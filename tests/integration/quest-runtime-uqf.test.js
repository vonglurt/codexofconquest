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

// ── §ARCH-01 Phase 3 — remaining §WISDOM-01 skill-checks (wis_02–05) ──────────
//
// The same legacy→UQF transform applied to the rest of the arc's skill checks.
// Each must keep byte-level parity: correct page flag + its mission-bit token,
// exact xp (and zero gold — only wis_01 awarded gold), the right Ardley
// knowledge entry. wis_05 additionally sets the wisArchiveLetter flag.

test.describe('§WISDOM-01 wis_02–05 migrated to UQF (§ARCH-01 Phase 3)', () => {
  test('all four validate as UQF with a skill_check bit', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => ['quest_wis_02','quest_wis_03','quest_wis_04','quest_wis_05'].map(id => {
      const q = QUEST_DB[id];
      return { id, schema:q.schema, bit:q.bits[0].kind, stat:q.bits[0].stat, dc:q.bits[0].dc,
               valid: validateQuest(q).valid, gateFlags:(q.gate&&q.gate.flags)||[] };
    }));
    expect(r.every(x => x.schema === 'UQF-1.0' && x.bit === 'skill_check' && x.valid)).toBe(true);
    // spot-check the stat/dc transcription
    expect(r.find(x => x.id==='quest_wis_03')).toMatchObject({ stat:'INT', dc:11 });
    expect(r.find(x => x.id==='quest_wis_05').gateFlags).toEqual(['wisHookReceived','roenAlchemistMet']);
  });

  test('each PASS keeps byte-level parity (flag + token + exact xp/gold + knowledge)', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const got = await page.evaluate(() => {
      const cases = [
        { id:'quest_wis_02', flag:'wisPage2_aggression', xp:250, gold:0, know:'Ardley W2 — The Leak' },
        { id:'quest_wis_03', flag:'wisPage3_thumbscrew', xp:300, gold:0, know:'Ardley W3 — The Thumbscrew' },
        { id:'quest_wis_04', flag:'wisPage4_sight',      xp:300, gold:0, know:'Ardley W4 — The Long View' },
        { id:'quest_wis_05', flag:'wisPage5_form',       xp:300, gold:0, know:'Ardley W5 — Formlessness' },
      ];
      const out = {};
      for (const c of cases) {
        S_story.abilityScores = { wis:40, int:40 };   // both high ⇒ any DC passes regardless of stat
        S_story.level = 20; S_story.xp = 1000000; S_story.gold = 500;
        S_story.inventory = []; S_story.knowledge = [];
        delete S_story[c.flag]; delete S_story.wisArchiveLetter;
        S_story.quests = { [c.id]:'active' };
        _rollCeremonia(c.id);
        out[c.id] = {
          status: S_story.quests[c.id],
          flag: !!S_story[c.flag],
          token: !!S_story.inventory.find(i => i.flagRef === c.flag && i.type === 'mission_bit'),
          dxp: S_story.xp - 1000000, dgold: S_story.gold - 500,
          know: S_story.knowledge.some(k => k.startsWith(c.know)),
          archiveLetter: !!S_story.wisArchiveLetter,
        };
      }
      return { out, cases };
    });
    for (const c of got.cases) {
      const r = got.out[c.id];
      expect(r.status, c.id).toBe('done');
      expect(r.flag, c.id).toBe(true);
      expect(r.token, c.id).toBe(true);
      expect(r.dxp, c.id).toBe(c.xp);
      expect(r.dgold, c.id).toBe(c.gold);
      expect(r.know, c.id).toBe(true);
    }
    // wis_05 alone sets the extra archive-letter flag on pass
    expect(got.out['quest_wis_05'].archiveLetter).toBe(true);
  });

  test('wis_02 honors its two-flag gate (needs wisHookReceived AND saltwickAccessed)', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      S_story.quests = {}; delete S_story.wisHookReceived; delete S_story.saltwickAccessed;
      const node = { code:'MME' };
      S_story.wisHookReceived = true;                 // only one of two flags
      storyCheckQuests(node);
      const partial = S_story.quests.quest_wis_02;
      S_story.saltwickAccessed = true;                // now both
      storyCheckQuests(node);
      return { partial, full: S_story.quests.quest_wis_02 };
    });
    expect(r.partial).toBeUndefined();   // AND-gate: one flag is not enough
    expect(r.full).toBe('active');
  });
});

// ── §ARCH-01 Phase 3 — §WISDOM-01 side quests wis_00/06/07 (declarative completion) ──
//
// The arc's three type:'side' quests complete passively (no skill roll) when a
// flag/battle condition holds. Their completeFn is replaced by a declarative
// `completion` gate evaluated by QuestRuntime.canComplete in storyCheckQuests.
// wis_07 is the compound case the lab flagged (Open-Q #5): AND(five page flags)
// ∧ (wisPage6_shadow OR defeated VS_SHADOW), expressed via flags + flagsAny +
// battles — no boolean-expression language needed.

test.describe('§WISDOM-01 side quests wis_00/06/07 → UQF (§ARCH-01 Phase 3)', () => {
  test('all three validate as UQF (completion gate, empty bits allowed)', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => ['quest_wis_00','quest_wis_06','quest_wis_07'].map(id => {
      const q = QUEST_DB[id];
      return { id, schema:q.schema, completion:!!q.completion, bits:q.bits.length, valid:validateQuest(q).valid };
    }));
    expect(r.every(x => x.schema === 'UQF-1.0' && x.completion && x.bits === 0 && x.valid)).toBe(true);
  });

  test('canComplete models wis_07 compound AND(pages) ∧ (flag OR battle)', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const pages = ['wisPage1_masks','wisPage2_aggression','wisPage3_thumbscrew','wisPage4_sight','wisPage5_form'];
      const reset = (obj) => { S_story.defeatedBattles = {}; [...pages,'wisPage6_shadow'].forEach(f => delete S_story[f]); Object.assign(S_story, obj || {}); };
      const five = { wisPage1_masks:true, wisPage2_aggression:true, wisPage3_thumbscrew:true, wisPage4_sight:true, wisPage5_form:true };
      reset({}); const none = QuestRuntime.canComplete('quest_wis_07');
      reset(five); const fiveOnly = QuestRuntime.canComplete('quest_wis_07');            // pages, no OR-group
      reset({ ...five, wisPage6_shadow:true }); const viaFlag = QuestRuntime.canComplete('quest_wis_07');
      reset(five); S_story.defeatedBattles = { VS_SHADOW:true }; const viaBattle = QuestRuntime.canComplete('quest_wis_07');
      reset({ wisPage1_masks:true, wisPage6_shadow:true }); const missingPages = QuestRuntime.canComplete('quest_wis_07');
      return { none, fiveOnly, viaFlag, viaBattle, missingPages };
    });
    expect(r.none).toBe(false);
    expect(r.fiveOnly).toBe(false);       // five pages but neither shadow flag nor battle ⇒ incomplete
    expect(r.viaFlag).toBe(true);         // five pages + wisPage6_shadow
    expect(r.viaBattle).toBe(true);       // five pages + defeated VS_SHADOW
    expect(r.missingPages).toBe(false);   // OR-group satisfied but only one page ⇒ incomplete
  });

  test('storyCheckQuests auto-completes wis_06 via either OR branch', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const run = (setup) => {
        S_story.quests = { quest_wis_06:'active' }; S_story.inventory = [];
        S_story.defeatedBattles = {}; delete S_story.wisPage6_shadow;
        setup();
        storyCheckQuests({ code:'__none' });
        return S_story.quests.quest_wis_06;
      };
      return {
        neither: run(() => {}),
        viaFlag: run(() => { S_story.wisPage6_shadow = true; }),
        viaBattle: run(() => { S_story.defeatedBattles = { VS_SHADOW:true }; }),
      };
    });
    expect(r.neither).toBe('active');     // condition unmet ⇒ stays active
    expect(r.viaFlag).toBe('complete');
    expect(r.viaBattle).toBe('complete');
  });

  test('wis_00 gates activation (personalLegendComplete) then completion (wisHookReceived)', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      S_story.quests = {}; S_story.inventory = [];
      delete S_story.personalLegendComplete; delete S_story.wisHookReceived;
      storyCheckQuests({ code:'VS' }); const noActivate = S_story.quests.quest_wis_00;
      S_story.personalLegendComplete = true;
      storyCheckQuests({ code:'VS' }); const activated = S_story.quests.quest_wis_00;
      S_story.wisHookReceived = true;
      storyCheckQuests({ code:'VS' }); const completed = S_story.quests.quest_wis_00;
      return { noActivate, activated, completed };
    });
    expect(r.noActivate).toBeUndefined();   // gate blocks activation
    expect(r.activated).toBe('active');
    expect(r.completed).toBe('complete');   // declarative completion fired
  });
});

// ── §ARCH-01 Wave 1 — Wane's Crown skill-check arc (quest_wane_01..06) ──
//
// First Wave-1 arc: six sequential skill_check quests whose legacy onPass was an
// imperative closure (`_addCroneMark()` — increments S_story.croneMarks + bumps
// inn-kindness; wane_06 additionally computes S_story.waneCrownComplete). The
// closure is preserved verbatim behind a `_legacy_fn` bit (parity-safe), the
// `xpAward` becomes a `reward` bit, and the chain dependency
// `(S_story.quests['prev']||'') !== ''` becomes the new declarative
// `gate.questsAttempted` term added to QuestRuntime.canActivate.

test.describe('§ARCH-01 Wave 1 — Wane\'s Crown arc (quest_wane_01..06)', () => {
  const IDS = ['quest_wane_01','quest_wane_02','quest_wane_03','quest_wane_04','quest_wane_05','quest_wane_06'];

  test('all six validate as UQF skill_check quests with exact stat/dc/xp transcription', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate((ids) => ids.map(id => {
      const q = QUEST_DB[id];
      const sc = q.bits[0];
      const reward = (sc.onPass || []).find(b => b.kind === 'reward');
      const legacy = (sc.onPass || []).find(b => b.kind === '_legacy_fn');
      return { id, schema:q.schema, valid:validateQuest(q).valid, bit:sc.kind,
               stat:sc.stat, dc:sc.dc, skill:sc.skill, xp:reward && reward.xp, hasLegacy:!!legacy };
    }), IDS);
    expect(r.every(x => x.schema === 'UQF-1.0' && x.valid && x.bit === 'skill_check' && x.hasLegacy)).toBe(true);
    // exact transcription from the legacy checkAbility/checkDC/xpAward fields
    expect(r).toMatchObject([
      { id:'quest_wane_01', stat:'WIS', skill:'Insight',       dc:12, xp:150 },
      { id:'quest_wane_02', stat:'STR', skill:'Athletics',     dc:13, xp:175 },
      { id:'quest_wane_03', stat:'INT', skill:'Investigation', dc:13, xp:175 },
      { id:'quest_wane_04', stat:'WIS', skill:'Insight',       dc:14, xp:200 },
      { id:'quest_wane_05', stat:'WIS', skill:'Insight',       dc:13, xp:200 },
      { id:'quest_wane_06', stat:'CHA', skill:'Persuasion',    dc:14, xp:225 },
    ]);
  });

  test('each PASS marks done, grants exact xp, and runs the _addCroneMark closure (+1 croneMark)', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const got = await page.evaluate((ids) => {
      const xpByQuest = { quest_wane_01:150, quest_wane_02:175, quest_wane_03:175, quest_wane_04:200, quest_wane_05:200, quest_wane_06:225 };
      const out = {};
      for (const id of ids) {
        S_story.abilityScores = { str:40, dex:40, con:40, int:40, wis:40, cha:40 }; // any DC passes
        S_story.level = 20; S_story.xp = 1000000; S_story.day = 1;
        S_story.croneMarks = 0;
        S_story.quests = { [id]:'active' };
        _rollCeremonia(id);
        out[id] = { status:S_story.quests[id], dxp:S_story.xp - 1000000, croneMarks:S_story.croneMarks };
      }
      return { out, xpByQuest };
    }, IDS);
    for (const id of IDS) {
      expect(got.out[id].status, id).toBe('done');
      expect(got.out[id].dxp, id).toBe(got.xpByQuest[id]);
      expect(got.out[id].croneMarks, id).toBe(1);   // _legacy_fn(_addCroneMark) ran exactly once
    }
  });

  test('a non-retryable FAIL locks the quest and grants no croneMark or xp', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      // deeply negative score ⇒ even a natural 20 lands far below the DC (deterministic fail)
      S_story.abilityScores = { str:-100, dex:-100, con:-100, int:-100, wis:-100, cha:-100 };
      S_story.level = 1; S_story.xp = 0; S_story.croneMarks = 0; S_story.day = 1;
      S_story.quests = { quest_wane_03:'active' };
      _rollCeremonia('quest_wane_03');
      return { status:S_story.quests.quest_wane_03, xp:S_story.xp, croneMarks:S_story.croneMarks };
    });
    expect(r.status).toBe('failed');   // retryable:false ⇒ locked
    expect(r.xp).toBe(0);
    expect(r.croneMarks).toBe(0);
  });

  test('questsAttempted gate chains the arc: wane_02 needs wane_01 to have a status', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      S_story.quests = {};
      const blocked = QuestRuntime.canActivate('quest_wane_02');   // wane_01 not yet present
      S_story.quests = { quest_wane_01:'active' };
      const viaActive = QuestRuntime.canActivate('quest_wane_02'); // 'active' is a non-empty status
      S_story.quests = { quest_wane_01:'failed' };
      const viaFailed = QuestRuntime.canActivate('quest_wane_02'); // even a failed attempt opens the next
      const w1open = (S_story.quests = {}, QuestRuntime.canActivate('quest_wane_01')); // wane_01 has no gate
      return { blocked, viaActive, viaFailed, w1open };
    });
    expect(r.blocked).toBe(false);
    expect(r.viaActive).toBe(true);
    expect(r.viaFailed).toBe(true);   // parity with legacy `(quests['wane_01']||'') !== ''`
    expect(r.w1open).toBe(true);
  });

  test('wane_06 PASS runs its compound closure (croneMark + waneCrownComplete computation)', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      // five prior wane quests marked 'complete' ⇒ the closure should set waneCrownComplete true
      S_story.abilityScores = { cha:40 };
      S_story.level = 20; S_story.xp = 1000000; S_story.croneMarks = 0; S_story.day = 1;
      S_story.quests = { quest_wane_01:'complete', quest_wane_02:'complete', quest_wane_03:'complete',
                         quest_wane_04:'complete', quest_wane_05:'complete', quest_wane_06:'active' };
      delete S_story.waneCrownComplete;
      _rollCeremonia('quest_wane_06');
      return { status:S_story.quests.quest_wane_06, crown:S_story.waneCrownComplete, croneMarks:S_story.croneMarks };
    });
    expect(r.status).toBe('done');
    expect(r.croneMarks).toBe(1);
    expect(r.crown).toBe(true);   // verbatim closure: ≥5 wane quests 'complete'
  });

  test('canActivate questsDone term requires a terminal pass status (done/complete)', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      // synthetic probe quest exercising the new questsDone gate term in isolation
      QUEST_DB.__probe_done = { id:'__probe_done', schema:'UQF-1.0', gate:{ questsDone:['quest_wane_01'] }, bits:[] };
      const res = {};
      for (const st of ['', 'active', 'failed', 'done', 'complete']) {
        S_story.quests = st ? { quest_wane_01:st } : {};
        res[st || 'empty'] = QuestRuntime.canActivate('__probe_done');
      }
      delete QUEST_DB.__probe_done;
      return res;
    });
    expect(r).toMatchObject({ empty:false, active:false, failed:false, done:true, complete:true });
  });
});

// ── §ARCH-01 Wave 1 — Whisper's Crown arc (quest_whisper_01..06) ──
//
// Second Wave-1 crone arc. Five skill_checks (01–04, 06) follow the wane pattern
// (xpAward→reward, _addCroneMark→_legacy_fn, questsAttempted chain gate). The
// sixth member, quest_whisper_05, is a type:'side' quest: its `completeFn`
// (`!!whisperSaintSeen`) becomes a declarative `completion:{flags}` gate while
// its `onComplete` (sets the flag + inn-kindness) is kept verbatim — it fires
// from storyCheckQuests for every schema, so no bit migration is needed for it.

test.describe('§ARCH-01 Wave 1 — Whisper\'s Crown arc (quest_whisper_01..06)', () => {
  const SKILL = ['quest_whisper_01','quest_whisper_02','quest_whisper_03','quest_whisper_04','quest_whisper_06'];

  test('five skill_checks + the side quest all validate as UQF', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate((skill) => {
      const sc = skill.map(id => {
        const q = QUEST_DB[id]; const bit = q.bits[0];
        return { id, schema:q.schema, valid:validateQuest(q).valid, bit:bit.kind, stat:bit.stat, dc:bit.dc,
                 xp:(bit.onPass||[]).find(b=>b.kind==='reward').xp, hasLegacy:(bit.onPass||[]).some(b=>b.kind==='_legacy_fn') };
      });
      const side = QUEST_DB.quest_whisper_05;
      return { sc, side:{ schema:side.schema, valid:validateQuest(side).valid, completion:!!(side.completion&&side.completion.flags), bits:side.bits.length, onComplete:typeof side.onComplete } };
    }, SKILL);
    expect(r.sc.every(x => x.schema==='UQF-1.0' && x.valid && x.bit==='skill_check' && x.hasLegacy)).toBe(true);
    expect(r.sc).toMatchObject([
      { id:'quest_whisper_01', stat:'WIS', dc:12, xp:150 },
      { id:'quest_whisper_02', stat:'INT', dc:13, xp:175 },
      { id:'quest_whisper_03', stat:'WIS', dc:12, xp:175 },
      { id:'quest_whisper_04', stat:'WIS', dc:14, xp:200 },
      { id:'quest_whisper_06', stat:'CHA', dc:13, xp:225 },
    ]);
    // side quest: declarative completion gate, empty bits, onComplete kept as a live hook
    expect(r.side).toMatchObject({ schema:'UQF-1.0', valid:true, completion:true, bits:0, onComplete:'function' });
  });

  test('each skill_check PASS marks done, grants exact xp, runs _addCroneMark', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const got = await page.evaluate((skill) => {
      const xp = { quest_whisper_01:150, quest_whisper_02:175, quest_whisper_03:175, quest_whisper_04:200, quest_whisper_06:225 };
      const out = {};
      for (const id of skill) {
        S_story.abilityScores = { str:40, dex:40, con:40, int:40, wis:40, cha:40 };
        S_story.level = 20; S_story.xp = 1000000; S_story.day = 1; S_story.croneMarks = 0;
        S_story.quests = { [id]:'active' };
        _rollCeremonia(id);
        out[id] = { status:S_story.quests[id], dxp:S_story.xp - 1000000, croneMarks:S_story.croneMarks };
      }
      return { out, xp };
    }, SKILL);
    for (const id of SKILL) {
      expect(got.out[id].status, id).toBe('done');
      expect(got.out[id].dxp, id).toBe(got.xp[id]);
      expect(got.out[id].croneMarks, id).toBe(1);
    }
  });

  test('whisper_06 PASS runs its compound closure (croneMark + whisperCrownComplete)', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      S_story.abilityScores = { cha:40 };
      S_story.level = 20; S_story.xp = 1000000; S_story.croneMarks = 0; S_story.day = 1;
      S_story.quests = { quest_whisper_01:'complete', quest_whisper_02:'complete', quest_whisper_03:'complete',
                         quest_whisper_04:'complete', quest_whisper_05:'complete', quest_whisper_06:'active' };
      delete S_story.whisperCrownComplete;
      _rollCeremonia('quest_whisper_06');
      return { status:S_story.quests.quest_whisper_06, crown:S_story.whisperCrownComplete, croneMarks:S_story.croneMarks };
    });
    expect(r.status).toBe('done');
    expect(r.croneMarks).toBe(1);
    expect(r.crown).toBe(true);
  });

  test('whisper_05 (side): questsAttempted gate, then declarative completion via whisperSaintSeen + onComplete hook', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      // gate: needs whisper_01 to have a status
      S_story.quests = {}; delete S_story.whisperSaintSeen;
      const blocked = QuestRuntime.canActivate('quest_whisper_05');
      S_story.quests = { quest_whisper_01:'active' };
      const open = QuestRuntime.canActivate('quest_whisper_05');
      // completion gate is unmet until the witness flag is set
      const incompletePre = QuestRuntime.canComplete('quest_whisper_05');
      // drive it through storyCheckQuests: activate, then complete once flag is set
      S_story.quests = { quest_whisper_01:'active', quest_whisper_05:'active' };
      S_story.innmotherKindness = 0;
      storyCheckQuests({ code:'__none' });               // flag still false ⇒ stays active
      const stillActive = S_story.quests.quest_whisper_05;
      S_story.whisperSaintSeen = true;
      const canCompleteNow = QuestRuntime.canComplete('quest_whisper_05');
      storyCheckQuests({ code:'__none' });               // now completes ⇒ onComplete fires
      return { blocked, open, incompletePre, stillActive, canCompleteNow,
               status:S_story.quests.quest_whisper_05, innKindness:S_story.innmotherKindness };
    });
    expect(r.blocked).toBe(false);
    expect(r.open).toBe(true);
    expect(r.incompletePre).toBe(false);
    expect(r.stillActive).toBe('active');
    expect(r.canCompleteNow).toBe(true);
    expect(r.status).toBe('complete');
    expect(r.innKindness).toBeGreaterThanOrEqual(1);   // onComplete's _innKindness(1) ran
  });
});

// ── §ARCH-01 Wave 1 — Glut's Crown arc (quest_glut_01..06) ──
//
// Third crone arc. Five skill_checks (01–05) on the wane/whisper pattern. The
// twist: glut_05 (the fifth check) carries NO crown computation — the crown flag
// lives on glut_06 instead. quest_glut_06 (type:'side') has a FLAG activation
// gate (`glut_gift_held`, not a chain) and a multi-effect `onComplete` (returns
// the gift: clears the held flag, removes the inventory item, inn-kindness, sets
// glutCrownComplete) preserved verbatim.

test.describe('§ARCH-01 Wave 1 — Glut\'s Crown arc (quest_glut_01..06)', () => {
  const SKILL = ['quest_glut_01','quest_glut_02','quest_glut_03','quest_glut_04','quest_glut_05'];

  test('five skill_checks + the side quest all validate as UQF', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate((skill) => {
      const sc = skill.map(id => {
        const q = QUEST_DB[id]; const bit = q.bits[0];
        return { id, schema:q.schema, valid:validateQuest(q).valid, stat:bit.stat, dc:bit.dc,
                 xp:(bit.onPass||[]).find(b=>b.kind==='reward').xp, hasLegacy:(bit.onPass||[]).some(b=>b.kind==='_legacy_fn') };
      });
      const s6 = QUEST_DB.quest_glut_06;
      return { sc, side:{ schema:s6.schema, valid:validateQuest(s6).valid,
               gateFlags:(s6.gate&&s6.gate.flags)||[], completionFlags:(s6.completion&&s6.completion.flags)||[],
               bits:s6.bits.length, onComplete:typeof s6.onComplete } };
    }, SKILL);
    expect(r.sc.every(x => x.schema==='UQF-1.0' && x.valid && x.hasLegacy)).toBe(true);
    expect(r.sc).toMatchObject([
      { id:'quest_glut_01', stat:'WIS', dc:13, xp:150 },
      { id:'quest_glut_02', stat:'CHA', dc:13, xp:175 },
      { id:'quest_glut_03', stat:'INT', dc:14, xp:200 },
      { id:'quest_glut_04', stat:'WIS', dc:13, xp:200 },
      { id:'quest_glut_05', stat:'WIS', dc:15, xp:225 },
    ]);
    // side quest: FLAG activation gate + flag completion gate, onComplete kept live
    expect(r.side).toMatchObject({ schema:'UQF-1.0', valid:true, gateFlags:['glut_gift_held'],
      completionFlags:['glutGiftReturned'], bits:0, onComplete:'function' });
  });

  test('each skill_check PASS marks done, grants exact xp, runs _addCroneMark', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const got = await page.evaluate((skill) => {
      const xp = { quest_glut_01:150, quest_glut_02:175, quest_glut_03:200, quest_glut_04:200, quest_glut_05:225 };
      const out = {};
      for (const id of skill) {
        S_story.abilityScores = { str:40, dex:40, con:40, int:40, wis:40, cha:40 };
        S_story.level = 20; S_story.xp = 1000000; S_story.day = 1; S_story.croneMarks = 0;
        S_story.quests = { [id]:'active' };
        _rollCeremonia(id);
        out[id] = { status:S_story.quests[id], dxp:S_story.xp - 1000000, croneMarks:S_story.croneMarks };
      }
      return { out, xp };
    }, SKILL);
    for (const id of SKILL) {
      expect(got.out[id].status, id).toBe('done');
      expect(got.out[id].dxp, id).toBe(got.xp[id]);
      expect(got.out[id].croneMarks, id).toBe(1);
    }
  });

  test('glut_06 (side): flag gate, completion via glutGiftReturned, onComplete returns the gift + sets glutCrownComplete', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      // FLAG activation gate: needs glut_gift_held (not a quest-chain)
      S_story.quests = {}; delete S_story.glut_gift_held; delete S_story.glutGiftReturned;
      const blocked = QuestRuntime.canActivate('quest_glut_06');
      S_story.glut_gift_held = true;
      const open = QuestRuntime.canActivate('quest_glut_06');
      // drive activation + completion through storyCheckQuests
      S_story.quests = { quest_glut_06:'active' };
      S_story.inventory = [{ name:"Glut's Gift", icon:'🍯' }, { name:'Rope' }];
      S_story.innmotherKindness = 0; delete S_story.glutCrownComplete;
      storyCheckQuests({ code:'__none' });                 // glutGiftReturned still false ⇒ stays active
      const stillActive = S_story.quests.quest_glut_06;
      S_story.glutGiftReturned = true;
      storyCheckQuests({ code:'__none' });                 // completes ⇒ onComplete fires
      return {
        blocked, open, stillActive,
        status: S_story.quests.quest_glut_06,
        crown: S_story.glutCrownComplete,
        giftHeldCleared: S_story.glut_gift_held === false,
        giftRemoved: !S_story.inventory.some(i => i.name === "Glut's Gift"),
        ropeKept: S_story.inventory.some(i => i.name === 'Rope'),
        kindness: S_story.innmotherKindness,
      };
    });
    expect(r.blocked).toBe(false);          // no glut_gift_held ⇒ gate shut
    expect(r.open).toBe(true);              // flag set ⇒ gate open
    expect(r.stillActive).toBe('active');   // completion flag not yet set
    expect(r.status).toBe('complete');
    expect(r.crown).toBe(true);             // onComplete set glutCrownComplete
    expect(r.giftHeldCleared).toBe(true);
    expect(r.giftRemoved).toBe(true);       // "Glut's Gift" spliced from inventory
    expect(r.ropeKept).toBe(true);          // unrelated item untouched
    expect(r.kindness).toBeGreaterThanOrEqual(1);
  });
});

// ── §ARCH-01 Wave 1 — Ceremonia: Yael romance arc (quest_ceremonia_yael_01..05) ──
//
// Richer than the crones — exercises most of the registry at once:
//  • real checkPassFlag → mission_bit token+flag on PASS (yael_01..05)
//  • checkFailFlag      → mission_bit on FAIL (yael_04, non-retryable)
//  • numeric onPass counter (ceremoniaYaelAct=N) → kept via _legacy_fn
//  • yael_05 onPass also grants favor + an inventory token (verbatim closure)
//  • NEW gate term `favorMin` (replaces `(npcFavorability||{}).yael >= n`)
//  • retryable:true (yael_01..03) vs false (yael_04..05)
//  • vignetteTextAlt now honored on the UQF render path (parity fix)

test.describe('§ARCH-01 Wave 1 — Ceremonia: Yael arc (quest_ceremonia_yael_01..05)', () => {
  const IDS = ['quest_ceremonia_yael_01','quest_ceremonia_yael_02','quest_ceremonia_yael_03','quest_ceremonia_yael_04','quest_ceremonia_yael_05'];

  test('all five validate as UQF with mission_bit + reward + transcription', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate((ids) => ids.map(id => {
      const q = QUEST_DB[id]; const bit = q.bits[0];
      const mb = (bit.onPass||[]).find(b => b.kind==='mission_bit');
      const rw = (bit.onPass||[]).find(b => b.kind==='reward');
      return { id, schema:q.schema, valid:validateQuest(q).valid, stat:bit.stat, dc:bit.dc,
               passFlag:mb && mb.flag, xp:rw && rw.xp, retryable:q.retryable,
               failFlag:((bit.onFail||[]).find(b=>b.kind==='mission_bit')||{}).flag };
    }), IDS);
    expect(r.every(x => x.schema==='UQF-1.0' && x.valid && x.passFlag)).toBe(true);
    expect(r).toMatchObject([
      { id:'quest_ceremonia_yael_01', stat:'CHA', dc:10, xp:75,  passFlag:'ceremoniaPassed_yael_01', retryable:true },
      { id:'quest_ceremonia_yael_02', stat:'WIS', dc:12, xp:100, passFlag:'ceremoniaPassed_yael_02', retryable:true },
      { id:'quest_ceremonia_yael_03', stat:'STR', dc:12, xp:100, passFlag:'ceremoniaPassed_yael_03', retryable:true },
      { id:'quest_ceremonia_yael_04', stat:'CHA', dc:14, xp:125, passFlag:'ceremoniaPassed_yael_04', retryable:false, failFlag:'ceremonia_yael_04_failed' },
      { id:'quest_ceremonia_yael_05', stat:'CHA', dc:15, xp:150, passFlag:'ceremonia_yael_complete', retryable:false },
    ]);
  });

  test('each PASS grants the mission-bit token+flag, exact xp, and runs the act-counter closure', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const got = await page.evaluate((ids) => {
      const meta = {
        quest_ceremonia_yael_01:{ flag:'ceremoniaPassed_yael_01', xp:75,  act:1 },
        quest_ceremonia_yael_02:{ flag:'ceremoniaPassed_yael_02', xp:100, act:2 },
        quest_ceremonia_yael_03:{ flag:'ceremoniaPassed_yael_03', xp:100, act:3 },
        quest_ceremonia_yael_04:{ flag:'ceremoniaPassed_yael_04', xp:125, act:4 },
        quest_ceremonia_yael_05:{ flag:'ceremonia_yael_complete', xp:150, act:5 },
      };
      const out = {};
      for (const id of ids) {
        const m = meta[id];
        S_story.abilityScores = { str:40, dex:40, con:40, int:40, wis:40, cha:40 };
        S_story.level = 20; S_story.xp = 1000000; S_story.day = 1;
        S_story.inventory = []; S_story.ceremoniaYaelAct = 0;
        delete S_story[m.flag];
        S_story.quests = { [id]:'active' };
        _rollCeremonia(id);
        out[id] = {
          status: S_story.quests[id],
          flag: !!S_story[m.flag],
          token: !!S_story.inventory.find(i => i.flagRef === m.flag && i.type === 'mission_bit'),
          dxp: S_story.xp - 1000000,
          act: S_story.ceremoniaYaelAct,
        };
      }
      // yael_05 extras: favor bump + Watch Token item
      out.yael05favor = (S_story.npcFavorability||{}).yael || 0;
      out.yael05token = !!S_story.inventory.find(i => i.name === "Yael's Watch Token");
      return { out, meta };
    }, IDS);
    for (const id of IDS) {
      expect(got.out[id].status, id).toBe('done');
      expect(got.out[id].flag, id).toBe(true);
      expect(got.out[id].token, id).toBe(true);
      expect(got.out[id].dxp, id).toBe(got.meta[id].xp);
      expect(got.out[id].act, id).toBe(got.meta[id].act);
    }
    expect(got.out.yael05favor).toBeGreaterThanOrEqual(3);   // _setNpcFavor('yael',3)
    expect(got.out.yael05token).toBe(true);                   // Yael's Watch Token granted
  });

  test('yael_04 non-retryable FAIL → failed + grants the checkFailFlag mission-bit', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      S_story.abilityScores = { cha:-100 };                  // deterministic fail
      S_story.level = 1; S_story.day = 1; S_story.inventory = [];
      delete S_story.ceremonia_yael_04_failed; delete S_story.ceremoniaPassed_yael_04;
      S_story.quests = { quest_ceremonia_yael_04:'active' };
      _rollCeremonia('quest_ceremonia_yael_04');
      return {
        status: S_story.quests.quest_ceremonia_yael_04,
        failFlag: !!S_story.ceremonia_yael_04_failed,
        failToken: !!S_story.inventory.find(i => i.flagRef === 'ceremonia_yael_04_failed' && i.type === 'mission_bit'),
        passFlag: !!S_story.ceremoniaPassed_yael_04,
      };
    });
    expect(r.status).toBe('failed');
    expect(r.failFlag).toBe(true);     // checkFailFlag → onFail mission_bit
    expect(r.failToken).toBe(true);
    expect(r.passFlag).toBe(false);
  });

  test('yael_01 retryable FAIL → stays active, records an attempt, grants no flag', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      S_story.abilityScores = { cha:-100 };
      S_story.level = 1; S_story.day = 5; S_story.inventory = [];
      delete S_story.ceremoniaPassed_yael_01; S_story.skillCheckAttempts = {};
      S_story.quests = { quest_ceremonia_yael_01:'active' };
      _rollCeremonia('quest_ceremonia_yael_01');
      return {
        status: S_story.quests.quest_ceremonia_yael_01,
        attemptDay: (S_story.skillCheckAttempts.quest_ceremonia_yael_01||{}).lastDay,
        failures: (S_story.skillCheckAttempts.quest_ceremonia_yael_01||{}).failures,
        flag: !!S_story.ceremoniaPassed_yael_01,
      };
    });
    expect(r.status).toBe('active');   // retryable ⇒ not locked
    expect(r.attemptDay).toBe(5);
    expect(r.failures).toBe(1);
    expect(r.flag).toBe(false);
  });

  test('favorMin gate term: yael_01 (favor∧quest) and yael_05 (flagsAny∧favor)', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const set = (favor, obj) => { S_story.npcFavorability = { yael:favor }; S_story.quests = {};
        ['ceremoniaPassed_yael_04','ceremonia_yael_04_failed'].forEach(f => delete S_story[f]);
        Object.assign(S_story, obj || {}); };
      // yael_01: needs favor>=1 AND quest_slums_cleanup done
      set(0, {}); const y1_noFavorNoQuest = QuestRuntime.canActivate('quest_ceremonia_yael_01');
      set(1, {}); const y1_favorNoQuest = QuestRuntime.canActivate('quest_ceremonia_yael_01');
      set(1, {}); S_story.quests = { quest_slums_cleanup:'complete' }; const y1_both = QuestRuntime.canActivate('quest_ceremonia_yael_01');
      // yael_05: needs (pass04 OR fail04) AND favor>=3
      set(2, { ceremonia_yael_04_failed:true }); const y5_lowFavor = QuestRuntime.canActivate('quest_ceremonia_yael_05');
      set(3, { ceremonia_yael_04_failed:true }); const y5_viaFail = QuestRuntime.canActivate('quest_ceremonia_yael_05');
      set(3, { ceremoniaPassed_yael_04:true });  const y5_viaPass = QuestRuntime.canActivate('quest_ceremonia_yael_05');
      set(3, {}); const y5_noFlag = QuestRuntime.canActivate('quest_ceremonia_yael_05');
      return { y1_noFavorNoQuest, y1_favorNoQuest, y1_both, y5_lowFavor, y5_viaFail, y5_viaPass, y5_noFlag };
    });
    expect(r).toMatchObject({
      y1_noFavorNoQuest:false, y1_favorNoQuest:false, y1_both:true,
      y5_lowFavor:false, y5_viaFail:true, y5_viaPass:true, y5_noFlag:false,
    });
  });

  test('vignetteTextAlt is shown on the UQF render path when yael_04 was failed', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      S_story.abilityScores = { cha:14 }; S_story.level = 1; S_story.currentCode = 'LHR';
      const render = (failed) => {
        S_story.ceremonia_yael_04_failed = failed;
        S_story.quests = { quest_ceremonia_yael_05:'active' };
        storyRender(NODE_MAP['LHR']);
        // read the rendered quest-panel container only — NOT document.body, whose
        // innerHTML includes the <script> source (where both literals also live).
        return document.getElementById('story-info-row').innerHTML;
      };
      const altPart = 'I heard about the report';      // from vignetteTextAlt
      const mainPart = 'You told her your name outside the mortuary'; // from vignetteText
      const failedHtml = render(true);
      const passHtml   = render(false);
      return {
        failShowsAlt: failedHtml.includes(altPart),
        failHidesMain: !failedHtml.includes(mainPart),
        passShowsMain: passHtml.includes(mainPart),
        passHidesAlt: !passHtml.includes(altPart),
      };
    });
    expect(r.failShowsAlt).toBe(true);
    expect(r.failHidesMain).toBe(true);
    expect(r.passShowsMain).toBe(true);
    expect(r.passHidesAlt).toBe(true);
  });
});

// ── §ARCH-01 Wave 1 — §1367 historical skill-checks (4 of 6) ──
//
// The 1367 arc has 6 quests; the 4 skill_checks migrate here (the 2 combat
// quests — a_najera, f_plague — are Wave 4). These have NO checkPassFlag (no
// mission_bit), independent gates (activateCond:()=>true → gate:{}), and onPass/
// onFail closures that nudge clamped faction/faith TRACK COUNTERS — preserved
// verbatim behind _legacy_fn. quest_1367_d_hansa is the first Wave-1 quest with
// a real onFail effect (faction_hansa -1 on a failed, retryable check).

test.describe('§ARCH-01 Wave 1 — §1367 skill-checks (quest_1367_{e,b,c,d})', () => {
  const IDS = ['quest_1367_e_wycliffe','quest_1367_b_tamerlane','quest_1367_c_ottoman','quest_1367_d_hansa'];

  test('all four validate as UQF skill_checks (no mission_bit, exact stat/dc/xp)', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate((ids) => ids.map(id => {
      const q = QUEST_DB[id]; const bit = q.bits[0];
      return { id, schema:q.schema, valid:validateQuest(q).valid, stat:bit.stat, dc:bit.dc,
               xp:(bit.onPass||[]).find(b=>b.kind==='reward').xp,
               hasMissionBit:(bit.onPass||[]).some(b=>b.kind==='mission_bit'),
               gateEmpty: JSON.stringify(q.gate)==='{}' };
    }), IDS);
    expect(r.every(x => x.schema==='UQF-1.0' && x.valid && !x.hasMissionBit && x.gateEmpty)).toBe(true);
    expect(r).toMatchObject([
      { id:'quest_1367_e_wycliffe',  stat:'CHA', dc:13, xp:110 },
      { id:'quest_1367_b_tamerlane', stat:'WIS', dc:13, xp:120 },
      { id:'quest_1367_c_ottoman',   stat:'CHA', dc:14, xp:130 },
      { id:'quest_1367_d_hansa',     stat:'CHA', dc:15, xp:140 },
    ]);
  });

  test('each PASS grants exact xp and nudges the right clamped track counter', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const got = await page.evaluate((ids) => {
      const meta = {
        quest_1367_e_wycliffe:  { track:'faith_reform',   xp:110, inc:1 },
        quest_1367_b_tamerlane: { track:'faith_folk',     xp:120, inc:1 },
        quest_1367_c_ottoman:   { track:'faith_orthodox', xp:130, inc:1 },
        quest_1367_d_hansa:     { track:'faction_hansa',  xp:140, inc:2 },
      };
      const out = {};
      for (const id of ids) {
        const m = meta[id];
        S_story.abilityScores = { str:40, dex:40, con:40, int:40, wis:40, cha:40 };
        S_story.level = 20; S_story.xp = 1000000; S_story.day = 1;
        S_story[m.track] = 0;
        S_story.quests = { [id]:'active' };
        _rollCeremonia(id);
        out[id] = { status:S_story.quests[id], dxp:S_story.xp - 1000000, track:S_story[m.track] };
      }
      // clamp preserved: faction_hansa onPass is min(5, cur+2) ⇒ from 4 → 5, not 6
      S_story.faction_hansa = 4; S_story.quests = { quest_1367_d_hansa:'active' };
      S_story.abilityScores = { cha:40 }; _rollCeremonia('quest_1367_d_hansa');
      out.hansaClamp = S_story.faction_hansa;
      return { out, meta };
    }, IDS);
    for (const id of IDS) {
      expect(got.out[id].status, id).toBe('done');
      expect(got.out[id].dxp, id).toBe(got.meta[id].xp);
      expect(got.out[id].track, id).toBe(got.meta[id].inc);
    }
    expect(got.out.hansaClamp).toBe(5);   // Math.min(5, 4+2) clamp held
  });

  test('d_hansa FAIL runs its onFail (faction_hansa -1) and, being retryable, stays active', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      S_story.abilityScores = { cha:-100 };           // deterministic fail
      S_story.level = 1; S_story.day = 3; S_story.skillCheckAttempts = {};
      S_story.faction_hansa = 0;
      S_story.quests = { quest_1367_d_hansa:'active' };
      _rollCeremonia('quest_1367_d_hansa');
      return { status:S_story.quests.quest_1367_d_hansa, hansa:S_story.faction_hansa,
               failures:(S_story.skillCheckAttempts.quest_1367_d_hansa||{}).failures };
    });
    expect(r.status).toBe('active');   // retryable ⇒ not locked
    expect(r.hansa).toBe(-1);          // onFail ran exactly once
    expect(r.failures).toBe(1);
  });
});

// ── §ARCH-01 Wave 1 — Ceremonia d0207 arc (5-act, FULLY migrated) ──
//
// First complete d02xx arc migrated end-to-end (skill_check + side, like
// §WISDOM-01). Exercises: notFlags activation (a1), flag completion (a2),
// battle completion (a3 → completion:{battles}), and the NEW battle-gated
// ACTIVATION term gate.battles (a4 needs defeatedBattles['HKG']). a1 has a
// checkPassFlag but no onPass closure; a4/a5 keep their onPass via _legacy_fn.

test.describe('§ARCH-01 Wave 1 — Ceremonia d0207 arc (5-act, fully UQF)', () => {
  const ALL = ['quest_d0207_a1','quest_d0207_a2','quest_d0207_a3','quest_d0207_a4','quest_d0207_a5'];

  test('all five acts validate as UQF (3 skill_check + 2 side)', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate((ids) => ids.map(id => {
      const q = QUEST_DB[id];
      return { id, type:q.type, schema:q.schema, valid:validateQuest(q).valid,
               isSkill:(q.bits||[]).some(b=>b.kind==='skill_check'),
               hasCompletion:!!q.completion };
    }), ALL);
    expect(r.every(x => x.schema==='UQF-1.0' && x.valid)).toBe(true);
    expect(r.filter(x=>x.isSkill).map(x=>x.id)).toEqual(['quest_d0207_a1','quest_d0207_a4','quest_d0207_a5']);
    expect(r.filter(x=>x.hasCompletion).map(x=>x.id)).toEqual(['quest_d0207_a2','quest_d0207_a3']);
  });

  test('a1 notFlags gate: activatable until d0207_a1_passed, then closed; PASS grants flag+token+50xp', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      delete S_story.d0207_a1_passed;
      const before = QuestRuntime.canActivate('quest_d0207_a1');
      S_story.d0207_a1_passed = true;
      const after = QuestRuntime.canActivate('quest_d0207_a1');
      // PASS path
      delete S_story.d0207_a1_passed;
      S_story.abilityScores = { wis:40 }; S_story.level = 20; S_story.xp = 1000000;
      S_story.inventory = []; S_story.quests = { quest_d0207_a1:'active' };
      _rollCeremonia('quest_d0207_a1');
      return { before, after, status:S_story.quests.quest_d0207_a1, flag:!!S_story.d0207_a1_passed,
               token:!!S_story.inventory.find(i=>i.flagRef==='d0207_a1_passed'&&i.type==='mission_bit'),
               dxp:S_story.xp-1000000 };
    });
    expect(r.before).toBe(true);          // notFlags satisfied (flag unset)
    expect(r.after).toBe(false);          // notFlags violated (flag set)
    expect(r.status).toBe('done');
    expect(r.flag).toBe(true);
    expect(r.token).toBe(true);
    expect(r.dxp).toBe(50);
  });

  test('gate.battles: a4 activates only after HKG is defeated (and a1 passed)', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      S_story.d0207_a1_passed = true; S_story.defeatedBattles = {};
      const noBattle = QuestRuntime.canActivate('quest_d0207_a4');
      S_story.defeatedBattles = { HKG:true };
      const withBattle = QuestRuntime.canActivate('quest_d0207_a4');
      delete S_story.d0207_a1_passed;
      const battleButNoFlag = QuestRuntime.canActivate('quest_d0207_a4');  // AND: needs both
      return { noBattle, withBattle, battleButNoFlag };
    });
    expect(r.noBattle).toBe(false);        // battle prerequisite unmet
    expect(r.withBattle).toBe(true);       // battle + flag ⇒ open
    expect(r.battleButNoFlag).toBe(false); // flag missing ⇒ still shut
  });

  test('side acts complete declaratively: a2 via cyMadnessRoll flag, a3 via defeated HKG battle', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      // a2: completion {flags:['cyMadnessRoll']}
      delete S_story.cyMadnessRoll; S_story.defeatedBattles = {};
      const a2_pre = QuestRuntime.canComplete('quest_d0207_a2');
      S_story.cyMadnessRoll = true;
      const a2_post = QuestRuntime.canComplete('quest_d0207_a2');
      // a3: completion {battles:['HKG']}
      const a3_pre = QuestRuntime.canComplete('quest_d0207_a3');     // no battle yet
      S_story.defeatedBattles = { HKG:true };
      const a3_post = QuestRuntime.canComplete('quest_d0207_a3');
      // storyCheckQuests drives a2 active → complete
      S_story.quests = { quest_d0207_a2:'active' }; S_story.cyMadnessRoll = true;
      storyCheckQuests({ code:'__none' });
      return { a2_pre, a2_post, a3_pre, a3_post, a2status:S_story.quests.quest_d0207_a2 };
    });
    expect(r.a2_pre).toBe(false);
    expect(r.a2_post).toBe(true);
    expect(r.a3_pre).toBe(false);
    expect(r.a3_post).toBe(true);
    expect(r.a2status).toBe('complete');
  });

  test('a5 PASS grants cyOriginKnown token + 200xp and pushes the Name Plate item', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      S_story.abilityScores = { cha:40 }; S_story.level = 20; S_story.xp = 1000000;
      S_story.inventory = []; delete S_story.cyOriginKnown;
      S_story.quests = { quest_d0207_a5:'active' };
      _rollCeremonia('quest_d0207_a5');
      return { status:S_story.quests.quest_d0207_a5, flag:!!S_story.cyOriginKnown,
               token:!!S_story.inventory.find(i=>i.flagRef==='cyOriginKnown'&&i.type==='mission_bit'),
               plate:!!S_story.inventory.find(i=>i.name==="Scholar King's Name Plate"),
               dxp:S_story.xp-1000000 };
    });
    expect(r.status).toBe('done');
    expect(r.flag).toBe(true);
    expect(r.token).toBe(true);
    expect(r.plate).toBe(true);     // _legacy_fn pushed the flavor item
    expect(r.dxp).toBe(200);
  });
});

// ── §ARCH-01 Wave 1 — Ceremonia d0201/d0205/d0209 arcs (3 full arcs, codemod-migrated) ──
//
// 15 quests across three 5-act arcs, migrated by scripts/_codemod_d02_batch.js
// (the first script-assisted batch). Each arc = 3 skill_check + 2 side (or 4+1),
// using only already-supported engine terms (flags/notFlags/battles gates,
// flag/battle completion). New wrinkles vs d0207: onFail closures (d0201 a2/a4
// voidPressure+1), reward.gold on the a5 finales, and a side-quest onComplete
// (d0205_a3 sets mazeSolvedChecks + voidMazeEntered).

test.describe('§ARCH-01 Wave 1 — Ceremonia d0201/d0205/d0209 arcs (15 quests)', () => {
  const ALL = [];
  for (const arc of ['d0201','d0205','d0209']) for (const a of ['a1','a2','a3','a4','a5']) ALL.push('quest_'+arc+'_'+a);

  test('all 15 validate as UQF; the a3 acts are declarative-completion side quests', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate((ids) => ids.map(id => {
      const q = QUEST_DB[id];
      return { id, schema:q.schema, valid:validateQuest(q).valid, type:q.type,
               isSkill:(q.bits||[]).some(b=>b.kind==='skill_check'), hasCompletion:!!q.completion };
    }), ALL);
    expect(r.every(x => x.schema==='UQF-1.0' && x.valid)).toBe(true);
    // a3 of each arc is the side quest with a completion gate
    expect(r.filter(x=>x.hasCompletion).map(x=>x.id).sort())
      .toEqual(['quest_d0201_a3','quest_d0205_a3','quest_d0209_a3']);
    expect(r.filter(x=>x.isSkill).length).toBe(12);
  });

  test('every skill_check PASS: done + flag + token + exact xp/gold', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const got = await page.evaluate(() => {
      const cases = [
        { id:'quest_d0201_a1', flag:'d0201_a1_passed', xp:50,  gold:0 },
        { id:'quest_d0201_a2', flag:'d0201_a2_passed', xp:75,  gold:0 },
        { id:'quest_d0201_a4', flag:'d0201_a4_passed', xp:100, gold:0 },
        { id:'quest_d0201_a5', flag:'scriptorium_approach_complete', xp:250, gold:100 },
        { id:'quest_d0205_a1', flag:'d0205_a1_passed', xp:50,  gold:0 },
        { id:'quest_d0205_a2', flag:'d0205_a2_passed', xp:75,  gold:0 },
        { id:'quest_d0205_a4', flag:'d0205_a4_passed', xp:100, gold:0 },
        { id:'quest_d0205_a5', flag:'d0205_complete',  xp:250, gold:75 },
        { id:'quest_d0209_a1', flag:'d0209_a1_passed', xp:50,  gold:0 },
        { id:'quest_d0209_a2', flag:'d0209_a2_passed', xp:75,  gold:0 },
        { id:'quest_d0209_a4', flag:'voidFluxScrollChanged', xp:100, gold:0 },
        { id:'quest_d0209_a5', flag:'d0209_complete',  xp:200, gold:75 },
      ];
      const out = {};
      for (const c of cases) {
        S_story.abilityScores = { str:40, dex:40, con:40, int:40, wis:40, cha:40 };
        S_story.level = 20; S_story.xp = 1000000; S_story.gold = 500; S_story.day = 1;
        S_story.inventory = []; delete S_story[c.flag];
        S_story.quests = { [c.id]:'active' };
        _rollCeremonia(c.id);
        out[c.id] = { status:S_story.quests[c.id], flag:!!S_story[c.flag],
                      token:!!S_story.inventory.find(i=>i.flagRef===c.flag&&i.type==='mission_bit'),
                      dxp:S_story.xp-1000000, dgold:S_story.gold-500 };
      }
      return { out, cases };
    });
    for (const c of got.cases) {
      const r = got.out[c.id];
      expect(r.status, c.id).toBe('done');
      expect(r.flag, c.id).toBe(true);
      expect(r.token, c.id).toBe(true);
      expect(r.dxp, c.id).toBe(c.xp);
      expect(r.dgold, c.id).toBe(c.gold);
    }
  });

  test('onPass closures fire: maze counter, void-flux toggles, immunity choice', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const run = (id, setup) => {
        S_story.abilityScores = { str:40, dex:40, con:40, int:40, wis:40, cha:40 };
        S_story.level = 20; S_story.xp = 1000000; S_story.inventory = [];
        setup && setup();
        S_story.quests = { [id]:'active' };
        _rollCeremonia(id);
      };
      run('quest_d0205_a1', () => { S_story.mazeSolvedChecks = 0; });
      const maze1 = S_story.mazeSolvedChecks;
      run('quest_d0209_a1', () => { S_story.voidFluxActive = false; });
      const fluxOn = S_story.voidFluxActive;
      run('quest_d0209_a2', () => { delete S_story.voidFluxImmunityChoice; });
      const immunity = S_story.voidFluxImmunityChoice;
      run('quest_d0209_a5', () => { S_story.voidFluxActive = true; });
      const fluxOff = S_story.voidFluxActive;
      return { maze1, fluxOn, immunity, fluxOff };
    });
    expect(r.maze1).toBe(1);          // d0205_a1 closure: mazeSolvedChecks → 1
    expect(r.fluxOn).toBe(true);      // d0209_a1 closure: voidFluxActive → true
    expect(r.immunity).toBe('fire'); // d0209_a2 closure default
    expect(r.fluxOff).toBe(false);   // d0209_a5 closure: voidFluxActive → false
  });

  test('onFail closure: d0201_a2 FAIL bumps voidPressure and (retryable) stays active', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      S_story.abilityScores = { dex:-100 };       // deterministic fail
      S_story.level = 1; S_story.day = 2; S_story.voidPressure = 0; S_story.skillCheckAttempts = {};
      S_story.quests = { quest_d0201_a2:'active' };
      _rollCeremonia('quest_d0201_a2');
      return { status:S_story.quests.quest_d0201_a2, vp:S_story.voidPressure,
               failures:(S_story.skillCheckAttempts.quest_d0201_a2||{}).failures, flag:!!S_story.d0201_a2_passed };
    });
    expect(r.status).toBe('active');   // retryable
    expect(r.vp).toBe(1);              // onFail _legacy_fn ran
    expect(r.failures).toBe(1);
    expect(r.flag).toBe(false);
  });

  test('side acts complete declaratively; d0205_a3 onComplete sets maze flags', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      // d0201_a3 via battle RAI
      delete S_story.defeatedBattles; S_story.defeatedBattles = {};
      const a3_201_pre = QuestRuntime.canComplete('quest_d0201_a3');
      S_story.defeatedBattles = { RAI:true };
      const a3_201 = QuestRuntime.canComplete('quest_d0201_a3');
      // d0209_a3 via flag
      delete S_story.voidFluxCleared;
      const a3_209_pre = QuestRuntime.canComplete('quest_d0209_a3');
      S_story.voidFluxCleared = true;
      const a3_209 = QuestRuntime.canComplete('quest_d0209_a3');
      // d0205_a3 via battle BK, driven through storyCheckQuests so onComplete fires
      S_story.quests = { quest_d0205_a3:'active' }; S_story.defeatedBattles = { BK:true };
      delete S_story.voidMazeEntered; S_story.mazeSolvedChecks = 0;
      storyCheckQuests({ code:'__none' });
      return { a3_201_pre, a3_201, a3_209_pre, a3_209,
               a3_205status:S_story.quests.quest_d0205_a3,
               maze3:S_story.mazeSolvedChecks, mazeEntered:S_story.voidMazeEntered };
    });
    expect(r.a3_201_pre).toBe(false);
    expect(r.a3_201).toBe(true);
    expect(r.a3_209_pre).toBe(false);
    expect(r.a3_209).toBe(true);
    expect(r.a3_205status).toBe('complete');
    expect(r.maze3).toBe(3);             // onComplete kept verbatim
    expect(r.mazeEntered).toBe(true);
  });
});

// ── §ARCH-01 Wave 1 — Ceremonia d0204/d0206/d0208/d0210 arcs (codemod #2) ──
//
// Final 4 d02xx arcs (20 quests). Needed FOUR new engine terms: gate.shardsMin,
// gate.notBattles, gate.restedAtMin (canActivate) + completion.questsComplete
// (canComplete OR-group, strict ===\'complete\'). Per a deliberate user decision,
// the previously-DEAD completeItems on these skill_checks (Memory Token /
// Blueprint Roll / Baby Mimic / Loop Closure Seal — never granted in legacy
// because skill_checks never enter the completeItems completion loop) are now
// converted to onPass reward.items so they ARE granted. THIS WAVE IS NOT PURE
// PARITY — it intentionally fixes that latent bug. Live onPass closures (wand,
// cache, tribbles, flags) stay verbatim via _legacy_fn.

test.describe('§ARCH-01 Wave 1 — Ceremonia d0204/d0206/d0208/d0210 arcs (20 quests)', () => {
  const ALL = [];
  for (const arc of ['d0204','d0206','d0208','d0210']) for (const a of ['a1','a2','a3','a4','a5']) ALL.push('quest_'+arc+'_'+a);

  test('all 20 validate as UQF', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate((ids) => ids.map(id => {
      const q = QUEST_DB[id];
      return { id, schema:q.schema, valid:validateQuest(q).valid };
    }), ALL);
    const bad = r.filter(x => x.schema !== 'UQF-1.0' || !x.valid);
    expect(bad).toEqual([]);
  });

  test('new gate terms: shardsMin + notBattles (d0210_a1), restedAtMin (d0206_a3)', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      // d0210_a1: shardsMin:6, notBattles:['TLS']
      S_story.defeatedBattles = {};
      S_story.shards = 5; const lowShards = QuestRuntime.canActivate('quest_d0210_a1');
      S_story.shards = 6; const enoughShards = QuestRuntime.canActivate('quest_d0210_a1');
      S_story.defeatedBattles = { TLS:true }; const battleDone = QuestRuntime.canActivate('quest_d0210_a1');
      // d0206_a3: flags['d0206_a2_passed'] + restedAtMin:{SZG:1}
      S_story.d0206_a2_passed = true; S_story.shortRestedAtNodes = {};
      const noRest = QuestRuntime.canActivate('quest_d0206_a3');
      S_story.shortRestedAtNodes = { SZG:1 };
      const rested = QuestRuntime.canActivate('quest_d0206_a3');
      return { lowShards, enoughShards, battleDone, noRest, rested };
    });
    expect(r.lowShards).toBe(false);     // <6 shards
    expect(r.enoughShards).toBe(true);   // >=6 and TLS not defeated
    expect(r.battleDone).toBe(false);    // notBattles violated (TLS defeated)
    expect(r.noRest).toBe(false);        // not rested at SZG
    expect(r.rested).toBe(true);
  });

  test('questsComplete completion term (d0204_a3): strict ===complete, OR flag — a2 \'done\' is NOT enough', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const reset = () => { S_story.quests = {}; delete S_story.memorGateBypassUsed; };
      reset(); const none = QuestRuntime.canComplete('quest_d0204_a3');
      reset(); S_story.quests = { quest_d0204_a2:'done' }; const a2done = QuestRuntime.canComplete('quest_d0204_a3');
      reset(); S_story.quests = { quest_d0204_a2:'complete' }; const a2complete = QuestRuntime.canComplete('quest_d0204_a3');
      reset(); S_story.memorGateBypassUsed = true; const viaBypass = QuestRuntime.canComplete('quest_d0204_a3');
      return { none, a2done, a2complete, viaBypass };
    });
    expect(r.none).toBe(false);
    expect(r.a2done).toBe(false);      // strict: 'done' ≠ 'complete' (parity with legacy quirk)
    expect(r.a2complete).toBe(true);
    expect(r.viaBypass).toBe(true);
  });

  test('BUG-FIX: a5 finales now grant their (formerly dead) completeItems + xp/gold', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const got = await page.evaluate(() => {
      const cases = [
        { id:'quest_d0204_a5', item:'Memory Token',      xp:250, gold:100 },
        { id:'quest_d0206_a5', item:'Blueprint Roll',     xp:400, gold:150 },
        { id:'quest_d0208_a5', item:'Baby Mimic',         xp:300, gold:100 },
        { id:'quest_d0210_a5', item:'Loop Closure Seal',  xp:500, gold:200 },
      ];
      const out = {};
      for (const c of cases) {
        S_story.abilityScores = { str:40, dex:40, con:40, int:40, wis:40, cha:40 };
        S_story.level = 20; S_story.xp = 1000000; S_story.gold = 500; S_story.day = 1; S_story.inventory = [];
        S_story.quests = { [c.id]:'active' };
        _rollCeremonia(c.id);
        out[c.id] = { status:S_story.quests[c.id], item:!!S_story.inventory.find(i=>i.name===c.item),
                      dxp:S_story.xp-1000000, dgold:S_story.gold-500 };
      }
      return { out, cases };
    });
    for (const c of got.cases) {
      expect(got.out[c.id].status, c.id).toBe('done');
      expect(got.out[c.id].item, c.id).toBe(true);     // formerly never granted — now granted
      expect(got.out[c.id].dxp, c.id).toBe(c.xp);
      expect(got.out[c.id].dgold, c.id).toBe(c.gold);
    }
  });

  test('live onPass closures preserved: d0206_a2 wand, d0208_a4 cache + 3 tribbles', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      S_story.abilityScores = { str:40, dex:40, con:40, int:40, wis:40, cha:40 };
      S_story.level = 20; S_story.xp = 1000000;
      // d0206_a2 → Prototype Wand
      S_story.inventory = []; S_story.quests = { quest_d0206_a2:'active' };
      _rollCeremonia('quest_d0206_a2');
      const wand = !!S_story.inventory.find(i => i.name === "Scholar King's Prototype Wand");
      // d0208_a4 → Mimic's Cache + tribbles, tribbleCount += 3
      S_story.inventory = []; S_story.tribbleCount = 0; S_story.quests = { quest_d0208_a4:'active' };
      _rollCeremonia('quest_d0208_a4');
      const cache = !!S_story.inventory.find(i => i.name === "Mimic's Cache");
      const tribbles = S_story.inventory.filter(i => i.name === 'Fuzzy Tribble').length;
      return { wand, cache, tribbles, tribbleCount:S_story.tribbleCount };
    });
    expect(r.wand).toBe(true);
    expect(r.cache).toBe(true);
    expect(r.tribbles).toBe(3);
    expect(r.tribbleCount).toBe(3);
  });
});

// ── §SKILLFIX-01 — legacy resolver reads checkStat/checkSkill ──
//
// _rollCeremonia historically read only q.checkAbility/q.checkLabel, but ~2443
// skill_check quests define checkStat/checkSkill (the convention adaptLegacyQuest
// already reads). Those rolled with a flat +0 ability mod and an "undefined" skill
// label. The fix aliases checkAbility||checkStat and checkLabel||checkSkill at all
// read sites (roll math + panel render); the ~30 checkAbility quests are unchanged.

test.describe('§SKILLFIX-01 — legacy _rollCeremonia applies checkStat ability mod', () => {
  test('a checkStat quest now applies the real ability modifier (not +0) and a named label', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const cards = [];
      const orig = window._appendStoryHcard;
      window._appendStoryHcard = (c) => { cards.push(c); };
      S_story.abilityScores = { cha:20 };   // mod +5
      S_story.level = 1; S_story.day = 1; S_story.iodineBuffActive = false;
      S_story.quests = { quest_spark_01:'active' };
      _rollCeremonia('quest_spark_01');
      window._appendStoryHcard = orig;
      return cards[0] ? { formula:cards[0].formula } : null;
    });
    // CHA 20 → +5 mod, Prof +2, skill label "Persuasion" (was "undefined(+0)")
    expect(r.formula).toContain('Persuasion(+5)');
    expect(r.formula).toContain('Prof(+2)');
    expect(r.formula).not.toContain('undefined');
  });

  test('a checkAbility quest is unchanged (the alias does not disturb the working convention)', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      // Find a still-legacy checkAbility quest dynamically (robust to future migrations).
      const id = Object.keys(QUEST_DB).find(k => {
        const q = QUEST_DB[k];
        return q.type === 'skill_check' && q.schema !== 'UQF-1.0' && q.checkAbility && q.checkLabel;
      });
      if (!id) return { skipped:true };
      const q = QUEST_DB[id];
      const cards = [];
      const orig = window._appendStoryHcard;
      window._appendStoryHcard = (c) => { cards.push(c); };
      S_story.abilityScores = { [q.checkAbility]:20 };   // +5
      S_story.level = 1; S_story.day = 1; S_story.iodineBuffActive = false;
      S_story.quests = { [id]:'active' };
      _rollCeremonia(id);
      window._appendStoryHcard = orig;
      return { id, label:q.checkLabel, formula:cards[0] && cards[0].formula };
    });
    if (r.skipped) return;
    expect(r.formula).toContain(r.label + '(+5)');
    expect(r.formula).not.toContain('undefined');
  });
});

// ── §ARCH-01 Wave 1 — Innmother's Hall skill-checks (quest_inn_02..04) ──
//
// The inn arc's 3 skill_checks migrate here. Like §1367 they have NO
// checkPassFlag (no mission_bit), but unlike §1367 they share a NEW gate term
// `sleptAt:['INN']` (replaces activateCond:()=>!!sleptAtNodes['INN']) and their
// onPass nudges the innmotherKindness counter via _innKindness(1), preserved
// verbatim behind _legacy_fn. The side quests (inn_01/05/06) stay legacy.

test.describe('§ARCH-01 Wave 1 — Innmother skill-checks (quest_inn_{02,03,04})', () => {
  const IDS = ['quest_inn_02','quest_inn_03','quest_inn_04'];

  test('all three validate as UQF skill_checks (no mission_bit, sleptAt gate, exact stat/dc/xp)', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate((ids) => ids.map(id => {
      const q = QUEST_DB[id]; const bit = q.bits[0];
      return { id, schema:q.schema, valid:validateQuest(q).valid, stat:bit.stat, skill:bit.skill, dc:bit.dc,
               xp:(bit.onPass||[]).find(b=>b.kind==='reward').xp,
               hasMissionBit:(bit.onPass||[]).some(b=>b.kind==='mission_bit'),
               gate:q.gate };
    }), IDS);
    expect(r.every(x => x.schema==='UQF-1.0' && x.valid && !x.hasMissionBit)).toBe(true);
    expect(r.every(x => JSON.stringify(x.gate)==='{"sleptAt":["INN"]}')).toBe(true);
    expect(r).toMatchObject([
      { id:'quest_inn_02', stat:'WIS', skill:'Insight',    dc:12, xp:150 },
      { id:'quest_inn_03', stat:'CHA', skill:'Persuasion', dc:13, xp:175 },
      { id:'quest_inn_04', stat:'WIS', skill:'Insight',    dc:12, xp:150 },
    ]);
  });

  test('the new sleptAt gate term: inactive until slept at INN, then activates', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      S_story.sleptAtNodes = {};
      const before = QuestRuntime.canActivate('quest_inn_02');
      S_story.sleptAtNodes = { INN:true };
      const after = QuestRuntime.canActivate('quest_inn_02');
      S_story.sleptAtNodes = { BK:true };
      const wrongNode = QuestRuntime.canActivate('quest_inn_02');
      return { before, after, wrongNode };
    });
    expect(r.before).toBe(false);
    expect(r.after).toBe(true);
    expect(r.wrongNode).toBe(false);
  });

  test('each PASS marks done, grants exact xp, and runs _innKindness(+1)', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const got = await page.evaluate((ids) => {
      const xpById = { quest_inn_02:150, quest_inn_03:175, quest_inn_04:150 };
      const out = {};
      for (const id of ids) {
        S_story.abilityScores = { str:40, dex:40, con:40, int:40, wis:40, cha:40 };
        S_story.level = 20; S_story.xp = 1000000; S_story.day = 1;
        S_story.innmotherKindness = 0; S_story.freeBookingUnlocked = false;
        S_story.quests = { [id]:'active' };
        _rollCeremonia(id);
        out[id] = { status:S_story.quests[id], dxp:S_story.xp - 1000000, kindness:S_story.innmotherKindness };
      }
      return { out, xpById };
    }, IDS);
    for (const id of IDS) {
      expect(got.out[id].status, id).toBe('done');
      expect(got.out[id].dxp, id).toBe(got.xpById[id]);
      expect(got.out[id].kindness, id).toBe(1);   // _innKindness(1) ran exactly once
    }
  });

  test('a non-retryable FAIL locks the quest and grants no xp or kindness', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      S_story.abilityScores = { wis:-100 };          // deterministic fail even on a nat 20
      S_story.level = 1; S_story.day = 3; S_story.skillCheckAttempts = {};
      S_story.xp = 1000000; S_story.innmotherKindness = 0;
      S_story.quests = { quest_inn_02:'active' };
      _rollCeremonia('quest_inn_02');
      return { status:S_story.quests.quest_inn_02, dxp:S_story.xp - 1000000, kindness:S_story.innmotherKindness };
    });
    expect(r.status).toBe('failed');   // retryable:false ⇒ locked
    expect(r.dxp).toBe(0);
    expect(r.kindness).toBe(0);
  });
});

// ── §ARCH-01 Wave 1j — Spark: the Harmony Chain (quest_spark_01..05) ──
//
// The Smalt/Pip/Clot/Warmth/Aldous arc. Three skill_checks (01 CHA Persuasion
// DC10 retryable; 03 WIS Medicine DC13; 04 INT Investigation DC14) each carry a
// mission_bit (01 with bitLabel, 03/04 fall back to _flagToLabel) + a _legacy_fn
// holding the verbatim onPass closure (gold/xp/item/knowledge/msg). The two side
// quests (02/05) become completion gates that keep their onComplete closure — the
// engine fires it on the UQF completion path. checkStat resolves the modifier
// since §SKILLFIX-01, so the whole arc is pure parity.

test.describe('§ARCH-01 Wave 1j — Spark Harmony Chain (quest_spark_01..05)', () => {
  test('the three skill_checks validate with exact stat/skill/dc and mission_bit + gates', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => ['quest_spark_01','quest_spark_03','quest_spark_04'].map(id => {
      const q = QUEST_DB[id]; const bit = q.bits[0];
      const mb = (bit.onPass||[]).find(b=>b.kind==='mission_bit');
      return { id, schema:q.schema, valid:validateQuest(q).valid, stat:bit.stat, skill:bit.skill, dc:bit.dc,
               mbFlag:mb && mb.flag, mbLabel:mb && (mb.label||null),
               hasLegacyFn:(bit.onPass||[]).some(b=>b.kind==='_legacy_fn'),
               gate:JSON.stringify(q.gate), retryable:q.retryable };
    }));
    expect(r.every(x => x.schema==='UQF-1.0' && x.valid && x.hasLegacyFn)).toBe(true);
    expect(r).toMatchObject([
      { id:'quest_spark_01', stat:'CHA', skill:'Persuasion',    dc:10, mbFlag:'smaltBefriended',            mbLabel:'Smalt Befriended', gate:'{}',                                     retryable:true },
      { id:'quest_spark_03', stat:'WIS', skill:'Medicine',      dc:13, mbFlag:'bioluminescentParasiteFound', mbLabel:null,                gate:'{"flags":["pipMet"]}',                   retryable:true },
      { id:'quest_spark_04', stat:'INT', skill:'Investigation', dc:14, mbFlag:'whodunitSolved',              mbLabel:null,                gate:'{"flags":["bioluminescentParasiteFound"]}', retryable:true },
    ]);
  });

  test('the two side quests validate as UQF completion gates that retain onComplete', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => ['quest_spark_02','quest_spark_05'].map(id => {
      const q = QUEST_DB[id];
      return { id, schema:q.schema, type:q.type, valid:validateQuest(q).valid,
               gate:JSON.stringify(q.gate), completion:JSON.stringify(q.completion),
               hasOnComplete:typeof q.onComplete==='function' };
    }));
    expect(r).toMatchObject([
      { id:'quest_spark_02', schema:'UQF-1.0', type:'side', valid:true, gate:'{"flags":["smaltBefriended"]}',                                  completion:'{"flags":["pipMet"]}',          hasOnComplete:true },
      { id:'quest_spark_05', schema:'UQF-1.0', type:'side', valid:true, gate:'{"flags":["whodunitSolved","wrenpemburyInconsistencyNoticed"]}', completion:'{"flags":["aldousConfessed"]}', hasOnComplete:true },
    ]);
  });

  test('spark_01 PASS: done, smaltBefriended flag+token, Smalt\'s Trust, +100gp/+100xp', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      S_story.abilityScores = { str:40, dex:40, con:40, int:40, wis:40, cha:40 };
      S_story.level = 20; S_story.gold = 0; S_story.xp = 0; S_story.inventory = [];
      S_story.smaltBefriended = false; S_story.quests = { quest_spark_01:'active' };
      _rollCeremonia('quest_spark_01');
      return { status:S_story.quests.quest_spark_01, flag:S_story.smaltBefriended,
               gold:S_story.gold, xp:S_story.xp,
               hasToken:S_story.inventory.some(i=>i.flagRef==='smaltBefriended'),
               hasTrust:S_story.inventory.some(i=>i.name==="Smalt's Trust") };
    });
    expect(r).toEqual({ status:'done', flag:true, gold:100, xp:100, hasToken:true, hasTrust:true });
  });

  test('spark_03/04 PASS: exact gold/xp, item, knowledge, mission flag', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const run = (id) => {
        S_story.abilityScores = { str:40, dex:40, con:40, int:40, wis:40, cha:40 };
        S_story.level = 20; S_story.gold = 0; S_story.xp = 0; S_story.inventory = []; S_story.knowledge = [];
        S_story.quests = { [id]:'active' };
        _rollCeremonia(id);
        return { status:S_story.quests[id], gold:S_story.gold, xp:S_story.xp, knowledge:S_story.knowledge.length };
      };
      const s3 = run('quest_spark_03'); const glow = S_story.inventory.some(i=>i.name==="Clot's Glow"); const f3 = S_story.bioluminescentParasiteFound;
      const s4 = run('quest_spark_04'); const letter = S_story.inventory.some(i=>i.name==='Letter of Safe Passage'); const f4 = S_story.whodunitSolved;
      return { s3, glow, f3, s4, letter, f4 };
    });
    expect(r.s3).toEqual({ status:'done', gold:200, xp:200, knowledge:1 });
    expect(r.glow).toBe(true); expect(r.f3).toBe(true);
    expect(r.s4).toEqual({ status:'done', gold:300, xp:300, knowledge:0 });
    expect(r.letter).toBe(true); expect(r.f4).toBe(true);
  });

  test('spark_01 retryable FAIL: not locked, hp-1, attempt recorded, no flag/reward', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      S_story.abilityScores = { cha:-100 };       // deterministic fail
      S_story.level = 1; S_story.day = 5; S_story.skillCheckAttempts = {};
      S_story.gold = 0; S_story.xp = 0; S_story.hp = 10; S_story.inventory = [];
      S_story.smaltBefriended = false; S_story.quests = { quest_spark_01:'active' };
      _rollCeremonia('quest_spark_01');
      return { status:S_story.quests.quest_spark_01, hp:S_story.hp, gold:S_story.gold, xp:S_story.xp,
               flag:S_story.smaltBefriended, fails:(S_story.skillCheckAttempts.quest_spark_01||{}).failures };
    });
    expect(r.status).toBe('active');   // retryable ⇒ stays active, NOT 'failed'
    expect(r.hp).toBe(9);              // onFail closure docked 1
    expect(r.gold).toBe(0); expect(r.xp).toBe(0); expect(r.flag).toBe(false);
    expect(r.fails).toBe(1);
  });
});

// ── §ARCH-01 Wave 1k — Spark2: the Dunfall Harmony Chain (quest_spark2_01..05) ──
//
// The Bram/Oat/Fehn arc at Dunfall (DNF). Two skill_checks: 02 (WIS Animal
// Handling DC11, retryable) and 04 (INT Nature DC12, **non-retryable** — a FAIL
// runs the onFail msg then locks). Both checkPassFlags have no bitLabel →
// _flagToLabel fallback. The three side quests (01/03/05) are pure hook/waypoint
// gates with NO onComplete — completion flags set by story interaction elsewhere.

test.describe('§ARCH-01 Wave 1k — Spark2 Dunfall Harmony Chain (quest_spark2_01..05)', () => {
  test('the two skill_checks validate with exact stat/skill/dc, mission_bit (no label), gates, retryability', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => ['quest_spark2_02','quest_spark2_04'].map(id => {
      const q = QUEST_DB[id]; const bit = q.bits[0];
      const mb = (bit.onPass||[]).find(b=>b.kind==='mission_bit');
      return { id, schema:q.schema, valid:validateQuest(q).valid, stat:bit.stat, skill:bit.skill, dc:bit.dc,
               mbFlag:mb && mb.flag, mbLabel:mb && (mb.label||null),
               hasLegacyFnPass:(bit.onPass||[]).some(b=>b.kind==='_legacy_fn'),
               hasLegacyFnFail:(bit.onFail||[]).some(b=>b.kind==='_legacy_fn'),
               gate:JSON.stringify(q.gate), retryable:q.retryable };
    }));
    expect(r.every(x => x.schema==='UQF-1.0' && x.valid && x.hasLegacyFnPass && x.hasLegacyFnFail)).toBe(true);
    expect(r).toMatchObject([
      { id:'quest_spark2_02', stat:'WIS', skill:'Animal Handling', dc:11, mbFlag:'bramBefriended', mbLabel:null, gate:'{"flags":["spark2HookReceived"]}', retryable:true },
      { id:'quest_spark2_04', stat:'INT', skill:'Nature',          dc:12, mbFlag:'brimFound',       mbLabel:null, gate:'{"flags":["oatMet"]}',             retryable:false },
    ]);
  });

  test('the three side quests validate as structural completion gates (no onComplete)', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => ['quest_spark2_01','quest_spark2_03','quest_spark2_05'].map(id => {
      const q = QUEST_DB[id];
      return { id, schema:q.schema, type:q.type, valid:validateQuest(q).valid,
               gate:JSON.stringify(q.gate), completion:JSON.stringify(q.completion),
               hasOnComplete:typeof q.onComplete==='function' };
    }));
    expect(r).toMatchObject([
      { id:'quest_spark2_01', schema:'UQF-1.0', type:'side', valid:true, gate:'{"flags":["dunfallAccessed"]}', completion:'{"flags":["spark2HookReceived"]}', hasOnComplete:false },
      { id:'quest_spark2_03', schema:'UQF-1.0', type:'side', valid:true, gate:'{"flags":["bramBefriended"]}',  completion:'{"flags":["oatMet"]}',            hasOnComplete:false },
      { id:'quest_spark2_05', schema:'UQF-1.0', type:'side', valid:true, gate:'{"flags":["brimFound"]}',       completion:'{"flags":["fehnConfessed"]}',     hasOnComplete:false },
    ]);
  });

  test('spark2_02 PASS: done, bramBefriended flag+token, Bram\'s Fish Scale, +150xp', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      S_story.abilityScores = { str:40, dex:40, con:40, int:40, wis:40, cha:40 };
      S_story.level = 20; S_story.xp = 0; S_story.inventory = [];
      S_story.bramBefriended = false; S_story.quests = { quest_spark2_02:'active' };
      _rollCeremonia('quest_spark2_02');
      return { status:S_story.quests.quest_spark2_02, flag:S_story.bramBefriended, xp:S_story.xp,
               hasToken:S_story.inventory.some(i=>i.flagRef==='bramBefriended'),
               hasScale:S_story.inventory.some(i=>i.name==="Bram's Fish Scale") };
    });
    expect(r).toEqual({ status:'done', flag:true, xp:150, hasToken:true, hasScale:true });
  });

  test('spark2_04 PASS: +200xp, knowledge, splices Oat\'s Harbor Bead → Dunfall Drift Spore, sets brimFound', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      S_story.abilityScores = { str:40, dex:40, con:40, int:40, wis:40, cha:40 };
      S_story.level = 20; S_story.xp = 0; S_story.knowledge = [];
      S_story.inventory = [{ name:"Oat's Harbor Bead", icon:'🔮', type:'misc', sell:0 }];
      S_story.brimFound = false; S_story.quests = { quest_spark2_04:'active' };
      _rollCeremonia('quest_spark2_04');
      return { status:S_story.quests.quest_spark2_04, flag:S_story.brimFound, xp:S_story.xp, knowledge:S_story.knowledge.length,
               beadGone:!S_story.inventory.some(i=>i.name==="Oat's Harbor Bead"),
               hasSpore:S_story.inventory.some(i=>i.name==='Dunfall Drift Spore') };
    });
    expect(r).toEqual({ status:'done', flag:true, xp:200, knowledge:1, beadGone:true, hasSpore:true });
  });

  test('spark2_04 non-retryable FAIL: runs onFail msg then locks, no flag/reward', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      S_story.abilityScores = { int:-100 };       // deterministic fail
      S_story.level = 1; S_story.day = 5; S_story.skillCheckAttempts = {};
      S_story.xp = 0; S_story.knowledge = []; S_story.inventory = [];
      S_story.brimFound = false; S_story.quests = { quest_spark2_04:'active' };
      _rollCeremonia('quest_spark2_04');
      return { status:S_story.quests.quest_spark2_04, flag:S_story.brimFound, xp:S_story.xp,
               knowledge:S_story.knowledge.length, hasSpore:S_story.inventory.some(i=>i.name==='Dunfall Drift Spore') };
    });
    expect(r.status).toBe('failed');   // retryable:false ⇒ locked
    expect(r.flag).toBe(false); expect(r.xp).toBe(0); expect(r.knowledge).toBe(0); expect(r.hasSpore).toBe(false);
  });
});

// ── §ARCH-01 Wave 1l — Codex Inquisitor 3-question gauntlet (quest_inquisitor_*) ──
//
// At NUE. These are `checkAbility`/`checkLabel` quests (the ~30 that worked
// pre-§SKILLFIX-01) → pure parity. Fully DECOMPOSED (no onPass _legacy_fn):
// checkPassFlag→mission_bit{flag} (no label), xpAward→reward{xp}, and final's
// onPass item-push → reward{items:[Archive Key]}. Only `questions` keeps an
// onFail _legacy_fn (hp−10 psychic damage — no declarative damage bit). The
// gates chain: handshake←wmLowerArchiveUnlocked, questions←handshakePassed,
// final←questionsPassed. retryGateDays (0/0/1) kept top-level.

test.describe('§ARCH-01 Wave 1l — Codex Inquisitor gauntlet (quest_inquisitor_*)', () => {
  const IDS = ['quest_inquisitor_handshake','quest_inquisitor_questions','quest_inquisitor_final'];

  test('all three validate; exact stat/skill/dc, mission_bit (no label), reward xp, gates, retryGateDays', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate((ids) => ids.map(id => {
      const q = QUEST_DB[id]; const bit = q.bits[0];
      const mb = (bit.onPass||[]).find(b=>b.kind==='mission_bit');
      const rw = (bit.onPass||[]).find(b=>b.kind==='reward');
      return { id, schema:q.schema, valid:validateQuest(q).valid, stat:bit.stat, skill:bit.skill, dc:bit.dc,
               mbFlag:mb&&mb.flag, mbLabel:mb&&(mb.label||null), xp:rw&&rw.xp,
               gate:JSON.stringify(q.gate), retryGateDays:q.retryGateDays,
               hasOnPassLegacyFn:(bit.onPass||[]).some(b=>b.kind==='_legacy_fn') };
    }), IDS);
    expect(r.every(x => x.schema==='UQF-1.0' && x.valid && !x.hasOnPassLegacyFn)).toBe(true);
    expect(r).toMatchObject([
      { id:'quest_inquisitor_handshake', stat:'CHA', skill:'Persuasion', dc:10, mbFlag:'inquisitorHandshakePassed', mbLabel:null, xp:50,  gate:'{"flags":["wmLowerArchiveUnlocked"]}',     retryGateDays:0 },
      { id:'quest_inquisitor_questions', stat:'WIS', skill:'Insight',    dc:12, mbFlag:'inquisitorQuestionsPassed', mbLabel:null, xp:75,  gate:'{"flags":["inquisitorHandshakePassed"]}', retryGateDays:0 },
      { id:'quest_inquisitor_final',     stat:'CHA', skill:'Persuasion', dc:12, mbFlag:'inquisitorPassed',          mbLabel:null, xp:200, gate:'{"flags":["inquisitorQuestionsPassed"]}', retryGateDays:1 },
    ]);
  });

  test('each PASS marks done, sets its flag+token, grants exact xp; final grants Archive Key', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate((ids) => {
      const xpById = { quest_inquisitor_handshake:50, quest_inquisitor_questions:75, quest_inquisitor_final:200 };
      const flagById = { quest_inquisitor_handshake:'inquisitorHandshakePassed', quest_inquisitor_questions:'inquisitorQuestionsPassed', quest_inquisitor_final:'inquisitorPassed' };
      const out = {};
      for (const id of ids) {
        S_story.abilityScores = { str:40, dex:40, con:40, int:40, wis:40, cha:40 };
        S_story.level = 20; S_story.xp = 1000000; S_story.inventory = [];
        S_story[flagById[id]] = false; S_story.quests = { [id]:'active' };
        _rollCeremonia(id);
        out[id] = { status:S_story.quests[id], dxp:S_story.xp - 1000000, flag:S_story[flagById[id]],
                    token:S_story.inventory.some(i=>i.flagRef===flagById[id]),
                    archiveKey:S_story.inventory.some(i=>i.name==='Archive Key') };
      }
      return { out, xpById };
    }, IDS);
    for (const id of IDS) {
      expect(r.out[id].status, id).toBe('done');
      expect(r.out[id].dxp, id).toBe(r.xpById[id]);
      expect(r.out[id].flag, id).toBe(true);
      expect(r.out[id].token, id).toBe(true);
    }
    expect(r.out['quest_inquisitor_final'].archiveKey).toBe(true);
    expect(r.out['quest_inquisitor_handshake'].archiveKey).toBe(false);   // only the final grants it
  });

  test('questions retryable FAIL: stays active, onFail docks 10 hp, no flag/xp', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      S_story.abilityScores = { wis:-100 };       // deterministic fail
      S_story.level = 1; S_story.day = 4; S_story.skillCheckAttempts = {};
      S_story.xp = 0; S_story.hp = 30; S_story.inquisitorQuestionsPassed = false;
      S_story.quests = { quest_inquisitor_questions:'active' };
      _rollCeremonia('quest_inquisitor_questions');
      return { status:S_story.quests.quest_inquisitor_questions, hp:S_story.hp, xp:S_story.xp,
               flag:S_story.inquisitorQuestionsPassed,
               fails:(S_story.skillCheckAttempts.quest_inquisitor_questions||{}).failures };
    });
    expect(r.status).toBe('active');   // retryable ⇒ stays active
    expect(r.hp).toBe(20);             // onFail _legacy_fn docked 10 psychic
    expect(r.xp).toBe(0); expect(r.flag).toBe(false); expect(r.fails).toBe(1);
  });

  test('the §D01-02 NUE handshake button still drives the migrated quest through _rollCeremonia', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      // simulate the button handler's body (L28442-28446) against the migrated quest
      S_story.abilityScores = { str:40, dex:40, con:40, int:40, wis:40, cha:40 };
      S_story.level = 20; S_story.xp = 0; S_story.inventory = [];
      S_story.inquisitorMet = true; S_story.quests = S_story.quests || {};
      S_story.inquisitorHandshakePassed = false;
      if (!S_story.quests['quest_inquisitor_handshake']) S_story.quests['quest_inquisitor_handshake'] = 'active';
      _rollCeremonia('quest_inquisitor_handshake');
      return { status:S_story.quests.quest_inquisitor_handshake, flag:S_story.inquisitorHandshakePassed, xp:S_story.xp };
    });
    expect(r.status).toBe('done'); expect(r.flag).toBe(true); expect(r.xp).toBe(50);
  });
});

// ── §ARCH-01 Wave 1m — Sea: The Warmth Calm (quest_sea_01..03) ──
//
// The Deep Warmth Eel arc. sea_01 is a waypoint-arrival side quest exercising
// the NEW completion term `atNode:'NWI'` (← completeFn:()=>currentCode==='NWI').
// sea_02 (INT Investigation DC13) + sea_03 (WIS Nature DC14) are pure-parity
// skill_checks: checkPassFlag→mission_bit{flag} (no label) + rich onPass via
// _legacy_fn. All checkStat/checkSkill → pure parity since §SKILLFIX-01.

test.describe('§ARCH-01 Wave 1m — Sea: The Warmth Calm (quest_sea_01..03)', () => {
  test('the new completion.atNode term: sea_01 completes only while currentCode===NWI', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const q = QUEST_DB.quest_sea_01;
      S_story.currentCode = 'SEN';
      const elsewhere = QuestRuntime.canComplete('quest_sea_01');
      S_story.currentCode = 'NWI';
      const atNWI = QuestRuntime.canComplete('quest_sea_01');
      return { schema:q.schema, valid:validateQuest(q).valid, gate:JSON.stringify(q.gate),
               completion:JSON.stringify(q.completion), hasOnComplete:typeof q.onComplete==='function',
               elsewhere, atNWI };
    });
    expect(r).toMatchObject({ schema:'UQF-1.0', valid:true, gate:'{}', completion:'{"atNode":"NWI"}', hasOnComplete:true });
    expect(r.elsewhere).toBe(false);
    expect(r.atNWI).toBe(true);
  });

  test('the two skill_checks validate with exact stat/skill/dc + mission_bit (no label) + gates', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => ['quest_sea_02','quest_sea_03'].map(id => {
      const q = QUEST_DB[id]; const bit = q.bits[0];
      const mb = (bit.onPass||[]).find(b=>b.kind==='mission_bit');
      return { id, schema:q.schema, valid:validateQuest(q).valid, stat:bit.stat, skill:bit.skill, dc:bit.dc,
               mbFlag:mb&&mb.flag, mbLabel:mb&&(mb.label||null),
               hasLegacyFn:(bit.onPass||[]).some(b=>b.kind==='_legacy_fn'), gate:JSON.stringify(q.gate) };
    }));
    expect(r.every(x => x.schema==='UQF-1.0' && x.valid && x.hasLegacyFn)).toBe(true);
    expect(r).toMatchObject([
      { id:'quest_sea_02', stat:'INT', skill:'Investigation', dc:13, mbFlag:'warmthEelFound',    mbLabel:null, gate:'{"flags":["seaStrangenessNoticed"]}' },
      { id:'quest_sea_03', stat:'WIS', skill:'Nature',        dc:14, mbFlag:'warmthEelEscorted', mbLabel:null, gate:'{"flags":["warmthEelFound"]}' },
    ]);
  });

  test('sea_02/03 PASS: exact gold/xp, flags, knowledge (02), Joint Pirate Debt Note + ally flag (03)', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const run = (id) => {
        S_story.abilityScores = { str:40, dex:40, con:40, int:40, wis:40, cha:40 };
        S_story.level = 20; S_story.gold = 0; S_story.xp = 0; S_story.inventory = []; S_story.knowledge = [];
        S_story.quests = { [id]:'active' };
        _rollCeremonia(id);
        return { status:S_story.quests[id], gold:S_story.gold, xp:S_story.xp, knowledge:S_story.knowledge.length };
      };
      const s2 = run('quest_sea_02'); const f2 = S_story.warmthEelFound;
      const s3 = run('quest_sea_03'); const f3 = S_story.warmthEelEscorted; const ally = S_story.pirateCrew_allied;
      const note = S_story.inventory.some(i=>i.name==='Joint Pirate Debt Note');
      return { s2, f2, s3, f3, ally, note };
    });
    expect(r.s2).toEqual({ status:'done', gold:200, xp:200, knowledge:1 }); expect(r.f2).toBe(true);
    expect(r.s3).toEqual({ status:'done', gold:400, xp:400, knowledge:0 });
    expect(r.f3).toBe(true); expect(r.ally).toBe(true); expect(r.note).toBe(true);
  });
});

// ── §ARCH-01 Wave 1n — Naval Intercept: the role-choice branch (quest_sb_*) ──
//
// Captain Keel's intercept. sb_01 is the structural hook side quest. The three
// branch quests (fight/parley/examine) gate on the NEW `flagEquals` term
// ({ sbChosenRole:'…' }, strict equality) + flags:['sbApproachSeen']. parley/
// examine are retryable:false skill_checks whose onFail flips sbChosenRole→
// 'fight' (the branch fallthrough — then sb_fight's gate activates). ⚠ sb_fight
// carries BOTH onComplete(+400xp) AND xpAward:400 → a latent +800xp double-count
// preserved verbatim for parity (the side-quest xpAward engine path is unchanged).

test.describe('§ARCH-01 Wave 1n — Naval Intercept branch (quest_sb_*)', () => {
  test('the new flagEquals gate term: branch quests activate only on the matching sbChosenRole', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const probe = (id, seen, role) => { S_story.sbApproachSeen = seen; S_story.sbChosenRole = role; return QuestRuntime.canActivate(id); };
      return {
        parleyNoApproach: probe('quest_sb_parley', false, 'parley'),
        parleyWrongRole:  probe('quest_sb_parley', true,  'fight'),
        parleyMatch:      probe('quest_sb_parley', true,  'parley'),
        examineMatch:     probe('quest_sb_examine', true, 'examine'),
        fightMatch:       probe('quest_sb_fight',   true, 'fight'),
        fightWrongRole:   probe('quest_sb_fight',   true, 'parley'),
      };
    });
    expect(r).toEqual({ parleyNoApproach:false, parleyWrongRole:false, parleyMatch:true, examineMatch:true, fightMatch:true, fightWrongRole:false });
  });

  test('all four validate; sb_01 structural side, sb_fight battle-completion, parley/examine skill_checks', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const get = (id) => { const q = QUEST_DB[id]; return { id, schema:q.schema, type:q.type, valid:validateQuest(q).valid, gate:JSON.stringify(q.gate), completion:q.completion?JSON.stringify(q.completion):null }; };
      const sc = (id) => { const q = QUEST_DB[id]; const b = q.bits[0]; const mb=(b.onPass||[]).find(x=>x.kind==='mission_bit'); return { id, stat:b.stat, skill:b.skill, dc:b.dc, mbFlag:mb&&mb.flag, mbLabel:mb&&(mb.label||null), failFlips:(b.onFail||[]).some(x=>x.kind==='_legacy_fn'), retryable:q.retryable }; };
      return { meta:[get('quest_sb_01'),get('quest_sb_fight')], checks:[sc('quest_sb_parley'),sc('quest_sb_examine')] };
    });
    expect(r.meta).toMatchObject([
      { id:'quest_sb_01',    schema:'UQF-1.0', type:'side', valid:true, gate:'{}',                                                          completion:'{"flags":["sbApproachSeen"]}' },
      { id:'quest_sb_fight', schema:'UQF-1.0', type:'side', valid:true, gate:'{"flags":["sbApproachSeen"],"flagEquals":{"sbChosenRole":"fight"}}', completion:'{"battles":["SB_PRIVATEER"]}' },
    ]);
    expect(r.checks).toMatchObject([
      { id:'quest_sb_parley',  stat:'CHA', skill:'Persuasion',    dc:12, mbFlag:'sbParleySucceeded', mbLabel:null, failFlips:true, retryable:false },
      { id:'quest_sb_examine', stat:'INT', skill:'Investigation', dc:11, mbFlag:'sbPapersRead',      mbLabel:null, failFlips:true, retryable:false },
    ]);
  });

  test('parley PASS: −80gp, +350xp, Letter of Marque, sbResolved+flag', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      S_story.abilityScores = { str:40, dex:40, con:40, int:40, wis:40, cha:40 };
      S_story.level = 20; S_story.gold = 1000; S_story.xp = 0; S_story.inventory = [];
      S_story.sbParleySucceeded = false; S_story.sbResolved = false;
      S_story.quests = { quest_sb_parley:'active' };
      _rollCeremonia('quest_sb_parley');
      return { status:S_story.quests.quest_sb_parley, gold:S_story.gold, xp:S_story.xp,
               flag:S_story.sbParleySucceeded, resolved:S_story.sbResolved,
               letter:S_story.inventory.some(i=>i.name==='Letter of Marque (Keel)') };
    });
    expect(r).toEqual({ status:'done', gold:920, xp:350, flag:true, resolved:true, letter:true });
  });

  test('parley FAIL (non-retryable): locks, flips sbChosenRole→fight (sb_fight then activatable)', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      S_story.abilityScores = { cha:-100 };       // deterministic fail
      S_story.level = 1; S_story.day = 2; S_story.skillCheckAttempts = {};
      S_story.gold = 1000; S_story.xp = 0; S_story.inventory = [];
      S_story.sbApproachSeen = true; S_story.sbChosenRole = 'parley';
      S_story.sbParleySucceeded = false; S_story.quests = { quest_sb_parley:'active' };
      _rollCeremonia('quest_sb_parley');
      const fightNowActivatable = QuestRuntime.canActivate('quest_sb_fight');
      return { status:S_story.quests.quest_sb_parley, role:S_story.sbChosenRole,
               gold:S_story.gold, xp:S_story.xp, flag:S_story.sbParleySucceeded, fightNowActivatable };
    });
    expect(r.status).toBe('failed');           // retryable:false ⇒ locked
    expect(r.role).toBe('fight');              // onFail flipped the branch
    expect(r.gold).toBe(1000); expect(r.xp).toBe(0); expect(r.flag).toBe(false);
    expect(r.fightNowActivatable).toBe(true);  // the fallthrough now opens the fight quest
  });

  test('sb_fight onComplete grants +400xp closure portion + Letter of Marque + sbResolved (xpAward:400 still set for the engine path → latent +800 total)', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      S_story.xp = 0; S_story.gold = 0; S_story.inventory = []; S_story.sbResolved = false;
      QUEST_DB.quest_sb_fight.onComplete();   // the closure portion only
      return { xp:S_story.xp, gold:S_story.gold, resolved:S_story.sbResolved,
               letter:S_story.inventory.some(i=>i.name==='Letter of Marque (Keel)'),
               xpAward:QUEST_DB.quest_sb_fight.xpAward };
    });
    expect(r.xp).toBe(400); expect(r.gold).toBe(200); expect(r.resolved).toBe(true); expect(r.letter).toBe(true);
    expect(r.xpAward).toBe(400);   // engine's side-quest path adds another +400 on completion (latent double-count, parity-preserved)
  });
});

// ── §ARCH-01 Wave 1o — Lake/Relay Monster Hunt arcs (quest_hunt_* / quest_hunt2_*) ──
//
// Two structurally identical investigate→clear arcs: hunt2 (Night Hag relay
// road, WRO→BNX) and hunt (lake drowners, HFT→VAW). Each: structural hook side
// (_01, gate:{}), 2 retryable:false skill_checks (_02/_03, checkStat → pure
// parity, mission_bit{flag}+onPass/onFail _legacy_fn), and a lair-clear side
// (_04, battle completion). ⚠ hunt_04/hunt2_04 share the sb_fight latent
// double-count (onComplete +Nxp ∧ xpAward:N) — preserved verbatim.

test.describe('§ARCH-01 Wave 1o — Lake/Relay Monster Hunt (quest_hunt_* / quest_hunt2_*)', () => {
  const SKILL = [
    { id:'quest_hunt2_02', stat:'WIS', skill:'Perception',    dc:11, flag:'bendRoadClue',   gate:'{"flags":["huntHook2Received"]}', xp:150, knowledge:1 },
    { id:'quest_hunt2_03', stat:'INT', skill:'Investigation', dc:13, flag:'bendLairFound',   gate:'{"flags":["bendRoadClue"]}',      xp:200, knowledge:0 },
    { id:'quest_hunt_02',  stat:'INT', skill:'Investigation', dc:12, flag:'lakeClueFound',   gate:'{"flags":["huntHookReceived"]}',  xp:200, knowledge:1 },
    { id:'quest_hunt_03',  stat:'WIS', skill:'Perception',    dc:13, flag:'lakeLairLocated', gate:'{"flags":["lakeClueFound"]}',     xp:250, knowledge:0 },
  ];

  test('all 8 validate; 4 skill_checks (no mission_bit label) + 4 side quests (hooks gate:{}, lairs battle-completion)', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const sk = ['quest_hunt2_02','quest_hunt2_03','quest_hunt_02','quest_hunt_03'].map(id => {
        const q = QUEST_DB[id]; const b = q.bits[0]; const mb=(b.onPass||[]).find(x=>x.kind==='mission_bit');
        return { id, schema:q.schema, valid:validateQuest(q).valid, stat:b.stat, skill:b.skill, dc:b.dc, mbFlag:mb&&mb.flag, mbLabel:mb&&(mb.label||null), gate:JSON.stringify(q.gate), failFn:(b.onFail||[]).some(x=>x.kind==='_legacy_fn') };
      });
      const side = ['quest_hunt2_01','quest_hunt2_04','quest_hunt_01','quest_hunt_04'].map(id => {
        const q = QUEST_DB[id];
        return { id, schema:q.schema, valid:validateQuest(q).valid, gate:JSON.stringify(q.gate), completion:JSON.stringify(q.completion), onComplete:typeof q.onComplete==='function' };
      });
      return { sk, side };
    });
    expect(r.sk.every(x => x.schema==='UQF-1.0' && x.valid && x.mbLabel===null && x.failFn)).toBe(true);
    expect(r.sk).toMatchObject([
      { id:'quest_hunt2_02', stat:'WIS', skill:'Perception',    dc:11, mbFlag:'bendRoadClue',   gate:'{"flags":["huntHook2Received"]}' },
      { id:'quest_hunt2_03', stat:'INT', skill:'Investigation', dc:13, mbFlag:'bendLairFound',   gate:'{"flags":["bendRoadClue"]}' },
      { id:'quest_hunt_02',  stat:'INT', skill:'Investigation', dc:12, mbFlag:'lakeClueFound',   gate:'{"flags":["huntHookReceived"]}' },
      { id:'quest_hunt_03',  stat:'WIS', skill:'Perception',    dc:13, mbFlag:'lakeLairLocated', gate:'{"flags":["lakeClueFound"]}' },
    ]);
    expect(r.side).toMatchObject([
      { id:'quest_hunt2_01', schema:'UQF-1.0', valid:true, gate:'{}',                        completion:'{"flags":["huntHook2Received"]}', onComplete:false },
      { id:'quest_hunt2_04', schema:'UQF-1.0', valid:true, gate:'{"flags":["bendLairFound"]}',  completion:'{"battles":["BN_NIGHTHAG"]}',    onComplete:true },
      { id:'quest_hunt_01',  schema:'UQF-1.0', valid:true, gate:'{}',                        completion:'{"flags":["huntHookReceived"]}',  onComplete:false },
      { id:'quest_hunt_04',  schema:'UQF-1.0', valid:true, gate:'{"flags":["lakeLairLocated"]}', completion:'{"battles":["LD_DROWNERS"]}',  onComplete:true },
    ]);
  });

  test('every skill_check PASS: done + flag + token + exact xp + knowledge count', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const got = await page.evaluate((SKILL) => {
      const out = {};
      for (const s of SKILL) {
        S_story.abilityScores = { str:40, dex:40, con:40, int:40, wis:40, cha:40 };
        S_story.level = 20; S_story.xp = 0; S_story.inventory = []; S_story.knowledge = [];
        S_story[s.flag] = false; S_story.quests = { [s.id]:'active' };
        _rollCeremonia(s.id);
        out[s.id] = { status:S_story.quests[s.id], xp:S_story.xp, flag:S_story[s.flag],
                      token:S_story.inventory.some(i=>i.flagRef===s.flag), knowledge:S_story.knowledge.length };
      }
      return out;
    }, SKILL);
    for (const s of SKILL) {
      expect(got[s.id], s.id).toEqual({ status:'done', xp:s.xp, flag:true, token:true, knowledge:s.knowledge });
    }
  });

  test('lair-clear onComplete closures grant item + knowledge + gold/xp (and xpAward still set → latent double-count)', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const run = (id) => {
        S_story.xp = 0; S_story.gold = 0; S_story.inventory = []; S_story.knowledge = [];
        QUEST_DB[id].onComplete();
        return { xp:S_story.xp, gold:S_story.gold, knowledge:S_story.knowledge.length, inv:S_story.inventory.map(i=>i.name), xpAward:QUEST_DB[id].xpAward };
      };
      return { hag:run('quest_hunt2_04'), den:run('quest_hunt_04') };
    });
    expect(r.hag.xp).toBe(600); expect(r.hag.gold).toBe(400); expect(r.hag.knowledge).toBe(1);
    expect(r.hag.inv).toContain('Relay Station Token'); expect(r.hag.xpAward).toBe(600);  // engine adds another +600
    expect(r.den.xp).toBe(500); expect(r.den.gold).toBe(500); expect(r.den.knowledge).toBe(1);
    expect(r.den.inv).toContain('Drowned Compass'); expect(r.den.xpAward).toBe(500);      // engine adds another +500
  });
});

// ── §ARCH-01 Wave 1p — Bilge Mystery (§WHODUNIT-01, quest_bilge_01..04) ──
//
// Same investigate→clear shape as the hunt arcs: hook side (_01, flag gate),
// 2 retryable:false checkStat skill_checks (_02 INT Investigation DC12, _03 WIS
// Insight DC13; mission_bit{flag} no-label + onPass/onFail _legacy_fn), lair-clear
// side (_04, battle completion + verbatim onComplete). ⚠ bilge_04 shares the
// sb_fight/hunt_04 latent double-count (onComplete +600 ∧ xpAward:600 → +1200xp).

test.describe('§ARCH-01 Wave 1p — Bilge Mystery (quest_bilge_01..04)', () => {
  test('all 4 validate; 2 skill_checks (no label) + hook side (flag gate) + lair side (battle completion)', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const sk = ['quest_bilge_02','quest_bilge_03'].map(id => {
        const q = QUEST_DB[id]; const b = q.bits[0]; const mb=(b.onPass||[]).find(x=>x.kind==='mission_bit');
        return { id, schema:q.schema, valid:validateQuest(q).valid, stat:b.stat, skill:b.skill, dc:b.dc, mbFlag:mb&&mb.flag, mbLabel:mb&&(mb.label||null), gate:JSON.stringify(q.gate), retryable:q.retryable, failFn:(b.onFail||[]).some(x=>x.kind==='_legacy_fn') };
      });
      const side = ['quest_bilge_01','quest_bilge_04'].map(id => {
        const q = QUEST_DB[id];
        return { id, schema:q.schema, valid:validateQuest(q).valid, gate:JSON.stringify(q.gate), completion:JSON.stringify(q.completion), onComplete:typeof q.onComplete==='function' };
      });
      return { sk, side };
    });
    expect(r.sk.every(x => x.schema==='UQF-1.0' && x.valid && x.mbLabel===null && !x.retryable && x.failFn)).toBe(true);
    expect(r.sk).toMatchObject([
      { id:'quest_bilge_02', stat:'INT', skill:'Investigation', dc:12, mbFlag:'whodunit2ClueFound',   gate:'{"flags":["whodunit2HookReceived"]}' },
      { id:'quest_bilge_03', stat:'WIS', skill:'Insight',       dc:13, mbFlag:'whodunit2WitnessRead', gate:'{"flags":["whodunit2ClueFound"]}' },
    ]);
    expect(r.side).toMatchObject([
      { id:'quest_bilge_01', schema:'UQF-1.0', valid:true, gate:'{"flags":["saltwickAccessed"]}',   completion:'{"flags":["whodunit2HookReceived"]}', onComplete:false },
      { id:'quest_bilge_04', schema:'UQF-1.0', valid:true, gate:'{"flags":["whodunit2WitnessRead"]}', completion:'{"battles":["MS_BILGE"]}',           onComplete:true },
    ]);
  });

  test('both skill_check PASSes: done + flag + token + 200xp (03 no knowledge, 02 +1)', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const run = (id, flag) => {
        S_story.abilityScores = { str:40, dex:40, con:40, int:40, wis:40, cha:40 };
        S_story.level = 20; S_story.xp = 0; S_story.inventory = []; S_story.knowledge = [];
        S_story[flag] = false; S_story.quests = { [id]:'active' };
        _rollCeremonia(id);
        return { status:S_story.quests[id], xp:S_story.xp, flag:S_story[flag], token:S_story.inventory.some(i=>i.flagRef===flag), knowledge:S_story.knowledge.length };
      };
      return { c:run('quest_bilge_02','whodunit2ClueFound'), w:run('quest_bilge_03','whodunit2WitnessRead') };
    });
    expect(r.c).toEqual({ status:'done', xp:200, flag:true, token:true, knowledge:1 });
    expect(r.w).toEqual({ status:'done', xp:200, flag:true, token:true, knowledge:0 });
  });

  test('bilge_04 onComplete: +600gp/+600xp closure + Sea Spawn Scale Fragment + knowledge + solved flag (xpAward:600 → latent +1200)', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      S_story.xp = 0; S_story.gold = 0; S_story.inventory = []; S_story.knowledge = []; S_story.whodunit2Solved = false;
      QUEST_DB.quest_bilge_04.onComplete();
      return { xp:S_story.xp, gold:S_story.gold, knowledge:S_story.knowledge.length, solved:S_story.whodunit2Solved,
               frag:S_story.inventory.some(i=>i.name==='Sea Spawn Scale Fragment'), xpAward:QUEST_DB.quest_bilge_04.xpAward };
    });
    expect(r.xp).toBe(600); expect(r.gold).toBe(600); expect(r.knowledge).toBe(1);
    expect(r.solved).toBe(true); expect(r.frag).toBe(true); expect(r.xpAward).toBe(600);  // engine adds another +600 on completion
  });
});

// ── §ARCH-01 Wave 1q — The Personal Legend (§ALCHEMY-01, quest_alch_01..07) ──
//
// Roen's pilgrimage (Coelho's Alchemist retold). 5 structural waypoint side
// quests (01/02/03/06/07 — flag-chained gate + completion, NO onComplete) + 2
// retryable checkStat skill_checks (04 CHA Persuasion DC11, 05 WIS Insight DC12;
// mission_bit{flag} no-label + onPass/onFail _legacy_fn). The arc's terminal flag
// personalLegendComplete gates the §WISDOM-01 wis arc. Zero engine changes.

test.describe('§ARCH-01 Wave 1q — The Personal Legend (quest_alch_01..07)', () => {
  test('all 7 validate; 5 chained side quests (no onComplete) + 2 skill_checks (no label)', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const side = ['quest_alch_01','quest_alch_02','quest_alch_03','quest_alch_06','quest_alch_07'].map(id => {
        const q = QUEST_DB[id];
        return { id, schema:q.schema, type:q.type, valid:validateQuest(q).valid, gate:JSON.stringify(q.gate), completion:JSON.stringify(q.completion), onComplete:typeof q.onComplete==='function' };
      });
      const sk = ['quest_alch_04','quest_alch_05'].map(id => {
        const q = QUEST_DB[id]; const b = q.bits[0]; const mb=(b.onPass||[]).find(x=>x.kind==='mission_bit');
        return { id, schema:q.schema, valid:validateQuest(q).valid, stat:b.stat, skill:b.skill, dc:b.dc, mbFlag:mb&&mb.flag, mbLabel:mb&&(mb.label||null), gate:JSON.stringify(q.gate), retryable:q.retryable };
      });
      return { side, sk };
    });
    expect(r.side.every(x => x.schema==='UQF-1.0' && x.valid && x.type==='side' && !x.onComplete)).toBe(true);
    expect(r.side).toMatchObject([
      { id:'quest_alch_01', gate:'{}',                            completion:'{"flags":["roenMet"]}' },
      { id:'quest_alch_02', gate:'{"flags":["roenMet"]}',         completion:'{"flags":["roenMidlandsWisdom"]}' },
      { id:'quest_alch_03', gate:'{"flags":["roenMidlandsWisdom"]}', completion:'{"flags":["roenAtSea"]}' },
      { id:'quest_alch_06', gate:'{"flags":["roenMaltaCrisis"]}', completion:'{"flags":["roenAlchemistMet"]}' },
      { id:'quest_alch_07', gate:'{"flags":["roenAlchemistMet"]}', completion:'{"flags":["personalLegendComplete"]}' },
    ]);
    expect(r.sk.every(x => x.schema==='UQF-1.0' && x.valid && x.mbLabel===null && x.retryable===true)).toBe(true);
    expect(r.sk).toMatchObject([
      { id:'quest_alch_04', stat:'CHA', skill:'Persuasion', dc:11, mbFlag:'roenOracleRead',  gate:'{"flags":["roenAtSea"]}' },
      { id:'quest_alch_05', stat:'WIS', skill:'Insight',    dc:12, mbFlag:'roenMaltaCrisis', gate:'{"flags":["roenOracleRead"]}' },
    ]);
  });

  test('alch_04/05 PASS: done + flag + token + exact xp/gold (05 also +250gp)', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const run = (id, flag) => {
        S_story.abilityScores = { str:40, dex:40, con:40, int:40, wis:40, cha:40 };
        S_story.level = 20; S_story.xp = 0; S_story.gold = 0; S_story.inventory = [];
        S_story[flag] = false; S_story.quests = { [id]:'active' };
        _rollCeremonia(id);
        return { status:S_story.quests[id], xp:S_story.xp, gold:S_story.gold, flag:S_story[flag], token:S_story.inventory.some(i=>i.flagRef===flag) };
      };
      return { o:run('quest_alch_04','roenOracleRead'), m:run('quest_alch_05','roenMaltaCrisis') };
    });
    expect(r.o).toEqual({ status:'done', xp:300, gold:0,   flag:true, token:true });
    expect(r.m).toEqual({ status:'done', xp:350, gold:250, flag:true, token:true });
  });

  test('alch_04 retryable FAIL: stays active, no flag/xp', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      S_story.abilityScores = { cha:-100 };       // deterministic fail
      S_story.level = 1; S_story.day = 2; S_story.skillCheckAttempts = {};
      S_story.xp = 0; S_story.roenOracleRead = false; S_story.quests = { quest_alch_04:'active' };
      _rollCeremonia('quest_alch_04');
      return { status:S_story.quests.quest_alch_04, xp:S_story.xp, flag:S_story.roenOracleRead, fails:(S_story.skillCheckAttempts.quest_alch_04||{}).failures };
    });
    expect(r.status).toBe('active'); expect(r.xp).toBe(0); expect(r.flag).toBe(false); expect(r.fails).toBe(1);
  });
});

// ── §ARCH-01 Wave 1r — The Scar (§SCAR-01 Gret Orrens, quest_scar_01..04) ──
//
// checkAbility quests (pure parity), NO checkPassFlag (closures set flags →
// _legacy_fn; xpAward→reward{xp}). scar_03 is a moral BRANCH: onPass sets
// gretChoice='help', onFail sets 'refuse' (retryable:false → locks 'failed' but
// still progresses, since scar_04 gates on gretChoice truthy). scar_04 (side)
// keeps its itemChain (Scar's Light + Orrens Manuscript) + xpAward:350 + the
// per-id WIS handler — all schema-agnostic; completion = flags:['gretChoice'] ∧
// atNode:'NUE'.

test.describe('§ARCH-01 Wave 1r — The Scar (quest_scar_01..04)', () => {
  test('all 4 validate; 3 checkAbility skill_checks (no mission_bit) + scar_04 side (flags+atNode completion)', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const sk = ['quest_scar_01','quest_scar_02','quest_scar_03'].map(id => {
        const q = QUEST_DB[id]; const b = q.bits[0];
        return { id, schema:q.schema, valid:validateQuest(q).valid, stat:b.stat, skill:b.skill, dc:b.dc,
                 hasMissionBit:(b.onPass||[]).some(x=>x.kind==='mission_bit'),
                 xp:(b.onPass||[]).find(x=>x.kind==='reward')?.xp,
                 gate:JSON.stringify(q.gate), retryable:q.retryable,
                 failFn:(b.onFail||[]).some(x=>x.kind==='_legacy_fn') };
      });
      const s4 = QUEST_DB.quest_scar_04;
      return { sk, s4:{ schema:s4.schema, type:s4.type, valid:validateQuest(s4).valid, gate:JSON.stringify(s4.gate), completion:JSON.stringify(s4.completion), hasItemChain:Array.isArray(s4.itemChain)&&s4.itemChain.length===2, xpAward:s4.xpAward } };
    });
    expect(r.sk.every(x => x.schema==='UQF-1.0' && x.valid && !x.hasMissionBit)).toBe(true);
    expect(r.sk).toMatchObject([
      { id:'quest_scar_01', stat:'INT', skill:'Investigation', dc:8,  xp:100, gate:'{}',                                           retryable:true,  failFn:false },
      { id:'quest_scar_02', stat:'WIS', skill:'Insight',       dc:12, xp:200, gate:'{"flags":["gretMet"]}',                        retryable:true,  failFn:false },
      { id:'quest_scar_03', stat:'WIS', skill:'Insight',       dc:11, xp:250, gate:'{"flags":["gretLabyrinth"],"notFlags":["gretChoice"]}', retryable:false, failFn:true },
    ]);
    expect(r.s4).toEqual({ schema:'UQF-1.0', type:'side', valid:true, gate:'{"flags":["gretChoice"]}', completion:'{"flags":["gretChoice"],"atNode":"NUE"}', hasItemChain:true, xpAward:350 });
  });

  test('scar_01/02 PASS: done + flag(s) + exact xp (no token, no checkPassFlag)', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const run = (id) => {
        S_story.abilityScores = { str:40, dex:40, con:40, int:40, wis:40, cha:40 };
        S_story.level = 20; S_story.xp = 0; S_story.inventory = [];
        S_story.gretMet = false; S_story.gretLabyrinth = false; S_story.pierFalkWarm = false;
        S_story.quests = { [id]:'active' };
        _rollCeremonia(id);
        return { status:S_story.quests[id], xp:S_story.xp, tokens:S_story.inventory.length };
      };
      const a = run('quest_scar_01'); const met = S_story.gretMet;
      const b = run('quest_scar_02'); const lab = S_story.gretLabyrinth; const warm = S_story.pierFalkWarm;
      return { a, met, b, lab, warm };
    });
    expect(r.a).toEqual({ status:'done', xp:100, tokens:0 }); expect(r.met).toBe(true);
    expect(r.b).toEqual({ status:'done', xp:200, tokens:0 }); expect(r.lab).toBe(true); expect(r.warm).toBe(true);
  });

  test('scar_03 BRANCH: PASS→gretChoice=help (+250xp, done); FAIL→gretChoice=refuse (locks failed, no xp), both let scar_04 activate', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const pass = (() => {
        S_story.abilityScores = { wis:40 }; S_story.level = 20; S_story.xp = 0;
        S_story.gretChoice = ''; S_story.quests = { quest_scar_03:'active' };
        _rollCeremonia('quest_scar_03');
        return { status:S_story.quests.quest_scar_03, choice:S_story.gretChoice, xp:S_story.xp, s4:QuestRuntime.canActivate('quest_scar_04') };
      })();
      const fail = (() => {
        S_story.abilityScores = { wis:-100 }; S_story.level = 1; S_story.day = 1; S_story.skillCheckAttempts = {}; S_story.xp = 0;
        S_story.gretChoice = ''; S_story.gretLabyrinth = true; S_story.quests = { quest_scar_03:'active' };
        _rollCeremonia('quest_scar_03');
        return { status:S_story.quests.quest_scar_03, choice:S_story.gretChoice, xp:S_story.xp, s4:QuestRuntime.canActivate('quest_scar_04') };
      })();
      return { pass, fail };
    });
    expect(r.pass).toEqual({ status:'done',   choice:'help',   xp:250, s4:true });
    expect(r.fail).toEqual({ status:'failed', choice:'refuse', xp:0,   s4:true });
  });

  test('scar_04 completion.atNode: needs gretChoice AND currentCode===NUE', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      S_story.gretChoice = 'help';
      S_story.currentCode = 'LHR'; const wrongNode = QuestRuntime.canComplete('quest_scar_04');
      S_story.currentCode = 'NUE'; const atNUE = QuestRuntime.canComplete('quest_scar_04');
      S_story.gretChoice = ''; const noChoice = QuestRuntime.canComplete('quest_scar_04');
      return { wrongNode, atNUE, noChoice };
    });
    expect(r).toEqual({ wrongNode:false, atNUE:true, noChoice:false });
  });
});

// ── §ARCH-01 Wave 1s — The Four Courts of the Littoral Sea (§SIREN-01) ──
//
// 5 skill_checks (LC1 aurel, LC2 calice, LC3 mireille, LC4 solen, LSO overseer),
// all retryable:false, pure parity, fully decomposed (NO onPass closures existed):
// checkPassFlag→onPass mission_bit{flag,label}; xpAward→reward; checkFailFlag→
// onFail mission_bit with the SAME bitLabel (mirrors legacy _grantMissionBit(
// failFlag, q.bitLabel)). solen_horizon had no checkFailFlag → onFail:[]. The
// pass/fail flags are read directly by the LC1–LC4/LSO NPC quoteFns + the
// LJ3/betrayalCount blocks; mission_bit sets the flag + grants the token, so
// those reads keep working byte-for-byte.

const SIREN = [
  { id:'quest_aurel_tide',    stat:'WIS', skill:'Insight',       dc:12, xp:150, passFlag:'aurelTideRead',       label:'Aurel Seal',     failFlag:'betrayalThought' },
  { id:'quest_calice_bridge', stat:'INT', skill:'Investigation', dc:13, xp:175, passFlag:'caliceBridgeCrossed', label:'Calice Crossing', failFlag:'betrayalWord' },
  { id:'quest_mireille_ami',  stat:'CHA', skill:'Persuasion',    dc:14, xp:200, passFlag:'mireilleAmiNamed',    label:'Mireille Named', failFlag:'betrayalDeed' },
  { id:'quest_solen_horizon', stat:'WIS', skill:'Insight',       dc:13, xp:225, passFlag:'solenSoonRead',       label:'Solen Truth',    failFlag:null },
  { id:'quest_sea_overseer',  stat:'WIS', skill:'Insight',       dc:15, xp:250, passFlag:'charmResisted',       label:'Charm Resisted', failFlag:'seaOverseerMet' },
];

test.describe('§ARCH-01 Wave 1s — The Four Courts of the Littoral Sea (§SIREN-01)', () => {
  test('all 5 validate as UQF skill_checks; gate:{}, retryable:false, onPass mission_bit{flag,label}+reward, onFail mission_bit (solen onFail:[])', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate((SIREN) => SIREN.map(s => {
      const q = QUEST_DB[s.id]; const b = (q.bits || []).find(x => x.kind === 'skill_check');
      const pb = (b.onPass || []).find(x => x.kind === 'mission_bit');
      const rw = (b.onPass || []).find(x => x.kind === 'reward');
      const fb = (b.onFail || []).find(x => x.kind === 'mission_bit');
      return { id:s.id, schema:q.schema, valid:validateQuest(q).valid, type:q.type,
               gate:JSON.stringify(q.gate), retryable:q.retryable,
               stat:b.stat, skill:b.skill, dc:b.dc,
               passFlag:pb && pb.flag, passLabel:pb && pb.label, xp:rw && rw.xp,
               failFlag:fb ? fb.flag : null, failLabel:fb ? fb.label : null,
               failLen:(b.onFail || []).length };
    }), SIREN);
    for (const s of SIREN) {
      const got = r.find(x => x.id === s.id);
      expect(got).toMatchObject({
        schema:'UQF-1.0', valid:true, type:'skill_check', gate:'{}', retryable:false,
        stat:s.stat, skill:s.skill, dc:s.dc,
        passFlag:s.passFlag, passLabel:s.label, xp:s.xp,
      });
      if (s.failFlag) expect(got).toMatchObject({ failFlag:s.failFlag, failLabel:s.label });
      else expect(got.failLen).toBe(0);
    }
  });

  test('activation gate:{} — all 5 activatable from a fresh slate', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate((SIREN) => {
      S_story.quests = {};
      return SIREN.map(s => ({ id:s.id, can:QuestRuntime.canActivate(s.id) }));
    }, SIREN);
    expect(r.every(x => x.can === true)).toBe(true);
  });

  test('PASS parity: done + pass flag true + token{flagRef,name} + exact xp delta', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate((SIREN) => SIREN.map(s => {
      S_story.abilityScores = { [s.stat.toLowerCase()]: 40 };
      S_story.level = 20; S_story.xp = 0; S_story.inventory = [];
      S_story[s.passFlag] = false; if (s.failFlag) S_story[s.failFlag] = false;
      S_story.quests = { [s.id]:'active' };
      _rollCeremonia(s.id);
      const tok = S_story.inventory.find(i => i.type === 'mission_bit' && i.flagRef === s.passFlag);
      return { id:s.id, status:S_story.quests[s.id], flag:S_story[s.passFlag], xp:S_story.xp,
               tokName:tok && tok.name, failFlagSet:s.failFlag ? S_story[s.failFlag] : null };
    }), SIREN);
    for (const s of SIREN) {
      const got = r.find(x => x.id === s.id);
      expect(got).toEqual({ id:s.id, status:'done', flag:true, xp:s.xp,
                            tokName:s.label + ' Token', failFlagSet:s.failFlag ? false : null });
    }
  });

  test('FAIL parity (non-retryable): failed + fail flag/token (same bitLabel), pass flag false, no xp; solen grants nothing', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate((SIREN) => SIREN.map(s => {
      S_story.abilityScores = { [s.stat.toLowerCase()]: -100 };
      S_story.level = 1; S_story.day = 1; S_story.skillCheckAttempts = {};
      S_story.xp = 0; S_story.inventory = [];
      S_story[s.passFlag] = false; if (s.failFlag) S_story[s.failFlag] = false;
      S_story.quests = { [s.id]:'active' };
      _rollCeremonia(s.id);
      const failTok = s.failFlag ? S_story.inventory.find(i => i.type === 'mission_bit' && i.flagRef === s.failFlag) : null;
      return { id:s.id, status:S_story.quests[s.id], passFlag:S_story[s.passFlag], xp:S_story.xp,
               failFlagSet:s.failFlag ? S_story[s.failFlag] : null,
               failTokName:failTok ? failTok.name : null, tokens:S_story.inventory.length };
    }), SIREN);
    for (const s of SIREN) {
      const got = r.find(x => x.id === s.id);
      expect(got.status).toBe('failed');
      expect(got.passFlag).toBe(false);
      expect(got.xp).toBe(0);
      if (s.failFlag) {
        expect(got.failFlagSet).toBe(true);
        expect(got.failTokName).toBe(s.label + ' Token');
        expect(got.tokens).toBe(1);
      } else {
        expect(got.tokens).toBe(0); // solen: no checkFailFlag, onFail:[]
      }
    }
  });
});

// ── §ARCH-01 Wave 1t — Biblical singletons (quest_stoning_lystra, quest_basket_damascus) ──
//
// Two Acts/Pauline skill_checks closing out the biblical Wave-1 cluster.
//   stoning_lystra (KYA, STR Athletics DC13, retryable:false): SHARED pass/fail flag
//     stoningEvent (bitLabel 'Lystra Stoning') — the same mission_bit grants on BOTH outcomes;
//     the legacy onFail hp→1 closure rides as a _legacy_fn ordered before the bit. gate
//     {questsDone:['quest_lame_lystra']}.
//   basket_damascus (DAM, STR Athletics DC12, retryable:true/retryGateDays:1): onPass fully
//     decomposed into TWO mission_bits (escapedDamascus 'Damascus Escape' + basketRopeComplete
//     'Basket Rope') + reward; onFail:[] (retryable → no terminal fail flag). gate
//     {flags:['anathSightRestored']}.
test.describe('§ARCH-01 Wave 1t — Biblical singletons (stoning_lystra, basket_damascus)', () => {
  test('both validate as UQF skill_checks with correct gate / stat / dc / onPass / onFail shape', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const dump = (id) => {
        const q = QUEST_DB[id]; const b = (q.bits || []).find(x => x.kind === 'skill_check');
        return { id, schema:q.schema, valid:validateQuest(q).valid, type:q.type,
                 gate:JSON.stringify(q.gate), retryable:q.retryable, retryGateDays:q.retryGateDays,
                 stat:b.stat, skill:b.skill, dc:b.dc,
                 onPass:b.onPass.map(x => x.kind === 'mission_bit' ? 'mb:' + x.flag + ':' + x.label
                                       : x.kind === 'reward' ? 'xp:' + x.xp : x.kind),
                 onFail:b.onFail.map(x => x.kind === 'mission_bit' ? 'mb:' + x.flag + ':' + x.label : x.kind) };
      };
      return { stoning:dump('quest_stoning_lystra'), basket:dump('quest_basket_damascus') };
    });
    expect(r.stoning).toMatchObject({
      schema:'UQF-1.0', valid:true, type:'skill_check',
      gate:'{"questsDone":["quest_lame_lystra"]}', retryable:false,
      stat:'STR', skill:'Athletics', dc:13,
      onPass:['mb:stoningEvent:Lystra Stoning', 'xp:150'],
      onFail:['_legacy_fn', 'mb:stoningEvent:Lystra Stoning'],
    });
    expect(r.basket).toMatchObject({
      schema:'UQF-1.0', valid:true, type:'skill_check',
      gate:'{"flags":["anathSightRestored"]}', retryable:true, retryGateDays:1,
      stat:'STR', skill:'Athletics', dc:12,
      onPass:['mb:escapedDamascus:Damascus Escape', 'xp:150', 'mb:basketRopeComplete:Basket Rope'],
      onFail:[],
    });
  });

  test('declarative gates open only when their prerequisite is met', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      S_story.quests = {}; S_story.anathSightRestored = false;
      const closed = { stoning:QuestRuntime.canActivate('quest_stoning_lystra'),
                       basket:QuestRuntime.canActivate('quest_basket_damascus') };
      S_story.quests = { quest_lame_lystra:'done' }; S_story.anathSightRestored = true;
      const open = { stoning:QuestRuntime.canActivate('quest_stoning_lystra'),
                     basket:QuestRuntime.canActivate('quest_basket_damascus') };
      return { closed, open };
    });
    expect(r.closed).toEqual({ stoning:false, basket:false });
    expect(r.open).toEqual({ stoning:true, basket:true });
  });

  test('stoning PASS parity: done + stoningEvent true + Lystra token + xp+150', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      S_story.abilityScores = { str:40 }; S_story.level = 20; S_story.xp = 0;
      S_story.hp = 30; S_story.inventory = []; S_story.stoningEvent = false;
      S_story.quests = { quest_stoning_lystra:'active' };
      _rollCeremonia('quest_stoning_lystra');
      const tok = S_story.inventory.find(i => i.type === 'mission_bit' && i.flagRef === 'stoningEvent');
      return { status:S_story.quests.quest_stoning_lystra, flag:S_story.stoningEvent,
               xp:S_story.xp, hp:S_story.hp, tokName:tok && tok.name, tokens:S_story.inventory.length };
    });
    expect(r).toEqual({ status:'done', flag:true, xp:150, hp:30, tokName:'Lystra Stoning Token', tokens:1 });
  });

  test('stoning FAIL parity (non-retryable): failed + stoningEvent true (shared flag) + token + hp→1 + no xp', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      S_story.abilityScores = { str:-100 }; S_story.level = 1; S_story.xp = 0;
      S_story.hp = 30; S_story.inventory = []; S_story.stoningEvent = false;
      S_story.quests = { quest_stoning_lystra:'active' };
      _rollCeremonia('quest_stoning_lystra');
      const tok = S_story.inventory.find(i => i.type === 'mission_bit' && i.flagRef === 'stoningEvent');
      return { status:S_story.quests.quest_stoning_lystra, flag:S_story.stoningEvent,
               xp:S_story.xp, hp:S_story.hp, tokName:tok && tok.name, tokens:S_story.inventory.length };
    });
    expect(r).toEqual({ status:'failed', flag:true, xp:0, hp:1, tokName:'Lystra Stoning Token', tokens:1 });
  });

  test('basket PASS parity: done + both flags + two tokens + xp+150', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      S_story.abilityScores = { str:40 }; S_story.level = 20; S_story.xp = 0;
      S_story.inventory = []; S_story.escapedDamascus = false; S_story.basketRopeComplete = false;
      S_story.quests = { quest_basket_damascus:'active' };
      _rollCeremonia('quest_basket_damascus');
      const t1 = S_story.inventory.find(i => i.type === 'mission_bit' && i.flagRef === 'escapedDamascus');
      const t2 = S_story.inventory.find(i => i.type === 'mission_bit' && i.flagRef === 'basketRopeComplete');
      return { status:S_story.quests.quest_basket_damascus, esc:S_story.escapedDamascus,
               rope:S_story.basketRopeComplete, xp:S_story.xp,
               t1:t1 && t1.name, t2:t2 && t2.name, tokens:S_story.inventory.length };
    });
    expect(r).toEqual({ status:'done', esc:true, rope:true, xp:150,
                        t1:'Damascus Escape Token', t2:'Basket Rope Token', tokens:2 });
  });

  test('basket FAIL parity (retryable): stays active, no flags, no tokens, no xp, attempt recorded', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      S_story.abilityScores = { str:-100 }; S_story.level = 1; S_story.day = 5; S_story.xp = 0;
      S_story.skillCheckAttempts = {}; S_story.inventory = [];
      S_story.escapedDamascus = false; S_story.basketRopeComplete = false;
      S_story.quests = { quest_basket_damascus:'active' };
      _rollCeremonia('quest_basket_damascus');
      return { status:S_story.quests.quest_basket_damascus, esc:S_story.escapedDamascus,
               rope:S_story.basketRopeComplete, xp:S_story.xp, tokens:S_story.inventory.length,
               failures:(S_story.skillCheckAttempts.quest_basket_damascus || {}).failures };
    });
    expect(r).toEqual({ status:'active', esc:false, rope:false, xp:0, tokens:0, failures:1 });
  });
});

// ── §ARCH-01 Wave 1u — Atlantean iodine chain (iodine_01, shore_02, forge_01, sunken_01) ──
//
// The four skill_checks of the §CROWN-01 iodine reduction chain (INN→DS1→DSF→DA1).
// All retryable:true, NO checkPassFlag/checkFailFlag — each carries a rich onPass closure
// (item push / gold / knowledge / storyMsg + flag set) preserved verbatim as a single
// _legacy_fn ordered AFTER reward{xp} (mirrors legacy xpAward-then-onPass()). No onFail → [].
// Gates: iodine_01 {questsAttempted:['quest_inn_01']}; forge_01 {flags:['atlanteanProcessKnown']};
// shore_02/sunken_01 {} (were () => true). The side acts (iodine_02/03, shore_01, forge_02,
// sunken_02) stay legacy.
const IODINE = [
  { id:'quest_iodine_01', stat:'int', dc:11, xp:100, gold:0,   skill:'INT Investigation', flag:null,             items:['Iodine Salt'],              knowledge:0 },
  { id:'quest_shore_02',  stat:'wis', dc:12, xp:150, gold:150, skill:'WIS Perception',    flag:'kelpBedsCharted', items:['Swamp Kelp','Swamp Kelp'], knowledge:0 },
  { id:'quest_forge_01',  stat:'int', dc:14, xp:300, gold:300, skill:'INT Arcana',        flag:'forgeActivated',  items:[],                           knowledge:0 },
  { id:'quest_sunken_01', stat:'int', dc:13, xp:250, gold:250, skill:'INT Arcana',        flag:'inscriptionRead', items:[],                           knowledge:1 },
];

test.describe('§ARCH-01 Wave 1u — Atlantean iodine chain (iodine_01/shore_02/forge_01/sunken_01)', () => {
  test('all 4 validate as UQF skill_checks; retryable:true, onPass [reward{xp}, _legacy_fn], onFail:[]', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate((IODINE) => IODINE.map(s => {
      const q = QUEST_DB[s.id]; const b = (q.bits || []).find(x => x.kind === 'skill_check');
      const rw = (b.onPass || []).find(x => x.kind === 'reward');
      return { id:s.id, schema:q.schema, valid:validateQuest(q).valid, type:q.type,
               retryable:q.retryable, stat:b.stat, skill:b.skill, dc:b.dc,
               onPassKinds:(b.onPass || []).map(x => x.kind), xp:rw && rw.xp,
               onFailLen:(b.onFail || []).length };
    }), IODINE);
    for (const s of IODINE) {
      const got = r.find(x => x.id === s.id);
      expect(got).toEqual({ id:s.id, schema:'UQF-1.0', valid:true, type:'skill_check',
        retryable:true, stat:s.stat.toUpperCase(), skill:s.skill, dc:s.dc,
        onPassKinds:['reward', '_legacy_fn'], xp:s.xp, onFailLen:0 });
    }
  });

  test('declarative gates: iodine_01 needs quest_inn_01 attempted, forge_01 needs atlanteanProcessKnown, shore_02/sunken_01 always', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      S_story.quests = {}; S_story.atlanteanProcessKnown = false;
      const closed = {};
      ['quest_iodine_01','quest_shore_02','quest_forge_01','quest_sunken_01'].forEach(id => closed[id] = QuestRuntime.canActivate(id));
      S_story.quests = { quest_inn_01:'active' }; S_story.atlanteanProcessKnown = true;
      const open = {};
      ['quest_iodine_01','quest_shore_02','quest_forge_01','quest_sunken_01'].forEach(id => open[id] = QuestRuntime.canActivate(id));
      return { closed, open };
    });
    expect(r.closed).toEqual({ quest_iodine_01:false, quest_shore_02:true, quest_forge_01:false, quest_sunken_01:true });
    expect(r.open).toEqual({ quest_iodine_01:true, quest_shore_02:true, quest_forge_01:true, quest_sunken_01:true });
  });

  test('PASS parity: done + exact xp/gold + onPass closure side effects (items / flag / knowledge)', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate((IODINE) => IODINE.map(s => {
      S_story.abilityScores = { [s.stat]: 40 };
      S_story.level = 20; S_story.xp = 0; S_story.gold = 0;
      S_story.inventory = []; S_story.knowledge = [];
      if (s.flag) S_story[s.flag] = false;
      S_story.quests = { [s.id]:'active' };
      _rollCeremonia(s.id);
      return { id:s.id, status:S_story.quests[s.id], xp:S_story.xp, gold:S_story.gold,
               flag: s.flag ? S_story[s.flag] : null,
               items: S_story.inventory.map(i => i.name), knowledge: S_story.knowledge.length };
    }), IODINE);
    for (const s of IODINE) {
      const got = r.find(x => x.id === s.id);
      expect(got.status).toBe('done');
      expect(got.xp).toBe(s.xp);
      expect(got.gold).toBe(s.gold);
      expect(got.flag).toBe(s.flag ? true : null);
      expect(got.items).toEqual(s.items);
      expect(got.knowledge).toBe(s.knowledge);
    }
  });

  test('FAIL parity (retryable): stays active, no xp/gold, no closure effects, attempt recorded', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate((IODINE) => IODINE.map(s => {
      S_story.abilityScores = { [s.stat]: -100 };
      S_story.level = 1; S_story.day = 5; S_story.skillCheckAttempts = {};
      S_story.xp = 0; S_story.gold = 0; S_story.inventory = []; S_story.knowledge = [];
      if (s.flag) S_story[s.flag] = false;
      S_story.quests = { [s.id]:'active' };
      _rollCeremonia(s.id);
      return { id:s.id, status:S_story.quests[s.id], xp:S_story.xp, gold:S_story.gold,
               flag: s.flag ? S_story[s.flag] : null, items:S_story.inventory.length,
               knowledge:S_story.knowledge.length,
               failures:(S_story.skillCheckAttempts[s.id] || {}).failures };
    }), IODINE);
    for (const s of IODINE) {
      const got = r.find(x => x.id === s.id);
      expect(got).toEqual({ id:s.id, status:'active', xp:0, gold:0,
        flag: s.flag ? false : null, items:0, knowledge:0, failures:1 });
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════
// §ARCH-01 Wave 1v — final Wave-1 singletons: Highland trade + folk wisdom.
// ══════════════════════════════════════════════════════════════════════════

const HIGHLAND = [
  { id:'quest_df_02', stat:'wis', skill:'Insight',    dc:11, flag:'dfBarterLearned',    token:'Df Barter Learned Token',    gateFlag:'dunfallAccessed',  gold:100, xp:250, item:'Highland Herb Pouch' },
  { id:'quest_sk_02', stat:'cha', skill:'Persuasion', dc:12, flag:'saltwickJobAccepted', token:'Saltwick Job Accepted Token', gateFlag:'saltwickAccessed', gold:600, xp:400, item:'Saltwick Bill of Lading' },
];

test.describe('§ARCH-01 Wave 1v — Highland trade (df_02 / sk_02)', () => {
  test('both validate as UQF skill_checks; checkPassFlag → onPass [mission_bit(no label), _legacy_fn], onFail [_legacy_fn]', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate((HIGHLAND) => HIGHLAND.map(s => {
      const q = QUEST_DB[s.id]; const b = (q.bits || []).find(x => x.kind === 'skill_check');
      const mb = (b.onPass || []).find(x => x.kind === 'mission_bit');
      return { id:s.id, schema:q.schema, valid:validateQuest(q).valid, type:q.type,
               retryable:q.retryable, stat:b.stat, skill:b.skill, dc:b.dc,
               onPassKinds:(b.onPass || []).map(x => x.kind),
               onFailKinds:(b.onFail || []).map(x => x.kind),
               mbFlag:mb.flag, mbHasLabel:('label' in mb) };
    }), HIGHLAND);
    for (const s of HIGHLAND) {
      const got = r.find(x => x.id === s.id);
      expect(got).toEqual({ id:s.id, schema:'UQF-1.0', valid:true, type:'skill_check',
        retryable:true, stat:s.stat.toUpperCase(), skill:s.skill, dc:s.dc,
        onPassKinds:['mission_bit', '_legacy_fn'], onFailKinds:['_legacy_fn'],
        mbFlag:s.flag, mbHasLabel:false });  // no explicit label ⇒ _grantMissionBit falls through to _flagToLabel
    }
  });

  test('declarative gates: df_02 needs dunfallAccessed, sk_02 needs saltwickAccessed', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate((HIGHLAND) => HIGHLAND.map(s => {
      S_story[s.gateFlag] = false; const closed = QuestRuntime.canActivate(s.id);
      S_story[s.gateFlag] = true;  const open   = QuestRuntime.canActivate(s.id);
      return { id:s.id, closed, open };
    }), HIGHLAND);
    for (const s of HIGHLAND) {
      const got = r.find(x => x.id === s.id);
      expect(got).toEqual({ id:s.id, closed:false, open:true });
    }
  });

  test('PASS parity: done + flag set + bone token (flagRef + _flagToLabel name) + gold + xp + item', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate((HIGHLAND) => HIGHLAND.map(s => {
      S_story.abilityScores = { [s.stat]: 40 };
      S_story.level = 20; S_story.xp = 0; S_story.gold = 0; S_story.inventory = [];
      S_story[s.flag] = false; S_story.quests = { [s.id]:'active' };
      _rollCeremonia(s.id);
      const tok = S_story.inventory.find(i => i.flagRef === s.flag);
      return { id:s.id, status:S_story.quests[s.id], flag:S_story[s.flag],
               xp:S_story.xp, gold:S_story.gold,
               tokenName: tok && tok.name, tokenType: tok && tok.type,
               hasItem: S_story.inventory.some(i => i.name === s.item) };
    }), HIGHLAND);
    for (const s of HIGHLAND) {
      const got = r.find(x => x.id === s.id);
      expect(got).toEqual({ id:s.id, status:'done', flag:true, xp:s.xp, gold:s.gold,
        tokenName:s.token, tokenType:'mission_bit', hasItem:true });
    }
  });

  test('FAIL parity (retryable): stays active, no flag/token/gold/xp/item, attempt recorded', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate((HIGHLAND) => HIGHLAND.map(s => {
      S_story.abilityScores = { [s.stat]: -100 };
      S_story.level = 1; S_story.day = 5; S_story.skillCheckAttempts = {};
      S_story.xp = 0; S_story.gold = 0; S_story.inventory = [];
      S_story[s.flag] = false; S_story.quests = { [s.id]:'active' };
      _rollCeremonia(s.id);
      return { id:s.id, status:S_story.quests[s.id], flag:S_story[s.flag],
               xp:S_story.xp, gold:S_story.gold, items:S_story.inventory.length,
               failures:(S_story.skillCheckAttempts[s.id] || {}).failures };
    }), HIGHLAND);
    for (const s of HIGHLAND) {
      const got = r.find(x => x.id === s.id);
      expect(got).toEqual({ id:s.id, status:'active', flag:false, xp:0, gold:0, items:0, failures:1 });
    }
  });
});

const FOLK = [
  { id:'quest_lxvii67',  stat:'wis', skill:'Insight', dc:10, xp:67,  passFlag:'faith_folk',   passVal:1,    legacyGate:true  },
  { id:'quest_guide_04', stat:'wis', skill:'Insight', dc:11, xp:250, passFlag:'emmerStage4a', passVal:true, legacyGate:false },
];

test.describe('§ARCH-01 Wave 1v — folk wisdom (lxvii67 jester / guide_04 U-curve)', () => {
  test('both validate; xpAward → onPass [reward{xp}, _legacy_fn] (no token), onFail:[]', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate((FOLK) => FOLK.map(s => {
      const q = QUEST_DB[s.id]; const b = (q.bits || []).find(x => x.kind === 'skill_check');
      const rw = (b.onPass || []).find(x => x.kind === 'reward');
      return { id:s.id, schema:q.schema, valid:validateQuest(q).valid, type:q.type,
               retryable:q.retryable, stat:b.stat, skill:b.skill, dc:b.dc,
               onPassKinds:(b.onPass || []).map(x => x.kind), xp:rw && rw.xp,
               onFailLen:(b.onFail || []).length,
               hasMissionBit:(b.onPass || []).some(x => x.kind === 'mission_bit') };
    }), FOLK);
    for (const s of FOLK) {
      const got = r.find(x => x.id === s.id);
      expect(got).toEqual({ id:s.id, schema:'UQF-1.0', valid:true, type:'skill_check',
        retryable:true, stat:s.stat.toUpperCase(), skill:s.skill, dc:s.dc,
        onPassKinds:['reward', '_legacy_fn'], xp:s.xp, onFailLen:0, hasMissionBit:false });
    }
  });

  test('gates: guide_04 → questsDone[quest_guide_03]; lxvii67 keeps load-bearing activateCond behind a _legacyFn gate (faith_folk>=1 inexpressible)', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      S_story.quests = {}; const g04closed = QuestRuntime.canActivate('quest_guide_04');
      S_story.quests = { quest_guide_03:'done' }; const g04open = QuestRuntime.canActivate('quest_guide_04');
      const lq = QUEST_DB['quest_lxvii67'];
      const gateLegacy = !!(lq.gate && lq.gate._legacyFn);
      const caAlways = QuestRuntime.canActivate('quest_lxvii67');
      S_story.faith_folk = 0; const acClosed = lq.activateCond();
      S_story.faith_folk = 1; const acOpen = lq.activateCond();
      return { g04closed, g04open, gateLegacy, caAlways, acClosed, acOpen };
    });
    expect(r).toEqual({ g04closed:false, g04open:true, gateLegacy:true, caAlways:true, acClosed:false, acOpen:true });
  });

  test('PASS parity: done + xp + onPass flag effect (faith_folk++ / emmerStage4a) + NO token', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate((FOLK) => FOLK.map(s => {
      S_story.abilityScores = { [s.stat]: 40 };
      S_story.level = 20; S_story.xp = 0; S_story.inventory = [];
      S_story.faith_folk = 0; S_story.emmerStage4a = false;
      S_story.quests = { [s.id]:'active' };
      _rollCeremonia(s.id);
      return { id:s.id, status:S_story.quests[s.id], xp:S_story.xp,
               passVal:S_story[s.passFlag], tokens:S_story.inventory.filter(i => i.type === 'mission_bit').length };
    }), FOLK);
    for (const s of FOLK) {
      const got = r.find(x => x.id === s.id);
      expect(got).toEqual({ id:s.id, status:'done', xp:s.xp, passVal:s.passVal, tokens:0 });
    }
  });

  test('FAIL parity (retryable): stays active, xp 0, flag unchanged, attempt recorded', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate((FOLK) => FOLK.map(s => {
      S_story.abilityScores = { [s.stat]: -100 };
      S_story.level = 1; S_story.day = 5; S_story.skillCheckAttempts = {};
      S_story.xp = 0; S_story.inventory = [];
      S_story.faith_folk = 0; S_story.emmerStage4a = false;
      S_story.quests = { [s.id]:'active' };
      _rollCeremonia(s.id);
      return { id:s.id, status:S_story.quests[s.id], xp:S_story.xp,
               faith_folk:S_story.faith_folk, emmerStage4a:S_story.emmerStage4a,
               items:S_story.inventory.length,
               failures:(S_story.skillCheckAttempts[s.id] || {}).failures };
    }), FOLK);
    for (const s of FOLK) {
      const got = r.find(x => x.id === s.id);
      expect(got).toEqual({ id:s.id, status:'active', xp:0, faith_folk:0, emmerStage4a:false, items:0, failures:1 });
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════
// §ARCH-01 Wave 2 — bulk script-assisted migration (scripts/uqf-bulk-migrate.js).
// First family: hav_* (The Articles / Havorn corsair-papers arcs, 30 acts). All
// checkStat + checkPassFlag(no bitLabel) + no xp/gold + non-retryable; every
// activateCond is the trivial `() => !!S_story.<flag>` shape → decomposed to
// gate:{flags:[…]} (act1 openers → gate:{}). Self-contained: enumerates the
// family from QUEST_DB and asserts structure + pass/fail parity + gate chaining.
// ══════════════════════════════════════════════════════════════════════════
test.describe('§ARCH-01 Wave 2 — hav_* family (bulk-migrated, 30 acts)', () => {
  test('every hav_* skill_check is UQF-1.0, validates, onPass:[mission_bit], onFail:[]', async ({ page }) => {
    const errs = []; page.on('pageerror', e => errs.push(String(e)));
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const hav = Object.values(QUEST_DB).filter(q => /^hav_/.test(q.id) && q.type === 'skill_check');
      return hav.map(q => {
        const b = (q.bits || []).find(x => x.kind === 'skill_check');
        return { id:q.id, schema:q.schema, valid:validateQuest(q).valid,
          hasStat:!!(b && b.stat), hasDc:typeof (b && b.dc) === 'number',
          onPassK:b ? b.onPass.map(x => x.kind) : null, onFailLen:b ? b.onFail.length : null,
          mbHasLabel:b ? ('label' in (b.onPass.find(x => x.kind === 'mission_bit') || {})) : null };
      });
    });
    expect(errs).toEqual([]);
    expect(r.length).toBe(30);
    for (const q of r) {
      expect(q.schema).toBe('UQF-1.0');
      expect(q.valid).toBe(true);
      expect(q.hasStat).toBe(true);
      expect(q.hasDc).toBe(true);
      expect(q.onPassK).toEqual(['mission_bit']);  // no xp/gold in this family
      expect(q.onFailLen).toBe(0);
      expect(q.mbHasLabel).toBe(false);            // label omitted ⇒ _flagToLabel parity
    }
  });

  test('PASS parity: done + checkPassFlag true + bone token (name = _flagToLabel + " Token"), no xp/gold', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const hav = Object.values(QUEST_DB).filter(q => /^hav_/.test(q.id) && q.type === 'skill_check');
      return hav.map(q => {
        const b = q.bits.find(x => x.kind === 'skill_check');
        const flag = b.onPass.find(x => x.kind === 'mission_bit').flag;
        S_story.abilityScores = { [b.stat.toLowerCase()]: 40 };
        S_story.level = 20; S_story.xp = 0; S_story.gold = 0; S_story.inventory = [];
        S_story[flag] = false; S_story.quests = { [q.id]:'active' };
        _rollCeremonia(q.id);
        const tok = S_story.inventory.find(i => i.flagRef === flag);
        return { id:q.id, status:S_story.quests[q.id], flag:S_story[flag], xp:S_story.xp, gold:S_story.gold,
          tokenOk: !!tok && tok.name === _flagToLabel(flag) + ' Token' && tok.type === 'mission_bit',
          items:S_story.inventory.length };
      });
    });
    for (const q of r) {
      expect(q).toEqual({ id:q.id, status:'done', flag:true, xp:0, gold:0, tokenOk:true, items:1 });
    }
  });

  test('FAIL parity (non-retryable): failed + flag false + no token', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const hav = Object.values(QUEST_DB).filter(q => /^hav_/.test(q.id) && q.type === 'skill_check');
      return hav.map(q => {
        const b = q.bits.find(x => x.kind === 'skill_check');
        const flag = b.onPass.find(x => x.kind === 'mission_bit').flag;
        S_story.abilityScores = { [b.stat.toLowerCase()]: -100 };
        S_story.level = 1; S_story.day = 5; S_story.skillCheckAttempts = {};
        S_story.xp = 0; S_story.gold = 0; S_story.inventory = [];
        S_story[flag] = false; S_story.quests = { [q.id]:'active' };
        _rollCeremonia(q.id);
        return { id:q.id, status:S_story.quests[q.id], flag:S_story[flag], items:S_story.inventory.length };
      });
    });
    for (const q of r) {
      expect(q).toEqual({ id:q.id, status:'failed', flag:false, items:0 });
    }
  });

  test('gate decomposition: act1 openers gate:{}, act2..N gate.flags === prior act pass-flag', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const hav = Object.values(QUEST_DB).filter(q => /^hav_/.test(q.id) && q.type === 'skill_check');
      return hav.map(q => ({ id:q.id, gate:q.gate,
        priorFlag: (() => {
          const m = q.id.match(/^(hav_\d+)_act(\d+)$/); if (!m || m[2] === '1') return null;
          const prev = QUEST_DB[`${m[1]}_act${+m[2]-1}`];
          const pb = prev && prev.bits && prev.bits.find(x => x.kind === 'skill_check');
          return pb ? (pb.onPass.find(x => x.kind === 'mission_bit')||{}).flag : null;
        })() }));
    });
    for (const q of r) {
      if (/_act1$/.test(q.id)) { expect(q.gate).toEqual({}); }
      else { expect(q.gate.flags).toEqual([q.priorFlag]); }
    }
  });
});

// §ARCH-01 Wave 2b — ada* family (235 acts, the single largest legacy
// skill_check family). Maximally uniform: all checkStat + checkPassFlag (no
// bitLabel/xp/gold), non-retryable, and NO activateCond on any act → all
// gate:{} (independently activatable, matching legacy). Self-contained.
test.describe('§ARCH-01 Wave 2b — ada* family (bulk-migrated, 235 acts)', () => {
  test('every ada* skill_check is UQF-1.0, validates, gate:{}, onPass:[mission_bit](no label), onFail:[]', async ({ page }) => {
    const errs = []; page.on('pageerror', e => errs.push(String(e)));
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const ada = Object.values(QUEST_DB).filter(q => /^ada/.test(q.id) && q.type === 'skill_check');
      return ada.map(q => {
        const b = (q.bits || []).find(x => x.kind === 'skill_check');
        return { id:q.id, schema:q.schema, valid:validateQuest(q).valid, gateEmpty:JSON.stringify(q.gate) === '{}',
          hasStat:!!(b && b.stat), hasDc:typeof (b && b.dc) === 'number',
          onPassK:b ? b.onPass.map(x => x.kind) : null, onFailLen:b ? b.onFail.length : null,
          mbHasLabel:b ? ('label' in (b.onPass.find(x => x.kind === 'mission_bit') || {})) : null };
      });
    });
    expect(errs).toEqual([]);
    expect(r.length).toBe(235);
    for (const q of r) {
      expect(q.schema).toBe('UQF-1.0');
      expect(q.valid).toBe(true);
      expect(q.gateEmpty).toBe(true);
      expect(q.hasStat).toBe(true);
      expect(q.hasDc).toBe(true);
      expect(q.onPassK).toEqual(['mission_bit']);
      expect(q.onFailLen).toBe(0);
      expect(q.mbHasLabel).toBe(false);
    }
  });

  test('PASS/FAIL parity across all 235: pass→done+flag+_flagToLabel token; fail→failed+no flag/token', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const ada = Object.values(QUEST_DB).filter(q => /^ada/.test(q.id) && q.type === 'skill_check');
      let passBad = [], failBad = [];
      for (const q of ada) {
        const b = q.bits.find(x => x.kind === 'skill_check');
        const flag = b.onPass.find(x => x.kind === 'mission_bit').flag;
        // PASS
        S_story.abilityScores = { [b.stat.toLowerCase()]: 40 };
        S_story.level = 20; S_story.xp = 0; S_story.gold = 0; S_story.inventory = [];
        S_story[flag] = false; S_story.quests = { [q.id]:'active' };
        _rollCeremonia(q.id);
        const tok = S_story.inventory.find(i => i.flagRef === flag);
        if (!(S_story.quests[q.id] === 'done' && S_story[flag] === true && tok &&
              tok.name === _flagToLabel(flag) + ' Token' && tok.type === 'mission_bit' &&
              S_story.xp === 0 && S_story.gold === 0 && S_story.inventory.length === 1)) passBad.push(q.id);
        // FAIL
        S_story.abilityScores = { [b.stat.toLowerCase()]: -100 };
        S_story.level = 1; S_story.day = 5; S_story.skillCheckAttempts = {};
        S_story.xp = 0; S_story.gold = 0; S_story.inventory = [];
        S_story[flag] = false; S_story.quests = { [q.id]:'active' };
        _rollCeremonia(q.id);
        if (!(S_story.quests[q.id] === 'failed' && S_story[flag] === false && S_story.inventory.length === 0)) failBad.push(q.id);
      }
      return { count:ada.length, passBad, failBad };
    });
    expect(r.count).toBe(235);
    expect(r.passBad).toEqual([]);
    expect(r.failBad).toEqual([]);
  });
});

// §ARCH-01 Wave 2c — ath* family (113 skill_check acts; the ath_c1a* Trojan-cycle
// chapters + ath_NN_act* arcs). Mixed gates: 72 with no activateCond → gate:{},
// 41 with trivial `()=>!!S_story.<priorFlag>` → gate:{flags:[…]}. Notably, ~3 acts
// (ath_c1a2/c1a4/c1a5) carried a DUPLICATE activateCond — the real function form
// PLUS a dead string copy `activateCond:"() => …"`; JS last-key-wins made the
// parsed value a STRING, so the legacy activation site `q.activateCond()` THREW a
// TypeError at runtime (a live crash on those nodes). The bulk migrator strips both
// forms and decomposes the intended gate, so this also FIXES that latent crash —
// asserted here via canActivate gate behavior + the no-activateCond invariant.
test.describe('§ARCH-01 Wave 2c — ath* family (bulk-migrated, 113 acts; fixes string-activateCond crash)', () => {
  test('every ath* skill_check is UQF-1.0, validates, onPass:[mission_bit](no label), onFail:[], NO residual activateCond', async ({ page }) => {
    const errs = []; page.on('pageerror', e => errs.push(String(e)));
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const ath = Object.values(QUEST_DB).filter(q => /^ath/.test(q.id) && q.type === 'skill_check');
      return ath.map(q => {
        const b = (q.bits || []).find(x => x.kind === 'skill_check');
        const gate = q.gate || {};
        return { id:q.id, schema:q.schema, valid:validateQuest(q).valid,
          noAC: typeof q.activateCond === 'undefined',
          gateShape: gate.flags ? 'flags' : (JSON.stringify(gate) === '{}' ? 'empty' : 'other'),
          hasStat:!!(b && b.stat), hasDc:typeof (b && b.dc) === 'number',
          onPassK:b ? b.onPass.map(x => x.kind) : null, onFailLen:b ? b.onFail.length : null,
          mbHasLabel:b ? ('label' in (b.onPass.find(x => x.kind === 'mission_bit') || {})) : null };
      });
    });
    expect(errs).toEqual([]);
    expect(r.length).toBe(113);
    for (const q of r) {
      expect(q.schema).toBe('UQF-1.0');
      expect(q.valid).toBe(true);
      expect(q.noAC).toBe(true);                          // string/function activateCond fully removed
      expect(['flags', 'empty']).toContain(q.gateShape);  // no _legacyFn fallbacks in this family
      expect(q.hasStat).toBe(true);
      expect(q.hasDc).toBe(true);
      expect(q.onPassK).toEqual(['mission_bit']);
      expect(q.onFailLen).toBe(0);
      expect(q.mbHasLabel).toBe(false);
    }
  });

  test('PASS/FAIL parity across all 113 + gate behavior (flags ⇒ activatable iff flag set; {} ⇒ always)', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const ath = Object.values(QUEST_DB).filter(q => /^ath/.test(q.id) && q.type === 'skill_check');
      let passBad = [], failBad = [], gateBad = [];
      for (const q of ath) {
        const b = q.bits.find(x => x.kind === 'skill_check');
        const flag = b.onPass.find(x => x.kind === 'mission_bit').flag;
        // PASS
        S_story.abilityScores = { [b.stat.toLowerCase()]: 40 };
        S_story.level = 20; S_story.xp = 0; S_story.gold = 0; S_story.inventory = [];
        S_story[flag] = false; S_story.quests = { [q.id]:'active' };
        _rollCeremonia(q.id);
        const tok = S_story.inventory.find(i => i.flagRef === flag);
        if (!(S_story.quests[q.id] === 'done' && S_story[flag] === true && tok &&
              tok.name === _flagToLabel(flag) + ' Token' && S_story.xp === 0 && S_story.gold === 0 &&
              S_story.inventory.length === 1)) passBad.push(q.id);
        // FAIL
        S_story.abilityScores = { [b.stat.toLowerCase()]: -100 };
        S_story.level = 1; S_story.day = 5; S_story.skillCheckAttempts = {};
        S_story.xp = 0; S_story.gold = 0; S_story.inventory = [];
        S_story[flag] = false; S_story.quests = { [q.id]:'active' };
        _rollCeremonia(q.id);
        if (!(S_story.quests[q.id] === 'failed' && S_story[flag] === false && S_story.inventory.length === 0)) failBad.push(q.id);
        // GATE
        const g = q.gate || {};
        if (g.flags && g.flags.length) {
          const gf = g.flags[0];
          S_story[gf] = false; const c0 = QuestRuntime.canActivate(q.id);
          S_story[gf] = true;  const c1 = QuestRuntime.canActivate(q.id);
          if (!(c0 === false && c1 === true)) gateBad.push(q.id);
        } else if (QuestRuntime.canActivate(q.id) !== true) gateBad.push(q.id);
      }
      return { count:ath.length, passBad, failBad, gateBad };
    });
    expect(r.count).toBe(113);
    expect(r.passBad).toEqual([]);
    expect(r.failBad).toEqual([]);
    expect(r.gateBad).toEqual([]);
  });
});

// §ARCH-01 Wave 2d — lis* family (89 skill_check acts; the Lisbon Camões-quire
// authentication arcs — two naming conventions: lis_NN_actN (6 arcs × 4) +
// lisNN_actN (13 arcs × 5)). Mixed gates: 71 with no activateCond → gate:{},
// 18 with trivial `()=>!!S_story.<priorFlag>` → gate:{flags:[…]} (the 6 lis_NN
// arcs' act2–4 chains). Uniform otherwise: all checkStat (UPPERCASE — CHA/INT/
// STR/WIS), all checkPassFlag (no bitLabel/xp/gold), non-retryable, no _legacyFn.
// NB the legacy checkStat was uppercase, which the legacy resolver read raw-case
// (abilityScores keys are lowercase ⇒ silent +0 modifier, the §SKILLFIX-01 bug);
// the UQF resolver lowercases ⇒ applies the real modifier. Parity was verified
// pre-migration vs a golden seeded under BOTH cases (deterministic extreme
// through either resolver); the seed() helper below mirrors that. Self-contained.
test.describe('§ARCH-01 Wave 2d — lis* family (bulk-migrated, 89 acts)', () => {
  test('every lis* skill_check is UQF-1.0, validates, onPass:[mission_bit](no label), onFail:[], NO residual activateCond', async ({ page }) => {
    const errs = []; page.on('pageerror', e => errs.push(String(e)));
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const lis = Object.values(QUEST_DB).filter(q => /^lis/.test(q.id) && q.type === 'skill_check');
      return lis.map(q => {
        const b = (q.bits || []).find(x => x.kind === 'skill_check');
        const gate = q.gate || {};
        return { id:q.id, schema:q.schema, valid:validateQuest(q).valid,
          noAC: typeof q.activateCond === 'undefined',
          gateShape: gate.flags ? 'flags' : (JSON.stringify(gate) === '{}' ? 'empty' : 'other'),
          hasStat:!!(b && b.stat), hasDc:typeof (b && b.dc) === 'number',
          onPassK:b ? b.onPass.map(x => x.kind) : null, onFailLen:b ? b.onFail.length : null,
          mbHasLabel:b ? ('label' in (b.onPass.find(x => x.kind === 'mission_bit') || {})) : null };
      });
    });
    expect(errs).toEqual([]);
    expect(r.length).toBe(89);
    const shapes = { flags:0, empty:0 };
    for (const q of r) {
      expect(q.schema).toBe('UQF-1.0');
      expect(q.valid).toBe(true);
      expect(q.noAC).toBe(true);                          // function/string activateCond fully removed
      expect(['flags', 'empty']).toContain(q.gateShape);  // no _legacyFn fallbacks in this family
      expect(q.hasStat).toBe(true);
      expect(q.hasDc).toBe(true);
      expect(q.onPassK).toEqual(['mission_bit']);
      expect(q.onFailLen).toBe(0);
      expect(q.mbHasLabel).toBe(false);
      shapes[q.gateShape]++;
    }
    expect(shapes).toEqual({ flags:18, empty:71 });
  });

  test('PASS/FAIL parity across all 89 + gate behavior (flags ⇒ activatable iff flag set; {} ⇒ always)', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      // checkStat is uppercase but abilityScores keys are lowercase; the UQF
      // resolver lowercases, so seed both cases for a deterministic extreme.
      const seed = (k, v) => ({ [k]: v, [k.toLowerCase()]: v });
      const lis = Object.values(QUEST_DB).filter(q => /^lis/.test(q.id) && q.type === 'skill_check');
      let passBad = [], failBad = [], gateBad = [];
      for (const q of lis) {
        const b = q.bits.find(x => x.kind === 'skill_check');
        const flag = b.onPass.find(x => x.kind === 'mission_bit').flag;
        // PASS
        S_story.abilityScores = seed(b.stat, 40);
        S_story.level = 20; S_story.xp = 0; S_story.gold = 0; S_story.inventory = [];
        S_story[flag] = false; S_story.quests = { [q.id]:'active' };
        _rollCeremonia(q.id);
        const tok = S_story.inventory.find(i => i.flagRef === flag);
        if (!(S_story.quests[q.id] === 'done' && S_story[flag] === true && tok &&
              tok.name === _flagToLabel(flag) + ' Token' && tok.type === 'mission_bit' &&
              S_story.xp === 0 && S_story.gold === 0 && S_story.inventory.length === 1)) passBad.push(q.id);
        // FAIL
        S_story.abilityScores = seed(b.stat, -100);
        S_story.level = 1; S_story.day = 5; S_story.skillCheckAttempts = {};
        S_story.xp = 0; S_story.gold = 0; S_story.inventory = [];
        S_story[flag] = false; S_story.quests = { [q.id]:'active' };
        _rollCeremonia(q.id);
        if (!(S_story.quests[q.id] === 'failed' && S_story[flag] === false && S_story.inventory.length === 0)) failBad.push(q.id);
        // GATE
        const g = q.gate || {};
        if (g.flags && g.flags.length) {
          const gf = g.flags[0];
          S_story[gf] = false; const c0 = QuestRuntime.canActivate(q.id);
          S_story[gf] = true;  const c1 = QuestRuntime.canActivate(q.id);
          if (!(c0 === false && c1 === true)) gateBad.push(q.id);
        } else if (QuestRuntime.canActivate(q.id) !== true) gateBad.push(q.id);
      }
      return { count:lis.length, passBad, failBad, gateBad };
    });
    expect(r.count).toBe(89);
    expect(r.passBad).toEqual([]);
    expect(r.failBad).toEqual([]);
    expect(r.gateBad).toEqual([]);
  });
});

// §ARCH-01 Wave 2e — zth* family (75 skill_check acts; the Zürich arcs —
// zthNN_actN 11 arcs × 5 + zth_NN_actN 4 arcs × 4 (act5 of those is a
// `delivery`, out of skill_check scope) + 4 zth_c1a* singletons (zth_c1a3 is a
// `type:"hybrid"`, correctly skipped)). Mixed gates: 60 with no activateCond →
// gate:{}, 15 with trivial `()=>!!S_story.<priorFlag>` → gate:{flags:[…]}.
// Like lis (Wave 2d), an UPPERCASE-checkStat family (CHA/CON/INT/STR/WIS): the
// legacy resolver read abilityScores[checkStat] raw-case (keys are lowercase ⇒
// silent +0 modifier, the §SKILLFIX-01 bug); the UQF resolver lowercases ⇒
// applies the real modifier. Parity was verified pre-migration vs a golden
// seeded under BOTH cases; the seed() helper below mirrors that. Self-contained.
test.describe('§ARCH-01 Wave 2e — zth* family (bulk-migrated, 75 acts)', () => {
  test('every zth* skill_check is UQF-1.0, validates, onPass:[mission_bit](no label), onFail:[], NO residual activateCond', async ({ page }) => {
    const errs = []; page.on('pageerror', e => errs.push(String(e)));
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const zth = Object.values(QUEST_DB).filter(q => /^zth/.test(q.id) && q.type === 'skill_check');
      return zth.map(q => {
        const b = (q.bits || []).find(x => x.kind === 'skill_check');
        const gate = q.gate || {};
        return { id:q.id, schema:q.schema, valid:validateQuest(q).valid,
          noAC: typeof q.activateCond === 'undefined',
          gateShape: gate.flags ? 'flags' : (JSON.stringify(gate) === '{}' ? 'empty' : 'other'),
          hasStat:!!(b && b.stat), hasDc:typeof (b && b.dc) === 'number',
          onPassK:b ? b.onPass.map(x => x.kind) : null, onFailLen:b ? b.onFail.length : null,
          mbHasLabel:b ? ('label' in (b.onPass.find(x => x.kind === 'mission_bit') || {})) : null };
      });
    });
    expect(errs).toEqual([]);
    expect(r.length).toBe(75);
    const shapes = { flags:0, empty:0 };
    for (const q of r) {
      expect(q.schema).toBe('UQF-1.0');
      expect(q.valid).toBe(true);
      expect(q.noAC).toBe(true);                          // function/string activateCond fully removed
      expect(['flags', 'empty']).toContain(q.gateShape);  // no _legacyFn fallbacks in this family
      expect(q.hasStat).toBe(true);
      expect(q.hasDc).toBe(true);
      expect(q.onPassK).toEqual(['mission_bit']);
      expect(q.onFailLen).toBe(0);
      expect(q.mbHasLabel).toBe(false);
      shapes[q.gateShape]++;
    }
    expect(shapes).toEqual({ flags:15, empty:60 });
  });

  test('PASS/FAIL parity across all 75 + gate behavior (flags ⇒ activatable iff flag set; {} ⇒ always)', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      // checkStat is uppercase but abilityScores keys are lowercase; the UQF
      // resolver lowercases, so seed both cases for a deterministic extreme.
      const seed = (k, v) => ({ [k]: v, [k.toLowerCase()]: v });
      const zth = Object.values(QUEST_DB).filter(q => /^zth/.test(q.id) && q.type === 'skill_check');
      let passBad = [], failBad = [], gateBad = [];
      for (const q of zth) {
        const b = q.bits.find(x => x.kind === 'skill_check');
        const flag = b.onPass.find(x => x.kind === 'mission_bit').flag;
        // PASS
        S_story.abilityScores = seed(b.stat, 40);
        S_story.level = 20; S_story.xp = 0; S_story.gold = 0; S_story.inventory = [];
        S_story[flag] = false; S_story.quests = { [q.id]:'active' };
        _rollCeremonia(q.id);
        const tok = S_story.inventory.find(i => i.flagRef === flag);
        if (!(S_story.quests[q.id] === 'done' && S_story[flag] === true && tok &&
              tok.name === _flagToLabel(flag) + ' Token' && tok.type === 'mission_bit' &&
              S_story.xp === 0 && S_story.gold === 0 && S_story.inventory.length === 1)) passBad.push(q.id);
        // FAIL
        S_story.abilityScores = seed(b.stat, -100);
        S_story.level = 1; S_story.day = 5; S_story.skillCheckAttempts = {};
        S_story.xp = 0; S_story.gold = 0; S_story.inventory = [];
        S_story[flag] = false; S_story.quests = { [q.id]:'active' };
        _rollCeremonia(q.id);
        if (!(S_story.quests[q.id] === 'failed' && S_story[flag] === false && S_story.inventory.length === 0)) failBad.push(q.id);
        // GATE
        const g = q.gate || {};
        if (g.flags && g.flags.length) {
          const gf = g.flags[0];
          S_story[gf] = false; const c0 = QuestRuntime.canActivate(q.id);
          S_story[gf] = true;  const c1 = QuestRuntime.canActivate(q.id);
          if (!(c0 === false && c1 === true)) gateBad.push(q.id);
        } else if (QuestRuntime.canActivate(q.id) !== true) gateBad.push(q.id);
      }
      return { count:zth.length, passBad, failBad, gateBad };
    });
    expect(r.count).toBe(75);
    expect(r.passBad).toEqual([]);
    expect(r.failBad).toEqual([]);
    expect(r.gateBad).toEqual([]);
  });
});

// §ARCH-01 Wave 2f — flr* family (71 skill_check acts; the Florence arcs —
// flrNN_actN 11 arcs × 5 + flr_NN_actN 4 arcs × 4 (act5 of those is a
// `delivery`, out of skill_check scope; no c1a singletons, no hybrid this
// family). Mixed gates: 59 with no activateCond → gate:{}, 12 with trivial
// `()=>!!S_story.<priorFlag>` → gate:{flags:[…]}. Like lis/zth (Waves 2d/2e),
// an UPPERCASE-checkStat family (CHA/INT/STR/WIS): the legacy resolver read
// abilityScores[checkStat] raw-case (keys are lowercase ⇒ silent +0 modifier,
// the §SKILLFIX-01 bug); the UQF resolver lowercases ⇒ applies the real
// modifier. Parity verified pre-migration vs a golden seeded under BOTH cases;
// the seed() helper below mirrors that. Self-contained.
test.describe('§ARCH-01 Wave 2f — flr* family (bulk-migrated, 71 acts)', () => {
  test('every flr* skill_check is UQF-1.0, validates, onPass:[mission_bit](no label), onFail:[], NO residual activateCond', async ({ page }) => {
    const errs = []; page.on('pageerror', e => errs.push(String(e)));
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const flr = Object.values(QUEST_DB).filter(q => /^flr/.test(q.id) && q.type === 'skill_check');
      return flr.map(q => {
        const b = (q.bits || []).find(x => x.kind === 'skill_check');
        const gate = q.gate || {};
        return { id:q.id, schema:q.schema, valid:validateQuest(q).valid,
          noAC: typeof q.activateCond === 'undefined',
          gateShape: gate.flags ? 'flags' : (JSON.stringify(gate) === '{}' ? 'empty' : 'other'),
          hasStat:!!(b && b.stat), hasDc:typeof (b && b.dc) === 'number',
          onPassK:b ? b.onPass.map(x => x.kind) : null, onFailLen:b ? b.onFail.length : null,
          mbHasLabel:b ? ('label' in (b.onPass.find(x => x.kind === 'mission_bit') || {})) : null };
      });
    });
    expect(errs).toEqual([]);
    expect(r.length).toBe(71);
    const shapes = { flags:0, empty:0 };
    for (const q of r) {
      expect(q.schema).toBe('UQF-1.0');
      expect(q.valid).toBe(true);
      expect(q.noAC).toBe(true);                          // function/string activateCond fully removed
      expect(['flags', 'empty']).toContain(q.gateShape);  // no _legacyFn fallbacks in this family
      expect(q.hasStat).toBe(true);
      expect(q.hasDc).toBe(true);
      expect(q.onPassK).toEqual(['mission_bit']);
      expect(q.onFailLen).toBe(0);
      expect(q.mbHasLabel).toBe(false);
      shapes[q.gateShape]++;
    }
    expect(shapes).toEqual({ flags:12, empty:59 });
  });

  test('PASS/FAIL parity across all 71 + gate behavior (flags ⇒ activatable iff flag set; {} ⇒ always)', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      // checkStat is uppercase but abilityScores keys are lowercase; the UQF
      // resolver lowercases, so seed both cases for a deterministic extreme.
      const seed = (k, v) => ({ [k]: v, [k.toLowerCase()]: v });
      const flr = Object.values(QUEST_DB).filter(q => /^flr/.test(q.id) && q.type === 'skill_check');
      let passBad = [], failBad = [], gateBad = [];
      for (const q of flr) {
        const b = q.bits.find(x => x.kind === 'skill_check');
        const flag = b.onPass.find(x => x.kind === 'mission_bit').flag;
        // PASS
        S_story.abilityScores = seed(b.stat, 40);
        S_story.level = 20; S_story.xp = 0; S_story.gold = 0; S_story.inventory = [];
        S_story[flag] = false; S_story.quests = { [q.id]:'active' };
        _rollCeremonia(q.id);
        const tok = S_story.inventory.find(i => i.flagRef === flag);
        if (!(S_story.quests[q.id] === 'done' && S_story[flag] === true && tok &&
              tok.name === _flagToLabel(flag) + ' Token' && tok.type === 'mission_bit' &&
              S_story.xp === 0 && S_story.gold === 0 && S_story.inventory.length === 1)) passBad.push(q.id);
        // FAIL
        S_story.abilityScores = seed(b.stat, -100);
        S_story.level = 1; S_story.day = 5; S_story.skillCheckAttempts = {};
        S_story.xp = 0; S_story.gold = 0; S_story.inventory = [];
        S_story[flag] = false; S_story.quests = { [q.id]:'active' };
        _rollCeremonia(q.id);
        if (!(S_story.quests[q.id] === 'failed' && S_story[flag] === false && S_story.inventory.length === 0)) failBad.push(q.id);
        // GATE
        const g = q.gate || {};
        if (g.flags && g.flags.length) {
          const gf = g.flags[0];
          S_story[gf] = false; const c0 = QuestRuntime.canActivate(q.id);
          S_story[gf] = true;  const c1 = QuestRuntime.canActivate(q.id);
          if (!(c0 === false && c1 === true)) gateBad.push(q.id);
        } else if (QuestRuntime.canActivate(q.id) !== true) gateBad.push(q.id);
      }
      return { count:flr.length, passBad, failBad, gateBad };
    });
    expect(r.count).toBe(71);
    expect(r.passBad).toEqual([]);
    expect(r.failBad).toEqual([]);
    expect(r.gateBad).toEqual([]);
  });
});

// §ARCH-01 Wave 2g — hft_* family (50 skill_check acts; the Hanseatic-trade
// arcs). FIRST MIXED-SHAPE bulk family: 35 acts carry a checkPassFlag (hft_01–07
// arcs) → onPass:[mission_bit{flag}]; 15 acts have NO checkPassFlag (hft_08–11
// arcs) → onPass:[] (legacy pass→done granted nothing; the migrator's
// `passFlag ? mission_bit : null` + filter(Boolean) reproduces that exactly).
// Mixed gates: 22 gate:{} + 28 trivial `()=>!!S_story.<priorFlag>` →
// gate:{flags:[…]}. Like lis/zth/flr, UPPERCASE-checkStat (CHA/CON/INT/STR/WIS):
// legacy read abilityScores[checkStat] raw-case ⇒ silent +0 mod (the
// §SKILLFIX-01 bug); UQF lowercases ⇒ real mod. Parity verified pre-migration vs
// a golden seeded under BOTH cases; seed() below mirrors that. The migrator also
// type-gates out the non-skill_check members (hft_10_act3 combat + 4 deliveries).
// Self-contained.
test.describe('§ARCH-01 Wave 2g — hft_* family (bulk-migrated, 50 acts; mixed flag/flagless)', () => {
  test('every hft_* skill_check is UQF-1.0, validates, onFail:[], NO residual activateCond; onPass = mission_bit OR empty', async ({ page }) => {
    const errs = []; page.on('pageerror', e => errs.push(String(e)));
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const hft = Object.values(QUEST_DB).filter(q => /^hft_/.test(q.id) && q.type === 'skill_check');
      return hft.map(q => {
        const b = (q.bits || []).find(x => x.kind === 'skill_check');
        const mb = b && b.onPass.find(x => x.kind === 'mission_bit');
        const gate = q.gate || {};
        return { id:q.id, schema:q.schema, valid:validateQuest(q).valid,
          noAC: typeof q.activateCond === 'undefined',
          gateShape: gate.flags ? 'flags' : (JSON.stringify(gate) === '{}' ? 'empty' : 'other'),
          hasStat:!!(b && b.stat), hasDc:typeof (b && b.dc) === 'number',
          onPassK:b ? b.onPass.map(x => x.kind) : null, onFailLen:b ? b.onFail.length : null,
          mbHasLabel:mb ? ('label' in mb) : null };
      });
    });
    expect(errs).toEqual([]);
    expect(r.length).toBe(50);
    const gateShapes = { flags:0, empty:0 };
    const passShapes = { mission_bit:0, none:0 };
    for (const q of r) {
      expect(q.schema).toBe('UQF-1.0');
      expect(q.valid).toBe(true);
      expect(q.noAC).toBe(true);                          // function/string activateCond fully removed
      expect(['flags', 'empty']).toContain(q.gateShape);  // no _legacyFn fallbacks in this family
      expect(q.hasStat).toBe(true);
      expect(q.hasDc).toBe(true);
      expect(q.onFailLen).toBe(0);
      // mixed shape: flag-bearing → [mission_bit] (no label); flagless → []
      if (q.onPassK.length) {
        expect(q.onPassK).toEqual(['mission_bit']);
        expect(q.mbHasLabel).toBe(false);
        passShapes.mission_bit++;
      } else {
        expect(q.onPassK).toEqual([]);
        passShapes.none++;
      }
      gateShapes[q.gateShape]++;
    }
    expect(gateShapes).toEqual({ flags:28, empty:22 });
    expect(passShapes).toEqual({ mission_bit:35, none:15 });
  });

  test('PASS/FAIL parity across all 50 + gate behavior; flag-bearing grant a token, flagless grant nothing', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      // checkStat is uppercase but abilityScores keys are lowercase; the UQF
      // resolver lowercases, so seed both cases for a deterministic extreme.
      const seed = (k, v) => ({ [k]: v, [k.toLowerCase()]: v });
      const hft = Object.values(QUEST_DB).filter(q => /^hft_/.test(q.id) && q.type === 'skill_check');
      let passBad = [], failBad = [], gateBad = [];
      for (const q of hft) {
        const b = q.bits.find(x => x.kind === 'skill_check');
        const mb = b.onPass.find(x => x.kind === 'mission_bit');
        const flag = mb ? mb.flag : null;
        // PASS
        S_story.abilityScores = seed(b.stat, 40);
        S_story.level = 20; S_story.xp = 0; S_story.gold = 0; S_story.inventory = [];
        if (flag) S_story[flag] = false;
        S_story.quests = { [q.id]:'active' };
        _rollCeremonia(q.id);
        if (flag) {
          const tok = S_story.inventory.find(i => i.flagRef === flag);
          if (!(S_story.quests[q.id] === 'done' && S_story[flag] === true && tok &&
                tok.name === _flagToLabel(flag) + ' Token' && tok.type === 'mission_bit' &&
                S_story.xp === 0 && S_story.gold === 0 && S_story.inventory.length === 1)) passBad.push(q.id);
        } else {  // flagless: pass→done, NO token, NO xp/gold
          if (!(S_story.quests[q.id] === 'done' && S_story.xp === 0 && S_story.gold === 0 &&
                S_story.inventory.length === 0)) passBad.push(q.id);
        }
        // FAIL (all non-retryable → failed, never a flag/token)
        S_story.abilityScores = seed(b.stat, -100);
        S_story.level = 1; S_story.day = 5; S_story.skillCheckAttempts = {};
        S_story.xp = 0; S_story.gold = 0; S_story.inventory = [];
        if (flag) S_story[flag] = false;
        S_story.quests = { [q.id]:'active' };
        _rollCeremonia(q.id);
        if (!(S_story.quests[q.id] === 'failed' && (!flag || S_story[flag] === false) && S_story.inventory.length === 0)) failBad.push(q.id);
        // GATE
        const g = q.gate || {};
        if (g.flags && g.flags.length) {
          const gf = g.flags[0];
          S_story[gf] = false; const c0 = QuestRuntime.canActivate(q.id);
          S_story[gf] = true;  const c1 = QuestRuntime.canActivate(q.id);
          if (!(c0 === false && c1 === true)) gateBad.push(q.id);
        } else if (QuestRuntime.canActivate(q.id) !== true) gateBad.push(q.id);
      }
      return { count:hft.length, passBad, failBad, gateBad };
    });
    expect(r.count).toBe(50);
    expect(r.passBad).toEqual([]);
    expect(r.failBad).toEqual([]);
    expect(r.gateBad).toEqual([]);
  });
});

// §ARCH-01 Wave 2h — rkv_* family (50 skill_check acts; Reykjavík/northern arcs).
// Structural twin of hft_ (Wave 2g) — MIXED shape: 35 acts (rkv_01–07) carry a
// checkPassFlag → onPass:[mission_bit{flag}]; 15 acts (rkv_08–11) have NO
// checkPassFlag → onPass:[] (legacy pass→done granted nothing; reproduced
// byte-for-byte). Mixed gates: 22 gate:{} + 28 trivial
// `()=>!!S_story.<priorFlag>` → gate:{flags:[…]}. UPPERCASE-checkStat
// (CHA/CON/DEX/INT/STR/WIS): legacy raw-case read ⇒ silent +0 mod (§SKILLFIX-01);
// UQF lowercases ⇒ real mod. Golden seeded under BOTH cases; seed() below mirrors
// that. Transform type-gates out non-skill_check members (rkv_10_act3 combat + 4
// deliveries). Self-contained.
test.describe('§ARCH-01 Wave 2h — rkv_* family (bulk-migrated, 50 acts; mixed flag/flagless)', () => {
  test('every rkv_* skill_check is UQF-1.0, validates, onFail:[], NO residual activateCond; onPass = mission_bit OR empty', async ({ page }) => {
    const errs = []; page.on('pageerror', e => errs.push(String(e)));
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const rkv = Object.values(QUEST_DB).filter(q => /^rkv_/.test(q.id) && q.type === 'skill_check');
      return rkv.map(q => {
        const b = (q.bits || []).find(x => x.kind === 'skill_check');
        const mb = b && b.onPass.find(x => x.kind === 'mission_bit');
        const gate = q.gate || {};
        return { id:q.id, schema:q.schema, valid:validateQuest(q).valid,
          noAC: typeof q.activateCond === 'undefined',
          gateShape: gate.flags ? 'flags' : (JSON.stringify(gate) === '{}' ? 'empty' : 'other'),
          hasStat:!!(b && b.stat), hasDc:typeof (b && b.dc) === 'number',
          onPassK:b ? b.onPass.map(x => x.kind) : null, onFailLen:b ? b.onFail.length : null,
          mbHasLabel:mb ? ('label' in mb) : null };
      });
    });
    expect(errs).toEqual([]);
    expect(r.length).toBe(50);
    const gateShapes = { flags:0, empty:0 };
    const passShapes = { mission_bit:0, none:0 };
    for (const q of r) {
      expect(q.schema).toBe('UQF-1.0');
      expect(q.valid).toBe(true);
      expect(q.noAC).toBe(true);
      expect(['flags', 'empty']).toContain(q.gateShape);
      expect(q.hasStat).toBe(true);
      expect(q.hasDc).toBe(true);
      expect(q.onFailLen).toBe(0);
      if (q.onPassK.length) {
        expect(q.onPassK).toEqual(['mission_bit']);
        expect(q.mbHasLabel).toBe(false);
        passShapes.mission_bit++;
      } else {
        expect(q.onPassK).toEqual([]);
        passShapes.none++;
      }
      gateShapes[q.gateShape]++;
    }
    expect(gateShapes).toEqual({ flags:28, empty:22 });
    expect(passShapes).toEqual({ mission_bit:35, none:15 });
  });

  test('PASS/FAIL parity across all 50 + gate behavior; flag-bearing grant a token, flagless grant nothing', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const seed = (k, v) => ({ [k]: v, [k.toLowerCase()]: v });
      const rkv = Object.values(QUEST_DB).filter(q => /^rkv_/.test(q.id) && q.type === 'skill_check');
      let passBad = [], failBad = [], gateBad = [];
      for (const q of rkv) {
        const b = q.bits.find(x => x.kind === 'skill_check');
        const mb = b.onPass.find(x => x.kind === 'mission_bit');
        const flag = mb ? mb.flag : null;
        // PASS
        S_story.abilityScores = seed(b.stat, 40);
        S_story.level = 20; S_story.xp = 0; S_story.gold = 0; S_story.inventory = [];
        if (flag) S_story[flag] = false;
        S_story.quests = { [q.id]:'active' };
        _rollCeremonia(q.id);
        if (flag) {
          const tok = S_story.inventory.find(i => i.flagRef === flag);
          if (!(S_story.quests[q.id] === 'done' && S_story[flag] === true && tok &&
                tok.name === _flagToLabel(flag) + ' Token' && tok.type === 'mission_bit' &&
                S_story.xp === 0 && S_story.gold === 0 && S_story.inventory.length === 1)) passBad.push(q.id);
        } else {
          if (!(S_story.quests[q.id] === 'done' && S_story.xp === 0 && S_story.gold === 0 &&
                S_story.inventory.length === 0)) passBad.push(q.id);
        }
        // FAIL
        S_story.abilityScores = seed(b.stat, -100);
        S_story.level = 1; S_story.day = 5; S_story.skillCheckAttempts = {};
        S_story.xp = 0; S_story.gold = 0; S_story.inventory = [];
        if (flag) S_story[flag] = false;
        S_story.quests = { [q.id]:'active' };
        _rollCeremonia(q.id);
        if (!(S_story.quests[q.id] === 'failed' && (!flag || S_story[flag] === false) && S_story.inventory.length === 0)) failBad.push(q.id);
        // GATE
        const g = q.gate || {};
        if (g.flags && g.flags.length) {
          const gf = g.flags[0];
          S_story[gf] = false; const c0 = QuestRuntime.canActivate(q.id);
          S_story[gf] = true;  const c1 = QuestRuntime.canActivate(q.id);
          if (!(c0 === false && c1 === true)) gateBad.push(q.id);
        } else if (QuestRuntime.canActivate(q.id) !== true) gateBad.push(q.id);
      }
      return { count:rkv.length, passBad, failBad, gateBad };
    });
    expect(r.count).toBe(50);
    expect(r.passBad).toEqual([]);
    expect(r.failBad).toEqual([]);
    expect(r.gateBad).toEqual([]);
  });
});

// §ARCH-01 Wave 2i / §SKILLFIX-02 — ist_* family (48 skill_check acts;
// Constantinople ist_cNaM chapters). FIRST family whose checkStat holds a D&D
// SKILL NAME (Persuasion/History/Insight/Deception/Investigation/Religion) or a
// full ability word (Strength) rather than an ability abbreviation. The legacy
// resolver read abilityScores[checkStat] → undefined → +0 ability mod (a latent
// bug §SKILLFIX-01 did not reach). §SKILLFIX-02 (user-approved): the migrator
// maps the skill to its governing ability (D&D 5e standard; homebrew
// Courage/Presence → CHA) into `stat`, keeping the skill name in `skill` for
// display+proficiency. This is a deliberate BEHAVIOR CHANGE — the check now rolls
// the mapped ability mod + proficiency (the intended behavior), so parity is
// asserted on DISPLAY (untouched) + structure + the mapping, NOT vs the legacy
// +0 roll. All flag-bearing; gates 38 {} + 10 {flags}. Self-contained.
test.describe('§ARCH-01 Wave 2i / §SKILLFIX-02 — ist_* family (skill→ability mapped, 48 acts)', () => {
  // D&D 5e skill→ability (mirrors scripts/uqf-bulk-migrate.js); used to pin the mapping durably.
  const ABILITIES = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
  const SKILL_TO_ABILITY = {
    ATHLETICS:'STR', ACROBATICS:'DEX', 'SLEIGHT OF HAND':'DEX', STEALTH:'DEX',
    ARCANA:'INT', HISTORY:'INT', INVESTIGATION:'INT', NATURE:'INT', RELIGION:'INT',
    'ANIMAL HANDLING':'WIS', INSIGHT:'WIS', MEDICINE:'WIS', PERCEPTION:'WIS', SURVIVAL:'WIS',
    DECEPTION:'CHA', INTIMIDATION:'CHA', PERFORMANCE:'CHA', PERSUASION:'CHA', COURAGE:'CHA', PRESENCE:'CHA',
  };

  test('every ist_* skill_check is UQF-1.0, validates, stat is a real ability, skill→ability mapping holds', async ({ page }) => {
    const errs = []; page.on('pageerror', e => errs.push(String(e)));
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const ist = Object.values(QUEST_DB).filter(q => /^ist_/.test(q.id) && q.type === 'skill_check');
      return ist.map(q => {
        const b = (q.bits || []).find(x => x.kind === 'skill_check');
        const mb = b && b.onPass.find(x => x.kind === 'mission_bit');
        const gate = q.gate || {};
        return { id:q.id, schema:q.schema, valid:validateQuest(q).valid, stat:b ? b.stat : null, skill:(b && b.skill) || null,
          noAC: typeof q.activateCond === 'undefined',
          gateShape: gate.flags ? 'flags' : (JSON.stringify(gate) === '{}' ? 'empty' : 'other'),
          onPassK:b ? b.onPass.map(x => x.kind) : null, onFailLen:b ? b.onFail.length : null,
          mbHasLabel:mb ? ('label' in mb) : null };
      });
    });
    expect(errs).toEqual([]);
    expect(r.length).toBe(48);
    const gateShapes = { flags:0, empty:0 };
    let mappedSkills = 0;
    for (const q of r) {
      expect(q.schema).toBe('UQF-1.0');
      expect(q.valid).toBe(true);
      expect(ABILITIES).toContain(q.stat);              // §SKILLFIX-02: stat is always a real ability now
      expect(q.noAC).toBe(true);
      expect(['flags', 'empty']).toContain(q.gateShape);
      expect(q.onPassK).toEqual(['mission_bit']);        // ist all flag-bearing
      expect(q.onFailLen).toBe(0);
      expect(q.mbHasLabel).toBe(false);
      if (q.skill) {                                      // mapping durability: skill's ability === stat
        expect(SKILL_TO_ABILITY[q.skill.toUpperCase()], `${q.id} skill ${q.skill}`).toBe(q.stat);
        mappedSkills++;
      }
      gateShapes[q.gateShape]++;
    }
    expect(gateShapes).toEqual({ flags:10, empty:38 });
    expect(mappedSkills).toBe(32);                        // 32 of 48 carry a mapped skill name
  });

  test('NEW behavior (post-§SKILLFIX-02): the mapped ability mod drives the roll — forced PASS/FAIL + gate', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const seed = (k, v) => ({ [k]: v, [k.toLowerCase()]: v });
      const ist = Object.values(QUEST_DB).filter(q => /^ist_/.test(q.id) && q.type === 'skill_check');
      let passBad = [], failBad = [], gateBad = [];
      for (const q of ist) {
        const b = q.bits.find(x => x.kind === 'skill_check');
        const flag = b.onPass.find(x => x.kind === 'mission_bit').flag;
        // PASS — seed the MAPPED ability high
        S_story.abilityScores = seed(b.stat, 40);
        S_story.level = 20; S_story.xp = 0; S_story.gold = 0; S_story.inventory = [];
        S_story[flag] = false; S_story.quests = { [q.id]:'active' };
        _rollCeremonia(q.id);
        const tok = S_story.inventory.find(i => i.flagRef === flag);
        if (!(S_story.quests[q.id] === 'done' && S_story[flag] === true && tok &&
              tok.name === _flagToLabel(flag) + ' Token' && tok.type === 'mission_bit' &&
              S_story.xp === 0 && S_story.gold === 0 && S_story.inventory.length === 1)) passBad.push(q.id);
        // FAIL — seed the mapped ability very low
        S_story.abilityScores = seed(b.stat, -100);
        S_story.level = 1; S_story.day = 5; S_story.skillCheckAttempts = {};
        S_story.xp = 0; S_story.gold = 0; S_story.inventory = [];
        S_story[flag] = false; S_story.quests = { [q.id]:'active' };
        _rollCeremonia(q.id);
        if (!(S_story.quests[q.id] === 'failed' && S_story[flag] === false && S_story.inventory.length === 0)) failBad.push(q.id);
        // GATE
        const g = q.gate || {};
        if (g.flags && g.flags.length) {
          const gf = g.flags[0];
          S_story[gf] = false; const c0 = QuestRuntime.canActivate(q.id);
          S_story[gf] = true;  const c1 = QuestRuntime.canActivate(q.id);
          if (!(c0 === false && c1 === true)) gateBad.push(q.id);
        } else if (QuestRuntime.canActivate(q.id) !== true) gateBad.push(q.id);
      }
      return { count:ist.length, passBad, failBad, gateBad };
    });
    expect(r.count).toBe(48);
    expect(r.passBad).toEqual([]);
    expect(r.failBad).toEqual([]);
    expect(r.gateBad).toEqual([]);
  });
});

// §ARCH-01 Wave 2j — rix_* family (47 skill_check acts; Egil's Saga, the York
// court + Iceland/Althing cycles). Structural twin of rkv_ (Wave 2h) / hft_
// (Wave 2g) — MIXED shape: 33 acts carry a checkPassFlag → onPass:[mission_bit
// {flag}]; 14 acts (notably the rix_11 Sonatorrek cycle) have NO checkPassFlag →
// onPass:[] (legacy pass→done granted nothing; reproduced byte-for-byte). Mixed
// gates: 26 trivial `()=>!!S_story.<priorFlag>` → gate:{flags:[…]} + 21 gate:{}.
// UPPERCASE-checkStat (CHA/CON/DEX/INT/STR/WIS): legacy raw-case read ⇒ silent +0
// mod (§SKILLFIX-01); UQF lowercases ⇒ real mod. Golden seeded under BOTH cases;
// seed() below mirrors that. NO §SKILLFIX-02 (0 skill-name checkStats). Transform
// type-gates out the 8 non-skill_check members (combat rix_01/03_act3 + the
// delivery acts). Self-contained.
test.describe('§ARCH-01 Wave 2j — rix_* family (bulk-migrated, 47 acts; mixed flag/flagless)', () => {
  test('every rix_* skill_check is UQF-1.0, validates, onFail:[], NO residual activateCond; onPass = mission_bit OR empty', async ({ page }) => {
    const errs = []; page.on('pageerror', e => errs.push(String(e)));
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const rix = Object.values(QUEST_DB).filter(q => /^rix_/.test(q.id) && q.type === 'skill_check');
      return rix.map(q => {
        const b = (q.bits || []).find(x => x.kind === 'skill_check');
        const mb = b && b.onPass.find(x => x.kind === 'mission_bit');
        const gate = q.gate || {};
        return { id:q.id, schema:q.schema, valid:validateQuest(q).valid,
          noAC: typeof q.activateCond === 'undefined',
          gateShape: gate.flags ? 'flags' : (JSON.stringify(gate) === '{}' ? 'empty' : 'other'),
          hasStat:!!(b && b.stat), hasDc:typeof (b && b.dc) === 'number',
          onPassK:b ? b.onPass.map(x => x.kind) : null, onFailLen:b ? b.onFail.length : null,
          mbHasLabel:mb ? ('label' in mb) : null };
      });
    });
    expect(errs).toEqual([]);
    expect(r.length).toBe(47);
    const gateShapes = { flags:0, empty:0 };
    const passShapes = { mission_bit:0, none:0 };
    for (const q of r) {
      expect(q.schema).toBe('UQF-1.0');
      expect(q.valid).toBe(true);
      expect(q.noAC).toBe(true);
      expect(['flags', 'empty']).toContain(q.gateShape);
      expect(q.hasStat).toBe(true);
      expect(q.hasDc).toBe(true);
      expect(q.onFailLen).toBe(0);
      if (q.onPassK.length) {
        expect(q.onPassK).toEqual(['mission_bit']);
        expect(q.mbHasLabel).toBe(false);
        passShapes.mission_bit++;
      } else {
        expect(q.onPassK).toEqual([]);
        passShapes.none++;
      }
      gateShapes[q.gateShape]++;
    }
    expect(gateShapes).toEqual({ flags:26, empty:21 });
    expect(passShapes).toEqual({ mission_bit:33, none:14 });
  });

  test('PASS/FAIL parity across all 47 + gate behavior; flag-bearing grant a token, flagless grant nothing', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const seed = (k, v) => ({ [k]: v, [k.toLowerCase()]: v });
      const rix = Object.values(QUEST_DB).filter(q => /^rix_/.test(q.id) && q.type === 'skill_check');
      let passBad = [], failBad = [], gateBad = [];
      for (const q of rix) {
        const b = q.bits.find(x => x.kind === 'skill_check');
        const mb = b.onPass.find(x => x.kind === 'mission_bit');
        const flag = mb ? mb.flag : null;
        // PASS
        S_story.abilityScores = seed(b.stat, 40);
        S_story.level = 20; S_story.xp = 0; S_story.gold = 0; S_story.inventory = [];
        if (flag) S_story[flag] = false;
        S_story.quests = { [q.id]:'active' };
        _rollCeremonia(q.id);
        if (flag) {
          const tok = S_story.inventory.find(i => i.flagRef === flag);
          if (!(S_story.quests[q.id] === 'done' && S_story[flag] === true && tok &&
                tok.name === _flagToLabel(flag) + ' Token' && tok.type === 'mission_bit' &&
                S_story.xp === 0 && S_story.gold === 0 && S_story.inventory.length === 1)) passBad.push(q.id);
        } else {
          if (!(S_story.quests[q.id] === 'done' && S_story.xp === 0 && S_story.gold === 0 &&
                S_story.inventory.length === 0)) passBad.push(q.id);
        }
        // FAIL
        S_story.abilityScores = seed(b.stat, -100);
        S_story.level = 1; S_story.day = 5; S_story.skillCheckAttempts = {};
        S_story.xp = 0; S_story.gold = 0; S_story.inventory = [];
        if (flag) S_story[flag] = false;
        S_story.quests = { [q.id]:'active' };
        _rollCeremonia(q.id);
        if (!(S_story.quests[q.id] === 'failed' && (!flag || S_story[flag] === false) && S_story.inventory.length === 0)) failBad.push(q.id);
        // GATE
        const g = q.gate || {};
        if (g.flags && g.flags.length) {
          const gf = g.flags[0];
          S_story[gf] = false; const c0 = QuestRuntime.canActivate(q.id);
          S_story[gf] = true;  const c1 = QuestRuntime.canActivate(q.id);
          if (!(c0 === false && c1 === true)) gateBad.push(q.id);
        } else if (QuestRuntime.canActivate(q.id) !== true) gateBad.push(q.id);
      }
      return { count:rix.length, passBad, failBad, gateBad };
    });
    expect(r.count).toBe(47);
    expect(r.passBad).toEqual([]);
    expect(r.failBad).toEqual([]);
    expect(r.gateBad).toEqual([]);
  });
});

// §ARCH-01 Wave 2k — ost_* family (46 skill_check acts; Ostmen/Norse-Dublin
// saga cycles, nodes incl. frost-giant battlegrounds). Structural twin of rix_
// (Wave 2j) / rkv_ (Wave 2h) — MIXED shape: 32 acts carry a checkPassFlag →
// onPass:[mission_bit{flag}]; 14 acts have NO checkPassFlag → onPass:[] (legacy
// pass→done granted nothing; reproduced byte-for-byte). Mixed gates: 21 gate:{}
// + 25 trivial `()=>!!S_story.<priorFlag>` → gate:{flags:[…]}. UPPERCASE-checkStat
// (CHA/CON/DEX/INT/WIS): legacy raw-case read ⇒ silent +0 mod (§SKILLFIX-01);
// UQF lowercases ⇒ real mod. Golden seeded under BOTH cases; seed() below mirrors
// that. NO §SKILLFIX-02 (0 skill-name checkStats). Transform type-gates out the 9
// non-skill_check members (5 combat ost_01_act2/02_act4/03_act3/09_act3/10_act3 +
// 4 deliveries). Self-contained.
test.describe('§ARCH-01 Wave 2k — ost_* family (bulk-migrated, 46 acts; mixed flag/flagless)', () => {
  test('every ost_* skill_check is UQF-1.0, validates, onFail:[], NO residual activateCond; onPass = mission_bit OR empty', async ({ page }) => {
    const errs = []; page.on('pageerror', e => errs.push(String(e)));
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const ost = Object.values(QUEST_DB).filter(q => /^ost_/.test(q.id) && q.type === 'skill_check');
      return ost.map(q => {
        const b = (q.bits || []).find(x => x.kind === 'skill_check');
        const mb = b && b.onPass.find(x => x.kind === 'mission_bit');
        const gate = q.gate || {};
        return { id:q.id, schema:q.schema, valid:validateQuest(q).valid,
          noAC: typeof q.activateCond === 'undefined',
          gateShape: gate.flags ? 'flags' : (JSON.stringify(gate) === '{}' ? 'empty' : 'other'),
          hasStat:!!(b && b.stat), hasDc:typeof (b && b.dc) === 'number',
          onPassK:b ? b.onPass.map(x => x.kind) : null, onFailLen:b ? b.onFail.length : null,
          mbHasLabel:mb ? ('label' in mb) : null };
      });
    });
    expect(errs).toEqual([]);
    expect(r.length).toBe(46);
    const gateShapes = { flags:0, empty:0 };
    const passShapes = { mission_bit:0, none:0 };
    for (const q of r) {
      expect(q.schema).toBe('UQF-1.0');
      expect(q.valid).toBe(true);
      expect(q.noAC).toBe(true);
      expect(['flags', 'empty']).toContain(q.gateShape);
      expect(q.hasStat).toBe(true);
      expect(q.hasDc).toBe(true);
      expect(q.onFailLen).toBe(0);
      if (q.onPassK.length) {
        expect(q.onPassK).toEqual(['mission_bit']);
        expect(q.mbHasLabel).toBe(false);
        passShapes.mission_bit++;
      } else {
        expect(q.onPassK).toEqual([]);
        passShapes.none++;
      }
      gateShapes[q.gateShape]++;
    }
    expect(gateShapes).toEqual({ flags:25, empty:21 });
    expect(passShapes).toEqual({ mission_bit:32, none:14 });
  });

  test('PASS/FAIL parity across all 46 + gate behavior; flag-bearing grant a token, flagless grant nothing', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const seed = (k, v) => ({ [k]: v, [k.toLowerCase()]: v });
      const ost = Object.values(QUEST_DB).filter(q => /^ost_/.test(q.id) && q.type === 'skill_check');
      let passBad = [], failBad = [], gateBad = [];
      for (const q of ost) {
        const b = q.bits.find(x => x.kind === 'skill_check');
        const mb = b.onPass.find(x => x.kind === 'mission_bit');
        const flag = mb ? mb.flag : null;
        // PASS
        S_story.abilityScores = seed(b.stat, 40);
        S_story.level = 20; S_story.xp = 0; S_story.gold = 0; S_story.inventory = [];
        if (flag) S_story[flag] = false;
        S_story.quests = { [q.id]:'active' };
        _rollCeremonia(q.id);
        if (flag) {
          const tok = S_story.inventory.find(i => i.flagRef === flag);
          if (!(S_story.quests[q.id] === 'done' && S_story[flag] === true && tok &&
                tok.name === _flagToLabel(flag) + ' Token' && tok.type === 'mission_bit' &&
                S_story.xp === 0 && S_story.gold === 0 && S_story.inventory.length === 1)) passBad.push(q.id);
        } else {
          if (!(S_story.quests[q.id] === 'done' && S_story.xp === 0 && S_story.gold === 0 &&
                S_story.inventory.length === 0)) passBad.push(q.id);
        }
        // FAIL
        S_story.abilityScores = seed(b.stat, -100);
        S_story.level = 1; S_story.day = 5; S_story.skillCheckAttempts = {};
        S_story.xp = 0; S_story.gold = 0; S_story.inventory = [];
        if (flag) S_story[flag] = false;
        S_story.quests = { [q.id]:'active' };
        _rollCeremonia(q.id);
        if (!(S_story.quests[q.id] === 'failed' && (!flag || S_story[flag] === false) && S_story.inventory.length === 0)) failBad.push(q.id);
        // GATE
        const g = q.gate || {};
        if (g.flags && g.flags.length) {
          const gf = g.flags[0];
          S_story[gf] = false; const c0 = QuestRuntime.canActivate(q.id);
          S_story[gf] = true;  const c1 = QuestRuntime.canActivate(q.id);
          if (!(c0 === false && c1 === true)) gateBad.push(q.id);
        } else if (QuestRuntime.canActivate(q.id) !== true) gateBad.push(q.id);
      }
      return { count:ost.length, passBad, failBad, gateBad };
    });
    expect(r.count).toBe(46);
    expect(r.passBad).toEqual([]);
    expect(r.failBad).toEqual([]);
    expect(r.gateBad).toEqual([]);
  });
});

// §ARCH-01 Wave 2l — arn_* family (43 skill_check acts; Arnarstapi/Norse saga
// cycles). Structural twin of ost_ (Wave 2k) / rix_ (Wave 2j) — MIXED shape: 32
// acts carry a checkPassFlag → onPass:[mission_bit{flag}]; 11 acts have NO
// checkPassFlag → onPass:[] (legacy pass→done granted nothing; reproduced
// byte-for-byte). Mixed gates: 18 gate:{} + 25 trivial
// `()=>!!S_story.<priorFlag>` → gate:{flags:[…]}. UPPERCASE-checkStat
// (CHA/CON/DEX/INT/STR/WIS): legacy raw-case read ⇒ silent +0 mod (§SKILLFIX-01);
// UQF lowercases ⇒ real mod. Golden seeded under BOTH cases; seed() below mirrors
// that. NO §SKILLFIX-02 (0 skill-name checkStats). Transform type-gates out the 7
// non-skill_check members (4 combat arn_01/03/05_act3 + arn_10_act2 + 3
// deliveries). Self-contained.
test.describe('§ARCH-01 Wave 2l — arn_* family (bulk-migrated, 43 acts; mixed flag/flagless)', () => {
  test('every arn_* skill_check is UQF-1.0, validates, onFail:[], NO residual activateCond; onPass = mission_bit OR empty', async ({ page }) => {
    const errs = []; page.on('pageerror', e => errs.push(String(e)));
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const arn = Object.values(QUEST_DB).filter(q => /^arn_/.test(q.id) && q.type === 'skill_check');
      return arn.map(q => {
        const b = (q.bits || []).find(x => x.kind === 'skill_check');
        const mb = b && b.onPass.find(x => x.kind === 'mission_bit');
        const gate = q.gate || {};
        return { id:q.id, schema:q.schema, valid:validateQuest(q).valid,
          noAC: typeof q.activateCond === 'undefined',
          gateShape: gate.flags ? 'flags' : (JSON.stringify(gate) === '{}' ? 'empty' : 'other'),
          hasStat:!!(b && b.stat), hasDc:typeof (b && b.dc) === 'number',
          onPassK:b ? b.onPass.map(x => x.kind) : null, onFailLen:b ? b.onFail.length : null,
          mbHasLabel:mb ? ('label' in mb) : null };
      });
    });
    expect(errs).toEqual([]);
    expect(r.length).toBe(43);
    const gateShapes = { flags:0, empty:0 };
    const passShapes = { mission_bit:0, none:0 };
    for (const q of r) {
      expect(q.schema).toBe('UQF-1.0');
      expect(q.valid).toBe(true);
      expect(q.noAC).toBe(true);
      expect(['flags', 'empty']).toContain(q.gateShape);
      expect(q.hasStat).toBe(true);
      expect(q.hasDc).toBe(true);
      expect(q.onFailLen).toBe(0);
      if (q.onPassK.length) {
        expect(q.onPassK).toEqual(['mission_bit']);
        expect(q.mbHasLabel).toBe(false);
        passShapes.mission_bit++;
      } else {
        expect(q.onPassK).toEqual([]);
        passShapes.none++;
      }
      gateShapes[q.gateShape]++;
    }
    expect(gateShapes).toEqual({ flags:25, empty:18 });
    expect(passShapes).toEqual({ mission_bit:32, none:11 });
  });

  test('PASS/FAIL parity across all 43 + gate behavior; flag-bearing grant a token, flagless grant nothing', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const seed = (k, v) => ({ [k]: v, [k.toLowerCase()]: v });
      const arn = Object.values(QUEST_DB).filter(q => /^arn_/.test(q.id) && q.type === 'skill_check');
      let passBad = [], failBad = [], gateBad = [];
      for (const q of arn) {
        const b = q.bits.find(x => x.kind === 'skill_check');
        const mb = b.onPass.find(x => x.kind === 'mission_bit');
        const flag = mb ? mb.flag : null;
        // PASS
        S_story.abilityScores = seed(b.stat, 40);
        S_story.level = 20; S_story.xp = 0; S_story.gold = 0; S_story.inventory = [];
        if (flag) S_story[flag] = false;
        S_story.quests = { [q.id]:'active' };
        _rollCeremonia(q.id);
        if (flag) {
          const tok = S_story.inventory.find(i => i.flagRef === flag);
          if (!(S_story.quests[q.id] === 'done' && S_story[flag] === true && tok &&
                tok.name === _flagToLabel(flag) + ' Token' && tok.type === 'mission_bit' &&
                S_story.xp === 0 && S_story.gold === 0 && S_story.inventory.length === 1)) passBad.push(q.id);
        } else {
          if (!(S_story.quests[q.id] === 'done' && S_story.xp === 0 && S_story.gold === 0 &&
                S_story.inventory.length === 0)) passBad.push(q.id);
        }
        // FAIL
        S_story.abilityScores = seed(b.stat, -100);
        S_story.level = 1; S_story.day = 5; S_story.skillCheckAttempts = {};
        S_story.xp = 0; S_story.gold = 0; S_story.inventory = [];
        if (flag) S_story[flag] = false;
        S_story.quests = { [q.id]:'active' };
        _rollCeremonia(q.id);
        if (!(S_story.quests[q.id] === 'failed' && (!flag || S_story[flag] === false) && S_story.inventory.length === 0)) failBad.push(q.id);
        // GATE
        const g = q.gate || {};
        if (g.flags && g.flags.length) {
          const gf = g.flags[0];
          S_story[gf] = false; const c0 = QuestRuntime.canActivate(q.id);
          S_story[gf] = true;  const c1 = QuestRuntime.canActivate(q.id);
          if (!(c0 === false && c1 === true)) gateBad.push(q.id);
        } else if (QuestRuntime.canActivate(q.id) !== true) gateBad.push(q.id);
      }
      return { count:arn.length, passBad, failBad, gateBad };
    });
    expect(r.count).toBe(43);
    expect(r.passBad).toEqual([]);
    expect(r.failBad).toEqual([]);
    expect(r.gateBad).toEqual([]);
  });
});

// §ARCH-01 Wave 2m — vby_* family (42 skill_check acts; Viby/Norse saga arcs,
// 10 chapters × ~5 acts). Structural twin of arn_ (Wave 2l) / ost_ (Wave 2k) /
// rix_ (Wave 2j) — MIXED shape: 33 acts carry a checkPassFlag →
// onPass:[mission_bit{flag}]; 9 acts (the entirely-flagless arcs vby_08/09/10)
// have NO checkPassFlag → onPass:[] (legacy pass→done granted nothing;
// reproduced byte-for-byte). Mixed gates: 16 gate:{} + 26 trivial
// `()=>!!S_story.<priorFlag>` → gate:{flags:[…]} (the act1 openers of arcs 01–07
// plus all of the flagless arcs 08/09/10 are gate:{}). UPPERCASE-checkStat
// (CHA/CON/DEX/INT/STR/WIS): legacy raw-case read ⇒ silent +0 mod (§SKILLFIX-01);
// UQF lowercases ⇒ real mod. Golden seeded under BOTH cases; seed() below mirrors
// that. NO §SKILLFIX-02 (0 skill-name checkStats). Transform type-gates out the 8
// non-skill_check members (5 combat vby_01/03/08_act3 + vby_09_act2 + vby_10_act3
// + 3 deliveries vby_08/09/10_act5). Self-contained.
test.describe('§ARCH-01 Wave 2m — vby_* family (bulk-migrated, 42 acts; mixed flag/flagless)', () => {
  test('every vby_* skill_check is UQF-1.0, validates, onFail:[], NO residual activateCond; onPass = mission_bit OR empty', async ({ page }) => {
    const errs = []; page.on('pageerror', e => errs.push(String(e)));
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const vby = Object.values(QUEST_DB).filter(q => /^vby_/.test(q.id) && q.type === 'skill_check');
      return vby.map(q => {
        const b = (q.bits || []).find(x => x.kind === 'skill_check');
        const mb = b && b.onPass.find(x => x.kind === 'mission_bit');
        const gate = q.gate || {};
        return { id:q.id, schema:q.schema, valid:validateQuest(q).valid,
          noAC: typeof q.activateCond === 'undefined',
          gateShape: gate.flags ? 'flags' : (JSON.stringify(gate) === '{}' ? 'empty' : 'other'),
          hasStat:!!(b && b.stat), hasDc:typeof (b && b.dc) === 'number',
          onPassK:b ? b.onPass.map(x => x.kind) : null, onFailLen:b ? b.onFail.length : null,
          mbHasLabel:mb ? ('label' in mb) : null };
      });
    });
    expect(errs).toEqual([]);
    expect(r.length).toBe(42);
    const gateShapes = { flags:0, empty:0 };
    const passShapes = { mission_bit:0, none:0 };
    for (const q of r) {
      expect(q.schema).toBe('UQF-1.0');
      expect(q.valid).toBe(true);
      expect(q.noAC).toBe(true);
      expect(['flags', 'empty']).toContain(q.gateShape);
      expect(q.hasStat).toBe(true);
      expect(q.hasDc).toBe(true);
      expect(q.onFailLen).toBe(0);
      if (q.onPassK.length) {
        expect(q.onPassK).toEqual(['mission_bit']);
        expect(q.mbHasLabel).toBe(false);
        passShapes.mission_bit++;
      } else {
        expect(q.onPassK).toEqual([]);
        passShapes.none++;
      }
      gateShapes[q.gateShape]++;
    }
    expect(gateShapes).toEqual({ flags:26, empty:16 });
    expect(passShapes).toEqual({ mission_bit:33, none:9 });
  });

  test('PASS/FAIL parity across all 42 + gate behavior; flag-bearing grant a token, flagless grant nothing', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const seed = (k, v) => ({ [k]: v, [k.toLowerCase()]: v });
      const vby = Object.values(QUEST_DB).filter(q => /^vby_/.test(q.id) && q.type === 'skill_check');
      let passBad = [], failBad = [], gateBad = [];
      for (const q of vby) {
        const b = q.bits.find(x => x.kind === 'skill_check');
        const mb = b.onPass.find(x => x.kind === 'mission_bit');
        const flag = mb ? mb.flag : null;
        // PASS
        S_story.abilityScores = seed(b.stat, 40);
        S_story.level = 20; S_story.xp = 0; S_story.gold = 0; S_story.inventory = [];
        if (flag) S_story[flag] = false;
        S_story.quests = { [q.id]:'active' };
        _rollCeremonia(q.id);
        if (flag) {
          const tok = S_story.inventory.find(i => i.flagRef === flag);
          if (!(S_story.quests[q.id] === 'done' && S_story[flag] === true && tok &&
                tok.name === _flagToLabel(flag) + ' Token' && tok.type === 'mission_bit' &&
                S_story.xp === 0 && S_story.gold === 0 && S_story.inventory.length === 1)) passBad.push(q.id);
        } else {
          if (!(S_story.quests[q.id] === 'done' && S_story.xp === 0 && S_story.gold === 0 &&
                S_story.inventory.length === 0)) passBad.push(q.id);
        }
        // FAIL
        S_story.abilityScores = seed(b.stat, -100);
        S_story.level = 1; S_story.day = 5; S_story.skillCheckAttempts = {};
        S_story.xp = 0; S_story.gold = 0; S_story.inventory = [];
        if (flag) S_story[flag] = false;
        S_story.quests = { [q.id]:'active' };
        _rollCeremonia(q.id);
        if (!(S_story.quests[q.id] === 'failed' && (!flag || S_story[flag] === false) && S_story.inventory.length === 0)) failBad.push(q.id);
        // GATE
        const g = q.gate || {};
        if (g.flags && g.flags.length) {
          const gf = g.flags[0];
          S_story[gf] = false; const c0 = QuestRuntime.canActivate(q.id);
          S_story[gf] = true;  const c1 = QuestRuntime.canActivate(q.id);
          if (!(c0 === false && c1 === true)) gateBad.push(q.id);
        } else if (QuestRuntime.canActivate(q.id) !== true) gateBad.push(q.id);
      }
      return { count:vby.length, passBad, failBad, gateBad };
    });
    expect(r.count).toBe(42);
    expect(r.passBad).toEqual([]);
    expect(r.failBad).toEqual([]);
    expect(r.gateBad).toEqual([]);
  });
});

// §ARCH-01 Wave 2n — kya_* family (52 skill_check acts; Trebizond/Constantinople
// 1367 arcs, dual id-convention `kya_cNaM` chapters + `kya_N_actN` arcs).
// UNIFORM-flag shape (NOT mixed): all 52 carry a checkPassFlag →
// onPass:[mission_bit{flag}] (0 flagless — simpler than the rix_/ost_/arn_/vby_
// twins). Mixed gates: 12 gate:{} + 40 trivial `()=>!!S_story.<priorFlag>` →
// gate:{flags:[…]}. UPPERCASE-checkStat (CHA/INT/WIS/DEX/STR): legacy raw-case
// read ⇒ silent +0 mod (§SKILLFIX-01); UQF lowercases ⇒ real mod. Golden seeded
// under BOTH cases; seed() below mirrors that. NO §SKILLFIX-02 (0 skill-name
// checkStats — despite the Constantinople setting it shares with the §SKILLFIX-02
// ist_ family, kya stores ability abbrevs). Transform type-gates out the 8
// non-skill_check members (2 hybrid kya_c1a2/c7a4 + 1 combat kya_c2a4 + 5
// deliveries kya_26/27/28/29/30_act5). Self-contained.
test.describe('§ARCH-01 Wave 2n — kya_* family (bulk-migrated, 52 acts; uniform flag-bearing)', () => {
  test('every kya_* skill_check is UQF-1.0, validates, onFail:[], NO residual activateCond; onPass = mission_bit', async ({ page }) => {
    const errs = []; page.on('pageerror', e => errs.push(String(e)));
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const kya = Object.values(QUEST_DB).filter(q => /^kya_/.test(q.id) && q.type === 'skill_check');
      return kya.map(q => {
        const b = (q.bits || []).find(x => x.kind === 'skill_check');
        const mb = b && b.onPass.find(x => x.kind === 'mission_bit');
        const gate = q.gate || {};
        return { id:q.id, schema:q.schema, valid:validateQuest(q).valid,
          noAC: typeof q.activateCond === 'undefined',
          gateShape: gate.flags ? 'flags' : (JSON.stringify(gate) === '{}' ? 'empty' : 'other'),
          hasStat:!!(b && b.stat), hasDc:typeof (b && b.dc) === 'number',
          onPassK:b ? b.onPass.map(x => x.kind) : null, onFailLen:b ? b.onFail.length : null,
          mbHasLabel:mb ? ('label' in mb) : null };
      });
    });
    expect(errs).toEqual([]);
    expect(r.length).toBe(52);
    const gateShapes = { flags:0, empty:0 };
    for (const q of r) {
      expect(q.schema).toBe('UQF-1.0');
      expect(q.valid).toBe(true);
      expect(q.noAC).toBe(true);
      expect(['flags', 'empty']).toContain(q.gateShape);
      expect(q.hasStat).toBe(true);
      expect(q.hasDc).toBe(true);
      expect(q.onFailLen).toBe(0);
      expect(q.onPassK).toEqual(['mission_bit']);
      expect(q.mbHasLabel).toBe(false);
      gateShapes[q.gateShape]++;
    }
    expect(gateShapes).toEqual({ flags:40, empty:12 });
  });

  test('PASS/FAIL parity across all 52 + gate behavior; every act grants a token on pass', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const seed = (k, v) => ({ [k]: v, [k.toLowerCase()]: v });
      const kya = Object.values(QUEST_DB).filter(q => /^kya_/.test(q.id) && q.type === 'skill_check');
      let passBad = [], failBad = [], gateBad = [];
      for (const q of kya) {
        const b = q.bits.find(x => x.kind === 'skill_check');
        const mb = b.onPass.find(x => x.kind === 'mission_bit');
        const flag = mb ? mb.flag : null;
        // PASS
        S_story.abilityScores = seed(b.stat, 40);
        S_story.level = 20; S_story.xp = 0; S_story.gold = 0; S_story.inventory = [];
        if (flag) S_story[flag] = false;
        S_story.quests = { [q.id]:'active' };
        _rollCeremonia(q.id);
        const tok = S_story.inventory.find(i => i.flagRef === flag);
        if (!(S_story.quests[q.id] === 'done' && S_story[flag] === true && tok &&
              tok.name === _flagToLabel(flag) + ' Token' && tok.type === 'mission_bit' &&
              S_story.xp === 0 && S_story.gold === 0 && S_story.inventory.length === 1)) passBad.push(q.id);
        // FAIL
        S_story.abilityScores = seed(b.stat, -100);
        S_story.level = 1; S_story.day = 5; S_story.skillCheckAttempts = {};
        S_story.xp = 0; S_story.gold = 0; S_story.inventory = [];
        if (flag) S_story[flag] = false;
        S_story.quests = { [q.id]:'active' };
        _rollCeremonia(q.id);
        if (!(S_story.quests[q.id] === 'failed' && S_story[flag] === false && S_story.inventory.length === 0)) failBad.push(q.id);
        // GATE
        const g = q.gate || {};
        if (g.flags && g.flags.length) {
          const gf = g.flags[0];
          S_story[gf] = false; const c0 = QuestRuntime.canActivate(q.id);
          S_story[gf] = true;  const c1 = QuestRuntime.canActivate(q.id);
          if (!(c0 === false && c1 === true)) gateBad.push(q.id);
        } else if (QuestRuntime.canActivate(q.id) !== true) gateBad.push(q.id);
      }
      return { count:kya.length, passBad, failBad, gateBad };
    });
    expect(r.count).toBe(52);
    expect(r.passBad).toEqual([]);
    expect(r.failBad).toEqual([]);
    expect(r.gateBad).toEqual([]);
  });
});

// §ARCH-01 Wave 2o — jrs_* family (51 skill_check acts; Jerusalem pilgrim/Crusade
// arcs, dual id-convention `jrsNN_actN` + `jrs_NN_actN`). UNIFORM-flag shape
// (like kya_/flr_): all 51 carry a checkPassFlag → onPass:[mission_bit{flag}]
// (0 flagless). Mixed gates: 39 gate:{} + 12 trivial `()=>!!S_story.<priorFlag>`
// → gate:{flags:[…]} (mostly-empty gate split — most arcs activate independently).
// UPPERCASE-checkStat (WIS/CHA/STR/INT/DEX): legacy raw-case read ⇒ silent +0 mod
// (§SKILLFIX-01); UQF lowercases ⇒ real mod. Golden seeded under BOTH cases;
// seed() below mirrors that. NO §SKILLFIX-02 (0 skill-name checkStats). Transform
// type-gates out the 4 non-skill_check members (deliveries jrs_08/09/10/11_act5).
// Self-contained.
test.describe('§ARCH-01 Wave 2o — jrs_* family (bulk-migrated, 51 acts; uniform flag-bearing)', () => {
  test('every jrs_* skill_check is UQF-1.0, validates, onFail:[], NO residual activateCond; onPass = mission_bit', async ({ page }) => {
    const errs = []; page.on('pageerror', e => errs.push(String(e)));
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const jrs = Object.values(QUEST_DB).filter(q => /^jrs/.test(q.id) && q.type === 'skill_check');
      return jrs.map(q => {
        const b = (q.bits || []).find(x => x.kind === 'skill_check');
        const mb = b && b.onPass.find(x => x.kind === 'mission_bit');
        const gate = q.gate || {};
        return { id:q.id, schema:q.schema, valid:validateQuest(q).valid,
          noAC: typeof q.activateCond === 'undefined',
          gateShape: gate.flags ? 'flags' : (JSON.stringify(gate) === '{}' ? 'empty' : 'other'),
          hasStat:!!(b && b.stat), hasDc:typeof (b && b.dc) === 'number',
          onPassK:b ? b.onPass.map(x => x.kind) : null, onFailLen:b ? b.onFail.length : null,
          mbHasLabel:mb ? ('label' in mb) : null };
      });
    });
    expect(errs).toEqual([]);
    expect(r.length).toBe(51);
    const gateShapes = { flags:0, empty:0 };
    for (const q of r) {
      expect(q.schema).toBe('UQF-1.0');
      expect(q.valid).toBe(true);
      expect(q.noAC).toBe(true);
      expect(['flags', 'empty']).toContain(q.gateShape);
      expect(q.hasStat).toBe(true);
      expect(q.hasDc).toBe(true);
      expect(q.onFailLen).toBe(0);
      expect(q.onPassK).toEqual(['mission_bit']);
      expect(q.mbHasLabel).toBe(false);
      gateShapes[q.gateShape]++;
    }
    expect(gateShapes).toEqual({ flags:12, empty:39 });
  });

  test('PASS/FAIL parity across all 51 + gate behavior; every act grants a token on pass', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const seed = (k, v) => ({ [k]: v, [k.toLowerCase()]: v });
      const jrs = Object.values(QUEST_DB).filter(q => /^jrs/.test(q.id) && q.type === 'skill_check');
      let passBad = [], failBad = [], gateBad = [];
      for (const q of jrs) {
        const b = q.bits.find(x => x.kind === 'skill_check');
        const mb = b.onPass.find(x => x.kind === 'mission_bit');
        const flag = mb ? mb.flag : null;
        // PASS
        S_story.abilityScores = seed(b.stat, 40);
        S_story.level = 20; S_story.xp = 0; S_story.gold = 0; S_story.inventory = [];
        if (flag) S_story[flag] = false;
        S_story.quests = { [q.id]:'active' };
        _rollCeremonia(q.id);
        const tok = S_story.inventory.find(i => i.flagRef === flag);
        if (!(S_story.quests[q.id] === 'done' && S_story[flag] === true && tok &&
              tok.name === _flagToLabel(flag) + ' Token' && tok.type === 'mission_bit' &&
              S_story.xp === 0 && S_story.gold === 0 && S_story.inventory.length === 1)) passBad.push(q.id);
        // FAIL
        S_story.abilityScores = seed(b.stat, -100);
        S_story.level = 1; S_story.day = 5; S_story.skillCheckAttempts = {};
        S_story.xp = 0; S_story.gold = 0; S_story.inventory = [];
        if (flag) S_story[flag] = false;
        S_story.quests = { [q.id]:'active' };
        _rollCeremonia(q.id);
        if (!(S_story.quests[q.id] === 'failed' && S_story[flag] === false && S_story.inventory.length === 0)) failBad.push(q.id);
        // GATE
        const g = q.gate || {};
        if (g.flags && g.flags.length) {
          const gf = g.flags[0];
          S_story[gf] = false; const c0 = QuestRuntime.canActivate(q.id);
          S_story[gf] = true;  const c1 = QuestRuntime.canActivate(q.id);
          if (!(c0 === false && c1 === true)) gateBad.push(q.id);
        } else if (QuestRuntime.canActivate(q.id) !== true) gateBad.push(q.id);
      }
      return { count:jrs.length, passBad, failBad, gateBad };
    });
    expect(r.count).toBe(51);
    expect(r.passBad).toEqual([]);
    expect(r.failBad).toEqual([]);
    expect(r.gateBad).toEqual([]);
  });
});

// §ARCH-01 Wave 2p — clj_* family (42 skill_check acts; no-underscore `cljNN_actN`
// convention — NB `--prefix clj`, not `clj_`). MIXED shape (twin of vby_/arn_):
// 33 acts carry a checkPassFlag → onPass:[mission_bit{flag}]; 9 acts have NO
// checkPassFlag → onPass:[] (legacy pass→done granted nothing; reproduced
// byte-for-byte). Gates: 9 gate:{} + 33 trivial `()=>!!S_story.<priorFlag>` →
// gate:{flags:[…]}. UPPERCASE-checkStat (WIS/CHA/INT): legacy raw-case read ⇒
// silent +0 mod (§SKILLFIX-01); UQF lowercases ⇒ real mod. Golden seeded under
// BOTH cases; seed() below mirrors that. NO §SKILLFIX-02 (0 skill-name
// checkStats). Transform type-gates out the 3 combat members
// (clj02/08/09_act4). Self-contained.
test.describe('§ARCH-01 Wave 2p — clj_* family (bulk-migrated, 42 acts; mixed flag/flagless)', () => {
  test('every clj_* skill_check is UQF-1.0, validates, onFail:[], NO residual activateCond; onPass = mission_bit OR empty', async ({ page }) => {
    const errs = []; page.on('pageerror', e => errs.push(String(e)));
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const clj = Object.values(QUEST_DB).filter(q => /^clj/.test(q.id) && q.type === 'skill_check');
      return clj.map(q => {
        const b = (q.bits || []).find(x => x.kind === 'skill_check');
        const mb = b && b.onPass.find(x => x.kind === 'mission_bit');
        const gate = q.gate || {};
        return { id:q.id, schema:q.schema, valid:validateQuest(q).valid,
          noAC: typeof q.activateCond === 'undefined',
          gateShape: gate.flags ? 'flags' : (JSON.stringify(gate) === '{}' ? 'empty' : 'other'),
          hasStat:!!(b && b.stat), hasDc:typeof (b && b.dc) === 'number',
          onPassK:b ? b.onPass.map(x => x.kind) : null, onFailLen:b ? b.onFail.length : null,
          mbHasLabel:mb ? ('label' in mb) : null };
      });
    });
    expect(errs).toEqual([]);
    expect(r.length).toBe(42);
    const gateShapes = { flags:0, empty:0 };
    const passShapes = { mission_bit:0, none:0 };
    for (const q of r) {
      expect(q.schema).toBe('UQF-1.0');
      expect(q.valid).toBe(true);
      expect(q.noAC).toBe(true);
      expect(['flags', 'empty']).toContain(q.gateShape);
      expect(q.hasStat).toBe(true);
      expect(q.hasDc).toBe(true);
      expect(q.onFailLen).toBe(0);
      if (q.onPassK.length) {
        expect(q.onPassK).toEqual(['mission_bit']);
        expect(q.mbHasLabel).toBe(false);
        passShapes.mission_bit++;
      } else {
        expect(q.onPassK).toEqual([]);
        passShapes.none++;
      }
      gateShapes[q.gateShape]++;
    }
    expect(gateShapes).toEqual({ flags:33, empty:9 });
    expect(passShapes).toEqual({ mission_bit:33, none:9 });
  });

  test('PASS/FAIL parity across all 42 + gate behavior; flag-bearing grant a token, flagless grant nothing', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const seed = (k, v) => ({ [k]: v, [k.toLowerCase()]: v });
      const clj = Object.values(QUEST_DB).filter(q => /^clj/.test(q.id) && q.type === 'skill_check');
      let passBad = [], failBad = [], gateBad = [];
      for (const q of clj) {
        const b = q.bits.find(x => x.kind === 'skill_check');
        const mb = b.onPass.find(x => x.kind === 'mission_bit');
        const flag = mb ? mb.flag : null;
        // PASS
        S_story.abilityScores = seed(b.stat, 40);
        S_story.level = 20; S_story.xp = 0; S_story.gold = 0; S_story.inventory = [];
        if (flag) S_story[flag] = false;
        S_story.quests = { [q.id]:'active' };
        _rollCeremonia(q.id);
        if (flag) {
          const tok = S_story.inventory.find(i => i.flagRef === flag);
          if (!(S_story.quests[q.id] === 'done' && S_story[flag] === true && tok &&
                tok.name === _flagToLabel(flag) + ' Token' && tok.type === 'mission_bit' &&
                S_story.xp === 0 && S_story.gold === 0 && S_story.inventory.length === 1)) passBad.push(q.id);
        } else {
          if (!(S_story.quests[q.id] === 'done' && S_story.xp === 0 && S_story.gold === 0 &&
                S_story.inventory.length === 0)) passBad.push(q.id);
        }
        // FAIL
        S_story.abilityScores = seed(b.stat, -100);
        S_story.level = 1; S_story.day = 5; S_story.skillCheckAttempts = {};
        S_story.xp = 0; S_story.gold = 0; S_story.inventory = [];
        if (flag) S_story[flag] = false;
        S_story.quests = { [q.id]:'active' };
        _rollCeremonia(q.id);
        if (!(S_story.quests[q.id] === 'failed' && (!flag || S_story[flag] === false) && S_story.inventory.length === 0)) failBad.push(q.id);
        // GATE
        const g = q.gate || {};
        if (g.flags && g.flags.length) {
          const gf = g.flags[0];
          S_story[gf] = false; const c0 = QuestRuntime.canActivate(q.id);
          S_story[gf] = true;  const c1 = QuestRuntime.canActivate(q.id);
          if (!(c0 === false && c1 === true)) gateBad.push(q.id);
        } else if (QuestRuntime.canActivate(q.id) !== true) gateBad.push(q.id);
      }
      return { count:clj.length, passBad, failBad, gateBad };
    });
    expect(r.count).toBe(42);
    expect(r.passBad).toEqual([]);
    expect(r.failBad).toEqual([]);
    expect(r.gateBad).toEqual([]);
  });
});

// §ARCH-01 Wave 2q — nwi_* family (42 skill_check acts; no-underscore
// `nwiNN_actN` convention — NB `--prefix nwi`, not `nwi_`; irregular numbering:
// 3-digit `nwi001`/`nwi002` arcs + 2-digit `nwi02`–`nwi08`). UNIFORM-flag (like
// kya_/jrs_): all 42 carry a checkPassFlag → onPass:[mission_bit{flag}]
// (0 flagless). Gates near-fully-chained: 1 gate:{} + 41 trivial
// `()=>!!S_story.<priorFlag>` → gate:{flags:[…]}. UPPERCASE-checkStat
// (CHA/WIS/INT): legacy raw-case read ⇒ silent +0 mod (§SKILLFIX-01); UQF
// lowercases ⇒ real mod. Golden seeded under BOTH cases; seed() below mirrors
// that. NO §SKILLFIX-02 (0 skill-name checkStats). Transform type-gates out the
// 3 combat members (nwi002/04/07_act4). Self-contained.
test.describe('§ARCH-01 Wave 2q — nwi_* family (bulk-migrated, 42 acts; uniform flag-bearing)', () => {
  test('every nwi_* skill_check is UQF-1.0, validates, onFail:[], NO residual activateCond; onPass = mission_bit', async ({ page }) => {
    const errs = []; page.on('pageerror', e => errs.push(String(e)));
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const nwi = Object.values(QUEST_DB).filter(q => /^nwi/.test(q.id) && q.type === 'skill_check');
      return nwi.map(q => {
        const b = (q.bits || []).find(x => x.kind === 'skill_check');
        const mb = b && b.onPass.find(x => x.kind === 'mission_bit');
        const gate = q.gate || {};
        return { id:q.id, schema:q.schema, valid:validateQuest(q).valid,
          noAC: typeof q.activateCond === 'undefined',
          gateShape: gate.flags ? 'flags' : (JSON.stringify(gate) === '{}' ? 'empty' : 'other'),
          hasStat:!!(b && b.stat), hasDc:typeof (b && b.dc) === 'number',
          onPassK:b ? b.onPass.map(x => x.kind) : null, onFailLen:b ? b.onFail.length : null,
          mbHasLabel:mb ? ('label' in mb) : null };
      });
    });
    expect(errs).toEqual([]);
    expect(r.length).toBe(42);
    const gateShapes = { flags:0, empty:0 };
    for (const q of r) {
      expect(q.schema).toBe('UQF-1.0');
      expect(q.valid).toBe(true);
      expect(q.noAC).toBe(true);
      expect(['flags', 'empty']).toContain(q.gateShape);
      expect(q.hasStat).toBe(true);
      expect(q.hasDc).toBe(true);
      expect(q.onFailLen).toBe(0);
      expect(q.onPassK).toEqual(['mission_bit']);
      expect(q.mbHasLabel).toBe(false);
      gateShapes[q.gateShape]++;
    }
    expect(gateShapes).toEqual({ flags:41, empty:1 });
  });

  test('PASS/FAIL parity across all 42 + gate behavior; every act grants a token on pass', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const seed = (k, v) => ({ [k]: v, [k.toLowerCase()]: v });
      const nwi = Object.values(QUEST_DB).filter(q => /^nwi/.test(q.id) && q.type === 'skill_check');
      let passBad = [], failBad = [], gateBad = [];
      for (const q of nwi) {
        const b = q.bits.find(x => x.kind === 'skill_check');
        const mb = b.onPass.find(x => x.kind === 'mission_bit');
        const flag = mb ? mb.flag : null;
        // PASS
        S_story.abilityScores = seed(b.stat, 40);
        S_story.level = 20; S_story.xp = 0; S_story.gold = 0; S_story.inventory = [];
        if (flag) S_story[flag] = false;
        S_story.quests = { [q.id]:'active' };
        _rollCeremonia(q.id);
        const tok = S_story.inventory.find(i => i.flagRef === flag);
        if (!(S_story.quests[q.id] === 'done' && S_story[flag] === true && tok &&
              tok.name === _flagToLabel(flag) + ' Token' && tok.type === 'mission_bit' &&
              S_story.xp === 0 && S_story.gold === 0 && S_story.inventory.length === 1)) passBad.push(q.id);
        // FAIL
        S_story.abilityScores = seed(b.stat, -100);
        S_story.level = 1; S_story.day = 5; S_story.skillCheckAttempts = {};
        S_story.xp = 0; S_story.gold = 0; S_story.inventory = [];
        if (flag) S_story[flag] = false;
        S_story.quests = { [q.id]:'active' };
        _rollCeremonia(q.id);
        if (!(S_story.quests[q.id] === 'failed' && S_story[flag] === false && S_story.inventory.length === 0)) failBad.push(q.id);
        // GATE
        const g = q.gate || {};
        if (g.flags && g.flags.length) {
          const gf = g.flags[0];
          S_story[gf] = false; const c0 = QuestRuntime.canActivate(q.id);
          S_story[gf] = true;  const c1 = QuestRuntime.canActivate(q.id);
          if (!(c0 === false && c1 === true)) gateBad.push(q.id);
        } else if (QuestRuntime.canActivate(q.id) !== true) gateBad.push(q.id);
      }
      return { count:nwi.length, passBad, failBad, gateBad };
    });
    expect(r.count).toBe(42);
    expect(r.passBad).toEqual([]);
    expect(r.failBad).toEqual([]);
    expect(r.gateBad).toEqual([]);
  });
});

// §ARCH-01 Wave 2r — bey_* family (42 skill_check acts; dual id-convention
// `bey_cNaM` chapters + `bey_N_actN` arcs). UNIFORM-flag (like kya_/jrs_/nwi_):
// all 42 carry a checkPassFlag → onPass:[mission_bit{flag}] (0 flagless).
// Gates: 10 gate:{} + 32 trivial `()=>!!S_story.<priorFlag>` → gate:{flags:[…]}.
// UPPERCASE-checkStat (WIS/CHA/INT/STR): legacy raw-case read ⇒ silent +0 mod
// (§SKILLFIX-01); UQF lowercases ⇒ real mod. Golden seeded under BOTH cases;
// seed() below mirrors that. NO §SKILLFIX-02 (0 skill-name checkStats). Transform
// type-gates out the 8 non-skill_check members (3 hybrid bey_c1a3/c4a2/c5a2 +
// 2 combat bey_c3a4/c6a4 + 3 deliveries bey_14/15/16_act5). Self-contained.
test.describe('§ARCH-01 Wave 2r — bey_* family (bulk-migrated, 42 acts; uniform flag-bearing)', () => {
  test('every bey_* skill_check is UQF-1.0, validates, onFail:[], NO residual activateCond; onPass = mission_bit', async ({ page }) => {
    const errs = []; page.on('pageerror', e => errs.push(String(e)));
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const bey = Object.values(QUEST_DB).filter(q => /^bey_/.test(q.id) && q.type === 'skill_check');
      return bey.map(q => {
        const b = (q.bits || []).find(x => x.kind === 'skill_check');
        const mb = b && b.onPass.find(x => x.kind === 'mission_bit');
        const gate = q.gate || {};
        return { id:q.id, schema:q.schema, valid:validateQuest(q).valid,
          noAC: typeof q.activateCond === 'undefined',
          gateShape: gate.flags ? 'flags' : (JSON.stringify(gate) === '{}' ? 'empty' : 'other'),
          hasStat:!!(b && b.stat), hasDc:typeof (b && b.dc) === 'number',
          onPassK:b ? b.onPass.map(x => x.kind) : null, onFailLen:b ? b.onFail.length : null,
          mbHasLabel:mb ? ('label' in mb) : null };
      });
    });
    expect(errs).toEqual([]);
    expect(r.length).toBe(42);
    const gateShapes = { flags:0, empty:0 };
    for (const q of r) {
      expect(q.schema).toBe('UQF-1.0');
      expect(q.valid).toBe(true);
      expect(q.noAC).toBe(true);
      expect(['flags', 'empty']).toContain(q.gateShape);
      expect(q.hasStat).toBe(true);
      expect(q.hasDc).toBe(true);
      expect(q.onFailLen).toBe(0);
      expect(q.onPassK).toEqual(['mission_bit']);
      expect(q.mbHasLabel).toBe(false);
      gateShapes[q.gateShape]++;
    }
    expect(gateShapes).toEqual({ flags:32, empty:10 });
  });

  test('PASS/FAIL parity across all 42 + gate behavior; every act grants a token on pass', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const seed = (k, v) => ({ [k]: v, [k.toLowerCase()]: v });
      const bey = Object.values(QUEST_DB).filter(q => /^bey_/.test(q.id) && q.type === 'skill_check');
      let passBad = [], failBad = [], gateBad = [];
      for (const q of bey) {
        const b = q.bits.find(x => x.kind === 'skill_check');
        const mb = b.onPass.find(x => x.kind === 'mission_bit');
        const flag = mb ? mb.flag : null;
        // PASS
        S_story.abilityScores = seed(b.stat, 40);
        S_story.level = 20; S_story.xp = 0; S_story.gold = 0; S_story.inventory = [];
        if (flag) S_story[flag] = false;
        S_story.quests = { [q.id]:'active' };
        _rollCeremonia(q.id);
        const tok = S_story.inventory.find(i => i.flagRef === flag);
        if (!(S_story.quests[q.id] === 'done' && S_story[flag] === true && tok &&
              tok.name === _flagToLabel(flag) + ' Token' && tok.type === 'mission_bit' &&
              S_story.xp === 0 && S_story.gold === 0 && S_story.inventory.length === 1)) passBad.push(q.id);
        // FAIL
        S_story.abilityScores = seed(b.stat, -100);
        S_story.level = 1; S_story.day = 5; S_story.skillCheckAttempts = {};
        S_story.xp = 0; S_story.gold = 0; S_story.inventory = [];
        if (flag) S_story[flag] = false;
        S_story.quests = { [q.id]:'active' };
        _rollCeremonia(q.id);
        if (!(S_story.quests[q.id] === 'failed' && S_story[flag] === false && S_story.inventory.length === 0)) failBad.push(q.id);
        // GATE
        const g = q.gate || {};
        if (g.flags && g.flags.length) {
          const gf = g.flags[0];
          S_story[gf] = false; const c0 = QuestRuntime.canActivate(q.id);
          S_story[gf] = true;  const c1 = QuestRuntime.canActivate(q.id);
          if (!(c0 === false && c1 === true)) gateBad.push(q.id);
        } else if (QuestRuntime.canActivate(q.id) !== true) gateBad.push(q.id);
      }
      return { count:bey.length, passBad, failBad, gateBad };
    });
    expect(r.count).toBe(42);
    expect(r.passBad).toEqual([]);
    expect(r.failBad).toEqual([]);
    expect(r.gateBad).toEqual([]);
  });
});

// §ARCH-01 Wave 2s — tbs_* family (41 skill_check acts — Rustaveli's "The Knight
// in the Panther's Skin", a 9-chapter × ~5-act grid, dual id-convention
// `tbs_cNaM`). UNIFORM-flag (like kya_/jrs_/nwi_/bey_): all 41 carry a
// checkPassFlag → onPass:[mission_bit{flag}] (0 flagless). Gates: 9 gate:{} + 32
// trivial `()=>!!S_story.<priorFlag>` → gate:{flags:[…]}. UPPERCASE-checkStat
// (WIS/CON/CHA/INT/DEX): legacy raw-case read ⇒ silent +0 mod (§SKILLFIX-01);
// UQF lowercases ⇒ real mod. Golden seeded under BOTH cases; seed() below
// mirrors that. NO §SKILLFIX-02 (0 skill-name checkStats). Transform type-gates
// out the 4 combat members (tbs_c1a3/c2a4/c8a4/c9a4) — 2 of which set the
// `tbsC1A3Done`/`tbsC2A4Done` flags that the migrated tbs_c1a4/tbs_c2a5 gate on;
// the gate test toggles the prior flag directly, so cross-sibling gates verify
// transparently. Self-contained.
test.describe('§ARCH-01 Wave 2s — tbs_* family (bulk-migrated, 41 acts; uniform flag-bearing)', () => {
  test('every tbs_* skill_check is UQF-1.0, validates, onFail:[], NO residual activateCond; onPass = mission_bit', async ({ page }) => {
    const errs = []; page.on('pageerror', e => errs.push(String(e)));
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const tbs = Object.values(QUEST_DB).filter(q => /^tbs_/.test(q.id) && q.type === 'skill_check');
      return tbs.map(q => {
        const b = (q.bits || []).find(x => x.kind === 'skill_check');
        const mb = b && b.onPass.find(x => x.kind === 'mission_bit');
        const gate = q.gate || {};
        return { id:q.id, schema:q.schema, valid:validateQuest(q).valid,
          noAC: typeof q.activateCond === 'undefined',
          gateShape: gate.flags ? 'flags' : (JSON.stringify(gate) === '{}' ? 'empty' : 'other'),
          hasStat:!!(b && b.stat), hasDc:typeof (b && b.dc) === 'number',
          onPassK:b ? b.onPass.map(x => x.kind) : null, onFailLen:b ? b.onFail.length : null,
          mbHasLabel:mb ? ('label' in mb) : null };
      });
    });
    expect(errs).toEqual([]);
    expect(r.length).toBe(41);
    const gateShapes = { flags:0, empty:0 };
    for (const q of r) {
      expect(q.schema).toBe('UQF-1.0');
      expect(q.valid).toBe(true);
      expect(q.noAC).toBe(true);
      expect(['flags', 'empty']).toContain(q.gateShape);
      expect(q.hasStat).toBe(true);
      expect(q.hasDc).toBe(true);
      expect(q.onFailLen).toBe(0);
      expect(q.onPassK).toEqual(['mission_bit']);
      expect(q.mbHasLabel).toBe(false);
      gateShapes[q.gateShape]++;
    }
    expect(gateShapes).toEqual({ flags:32, empty:9 });
  });

  test('PASS/FAIL parity across all 41 + gate behavior; every act grants a token on pass', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const seed = (k, v) => ({ [k]: v, [k.toLowerCase()]: v });
      const tbs = Object.values(QUEST_DB).filter(q => /^tbs_/.test(q.id) && q.type === 'skill_check');
      let passBad = [], failBad = [], gateBad = [];
      for (const q of tbs) {
        const b = q.bits.find(x => x.kind === 'skill_check');
        const mb = b.onPass.find(x => x.kind === 'mission_bit');
        const flag = mb ? mb.flag : null;
        // PASS
        S_story.abilityScores = seed(b.stat, 40);
        S_story.level = 20; S_story.xp = 0; S_story.gold = 0; S_story.inventory = [];
        if (flag) S_story[flag] = false;
        S_story.quests = { [q.id]:'active' };
        _rollCeremonia(q.id);
        const tok = S_story.inventory.find(i => i.flagRef === flag);
        if (!(S_story.quests[q.id] === 'done' && S_story[flag] === true && tok &&
              tok.name === _flagToLabel(flag) + ' Token' && tok.type === 'mission_bit' &&
              S_story.xp === 0 && S_story.gold === 0 && S_story.inventory.length === 1)) passBad.push(q.id);
        // FAIL
        S_story.abilityScores = seed(b.stat, -100);
        S_story.level = 1; S_story.day = 5; S_story.skillCheckAttempts = {};
        S_story.xp = 0; S_story.gold = 0; S_story.inventory = [];
        if (flag) S_story[flag] = false;
        S_story.quests = { [q.id]:'active' };
        _rollCeremonia(q.id);
        if (!(S_story.quests[q.id] === 'failed' && S_story[flag] === false && S_story.inventory.length === 0)) failBad.push(q.id);
        // GATE
        const g = q.gate || {};
        if (g.flags && g.flags.length) {
          const gf = g.flags[0];
          S_story[gf] = false; const c0 = QuestRuntime.canActivate(q.id);
          S_story[gf] = true;  const c1 = QuestRuntime.canActivate(q.id);
          if (!(c0 === false && c1 === true)) gateBad.push(q.id);
        } else if (QuestRuntime.canActivate(q.id) !== true) gateBad.push(q.id);
      }
      return { count:tbs.length, passBad, failBad, gateBad };
    });
    expect(r.count).toBe(41);
    expect(r.passBad).toEqual([]);
    expect(r.failBad).toEqual([]);
    expect(r.gateBad).toEqual([]);
  });
});

// §ARCH-01 Wave 2t — crl_* family (40 skill_check acts — 8 arcs × 5 acts,
// `crlNNN_actN` convention). UNIFORM-flag (like nwi_/bey_): all 40 carry a
// checkPassFlag → onPass:[mission_bit{flag}] (0 flagless). Gates near-fully-
// chained: 1 gate:{} + 39 trivial `()=>!!S_story.<priorFlag>` → gate:{flags:[…]}.
// UPPERCASE-checkStat (WIS/CHA/STR/INT): legacy raw-case read ⇒ silent +0 mod
// (§SKILLFIX-01); UQF lowercases ⇒ real mod. Golden seeded under BOTH cases;
// seed() below mirrors that. NO §SKILLFIX-02 (0 skill-name checkStats). Clean
// 8×5 grid — no type-gated siblings (the `crlNNNaN` strings are missionBit
// values, not quests). 7 inter-arc act1 gates reference external
// `crlNNNComplete` arc-completion flags (set outside the skill_check set); the
// gate test toggles the prior flag directly, so they verify transparently.
// Self-contained.
test.describe('§ARCH-01 Wave 2t — crl_* family (bulk-migrated, 40 acts; uniform flag-bearing)', () => {
  test('every crl_* skill_check is UQF-1.0, validates, onFail:[], NO residual activateCond; onPass = mission_bit', async ({ page }) => {
    const errs = []; page.on('pageerror', e => errs.push(String(e)));
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const crl = Object.values(QUEST_DB).filter(q => /^crl/.test(q.id) && q.type === 'skill_check');
      return crl.map(q => {
        const b = (q.bits || []).find(x => x.kind === 'skill_check');
        const mb = b && b.onPass.find(x => x.kind === 'mission_bit');
        const gate = q.gate || {};
        return { id:q.id, schema:q.schema, valid:validateQuest(q).valid,
          noAC: typeof q.activateCond === 'undefined',
          gateShape: gate.flags ? 'flags' : (JSON.stringify(gate) === '{}' ? 'empty' : 'other'),
          hasStat:!!(b && b.stat), hasDc:typeof (b && b.dc) === 'number',
          onPassK:b ? b.onPass.map(x => x.kind) : null, onFailLen:b ? b.onFail.length : null,
          mbHasLabel:mb ? ('label' in mb) : null };
      });
    });
    expect(errs).toEqual([]);
    expect(r.length).toBe(40);
    const gateShapes = { flags:0, empty:0 };
    for (const q of r) {
      expect(q.schema).toBe('UQF-1.0');
      expect(q.valid).toBe(true);
      expect(q.noAC).toBe(true);
      expect(['flags', 'empty']).toContain(q.gateShape);
      expect(q.hasStat).toBe(true);
      expect(q.hasDc).toBe(true);
      expect(q.onFailLen).toBe(0);
      expect(q.onPassK).toEqual(['mission_bit']);
      expect(q.mbHasLabel).toBe(false);
      gateShapes[q.gateShape]++;
    }
    expect(gateShapes).toEqual({ flags:39, empty:1 });
  });

  test('PASS/FAIL parity across all 40 + gate behavior; every act grants a token on pass', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const seed = (k, v) => ({ [k]: v, [k.toLowerCase()]: v });
      const crl = Object.values(QUEST_DB).filter(q => /^crl/.test(q.id) && q.type === 'skill_check');
      let passBad = [], failBad = [], gateBad = [];
      for (const q of crl) {
        const b = q.bits.find(x => x.kind === 'skill_check');
        const mb = b.onPass.find(x => x.kind === 'mission_bit');
        const flag = mb ? mb.flag : null;
        // PASS
        S_story.abilityScores = seed(b.stat, 40);
        S_story.level = 20; S_story.xp = 0; S_story.gold = 0; S_story.inventory = [];
        if (flag) S_story[flag] = false;
        S_story.quests = { [q.id]:'active' };
        _rollCeremonia(q.id);
        const tok = S_story.inventory.find(i => i.flagRef === flag);
        if (!(S_story.quests[q.id] === 'done' && S_story[flag] === true && tok &&
              tok.name === _flagToLabel(flag) + ' Token' && tok.type === 'mission_bit' &&
              S_story.xp === 0 && S_story.gold === 0 && S_story.inventory.length === 1)) passBad.push(q.id);
        // FAIL
        S_story.abilityScores = seed(b.stat, -100);
        S_story.level = 1; S_story.day = 5; S_story.skillCheckAttempts = {};
        S_story.xp = 0; S_story.gold = 0; S_story.inventory = [];
        if (flag) S_story[flag] = false;
        S_story.quests = { [q.id]:'active' };
        _rollCeremonia(q.id);
        if (!(S_story.quests[q.id] === 'failed' && S_story[flag] === false && S_story.inventory.length === 0)) failBad.push(q.id);
        // GATE
        const g = q.gate || {};
        if (g.flags && g.flags.length) {
          const gf = g.flags[0];
          S_story[gf] = false; const c0 = QuestRuntime.canActivate(q.id);
          S_story[gf] = true;  const c1 = QuestRuntime.canActivate(q.id);
          if (!(c0 === false && c1 === true)) gateBad.push(q.id);
        } else if (QuestRuntime.canActivate(q.id) !== true) gateBad.push(q.id);
      }
      return { count:crl.length, passBad, failBad, gateBad };
    });
    expect(r.count).toBe(40);
    expect(r.passBad).toEqual([]);
    expect(r.failBad).toEqual([]);
    expect(r.gateBad).toEqual([]);
  });
});

// §ARCH-01 Wave 2u — shk_* family (40 skill_check acts — dual id-convention
// `shkNN_actN` arcs (shk6–shk14 × 3 acts) + `shk_NN_actN` arcs (shk_04–shk_07)).
// MIXED flag/flagless (twin of clj_/hft_/rkv_): 27 acts carry a checkPassFlag →
// onPass:[mission_bit{flag}]; 13 acts have NO checkPassFlag → onPass:[] (legacy
// pass→done granted nothing — reproduced byte-for-byte). Gates: 22 gate:{} + 18
// trivial `()=>!!S_story.<priorFlag>` → gate:{flags:[…]}. UPPERCASE-checkStat
// (CHA/INT/WIS/DEX/CON): legacy raw-case read ⇒ silent +0 mod (§SKILLFIX-01); UQF
// lowercases ⇒ real mod. Golden seeded under BOTH cases; seed() below mirrors
// that. NO §SKILLFIX-02 (0 skill-name checkStats). The transform type-gates out
// the 7 non-skill_check members (3 combat shk_04_act3/shk_06_act3/shk_07_act4 +
// 4 deliveries shk_04_act5/shk_05_act5/shk_06_act5/shk_07_act5). Self-contained.
test.describe('§ARCH-01 Wave 2u — shk_* family (bulk-migrated, 40 acts; mixed flag/flagless)', () => {
  test('every shk_* skill_check is UQF-1.0, validates, onFail:[], NO residual activateCond; onPass = mission_bit OR empty', async ({ page }) => {
    const errs = []; page.on('pageerror', e => errs.push(String(e)));
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const shk = Object.values(QUEST_DB).filter(q => /^shk/.test(q.id) && q.type === 'skill_check');
      return shk.map(q => {
        const b = (q.bits || []).find(x => x.kind === 'skill_check');
        const mb = b && b.onPass.find(x => x.kind === 'mission_bit');
        const gate = q.gate || {};
        return { id:q.id, schema:q.schema, valid:validateQuest(q).valid,
          noAC: typeof q.activateCond === 'undefined',
          gateShape: gate.flags ? 'flags' : (JSON.stringify(gate) === '{}' ? 'empty' : 'other'),
          hasStat:!!(b && b.stat), hasDc:typeof (b && b.dc) === 'number',
          onPassK:b ? b.onPass.map(x => x.kind) : null, onFailLen:b ? b.onFail.length : null,
          mbHasLabel:mb ? ('label' in mb) : null };
      });
    });
    expect(errs).toEqual([]);
    expect(r.length).toBe(40);
    const gateShapes = { flags:0, empty:0 };
    const passShapes = { mission_bit:0, none:0 };
    for (const q of r) {
      expect(q.schema).toBe('UQF-1.0');
      expect(q.valid).toBe(true);
      expect(q.noAC).toBe(true);
      expect(['flags', 'empty']).toContain(q.gateShape);
      expect(q.hasStat).toBe(true);
      expect(q.hasDc).toBe(true);
      expect(q.onFailLen).toBe(0);
      if (q.onPassK.length) {
        expect(q.onPassK).toEqual(['mission_bit']);
        expect(q.mbHasLabel).toBe(false);
        passShapes.mission_bit++;
      } else {
        expect(q.onPassK).toEqual([]);
        passShapes.none++;
      }
      gateShapes[q.gateShape]++;
    }
    expect(gateShapes).toEqual({ flags:18, empty:22 });
    expect(passShapes).toEqual({ mission_bit:27, none:13 });
  });

  test('PASS/FAIL parity across all 40 + gate behavior; flag-bearing grant a token, flagless grant nothing', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const seed = (k, v) => ({ [k]: v, [k.toLowerCase()]: v });
      const shk = Object.values(QUEST_DB).filter(q => /^shk/.test(q.id) && q.type === 'skill_check');
      let passBad = [], failBad = [], gateBad = [];
      for (const q of shk) {
        const b = q.bits.find(x => x.kind === 'skill_check');
        const mb = b.onPass.find(x => x.kind === 'mission_bit');
        const flag = mb ? mb.flag : null;
        // PASS
        S_story.abilityScores = seed(b.stat, 40);
        S_story.level = 20; S_story.xp = 0; S_story.gold = 0; S_story.inventory = [];
        if (flag) S_story[flag] = false;
        S_story.quests = { [q.id]:'active' };
        _rollCeremonia(q.id);
        if (flag) {
          const tok = S_story.inventory.find(i => i.flagRef === flag);
          if (!(S_story.quests[q.id] === 'done' && S_story[flag] === true && tok &&
                tok.name === _flagToLabel(flag) + ' Token' && tok.type === 'mission_bit' &&
                S_story.xp === 0 && S_story.gold === 0 && S_story.inventory.length === 1)) passBad.push(q.id);
        } else {
          if (!(S_story.quests[q.id] === 'done' && S_story.xp === 0 && S_story.gold === 0 &&
                S_story.inventory.length === 0)) passBad.push(q.id);
        }
        // FAIL
        S_story.abilityScores = seed(b.stat, -100);
        S_story.level = 1; S_story.day = 5; S_story.skillCheckAttempts = {};
        S_story.xp = 0; S_story.gold = 0; S_story.inventory = [];
        if (flag) S_story[flag] = false;
        S_story.quests = { [q.id]:'active' };
        _rollCeremonia(q.id);
        if (!(S_story.quests[q.id] === 'failed' && (!flag || S_story[flag] === false) && S_story.inventory.length === 0)) failBad.push(q.id);
        // GATE
        const g = q.gate || {};
        if (g.flags && g.flags.length) {
          const gf = g.flags[0];
          S_story[gf] = false; const c0 = QuestRuntime.canActivate(q.id);
          S_story[gf] = true;  const c1 = QuestRuntime.canActivate(q.id);
          if (!(c0 === false && c1 === true)) gateBad.push(q.id);
        } else if (QuestRuntime.canActivate(q.id) !== true) gateBad.push(q.id);
      }
      return { count:shk.length, passBad, failBad, gateBad };
    });
    expect(r.count).toBe(40);
    expect(r.passBad).toEqual([]);
    expect(r.failBad).toEqual([]);
    expect(r.gateBad).toEqual([]);
  });
});

// §ARCH-01 Wave 2v — kir_* family (35 skill_check acts — 7 chapters × 5 acts,
// single `kir_cNaM` convention). UNIFORM-flag (like nwi_/bey_/crl_): all 35 carry
// a checkPassFlag → onPass:[mission_bit{flag}] (0 flagless). Gates: 7 gate:{} + 28
// trivial `()=>!!S_story.<priorFlag>` → gate:{flags:[…]}. UPPERCASE-checkStat (all
// six: WIS/CON/CHA/INT/STR/DEX): legacy raw-case read ⇒ silent +0 mod
// (§SKILLFIX-01); UQF lowercases ⇒ real mod. Golden seeded under BOTH cases;
// seed() below mirrors that. NO §SKILLFIX-02 (0 skill-name checkStats). Perfectly
// clean 7×5 grid — no type-gated siblings, no prefix bleed (all 35 file ids are
// the migrated acts). Self-contained.
test.describe('§ARCH-01 Wave 2v — kir_* family (bulk-migrated, 35 acts; uniform flag-bearing)', () => {
  test('every kir_* skill_check is UQF-1.0, validates, onFail:[], NO residual activateCond; onPass = mission_bit', async ({ page }) => {
    const errs = []; page.on('pageerror', e => errs.push(String(e)));
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const kir = Object.values(QUEST_DB).filter(q => /^kir/.test(q.id) && q.type === 'skill_check');
      return kir.map(q => {
        const b = (q.bits || []).find(x => x.kind === 'skill_check');
        const mb = b && b.onPass.find(x => x.kind === 'mission_bit');
        const gate = q.gate || {};
        return { id:q.id, schema:q.schema, valid:validateQuest(q).valid,
          noAC: typeof q.activateCond === 'undefined',
          gateShape: gate.flags ? 'flags' : (JSON.stringify(gate) === '{}' ? 'empty' : 'other'),
          hasStat:!!(b && b.stat), hasDc:typeof (b && b.dc) === 'number',
          onPassK:b ? b.onPass.map(x => x.kind) : null, onFailLen:b ? b.onFail.length : null,
          mbHasLabel:mb ? ('label' in mb) : null };
      });
    });
    expect(errs).toEqual([]);
    expect(r.length).toBe(35);
    const gateShapes = { flags:0, empty:0 };
    for (const q of r) {
      expect(q.schema).toBe('UQF-1.0');
      expect(q.valid).toBe(true);
      expect(q.noAC).toBe(true);
      expect(['flags', 'empty']).toContain(q.gateShape);
      expect(q.hasStat).toBe(true);
      expect(q.hasDc).toBe(true);
      expect(q.onFailLen).toBe(0);
      expect(q.onPassK).toEqual(['mission_bit']);
      expect(q.mbHasLabel).toBe(false);
      gateShapes[q.gateShape]++;
    }
    expect(gateShapes).toEqual({ flags:28, empty:7 });
  });

  test('PASS/FAIL parity across all 35 + gate behavior; every act grants a token on pass', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const seed = (k, v) => ({ [k]: v, [k.toLowerCase()]: v });
      const kir = Object.values(QUEST_DB).filter(q => /^kir/.test(q.id) && q.type === 'skill_check');
      let passBad = [], failBad = [], gateBad = [];
      for (const q of kir) {
        const b = q.bits.find(x => x.kind === 'skill_check');
        const mb = b.onPass.find(x => x.kind === 'mission_bit');
        const flag = mb ? mb.flag : null;
        // PASS
        S_story.abilityScores = seed(b.stat, 40);
        S_story.level = 20; S_story.xp = 0; S_story.gold = 0; S_story.inventory = [];
        if (flag) S_story[flag] = false;
        S_story.quests = { [q.id]:'active' };
        _rollCeremonia(q.id);
        const tok = S_story.inventory.find(i => i.flagRef === flag);
        if (!(S_story.quests[q.id] === 'done' && S_story[flag] === true && tok &&
              tok.name === _flagToLabel(flag) + ' Token' && tok.type === 'mission_bit' &&
              S_story.xp === 0 && S_story.gold === 0 && S_story.inventory.length === 1)) passBad.push(q.id);
        // FAIL
        S_story.abilityScores = seed(b.stat, -100);
        S_story.level = 1; S_story.day = 5; S_story.skillCheckAttempts = {};
        S_story.xp = 0; S_story.gold = 0; S_story.inventory = [];
        if (flag) S_story[flag] = false;
        S_story.quests = { [q.id]:'active' };
        _rollCeremonia(q.id);
        if (!(S_story.quests[q.id] === 'failed' && S_story[flag] === false && S_story.inventory.length === 0)) failBad.push(q.id);
        // GATE
        const g = q.gate || {};
        if (g.flags && g.flags.length) {
          const gf = g.flags[0];
          S_story[gf] = false; const c0 = QuestRuntime.canActivate(q.id);
          S_story[gf] = true;  const c1 = QuestRuntime.canActivate(q.id);
          if (!(c0 === false && c1 === true)) gateBad.push(q.id);
        } else if (QuestRuntime.canActivate(q.id) !== true) gateBad.push(q.id);
      }
      return { count:kir.length, passBad, failBad, gateBad };
    });
    expect(r.count).toBe(35);
    expect(r.passBad).toEqual([]);
    expect(r.failBad).toEqual([]);
    expect(r.gateBad).toEqual([]);
  });
});

// §ARCH-01 Wave 2w — lcy_* family (35 skill_check acts — 7 quests × 5 acts,
// single `lcy_NN_actN` convention; quests: Fortune/Glove/Arrow/John/Prisoner/
// Guesclin/Lady — White Company / Du Guesclin arc). UNIFORM-flag (like
// kir_/nwi_/bey_/crl_): all 35 carry a checkPassFlag → onPass:[mission_bit{flag}]
// (0 flagless). Gates form ONE linear 35-act chain: only lcy_01_act1 is ungated
// (gate:{}); the other 34 are trivial `()=>!!S_story.<priorFlag>` → gate:{flags:[…]}
// (each act gates the prior act's passFlag; each quest's act1 gates the prior
// quest's act5 flag) ⇒ split {flags:34, empty:1}, all gate flags internal.
// UPPERCASE-checkStat (WIS/STR/CHA): legacy raw-case read ⇒ silent +0 mod
// (§SKILLFIX-01); UQF lowercases ⇒ real mod. Golden seeded under BOTH cases;
// seed() below mirrors that. NO §SKILLFIX-02 (0 skill-name checkStats). Clean
// 7×5 grid — no type-gated siblings, no prefix bleed (all 35 file `lcy` ids are
// the migrated acts). Self-contained.
test.describe('§ARCH-01 Wave 2w — lcy_* family (bulk-migrated, 35 acts; uniform flag-bearing)', () => {
  test('every lcy_* skill_check is UQF-1.0, validates, onFail:[], NO residual activateCond; onPass = mission_bit', async ({ page }) => {
    const errs = []; page.on('pageerror', e => errs.push(String(e)));
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const lcy = Object.values(QUEST_DB).filter(q => /^lcy/.test(q.id) && q.type === 'skill_check');
      return lcy.map(q => {
        const b = (q.bits || []).find(x => x.kind === 'skill_check');
        const mb = b && b.onPass.find(x => x.kind === 'mission_bit');
        const gate = q.gate || {};
        return { id:q.id, schema:q.schema, valid:validateQuest(q).valid,
          noAC: typeof q.activateCond === 'undefined',
          gateShape: gate.flags ? 'flags' : (JSON.stringify(gate) === '{}' ? 'empty' : 'other'),
          hasStat:!!(b && b.stat), hasDc:typeof (b && b.dc) === 'number',
          onPassK:b ? b.onPass.map(x => x.kind) : null, onFailLen:b ? b.onFail.length : null,
          mbHasLabel:mb ? ('label' in mb) : null };
      });
    });
    expect(errs).toEqual([]);
    expect(r.length).toBe(35);
    const gateShapes = { flags:0, empty:0 };
    for (const q of r) {
      expect(q.schema).toBe('UQF-1.0');
      expect(q.valid).toBe(true);
      expect(q.noAC).toBe(true);
      expect(['flags', 'empty']).toContain(q.gateShape);
      expect(q.hasStat).toBe(true);
      expect(q.hasDc).toBe(true);
      expect(q.onFailLen).toBe(0);
      expect(q.onPassK).toEqual(['mission_bit']);
      expect(q.mbHasLabel).toBe(false);
      gateShapes[q.gateShape]++;
    }
    expect(gateShapes).toEqual({ flags:34, empty:1 });
  });

  test('PASS/FAIL parity across all 35 + gate behavior; every act grants a token on pass', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const seed = (k, v) => ({ [k]: v, [k.toLowerCase()]: v });
      const lcy = Object.values(QUEST_DB).filter(q => /^lcy/.test(q.id) && q.type === 'skill_check');
      let passBad = [], failBad = [], gateBad = [];
      for (const q of lcy) {
        const b = q.bits.find(x => x.kind === 'skill_check');
        const mb = b.onPass.find(x => x.kind === 'mission_bit');
        const flag = mb ? mb.flag : null;
        // PASS
        S_story.abilityScores = seed(b.stat, 40);
        S_story.level = 20; S_story.xp = 0; S_story.gold = 0; S_story.inventory = [];
        if (flag) S_story[flag] = false;
        S_story.quests = { [q.id]:'active' };
        _rollCeremonia(q.id);
        const tok = S_story.inventory.find(i => i.flagRef === flag);
        if (!(S_story.quests[q.id] === 'done' && S_story[flag] === true && tok &&
              tok.name === _flagToLabel(flag) + ' Token' && tok.type === 'mission_bit' &&
              S_story.xp === 0 && S_story.gold === 0 && S_story.inventory.length === 1)) passBad.push(q.id);
        // FAIL
        S_story.abilityScores = seed(b.stat, -100);
        S_story.level = 1; S_story.day = 5; S_story.skillCheckAttempts = {};
        S_story.xp = 0; S_story.gold = 0; S_story.inventory = [];
        if (flag) S_story[flag] = false;
        S_story.quests = { [q.id]:'active' };
        _rollCeremonia(q.id);
        if (!(S_story.quests[q.id] === 'failed' && S_story[flag] === false && S_story.inventory.length === 0)) failBad.push(q.id);
        // GATE
        const g = q.gate || {};
        if (g.flags && g.flags.length) {
          const gf = g.flags[0];
          S_story[gf] = false; const c0 = QuestRuntime.canActivate(q.id);
          S_story[gf] = true;  const c1 = QuestRuntime.canActivate(q.id);
          if (!(c0 === false && c1 === true)) gateBad.push(q.id);
        } else if (QuestRuntime.canActivate(q.id) !== true) gateBad.push(q.id);
      }
      return { count:lcy.length, passBad, failBad, gateBad };
    });
    expect(r.count).toBe(35);
    expect(r.passBad).toEqual([]);
    expect(r.failBad).toEqual([]);
    expect(r.gateBad).toEqual([]);
  });
});

// §ARCH-01 Wave 2x — lgw_* family (35 skill_check acts — 7 quests × 5 acts,
// single `lgw_NN_actN` convention; quests Barge/Throw/Harp/Gareth/Gawain/Grail/
// Morgan — Le Morte d'Arthur arc). STRUCTURAL TWIN of lcy_*: UNIFORM-flag — all
// 35 carry a checkPassFlag → onPass:[mission_bit{flag}] (0 flagless); gates form
// ONE linear 35-act chain (only lgw_01_act1 ungated; the other 34 are trivial
// `()=>!!S_story.<priorFlag>` → gate:{flags:[…]}, each quest's act1 gating the
// prior quest's act5 flag) ⇒ split {flags:34, empty:1}, all gate flags internal.
// UPPERCASE-checkStat (WIS/STR/CHA): legacy raw-case read ⇒ silent +0 mod
// (§SKILLFIX-01); UQF lowercases ⇒ real mod. Golden seeded under BOTH cases.
// NO §SKILLFIX-02 (0 skill-name checkStats). Clean 7×5 grid — no type-gated
// siblings, no prefix bleed (all 35 file `lgw` ids are the migrated acts).
// Self-contained.
test.describe('§ARCH-01 Wave 2x — lgw_* family (bulk-migrated, 35 acts; uniform flag-bearing)', () => {
  test('every lgw_* skill_check is UQF-1.0, validates, onFail:[], NO residual activateCond; onPass = mission_bit', async ({ page }) => {
    const errs = []; page.on('pageerror', e => errs.push(String(e)));
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const lgw = Object.values(QUEST_DB).filter(q => /^lgw/.test(q.id) && q.type === 'skill_check');
      return lgw.map(q => {
        const b = (q.bits || []).find(x => x.kind === 'skill_check');
        const mb = b && b.onPass.find(x => x.kind === 'mission_bit');
        const gate = q.gate || {};
        return { id:q.id, schema:q.schema, valid:validateQuest(q).valid,
          noAC: typeof q.activateCond === 'undefined',
          gateShape: gate.flags ? 'flags' : (JSON.stringify(gate) === '{}' ? 'empty' : 'other'),
          hasStat:!!(b && b.stat), hasDc:typeof (b && b.dc) === 'number',
          onPassK:b ? b.onPass.map(x => x.kind) : null, onFailLen:b ? b.onFail.length : null,
          mbHasLabel:mb ? ('label' in mb) : null };
      });
    });
    expect(errs).toEqual([]);
    expect(r.length).toBe(35);
    const gateShapes = { flags:0, empty:0 };
    for (const q of r) {
      expect(q.schema).toBe('UQF-1.0');
      expect(q.valid).toBe(true);
      expect(q.noAC).toBe(true);
      expect(['flags', 'empty']).toContain(q.gateShape);
      expect(q.hasStat).toBe(true);
      expect(q.hasDc).toBe(true);
      expect(q.onFailLen).toBe(0);
      expect(q.onPassK).toEqual(['mission_bit']);
      expect(q.mbHasLabel).toBe(false);
      gateShapes[q.gateShape]++;
    }
    expect(gateShapes).toEqual({ flags:34, empty:1 });
  });

  test('PASS/FAIL parity across all 35 + gate behavior; every act grants a token on pass', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const seed = (k, v) => ({ [k]: v, [k.toLowerCase()]: v });
      const lgw = Object.values(QUEST_DB).filter(q => /^lgw/.test(q.id) && q.type === 'skill_check');
      let passBad = [], failBad = [], gateBad = [];
      for (const q of lgw) {
        const b = q.bits.find(x => x.kind === 'skill_check');
        const mb = b.onPass.find(x => x.kind === 'mission_bit');
        const flag = mb ? mb.flag : null;
        // PASS
        S_story.abilityScores = seed(b.stat, 40);
        S_story.level = 20; S_story.xp = 0; S_story.gold = 0; S_story.inventory = [];
        if (flag) S_story[flag] = false;
        S_story.quests = { [q.id]:'active' };
        _rollCeremonia(q.id);
        const tok = S_story.inventory.find(i => i.flagRef === flag);
        if (!(S_story.quests[q.id] === 'done' && S_story[flag] === true && tok &&
              tok.name === _flagToLabel(flag) + ' Token' && tok.type === 'mission_bit' &&
              S_story.xp === 0 && S_story.gold === 0 && S_story.inventory.length === 1)) passBad.push(q.id);
        // FAIL
        S_story.abilityScores = seed(b.stat, -100);
        S_story.level = 1; S_story.day = 5; S_story.skillCheckAttempts = {};
        S_story.xp = 0; S_story.gold = 0; S_story.inventory = [];
        if (flag) S_story[flag] = false;
        S_story.quests = { [q.id]:'active' };
        _rollCeremonia(q.id);
        if (!(S_story.quests[q.id] === 'failed' && S_story[flag] === false && S_story.inventory.length === 0)) failBad.push(q.id);
        // GATE
        const g = q.gate || {};
        if (g.flags && g.flags.length) {
          const gf = g.flags[0];
          S_story[gf] = false; const c0 = QuestRuntime.canActivate(q.id);
          S_story[gf] = true;  const c1 = QuestRuntime.canActivate(q.id);
          if (!(c0 === false && c1 === true)) gateBad.push(q.id);
        } else if (QuestRuntime.canActivate(q.id) !== true) gateBad.push(q.id);
      }
      return { count:lgw.length, passBad, failBad, gateBad };
    });
    expect(r.count).toBe(35);
    expect(r.passBad).toEqual([]);
    expect(r.failBad).toEqual([]);
    expect(r.gateBad).toEqual([]);
  });
});

// §ARCH-01 Wave 2y — gci_* family (35 skill_check acts — 7 chapters × 5 acts,
// single `gci_NN_actN` convention, `gciCNAMDone` flags; Hugo's Toilers of the Sea
// arc: Gold Ring/Seat/Salvage Log/Clubin's Notebook/Confession/Unread Letter/
// Lethierry's Account). STRUCTURAL TWIN of lcy_*/lgw_*: UNIFORM-flag — all 35
// carry a checkPassFlag → onPass:[mission_bit{flag}] (0 flagless); gates form ONE
// linear 35-act chain (only gci_01_act1 ungated; the other 34 are trivial
// `()=>!!S_story.<priorFlag>` → gate:{flags:[…]}, each chapter's act1 gating the
// prior chapter's act5 flag) ⇒ split {flags:34, empty:1}, all gate flags internal.
// UPPERCASE-checkStat — ALL SIX abilities (CHA/CON/DEX/INT/STR/WIS): legacy
// raw-case read ⇒ silent +0 mod (§SKILLFIX-01); UQF lowercases ⇒ real mod. Golden
// seeded under BOTH cases. NO §SKILLFIX-02 (0 skill-name checkStats). Clean 7×5
// grid — no type-gated siblings, no prefix bleed (all 35 file `gci` ids are the
// migrated acts). Last clean (pure-parity) head from the Wave-2v re-scope trio.
// Self-contained.
test.describe('§ARCH-01 Wave 2y — gci_* family (bulk-migrated, 35 acts; uniform flag-bearing)', () => {
  test('every gci_* skill_check is UQF-1.0, validates, onFail:[], NO residual activateCond; onPass = mission_bit', async ({ page }) => {
    const errs = []; page.on('pageerror', e => errs.push(String(e)));
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const gci = Object.values(QUEST_DB).filter(q => /^gci/.test(q.id) && q.type === 'skill_check');
      return gci.map(q => {
        const b = (q.bits || []).find(x => x.kind === 'skill_check');
        const mb = b && b.onPass.find(x => x.kind === 'mission_bit');
        const gate = q.gate || {};
        return { id:q.id, schema:q.schema, valid:validateQuest(q).valid,
          noAC: typeof q.activateCond === 'undefined',
          gateShape: gate.flags ? 'flags' : (JSON.stringify(gate) === '{}' ? 'empty' : 'other'),
          hasStat:!!(b && b.stat), hasDc:typeof (b && b.dc) === 'number',
          onPassK:b ? b.onPass.map(x => x.kind) : null, onFailLen:b ? b.onFail.length : null,
          mbHasLabel:mb ? ('label' in mb) : null };
      });
    });
    expect(errs).toEqual([]);
    expect(r.length).toBe(35);
    const gateShapes = { flags:0, empty:0 };
    for (const q of r) {
      expect(q.schema).toBe('UQF-1.0');
      expect(q.valid).toBe(true);
      expect(q.noAC).toBe(true);
      expect(['flags', 'empty']).toContain(q.gateShape);
      expect(q.hasStat).toBe(true);
      expect(q.hasDc).toBe(true);
      expect(q.onFailLen).toBe(0);
      expect(q.onPassK).toEqual(['mission_bit']);
      expect(q.mbHasLabel).toBe(false);
      gateShapes[q.gateShape]++;
    }
    expect(gateShapes).toEqual({ flags:34, empty:1 });
  });

  test('PASS/FAIL parity across all 35 + gate behavior; every act grants a token on pass', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const seed = (k, v) => ({ [k]: v, [k.toLowerCase()]: v });
      const gci = Object.values(QUEST_DB).filter(q => /^gci/.test(q.id) && q.type === 'skill_check');
      let passBad = [], failBad = [], gateBad = [];
      for (const q of gci) {
        const b = q.bits.find(x => x.kind === 'skill_check');
        const mb = b.onPass.find(x => x.kind === 'mission_bit');
        const flag = mb ? mb.flag : null;
        // PASS
        S_story.abilityScores = seed(b.stat, 40);
        S_story.level = 20; S_story.xp = 0; S_story.gold = 0; S_story.inventory = [];
        if (flag) S_story[flag] = false;
        S_story.quests = { [q.id]:'active' };
        _rollCeremonia(q.id);
        const tok = S_story.inventory.find(i => i.flagRef === flag);
        if (!(S_story.quests[q.id] === 'done' && S_story[flag] === true && tok &&
              tok.name === _flagToLabel(flag) + ' Token' && tok.type === 'mission_bit' &&
              S_story.xp === 0 && S_story.gold === 0 && S_story.inventory.length === 1)) passBad.push(q.id);
        // FAIL
        S_story.abilityScores = seed(b.stat, -100);
        S_story.level = 1; S_story.day = 5; S_story.skillCheckAttempts = {};
        S_story.xp = 0; S_story.gold = 0; S_story.inventory = [];
        if (flag) S_story[flag] = false;
        S_story.quests = { [q.id]:'active' };
        _rollCeremonia(q.id);
        if (!(S_story.quests[q.id] === 'failed' && S_story[flag] === false && S_story.inventory.length === 0)) failBad.push(q.id);
        // GATE
        const g = q.gate || {};
        if (g.flags && g.flags.length) {
          const gf = g.flags[0];
          S_story[gf] = false; const c0 = QuestRuntime.canActivate(q.id);
          S_story[gf] = true;  const c1 = QuestRuntime.canActivate(q.id);
          if (!(c0 === false && c1 === true)) gateBad.push(q.id);
        } else if (QuestRuntime.canActivate(q.id) !== true) gateBad.push(q.id);
      }
      return { count:gci.length, passBad, failBad, gateBad };
    });
    expect(r.count).toBe(35);
    expect(r.passBad).toEqual([]);
    expect(r.failBad).toEqual([]);
    expect(r.gateBad).toEqual([]);
  });
});

// §ARCH-01 Wave 2z — waw_* family (38 skill_check acts — 8 arcs × ~5 acts, mixed
// `wawNNN_actN`/`waw_NN_actN` conventions). RECLASSIFIED CLEAN: the Wave-2v
// re-scope tagged waw as §SKILLFIX-02 (38/38 skill-name) but recon overturned
// that — the raw `checkStat`s are LOWERCASE ability abbrevs (cha/dex/str/wis/int),
// 0 skill-names, `skill→ability mapped 0` ⇒ NOT §SKILLFIX-02, pure pass/fail
// parity (the migrator uppercases the abbrev into bit.stat; legacy already read
// the lowercase key ⇒ real mod, so even §SKILLFIX-01 doesn't apply — no behavior
// change at all). UNIFORM-flag: all 38 carry a checkPassFlag → onPass:[mission_bit
// {flag}] (0 flagless). Gate split {flags:30, empty:8} (8 arc-opener act1s
// ungated). The 30 gate flags use a SEPARATE `wawNNNaM` naming, distinct from the
// `wawNNNActMPassed`/`WAW_NNN_actMPass` passFlags — they are EXTERNAL (set outside
// the migrated skill_check set; notably the 2 type-gated combat siblings
// `waw002_act4`/`waw_02_act4` set `waw002a4`/`waw_02a4` that `*_act5` gate on — the
// tbs/crl cross-sibling pattern). The gate test toggles the actual referenced flag
// directly, so these verify transparently. UPPERCASE-checkStat (CHA/DEX/INT/STR/
// WIS). Golden seeded under BOTH cases. No prefix bleed (the non-`_actN` `wawNNNaM`
// ids are gate-flag values, not quests). Self-contained.
test.describe('§ARCH-01 Wave 2z — waw_* family (bulk-migrated, 38 acts; uniform flag-bearing)', () => {
  test('every waw_* skill_check is UQF-1.0, validates, onFail:[], NO residual activateCond; onPass = mission_bit', async ({ page }) => {
    const errs = []; page.on('pageerror', e => errs.push(String(e)));
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const waw = Object.values(QUEST_DB).filter(q => /^waw/.test(q.id) && q.type === 'skill_check');
      return waw.map(q => {
        const b = (q.bits || []).find(x => x.kind === 'skill_check');
        const mb = b && b.onPass.find(x => x.kind === 'mission_bit');
        const gate = q.gate || {};
        return { id:q.id, schema:q.schema, valid:validateQuest(q).valid,
          noAC: typeof q.activateCond === 'undefined',
          gateShape: gate.flags ? 'flags' : (JSON.stringify(gate) === '{}' ? 'empty' : 'other'),
          hasStat:!!(b && b.stat), hasDc:typeof (b && b.dc) === 'number',
          onPassK:b ? b.onPass.map(x => x.kind) : null, onFailLen:b ? b.onFail.length : null,
          mbHasLabel:mb ? ('label' in mb) : null };
      });
    });
    expect(errs).toEqual([]);
    expect(r.length).toBe(38);
    const gateShapes = { flags:0, empty:0 };
    for (const q of r) {
      expect(q.schema).toBe('UQF-1.0');
      expect(q.valid).toBe(true);
      expect(q.noAC).toBe(true);
      expect(['flags', 'empty']).toContain(q.gateShape);
      expect(q.hasStat).toBe(true);
      expect(q.hasDc).toBe(true);
      expect(q.onFailLen).toBe(0);
      expect(q.onPassK).toEqual(['mission_bit']);
      expect(q.mbHasLabel).toBe(false);
      gateShapes[q.gateShape]++;
    }
    expect(gateShapes).toEqual({ flags:30, empty:8 });
  });

  test('PASS/FAIL parity across all 38 + gate behavior; every act grants a token on pass', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const seed = (k, v) => ({ [k]: v, [k.toLowerCase()]: v });
      const waw = Object.values(QUEST_DB).filter(q => /^waw/.test(q.id) && q.type === 'skill_check');
      let passBad = [], failBad = [], gateBad = [];
      for (const q of waw) {
        const b = q.bits.find(x => x.kind === 'skill_check');
        const mb = b.onPass.find(x => x.kind === 'mission_bit');
        const flag = mb ? mb.flag : null;
        // PASS
        S_story.abilityScores = seed(b.stat, 40);
        S_story.level = 20; S_story.xp = 0; S_story.gold = 0; S_story.inventory = [];
        if (flag) S_story[flag] = false;
        S_story.quests = { [q.id]:'active' };
        _rollCeremonia(q.id);
        const tok = S_story.inventory.find(i => i.flagRef === flag);
        if (!(S_story.quests[q.id] === 'done' && S_story[flag] === true && tok &&
              tok.name === _flagToLabel(flag) + ' Token' && tok.type === 'mission_bit' &&
              S_story.xp === 0 && S_story.gold === 0 && S_story.inventory.length === 1)) passBad.push(q.id);
        // FAIL
        S_story.abilityScores = seed(b.stat, -100);
        S_story.level = 1; S_story.day = 5; S_story.skillCheckAttempts = {};
        S_story.xp = 0; S_story.gold = 0; S_story.inventory = [];
        if (flag) S_story[flag] = false;
        S_story.quests = { [q.id]:'active' };
        _rollCeremonia(q.id);
        if (!(S_story.quests[q.id] === 'failed' && S_story[flag] === false && S_story.inventory.length === 0)) failBad.push(q.id);
        // GATE
        const g = q.gate || {};
        if (g.flags && g.flags.length) {
          const gf = g.flags[0];
          S_story[gf] = false; const c0 = QuestRuntime.canActivate(q.id);
          S_story[gf] = true;  const c1 = QuestRuntime.canActivate(q.id);
          if (!(c0 === false && c1 === true)) gateBad.push(q.id);
        } else if (QuestRuntime.canActivate(q.id) !== true) gateBad.push(q.id);
      }
      return { count:waw.length, passBad, failBad, gateBad };
    });
    expect(r.count).toBe(38);
    expect(r.passBad).toEqual([]);
    expect(r.failBad).toEqual([]);
    expect(r.gateBad).toEqual([]);
  });
});

// §ARCH-01 Wave 2aa — ams_* family (35 skill_check acts — 7 arcs × 5 acts,
// `ams_NN_NN` convention). RECLASSIFIED CLEAN (like waw): the Wave-2v re-scope
// tagged ams §SKILLFIX-02, but recon overturned it — `checkStat`s are lowercase
// ability abbrevs (wis/str/cha/int), 0 skill-names, `skill→ability mapped 0` ⇒
// NOT §SKILLFIX-02, pure pass/fail parity. STRUCTURALLY IDENTICAL to kir_*:
// UNIFORM-flag — all 35 carry a checkPassFlag → onPass:[mission_bit{flag}] (0
// flagless); gates form 7 INTERNAL per-arc chains (passFlag `amsNNaM`; each act
// gates the prior act's passFlag within its arc; the 7 arc-opener act1s ungated)
// ⇒ split {flags:28, empty:7}, all gate flags internal (none external).
// UPPERCASE-checkStat (CHA/INT/STR/WIS). Golden seeded under BOTH cases. No prefix
// bleed (the non-`_NN_NN` ids are the `amsNNaM` passFlag values). Self-contained.
test.describe('§ARCH-01 Wave 2aa — ams_* family (bulk-migrated, 35 acts; uniform flag-bearing)', () => {
  test('every ams_* skill_check is UQF-1.0, validates, onFail:[], NO residual activateCond; onPass = mission_bit', async ({ page }) => {
    const errs = []; page.on('pageerror', e => errs.push(String(e)));
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const ams = Object.values(QUEST_DB).filter(q => /^ams/.test(q.id) && q.type === 'skill_check');
      return ams.map(q => {
        const b = (q.bits || []).find(x => x.kind === 'skill_check');
        const mb = b && b.onPass.find(x => x.kind === 'mission_bit');
        const gate = q.gate || {};
        return { id:q.id, schema:q.schema, valid:validateQuest(q).valid,
          noAC: typeof q.activateCond === 'undefined',
          gateShape: gate.flags ? 'flags' : (JSON.stringify(gate) === '{}' ? 'empty' : 'other'),
          hasStat:!!(b && b.stat), hasDc:typeof (b && b.dc) === 'number',
          onPassK:b ? b.onPass.map(x => x.kind) : null, onFailLen:b ? b.onFail.length : null,
          mbHasLabel:mb ? ('label' in mb) : null };
      });
    });
    expect(errs).toEqual([]);
    expect(r.length).toBe(35);
    const gateShapes = { flags:0, empty:0 };
    for (const q of r) {
      expect(q.schema).toBe('UQF-1.0');
      expect(q.valid).toBe(true);
      expect(q.noAC).toBe(true);
      expect(['flags', 'empty']).toContain(q.gateShape);
      expect(q.hasStat).toBe(true);
      expect(q.hasDc).toBe(true);
      expect(q.onFailLen).toBe(0);
      expect(q.onPassK).toEqual(['mission_bit']);
      expect(q.mbHasLabel).toBe(false);
      gateShapes[q.gateShape]++;
    }
    expect(gateShapes).toEqual({ flags:28, empty:7 });
  });

  test('PASS/FAIL parity across all 35 + gate behavior; every act grants a token on pass', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const seed = (k, v) => ({ [k]: v, [k.toLowerCase()]: v });
      const ams = Object.values(QUEST_DB).filter(q => /^ams/.test(q.id) && q.type === 'skill_check');
      let passBad = [], failBad = [], gateBad = [];
      for (const q of ams) {
        const b = q.bits.find(x => x.kind === 'skill_check');
        const mb = b.onPass.find(x => x.kind === 'mission_bit');
        const flag = mb ? mb.flag : null;
        // PASS
        S_story.abilityScores = seed(b.stat, 40);
        S_story.level = 20; S_story.xp = 0; S_story.gold = 0; S_story.inventory = [];
        if (flag) S_story[flag] = false;
        S_story.quests = { [q.id]:'active' };
        _rollCeremonia(q.id);
        const tok = S_story.inventory.find(i => i.flagRef === flag);
        if (!(S_story.quests[q.id] === 'done' && S_story[flag] === true && tok &&
              tok.name === _flagToLabel(flag) + ' Token' && tok.type === 'mission_bit' &&
              S_story.xp === 0 && S_story.gold === 0 && S_story.inventory.length === 1)) passBad.push(q.id);
        // FAIL
        S_story.abilityScores = seed(b.stat, -100);
        S_story.level = 1; S_story.day = 5; S_story.skillCheckAttempts = {};
        S_story.xp = 0; S_story.gold = 0; S_story.inventory = [];
        if (flag) S_story[flag] = false;
        S_story.quests = { [q.id]:'active' };
        _rollCeremonia(q.id);
        if (!(S_story.quests[q.id] === 'failed' && S_story[flag] === false && S_story.inventory.length === 0)) failBad.push(q.id);
        // GATE
        const g = q.gate || {};
        if (g.flags && g.flags.length) {
          const gf = g.flags[0];
          S_story[gf] = false; const c0 = QuestRuntime.canActivate(q.id);
          S_story[gf] = true;  const c1 = QuestRuntime.canActivate(q.id);
          if (!(c0 === false && c1 === true)) gateBad.push(q.id);
        } else if (QuestRuntime.canActivate(q.id) !== true) gateBad.push(q.id);
      }
      return { count:ams.length, passBad, failBad, gateBad };
    });
    expect(r.count).toBe(35);
    expect(r.passBad).toEqual([]);
    expect(r.failBad).toEqual([]);
    expect(r.gateBad).toEqual([]);
  });
});

// §ARCH-01 Wave 2ab / §SKILLFIX-02 — bgw_* family (37 skill_check acts;
// `bgw_cNaM` chapters — the Genie Contract arc). SECOND genuine §SKILLFIX-02
// family (after ist_, Wave 2i): every checkStat holds a D&D SKILL NAME
// (Deception/History/Insight/Investigation/Nature/Persuasion), which legacy read
// as abilityScores[name] → undefined → +0 mod. The migrator maps the skill to its
// governing ability (D&D 5e) into `stat`, keeping the name in `skill` — a
// deliberate BEHAVIOR CHANGE (the check now rolls the mapped ability mod), so
// parity is asserted on DISPLAY (untouched) + structure + the mapping, NOT vs the
// legacy +0 roll. All 37 flag-bearing → onPass:[mission_bit{flag}]; gates all
// empty {flags:0, empty:37}. The transform type-gates out 3 combat siblings
// (bgw_c1a3/c6a4/c8a4). Self-contained.
test.describe('§ARCH-01 Wave 2ab / §SKILLFIX-02 — bgw_* family (skill→ability mapped, 37 acts)', () => {
  const ABILITIES = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
  const SKILL_TO_ABILITY = {
    ATHLETICS:'STR', ACROBATICS:'DEX', 'SLEIGHT OF HAND':'DEX', STEALTH:'DEX',
    ARCANA:'INT', HISTORY:'INT', INVESTIGATION:'INT', NATURE:'INT', RELIGION:'INT',
    'ANIMAL HANDLING':'WIS', INSIGHT:'WIS', MEDICINE:'WIS', PERCEPTION:'WIS', SURVIVAL:'WIS',
    DECEPTION:'CHA', INTIMIDATION:'CHA', PERFORMANCE:'CHA', PERSUASION:'CHA', COURAGE:'CHA', PRESENCE:'CHA',
  };

  test('every bgw_* skill_check is UQF-1.0, validates, stat is a real ability, skill→ability mapping holds', async ({ page }) => {
    const errs = []; page.on('pageerror', e => errs.push(String(e)));
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const bgw = Object.values(QUEST_DB).filter(q => /^bgw_/.test(q.id) && q.type === 'skill_check');
      return bgw.map(q => {
        const b = (q.bits || []).find(x => x.kind === 'skill_check');
        const mb = b && b.onPass.find(x => x.kind === 'mission_bit');
        const gate = q.gate || {};
        return { id:q.id, schema:q.schema, valid:validateQuest(q).valid, stat:b ? b.stat : null, skill:(b && b.skill) || null,
          noAC: typeof q.activateCond === 'undefined',
          gateShape: gate.flags ? 'flags' : (JSON.stringify(gate) === '{}' ? 'empty' : 'other'),
          onPassK:b ? b.onPass.map(x => x.kind) : null, onFailLen:b ? b.onFail.length : null,
          mbHasLabel:mb ? ('label' in mb) : null };
      });
    });
    expect(errs).toEqual([]);
    expect(r.length).toBe(37);
    const gateShapes = { flags:0, empty:0 };
    let mappedSkills = 0;
    for (const q of r) {
      expect(q.schema).toBe('UQF-1.0');
      expect(q.valid).toBe(true);
      expect(ABILITIES).toContain(q.stat);              // §SKILLFIX-02: stat is always a real ability
      expect(q.noAC).toBe(true);
      expect(['flags', 'empty']).toContain(q.gateShape);
      expect(q.onPassK).toEqual(['mission_bit']);        // bgw all flag-bearing
      expect(q.onFailLen).toBe(0);
      expect(q.mbHasLabel).toBe(false);
      if (q.skill) {                                      // mapping durability: skill's ability === stat
        expect(SKILL_TO_ABILITY[q.skill.toUpperCase()], `${q.id} skill ${q.skill}`).toBe(q.stat);
        mappedSkills++;
      }
      gateShapes[q.gateShape]++;
    }
    expect(gateShapes).toEqual({ flags:0, empty:37 });
    expect(mappedSkills).toBe(37);                        // all 37 carry a mapped skill name
  });

  test('NEW behavior (post-§SKILLFIX-02): the mapped ability mod drives the roll — forced PASS/FAIL + gate', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const seed = (k, v) => ({ [k]: v, [k.toLowerCase()]: v });
      const bgw = Object.values(QUEST_DB).filter(q => /^bgw_/.test(q.id) && q.type === 'skill_check');
      let passBad = [], failBad = [], gateBad = [];
      for (const q of bgw) {
        const b = q.bits.find(x => x.kind === 'skill_check');
        const flag = b.onPass.find(x => x.kind === 'mission_bit').flag;
        // PASS — seed the MAPPED ability high
        S_story.abilityScores = seed(b.stat, 40);
        S_story.level = 20; S_story.xp = 0; S_story.gold = 0; S_story.inventory = [];
        S_story[flag] = false; S_story.quests = { [q.id]:'active' };
        _rollCeremonia(q.id);
        const tok = S_story.inventory.find(i => i.flagRef === flag);
        if (!(S_story.quests[q.id] === 'done' && S_story[flag] === true && tok &&
              tok.name === _flagToLabel(flag) + ' Token' && tok.type === 'mission_bit' &&
              S_story.xp === 0 && S_story.gold === 0 && S_story.inventory.length === 1)) passBad.push(q.id);
        // FAIL — seed the mapped ability very low
        S_story.abilityScores = seed(b.stat, -100);
        S_story.level = 1; S_story.day = 5; S_story.skillCheckAttempts = {};
        S_story.xp = 0; S_story.gold = 0; S_story.inventory = [];
        S_story[flag] = false; S_story.quests = { [q.id]:'active' };
        _rollCeremonia(q.id);
        if (!(S_story.quests[q.id] === 'failed' && S_story[flag] === false && S_story.inventory.length === 0)) failBad.push(q.id);
        // GATE
        const g = q.gate || {};
        if (g.flags && g.flags.length) {
          const gf = g.flags[0];
          S_story[gf] = false; const c0 = QuestRuntime.canActivate(q.id);
          S_story[gf] = true;  const c1 = QuestRuntime.canActivate(q.id);
          if (!(c0 === false && c1 === true)) gateBad.push(q.id);
        } else if (QuestRuntime.canActivate(q.id) !== true) gateBad.push(q.id);
      }
      return { count:bgw.length, passBad, failBad, gateBad };
    });
    expect(r.count).toBe(37);
    expect(r.passBad).toEqual([]);
    expect(r.failBad).toEqual([]);
    expect(r.gateBad).toEqual([]);
  });
});

// §ARCH-01 Wave 2ac / §SKILLFIX-02 — cai_* family (35 skill_check acts;
// `cai_cNaM` chapters). THIRD genuine §SKILLFIX-02 family (after ist_ Wave 2i,
// bgw_ Wave 2ab) and the LAST of the cluster — clears it. Twin of bgw_: every
// checkStat is a D&D skill name (Deception/History/Insight/Investigation/Nature/
// Persuasion), legacy read as abilityScores[name] → +0 mod; the migrator maps
// skill→governing ability (CHA/INT/WIS) into `stat`, keeping the name in `skill`
// (`skill→ability mapped 35`, 0 mismatches). Deliberate BEHAVIOR CHANGE → parity
// on DISPLAY (untouched) + structure + mapping, NOT vs the +0 roll. All 35
// flag-bearing → onPass:[mission_bit{flag}]; gates all-empty {flags:0, empty:35}.
// Transform type-gates out 5 siblings (2 hybrid cai_c1a3/c4a3 + 3 combat
// cai_c6a4/c7a4/c8a4). Self-contained.
test.describe('§ARCH-01 Wave 2ac / §SKILLFIX-02 — cai_* family (skill→ability mapped, 35 acts)', () => {
  const ABILITIES = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
  const SKILL_TO_ABILITY = {
    ATHLETICS:'STR', ACROBATICS:'DEX', 'SLEIGHT OF HAND':'DEX', STEALTH:'DEX',
    ARCANA:'INT', HISTORY:'INT', INVESTIGATION:'INT', NATURE:'INT', RELIGION:'INT',
    'ANIMAL HANDLING':'WIS', INSIGHT:'WIS', MEDICINE:'WIS', PERCEPTION:'WIS', SURVIVAL:'WIS',
    DECEPTION:'CHA', INTIMIDATION:'CHA', PERFORMANCE:'CHA', PERSUASION:'CHA', COURAGE:'CHA', PRESENCE:'CHA',
  };

  test('every cai_* skill_check is UQF-1.0, validates, stat is a real ability, skill→ability mapping holds', async ({ page }) => {
    const errs = []; page.on('pageerror', e => errs.push(String(e)));
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const cai = Object.values(QUEST_DB).filter(q => /^cai_/.test(q.id) && q.type === 'skill_check');
      return cai.map(q => {
        const b = (q.bits || []).find(x => x.kind === 'skill_check');
        const mb = b && b.onPass.find(x => x.kind === 'mission_bit');
        const gate = q.gate || {};
        return { id:q.id, schema:q.schema, valid:validateQuest(q).valid, stat:b ? b.stat : null, skill:(b && b.skill) || null,
          noAC: typeof q.activateCond === 'undefined',
          gateShape: gate.flags ? 'flags' : (JSON.stringify(gate) === '{}' ? 'empty' : 'other'),
          onPassK:b ? b.onPass.map(x => x.kind) : null, onFailLen:b ? b.onFail.length : null,
          mbHasLabel:mb ? ('label' in mb) : null };
      });
    });
    expect(errs).toEqual([]);
    expect(r.length).toBe(35);
    const gateShapes = { flags:0, empty:0 };
    let mappedSkills = 0;
    for (const q of r) {
      expect(q.schema).toBe('UQF-1.0');
      expect(q.valid).toBe(true);
      expect(ABILITIES).toContain(q.stat);              // §SKILLFIX-02: stat is always a real ability
      expect(q.noAC).toBe(true);
      expect(['flags', 'empty']).toContain(q.gateShape);
      expect(q.onPassK).toEqual(['mission_bit']);        // cai all flag-bearing
      expect(q.onFailLen).toBe(0);
      expect(q.mbHasLabel).toBe(false);
      if (q.skill) {                                      // mapping durability: skill's ability === stat
        expect(SKILL_TO_ABILITY[q.skill.toUpperCase()], `${q.id} skill ${q.skill}`).toBe(q.stat);
        mappedSkills++;
      }
      gateShapes[q.gateShape]++;
    }
    expect(gateShapes).toEqual({ flags:0, empty:35 });
    expect(mappedSkills).toBe(35);                        // all 35 carry a mapped skill name
  });

  test('NEW behavior (post-§SKILLFIX-02): the mapped ability mod drives the roll — forced PASS/FAIL + gate', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const seed = (k, v) => ({ [k]: v, [k.toLowerCase()]: v });
      const cai = Object.values(QUEST_DB).filter(q => /^cai_/.test(q.id) && q.type === 'skill_check');
      let passBad = [], failBad = [], gateBad = [];
      for (const q of cai) {
        const b = q.bits.find(x => x.kind === 'skill_check');
        const flag = b.onPass.find(x => x.kind === 'mission_bit').flag;
        // PASS — seed the MAPPED ability high
        S_story.abilityScores = seed(b.stat, 40);
        S_story.level = 20; S_story.xp = 0; S_story.gold = 0; S_story.inventory = [];
        S_story[flag] = false; S_story.quests = { [q.id]:'active' };
        _rollCeremonia(q.id);
        const tok = S_story.inventory.find(i => i.flagRef === flag);
        if (!(S_story.quests[q.id] === 'done' && S_story[flag] === true && tok &&
              tok.name === _flagToLabel(flag) + ' Token' && tok.type === 'mission_bit' &&
              S_story.xp === 0 && S_story.gold === 0 && S_story.inventory.length === 1)) passBad.push(q.id);
        // FAIL — seed the mapped ability very low
        S_story.abilityScores = seed(b.stat, -100);
        S_story.level = 1; S_story.day = 5; S_story.skillCheckAttempts = {};
        S_story.xp = 0; S_story.gold = 0; S_story.inventory = [];
        S_story[flag] = false; S_story.quests = { [q.id]:'active' };
        _rollCeremonia(q.id);
        if (!(S_story.quests[q.id] === 'failed' && S_story[flag] === false && S_story.inventory.length === 0)) failBad.push(q.id);
        // GATE
        const g = q.gate || {};
        if (g.flags && g.flags.length) {
          const gf = g.flags[0];
          S_story[gf] = false; const c0 = QuestRuntime.canActivate(q.id);
          S_story[gf] = true;  const c1 = QuestRuntime.canActivate(q.id);
          if (!(c0 === false && c1 === true)) gateBad.push(q.id);
        } else if (QuestRuntime.canActivate(q.id) !== true) gateBad.push(q.id);
      }
      return { count:cai.length, passBad, failBad, gateBad };
    });
    expect(r.count).toBe(35);
    expect(r.passBad).toEqual([]);
    expect(r.failBad).toEqual([]);
    expect(r.gateBad).toEqual([]);
  });
});

// §ARCH-01 Wave 2ad — blq_* family SPLIT (59 skill_check acts: 29 well-formed
// migrated via an explicit id-list + 30 degenerate book-stubs left LEGACY, out of
// scope). The well-formed 29 are arcs blq_01/02/03/04/11/12 × ~5 acts (the Belluno
// legal-courier arc — guild counting house, communal court filings). RECLASSIFIED
// CLEAN: `checkStat`s are lowercase ability abbrevs (wis/cha/int/dex/str), 0
// skill-names, `skill→ability mapped 0` ⇒ NOT §SKILLFIX-02, pure pass/fail parity
// (like waw/ams). UNIFORM-flag — all 29 carry checkPassFlag → onPass:[mission_bit]
// (0 flagless); gates split {flags:23, empty:6} (the 6 arc-opener act1s ungated; 23
// chained on the prior act's passFlag — incl. blq_02_act5 gating on blq02RoadCleared,
// a flag set by the OUT-OF-SCOPE non-skill_check blq_02_act4, which the migrator
// keeps verbatim as gate.flags). The 30 degenerate blq_05–blq_10 book-stubs (the
// Decameron "Falcon's Inventory" stubs: reward:NaN, activateCond:()=>!!S_story.null,
// no checkStat/checkDC) MUST stay legacy — `--prefix blq` would have crashed the
// migrator's well-formedness guard, so the migration used an explicit id-list. This
// block inlines that allowlist so the 30 stubs are excluded by construction, and
// asserts they remain un-migrated. Self-contained.
const BLQ_WF_IDS = [
  'blq_01_act1','blq_01_act2','blq_01_act3','blq_01_act4','blq_01_act5',
  'blq_02_act1','blq_02_act2','blq_02_act3','blq_02_act5',
  'blq_03_act1','blq_03_act2','blq_03_act3','blq_03_act4','blq_03_act5',
  'blq_04_act1','blq_04_act2','blq_04_act3','blq_04_act4','blq_04_act5',
  'blq_11_act1','blq_11_act2','blq_11_act3','blq_11_act4','blq_11_act5',
  'blq_12_act1','blq_12_act2','blq_12_act3','blq_12_act4','blq_12_act5',
];
test.describe('§ARCH-01 Wave 2ad — blq_* family SPLIT (29 well-formed migrated; 30 degenerate stubs left legacy)', () => {
  test('every well-formed blq act is UQF-1.0, validates, onFail:[], NO residual activateCond; onPass = mission_bit; the 30 stubs stay legacy', async ({ page }) => {
    const errs = []; page.on('pageerror', e => errs.push(String(e)));
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate((wfIds) => {
      const wfSet = new Set(wfIds);
      const allBlq = Object.values(QUEST_DB).filter(q => /^blq/.test(q.id) && q.type === 'skill_check');
      const wf = allBlq.filter(q => wfSet.has(q.id));
      // the degenerate stubs = blq skill_checks NOT in the allowlist; must stay legacy
      const stubsUQF = allBlq.filter(q => !wfSet.has(q.id) && q.schema === 'UQF-1.0').map(q => q.id);
      return {
        stubCount: allBlq.length - wf.length,
        stubsUQF,
        acts: wf.map(q => {
          const b = (q.bits || []).find(x => x.kind === 'skill_check');
          const mb = b && b.onPass.find(x => x.kind === 'mission_bit');
          const gate = q.gate || {};
          return { id:q.id, schema:q.schema, valid:validateQuest(q).valid,
            noAC: typeof q.activateCond === 'undefined',
            gateShape: gate.flags ? 'flags' : (JSON.stringify(gate) === '{}' ? 'empty' : 'other'),
            hasStat:!!(b && b.stat), abilOk: b ? ['STR','DEX','CON','INT','WIS','CHA'].includes(b.stat) : false,
            hasDc:typeof (b && b.dc) === 'number', noSkill: b ? !('skill' in b) : false,
            onPassK:b ? b.onPass.map(x => x.kind) : null, onFailLen:b ? b.onFail.length : null,
            mbHasLabel:mb ? ('label' in mb) : null };
        }),
      };
    }, BLQ_WF_IDS);
    expect(errs).toEqual([]);
    expect(r.acts.length).toBe(29);
    expect(r.stubCount).toBe(30);          // the Decameron book-stubs are present…
    expect(r.stubsUQF).toEqual([]);        // …and NONE of them were migrated
    const gateShapes = { flags:0, empty:0 };
    for (const q of r.acts) {
      expect(q.schema).toBe('UQF-1.0');
      expect(q.valid).toBe(true);
      expect(q.noAC).toBe(true);
      expect(['flags', 'empty']).toContain(q.gateShape);
      expect(q.hasStat).toBe(true);
      expect(q.abilOk).toBe(true);         // CLEAN family — stat is a real ability abbrev
      expect(q.noSkill).toBe(true);        // not §SKILLFIX-02 — no skill name retained
      expect(q.hasDc).toBe(true);
      expect(q.onFailLen).toBe(0);
      expect(q.onPassK).toEqual(['mission_bit']);
      expect(q.mbHasLabel).toBe(false);
      gateShapes[q.gateShape]++;
    }
    expect(gateShapes).toEqual({ flags:23, empty:6 });
  });

  test('PASS/FAIL parity across all 29 + gate behavior; every act grants a token on pass', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate((wfIds) => {
      const seed = (k, v) => ({ [k]: v, [k.toLowerCase()]: v });
      const wfSet = new Set(wfIds);
      const blq = Object.values(QUEST_DB).filter(q => /^blq/.test(q.id) && q.type === 'skill_check' && wfSet.has(q.id));
      let passBad = [], failBad = [], gateBad = [];
      for (const q of blq) {
        const b = q.bits.find(x => x.kind === 'skill_check');
        const mb = b.onPass.find(x => x.kind === 'mission_bit');
        const flag = mb.flag;
        // PASS
        S_story.abilityScores = seed(b.stat, 40);
        S_story.level = 20; S_story.xp = 0; S_story.gold = 0; S_story.inventory = [];
        S_story[flag] = false;
        S_story.quests = { [q.id]:'active' };
        _rollCeremonia(q.id);
        const tok = S_story.inventory.find(i => i.flagRef === flag);
        if (!(S_story.quests[q.id] === 'done' && S_story[flag] === true && tok &&
              tok.name === _flagToLabel(flag) + ' Token' && tok.type === 'mission_bit' &&
              S_story.xp === 0 && S_story.gold === 0 && S_story.inventory.length === 1)) passBad.push(q.id);
        // FAIL
        S_story.abilityScores = seed(b.stat, -100);
        S_story.level = 1; S_story.day = 5; S_story.skillCheckAttempts = {};
        S_story.xp = 0; S_story.gold = 0; S_story.inventory = [];
        S_story[flag] = false;
        S_story.quests = { [q.id]:'active' };
        _rollCeremonia(q.id);
        if (!(S_story.quests[q.id] === 'failed' && S_story[flag] === false && S_story.inventory.length === 0)) failBad.push(q.id);
        // GATE
        const g = q.gate || {};
        if (g.flags && g.flags.length) {
          const gf = g.flags[0];
          S_story[gf] = false; const c0 = QuestRuntime.canActivate(q.id);
          S_story[gf] = true;  const c1 = QuestRuntime.canActivate(q.id);
          if (!(c0 === false && c1 === true)) gateBad.push(q.id);
        } else if (QuestRuntime.canActivate(q.id) !== true) gateBad.push(q.id);
      }
      return { count:blq.length, passBad, failBad, gateBad };
    }, BLQ_WF_IDS);
    expect(r.count).toBe(29);
    expect(r.passBad).toEqual([]);
    expect(r.failBad).toEqual([]);
    expect(r.gateBad).toEqual([]);
  });
});

// §ARCH-01 Wave 2ae — inv_* family (35 skill_check acts — 7 chapters × 5 acts,
// single `inv_NN_actN` convention, `invCNAMDone` flags; Macpherson's Ossian arc
// "The Shield of Gormur" — Dargo/Oscur/Dermid on the high moor). FIRST head from
// the fresh post-blq re-scope (the pre-scouted Wave-2 queue was exhausted at 2ad).
// STRUCTURAL TWIN of gci_*/lcy_*/lgw_*: UNIFORM-flag — all 35 carry a checkPassFlag
// → onPass:[mission_bit{flag}] (0 flagless); gates form ONE linear 35-act chain
// (only inv_01_act1 ungated; the other 34 are trivial `()=>!!S_story.<priorFlag>` →
// gate:{flags:[…]}, each chapter's act1 gating the prior chapter's act5 flag) ⇒
// split {flags:34, empty:1}, all gate flags internal. UPPERCASE-checkStat — ALL SIX
// abilities (CHA/CON/DEX/INT/STR/WIS): legacy raw-case read ⇒ silent +0 mod
// (§SKILLFIX-01); UQF lowercases ⇒ real mod. Golden seeded under BOTH cases. NO
// §SKILLFIX-02 (0 skill-name checkStats, `skill→ability mapped 0`). Clean 7×5 grid —
// no type-gated siblings, no prefix bleed (all 35 `inv_` ids are the migrated acts).
// Self-contained.
test.describe('§ARCH-01 Wave 2ae — inv_* family (bulk-migrated, 35 acts; uniform flag-bearing)', () => {
  test('every inv_* skill_check is UQF-1.0, validates, onFail:[], NO residual activateCond; onPass = mission_bit', async ({ page }) => {
    const errs = []; page.on('pageerror', e => errs.push(String(e)));
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const inv = Object.values(QUEST_DB).filter(q => /^inv_/.test(q.id) && q.type === 'skill_check');
      return inv.map(q => {
        const b = (q.bits || []).find(x => x.kind === 'skill_check');
        const mb = b && b.onPass.find(x => x.kind === 'mission_bit');
        const gate = q.gate || {};
        return { id:q.id, schema:q.schema, valid:validateQuest(q).valid,
          noAC: typeof q.activateCond === 'undefined',
          gateShape: gate.flags ? 'flags' : (JSON.stringify(gate) === '{}' ? 'empty' : 'other'),
          hasStat:!!(b && b.stat), abilOk: b ? ['STR','DEX','CON','INT','WIS','CHA'].includes(b.stat) : false,
          hasDc:typeof (b && b.dc) === 'number', noSkill: b ? !('skill' in b) : false,
          onPassK:b ? b.onPass.map(x => x.kind) : null, onFailLen:b ? b.onFail.length : null,
          mbHasLabel:mb ? ('label' in mb) : null };
      });
    });
    expect(errs).toEqual([]);
    expect(r.length).toBe(35);
    const gateShapes = { flags:0, empty:0 };
    for (const q of r) {
      expect(q.schema).toBe('UQF-1.0');
      expect(q.valid).toBe(true);
      expect(q.noAC).toBe(true);
      expect(['flags', 'empty']).toContain(q.gateShape);
      expect(q.hasStat).toBe(true);
      expect(q.abilOk).toBe(true);         // CLEAN family — stat is a real ability abbrev
      expect(q.noSkill).toBe(true);        // not §SKILLFIX-02 — no skill name retained
      expect(q.hasDc).toBe(true);
      expect(q.onFailLen).toBe(0);
      expect(q.onPassK).toEqual(['mission_bit']);
      expect(q.mbHasLabel).toBe(false);
      gateShapes[q.gateShape]++;
    }
    expect(gateShapes).toEqual({ flags:34, empty:1 });
  });

  test('PASS/FAIL parity across all 35 + gate behavior; every act grants a token on pass', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const seed = (k, v) => ({ [k]: v, [k.toLowerCase()]: v });
      const inv = Object.values(QUEST_DB).filter(q => /^inv_/.test(q.id) && q.type === 'skill_check');
      let passBad = [], failBad = [], gateBad = [];
      for (const q of inv) {
        const b = q.bits.find(x => x.kind === 'skill_check');
        const mb = b.onPass.find(x => x.kind === 'mission_bit');
        const flag = mb ? mb.flag : null;
        // PASS
        S_story.abilityScores = seed(b.stat, 40);
        S_story.level = 20; S_story.xp = 0; S_story.gold = 0; S_story.inventory = [];
        if (flag) S_story[flag] = false;
        S_story.quests = { [q.id]:'active' };
        _rollCeremonia(q.id);
        const tok = S_story.inventory.find(i => i.flagRef === flag);
        if (!(S_story.quests[q.id] === 'done' && S_story[flag] === true && tok &&
              tok.name === _flagToLabel(flag) + ' Token' && tok.type === 'mission_bit' &&
              S_story.xp === 0 && S_story.gold === 0 && S_story.inventory.length === 1)) passBad.push(q.id);
        // FAIL
        S_story.abilityScores = seed(b.stat, -100);
        S_story.level = 1; S_story.day = 5; S_story.skillCheckAttempts = {};
        S_story.xp = 0; S_story.gold = 0; S_story.inventory = [];
        if (flag) S_story[flag] = false;
        S_story.quests = { [q.id]:'active' };
        _rollCeremonia(q.id);
        if (!(S_story.quests[q.id] === 'failed' && S_story[flag] === false && S_story.inventory.length === 0)) failBad.push(q.id);
        // GATE
        const g = q.gate || {};
        if (g.flags && g.flags.length) {
          const gf = g.flags[0];
          S_story[gf] = false; const c0 = QuestRuntime.canActivate(q.id);
          S_story[gf] = true;  const c1 = QuestRuntime.canActivate(q.id);
          if (!(c0 === false && c1 === true)) gateBad.push(q.id);
        } else if (QuestRuntime.canActivate(q.id) !== true) gateBad.push(q.id);
      }
      return { count:inv.length, passBad, failBad, gateBad };
    });
    expect(r.count).toBe(35);
    expect(r.passBad).toEqual([]);
    expect(r.failBad).toEqual([]);
    expect(r.gateBad).toEqual([]);
  });
});

// §ARCH-01 Wave 2af — bhd_* family (35 skill_check acts — 7 chapters × 5 acts,
// single `bhd_NN_actN` convention, `bhdCNAMDone` flags; Ossian arc "Fergus's
// Cloak"). SECOND head from the post-blq re-scope (twin of inv_*, Wave 2ae).
// STRUCTURAL TWIN of inv_*/gci_*/lcy_*/lgw_*: UNIFORM-flag — all 35 carry a
// checkPassFlag → onPass:[mission_bit{flag}] (0 flagless); gates form ONE linear
// 35-act chain (only bhd_01_act1 ungated; the other 34 trivial
// `()=>!!S_story.<priorFlag>` → gate:{flags:[…]}) ⇒ split {flags:34, empty:1}.
// UPPERCASE-checkStat (CHA/CON/INT/STR/WIS); legacy raw-case read ⇒ silent +0 mod
// (§SKILLFIX-01), UQF lowercases ⇒ real mod; golden seeded under BOTH cases. CLEAN
// — `skill→ability mapped 0`, 0 skill-names, NOT §SKILLFIX-02. No type-gated
// siblings, no prefix bleed (all 35 `bhd_` ids are the migrated acts). Self-contained.
test.describe('§ARCH-01 Wave 2af — bhd_* family (bulk-migrated, 35 acts; uniform flag-bearing)', () => {
  test('every bhd_* skill_check is UQF-1.0, validates, onFail:[], NO residual activateCond; onPass = mission_bit', async ({ page }) => {
    const errs = []; page.on('pageerror', e => errs.push(String(e)));
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const bhd = Object.values(QUEST_DB).filter(q => /^bhd_/.test(q.id) && q.type === 'skill_check');
      return bhd.map(q => {
        const b = (q.bits || []).find(x => x.kind === 'skill_check');
        const mb = b && b.onPass.find(x => x.kind === 'mission_bit');
        const gate = q.gate || {};
        return { id:q.id, schema:q.schema, valid:validateQuest(q).valid,
          noAC: typeof q.activateCond === 'undefined',
          gateShape: gate.flags ? 'flags' : (JSON.stringify(gate) === '{}' ? 'empty' : 'other'),
          hasStat:!!(b && b.stat), abilOk: b ? ['STR','DEX','CON','INT','WIS','CHA'].includes(b.stat) : false,
          hasDc:typeof (b && b.dc) === 'number', noSkill: b ? !('skill' in b) : false,
          onPassK:b ? b.onPass.map(x => x.kind) : null, onFailLen:b ? b.onFail.length : null,
          mbHasLabel:mb ? ('label' in mb) : null };
      });
    });
    expect(errs).toEqual([]);
    expect(r.length).toBe(35);
    const gateShapes = { flags:0, empty:0 };
    for (const q of r) {
      expect(q.schema).toBe('UQF-1.0');
      expect(q.valid).toBe(true);
      expect(q.noAC).toBe(true);
      expect(['flags', 'empty']).toContain(q.gateShape);
      expect(q.hasStat).toBe(true);
      expect(q.abilOk).toBe(true);         // CLEAN family — stat is a real ability abbrev
      expect(q.noSkill).toBe(true);        // not §SKILLFIX-02 — no skill name retained
      expect(q.hasDc).toBe(true);
      expect(q.onFailLen).toBe(0);
      expect(q.onPassK).toEqual(['mission_bit']);
      expect(q.mbHasLabel).toBe(false);
      gateShapes[q.gateShape]++;
    }
    expect(gateShapes).toEqual({ flags:34, empty:1 });
  });

  test('PASS/FAIL parity across all 35 + gate behavior; every act grants a token on pass', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const seed = (k, v) => ({ [k]: v, [k.toLowerCase()]: v });
      const bhd = Object.values(QUEST_DB).filter(q => /^bhd_/.test(q.id) && q.type === 'skill_check');
      let passBad = [], failBad = [], gateBad = [];
      for (const q of bhd) {
        const b = q.bits.find(x => x.kind === 'skill_check');
        const mb = b.onPass.find(x => x.kind === 'mission_bit');
        const flag = mb ? mb.flag : null;
        // PASS
        S_story.abilityScores = seed(b.stat, 40);
        S_story.level = 20; S_story.xp = 0; S_story.gold = 0; S_story.inventory = [];
        if (flag) S_story[flag] = false;
        S_story.quests = { [q.id]:'active' };
        _rollCeremonia(q.id);
        const tok = S_story.inventory.find(i => i.flagRef === flag);
        if (!(S_story.quests[q.id] === 'done' && S_story[flag] === true && tok &&
              tok.name === _flagToLabel(flag) + ' Token' && tok.type === 'mission_bit' &&
              S_story.xp === 0 && S_story.gold === 0 && S_story.inventory.length === 1)) passBad.push(q.id);
        // FAIL
        S_story.abilityScores = seed(b.stat, -100);
        S_story.level = 1; S_story.day = 5; S_story.skillCheckAttempts = {};
        S_story.xp = 0; S_story.gold = 0; S_story.inventory = [];
        if (flag) S_story[flag] = false;
        S_story.quests = { [q.id]:'active' };
        _rollCeremonia(q.id);
        if (!(S_story.quests[q.id] === 'failed' && S_story[flag] === false && S_story.inventory.length === 0)) failBad.push(q.id);
        // GATE
        const g = q.gate || {};
        if (g.flags && g.flags.length) {
          const gf = g.flags[0];
          S_story[gf] = false; const c0 = QuestRuntime.canActivate(q.id);
          S_story[gf] = true;  const c1 = QuestRuntime.canActivate(q.id);
          if (!(c0 === false && c1 === true)) gateBad.push(q.id);
        } else if (QuestRuntime.canActivate(q.id) !== true) gateBad.push(q.id);
      }
      return { count:bhd.length, passBad, failBad, gateBad };
    });
    expect(r.count).toBe(35);
    expect(r.passBad).toEqual([]);
    expect(r.failBad).toEqual([]);
    expect(r.gateBad).toEqual([]);
  });
});

// §ARCH-01 Wave 2ag — sdq_* family (35 skill_check acts — 7 chapters × 5 acts,
// single `sdq_NN_actN` convention, `sdqCNAMDone` flags; Walter Scott's "Rob Roy"
// arc — Diana Vernon / Rashleigh / Osbaldistone Hall / the Ford of Aberfoil).
// THIRD head from the post-blq re-scope (twin of inv_*/bhd_*). STRUCTURAL TWIN of
// inv_*/bhd_*/gci_*/lcy_*/lgw_*: UNIFORM-flag — all 35 carry a checkPassFlag →
// onPass:[mission_bit{flag}] (0 flagless); gates form ONE linear 35-act chain
// (only sdq_01_act1 ungated; the other 34 trivial `()=>!!S_story.<priorFlag>` →
// gate:{flags:[…]}) ⇒ split {flags:34, empty:1}. UPPERCASE-checkStat (all six
// abilities CHA/CON/DEX/INT/STR/WIS); legacy raw-case read ⇒ silent +0 mod
// (§SKILLFIX-01), UQF lowercases ⇒ real mod; golden seeded under BOTH cases. CLEAN
// — `skill→ability mapped 0`, 0 skill-names, NOT §SKILLFIX-02. No type-gated
// siblings, no prefix bleed (all 35 `sdq_` ids are the migrated acts). Self-contained.
test.describe('§ARCH-01 Wave 2ag — sdq_* family (bulk-migrated, 35 acts; uniform flag-bearing)', () => {
  test('every sdq_* skill_check is UQF-1.0, validates, onFail:[], NO residual activateCond; onPass = mission_bit', async ({ page }) => {
    const errs = []; page.on('pageerror', e => errs.push(String(e)));
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const sdq = Object.values(QUEST_DB).filter(q => /^sdq_/.test(q.id) && q.type === 'skill_check');
      return sdq.map(q => {
        const b = (q.bits || []).find(x => x.kind === 'skill_check');
        const mb = b && b.onPass.find(x => x.kind === 'mission_bit');
        const gate = q.gate || {};
        return { id:q.id, schema:q.schema, valid:validateQuest(q).valid,
          noAC: typeof q.activateCond === 'undefined',
          gateShape: gate.flags ? 'flags' : (JSON.stringify(gate) === '{}' ? 'empty' : 'other'),
          hasStat:!!(b && b.stat), abilOk: b ? ['STR','DEX','CON','INT','WIS','CHA'].includes(b.stat) : false,
          hasDc:typeof (b && b.dc) === 'number', noSkill: b ? !('skill' in b) : false,
          onPassK:b ? b.onPass.map(x => x.kind) : null, onFailLen:b ? b.onFail.length : null,
          mbHasLabel:mb ? ('label' in mb) : null };
      });
    });
    expect(errs).toEqual([]);
    expect(r.length).toBe(35);
    const gateShapes = { flags:0, empty:0 };
    for (const q of r) {
      expect(q.schema).toBe('UQF-1.0');
      expect(q.valid).toBe(true);
      expect(q.noAC).toBe(true);
      expect(['flags', 'empty']).toContain(q.gateShape);
      expect(q.hasStat).toBe(true);
      expect(q.abilOk).toBe(true);         // CLEAN family — stat is a real ability abbrev
      expect(q.noSkill).toBe(true);        // not §SKILLFIX-02 — no skill name retained
      expect(q.hasDc).toBe(true);
      expect(q.onFailLen).toBe(0);
      expect(q.onPassK).toEqual(['mission_bit']);
      expect(q.mbHasLabel).toBe(false);
      gateShapes[q.gateShape]++;
    }
    expect(gateShapes).toEqual({ flags:34, empty:1 });
  });

  test('PASS/FAIL parity across all 35 + gate behavior; every act grants a token on pass', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const seed = (k, v) => ({ [k]: v, [k.toLowerCase()]: v });
      const sdq = Object.values(QUEST_DB).filter(q => /^sdq_/.test(q.id) && q.type === 'skill_check');
      let passBad = [], failBad = [], gateBad = [];
      for (const q of sdq) {
        const b = q.bits.find(x => x.kind === 'skill_check');
        const mb = b.onPass.find(x => x.kind === 'mission_bit');
        const flag = mb ? mb.flag : null;
        // PASS
        S_story.abilityScores = seed(b.stat, 40);
        S_story.level = 20; S_story.xp = 0; S_story.gold = 0; S_story.inventory = [];
        if (flag) S_story[flag] = false;
        S_story.quests = { [q.id]:'active' };
        _rollCeremonia(q.id);
        const tok = S_story.inventory.find(i => i.flagRef === flag);
        if (!(S_story.quests[q.id] === 'done' && S_story[flag] === true && tok &&
              tok.name === _flagToLabel(flag) + ' Token' && tok.type === 'mission_bit' &&
              S_story.xp === 0 && S_story.gold === 0 && S_story.inventory.length === 1)) passBad.push(q.id);
        // FAIL
        S_story.abilityScores = seed(b.stat, -100);
        S_story.level = 1; S_story.day = 5; S_story.skillCheckAttempts = {};
        S_story.xp = 0; S_story.gold = 0; S_story.inventory = [];
        if (flag) S_story[flag] = false;
        S_story.quests = { [q.id]:'active' };
        _rollCeremonia(q.id);
        if (!(S_story.quests[q.id] === 'failed' && S_story[flag] === false && S_story.inventory.length === 0)) failBad.push(q.id);
        // GATE
        const g = q.gate || {};
        if (g.flags && g.flags.length) {
          const gf = g.flags[0];
          S_story[gf] = false; const c0 = QuestRuntime.canActivate(q.id);
          S_story[gf] = true;  const c1 = QuestRuntime.canActivate(q.id);
          if (!(c0 === false && c1 === true)) gateBad.push(q.id);
        } else if (QuestRuntime.canActivate(q.id) !== true) gateBad.push(q.id);
      }
      return { count:sdq.length, passBad, failBad, gateBad };
    });
    expect(r.count).toBe(35);
    expect(r.passBad).toEqual([]);
    expect(r.failBad).toEqual([]);
    expect(r.gateBad).toEqual([]);
  });
});

// §ARCH-01 Wave 2ah — plw_* family (35 skill_check acts — 7 chapters × 5 acts,
// single `plw_NN_actN` convention, `plwCNAMDone` flags; Langland's "Piers Plowman"
// arc — the Pardon of Piers / the Daughters of God / Conscience / Unity's Gate).
// FOURTH head from the post-blq re-scope (twin of inv_*/bhd_*/sdq_*). STRUCTURAL
// TWIN of inv_*/bhd_*/sdq_*/gci_*/lcy_*/lgw_*: UNIFORM-flag — all 35 carry a
// checkPassFlag → onPass:[mission_bit{flag}] (0 flagless); gates form ONE linear
// 35-act chain (only plw_01_act1 ungated; the other 34 trivial
// `()=>!!S_story.<priorFlag>` → gate:{flags:[…]}) ⇒ split {flags:34, empty:1}.
// UPPERCASE-checkStat (CHA/CON/INT/STR/WIS); legacy raw-case read ⇒ silent +0 mod
// (§SKILLFIX-01), UQF lowercases ⇒ real mod; golden seeded under BOTH cases. CLEAN
// — `skill→ability mapped 0`, 0 skill-names, NOT §SKILLFIX-02. No type-gated
// siblings, no prefix bleed (all 35 `plw_` ids are the migrated acts). Self-contained.
test.describe('§ARCH-01 Wave 2ah — plw_* family (bulk-migrated, 35 acts; uniform flag-bearing)', () => {
  test('every plw_* skill_check is UQF-1.0, validates, onFail:[], NO residual activateCond; onPass = mission_bit', async ({ page }) => {
    const errs = []; page.on('pageerror', e => errs.push(String(e)));
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const plw = Object.values(QUEST_DB).filter(q => /^plw_/.test(q.id) && q.type === 'skill_check');
      return plw.map(q => {
        const b = (q.bits || []).find(x => x.kind === 'skill_check');
        const mb = b && b.onPass.find(x => x.kind === 'mission_bit');
        const gate = q.gate || {};
        return { id:q.id, schema:q.schema, valid:validateQuest(q).valid,
          noAC: typeof q.activateCond === 'undefined',
          gateShape: gate.flags ? 'flags' : (JSON.stringify(gate) === '{}' ? 'empty' : 'other'),
          hasStat:!!(b && b.stat), abilOk: b ? ['STR','DEX','CON','INT','WIS','CHA'].includes(b.stat) : false,
          hasDc:typeof (b && b.dc) === 'number', noSkill: b ? !('skill' in b) : false,
          onPassK:b ? b.onPass.map(x => x.kind) : null, onFailLen:b ? b.onFail.length : null,
          mbHasLabel:mb ? ('label' in mb) : null };
      });
    });
    expect(errs).toEqual([]);
    expect(r.length).toBe(35);
    const gateShapes = { flags:0, empty:0 };
    for (const q of r) {
      expect(q.schema).toBe('UQF-1.0');
      expect(q.valid).toBe(true);
      expect(q.noAC).toBe(true);
      expect(['flags', 'empty']).toContain(q.gateShape);
      expect(q.hasStat).toBe(true);
      expect(q.abilOk).toBe(true);         // CLEAN family — stat is a real ability abbrev
      expect(q.noSkill).toBe(true);        // not §SKILLFIX-02 — no skill name retained
      expect(q.hasDc).toBe(true);
      expect(q.onFailLen).toBe(0);
      expect(q.onPassK).toEqual(['mission_bit']);
      expect(q.mbHasLabel).toBe(false);
      gateShapes[q.gateShape]++;
    }
    expect(gateShapes).toEqual({ flags:34, empty:1 });
  });

  test('PASS/FAIL parity across all 35 + gate behavior; every act grants a token on pass', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const seed = (k, v) => ({ [k]: v, [k.toLowerCase()]: v });
      const plw = Object.values(QUEST_DB).filter(q => /^plw_/.test(q.id) && q.type === 'skill_check');
      let passBad = [], failBad = [], gateBad = [];
      for (const q of plw) {
        const b = q.bits.find(x => x.kind === 'skill_check');
        const mb = b.onPass.find(x => x.kind === 'mission_bit');
        const flag = mb ? mb.flag : null;
        // PASS
        S_story.abilityScores = seed(b.stat, 40);
        S_story.level = 20; S_story.xp = 0; S_story.gold = 0; S_story.inventory = [];
        if (flag) S_story[flag] = false;
        S_story.quests = { [q.id]:'active' };
        _rollCeremonia(q.id);
        const tok = S_story.inventory.find(i => i.flagRef === flag);
        if (!(S_story.quests[q.id] === 'done' && S_story[flag] === true && tok &&
              tok.name === _flagToLabel(flag) + ' Token' && tok.type === 'mission_bit' &&
              S_story.xp === 0 && S_story.gold === 0 && S_story.inventory.length === 1)) passBad.push(q.id);
        // FAIL
        S_story.abilityScores = seed(b.stat, -100);
        S_story.level = 1; S_story.day = 5; S_story.skillCheckAttempts = {};
        S_story.xp = 0; S_story.gold = 0; S_story.inventory = [];
        if (flag) S_story[flag] = false;
        S_story.quests = { [q.id]:'active' };
        _rollCeremonia(q.id);
        if (!(S_story.quests[q.id] === 'failed' && S_story[flag] === false && S_story.inventory.length === 0)) failBad.push(q.id);
        // GATE
        const g = q.gate || {};
        if (g.flags && g.flags.length) {
          const gf = g.flags[0];
          S_story[gf] = false; const c0 = QuestRuntime.canActivate(q.id);
          S_story[gf] = true;  const c1 = QuestRuntime.canActivate(q.id);
          if (!(c0 === false && c1 === true)) gateBad.push(q.id);
        } else if (QuestRuntime.canActivate(q.id) !== true) gateBad.push(q.id);
      }
      return { count:plw.length, passBad, failBad, gateBad };
    });
    expect(r.count).toBe(35);
    expect(r.passBad).toEqual([]);
    expect(r.failBad).toEqual([]);
    expect(r.gateBad).toEqual([]);
  });
});

// §ARCH-01 Wave 2ai — gdn_* family (35 skill_check acts — 7 chapters × 5 acts,
// single `gdn_NN_actN` convention, `gdnCNAMDone` flags; Njáls saga arc — Gunnar /
// Njáll's scribe / the Ice-Leap at Markfleet / the Fifth Court Gambit). FIFTH head
// from the post-blq re-scope (twin of inv_*/bhd_*/sdq_*/plw_*). STRUCTURAL TWIN of
// inv_*/bhd_*/sdq_*/plw_*/gci_*/lcy_*/lgw_*: UNIFORM-flag — all 35 carry a
// checkPassFlag → onPass:[mission_bit{flag}] (0 flagless); gates form ONE linear
// 35-act chain (only gdn_01_act1 ungated; the other 34 trivial
// `()=>!!S_story.<priorFlag>` → gate:{flags:[…]}) ⇒ split {flags:34, empty:1}.
// UPPERCASE-checkStat (CHA/CON/INT/STR/WIS); legacy raw-case read ⇒ silent +0 mod
// (§SKILLFIX-01), UQF lowercases ⇒ real mod; golden seeded under BOTH cases. CLEAN
// — `skill→ability mapped 0`, 0 skill-names, NOT §SKILLFIX-02. No type-gated
// siblings, no prefix bleed (all 35 `gdn_` ids are the migrated acts). Self-contained.
test.describe('§ARCH-01 Wave 2ai — gdn_* family (bulk-migrated, 35 acts; uniform flag-bearing)', () => {
  test('every gdn_* skill_check is UQF-1.0, validates, onFail:[], NO residual activateCond; onPass = mission_bit', async ({ page }) => {
    const errs = []; page.on('pageerror', e => errs.push(String(e)));
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const gdn = Object.values(QUEST_DB).filter(q => /^gdn_/.test(q.id) && q.type === 'skill_check');
      return gdn.map(q => {
        const b = (q.bits || []).find(x => x.kind === 'skill_check');
        const mb = b && b.onPass.find(x => x.kind === 'mission_bit');
        const gate = q.gate || {};
        return { id:q.id, schema:q.schema, valid:validateQuest(q).valid,
          noAC: typeof q.activateCond === 'undefined',
          gateShape: gate.flags ? 'flags' : (JSON.stringify(gate) === '{}' ? 'empty' : 'other'),
          hasStat:!!(b && b.stat), abilOk: b ? ['STR','DEX','CON','INT','WIS','CHA'].includes(b.stat) : false,
          hasDc:typeof (b && b.dc) === 'number', noSkill: b ? !('skill' in b) : false,
          onPassK:b ? b.onPass.map(x => x.kind) : null, onFailLen:b ? b.onFail.length : null,
          mbHasLabel:mb ? ('label' in mb) : null };
      });
    });
    expect(errs).toEqual([]);
    expect(r.length).toBe(35);
    const gateShapes = { flags:0, empty:0 };
    for (const q of r) {
      expect(q.schema).toBe('UQF-1.0');
      expect(q.valid).toBe(true);
      expect(q.noAC).toBe(true);
      expect(['flags', 'empty']).toContain(q.gateShape);
      expect(q.hasStat).toBe(true);
      expect(q.abilOk).toBe(true);         // CLEAN family — stat is a real ability abbrev
      expect(q.noSkill).toBe(true);        // not §SKILLFIX-02 — no skill name retained
      expect(q.hasDc).toBe(true);
      expect(q.onFailLen).toBe(0);
      expect(q.onPassK).toEqual(['mission_bit']);
      expect(q.mbHasLabel).toBe(false);
      gateShapes[q.gateShape]++;
    }
    expect(gateShapes).toEqual({ flags:34, empty:1 });
  });

  test('PASS/FAIL parity across all 35 + gate behavior; every act grants a token on pass', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const seed = (k, v) => ({ [k]: v, [k.toLowerCase()]: v });
      const gdn = Object.values(QUEST_DB).filter(q => /^gdn_/.test(q.id) && q.type === 'skill_check');
      let passBad = [], failBad = [], gateBad = [];
      for (const q of gdn) {
        const b = q.bits.find(x => x.kind === 'skill_check');
        const mb = b.onPass.find(x => x.kind === 'mission_bit');
        const flag = mb ? mb.flag : null;
        // PASS
        S_story.abilityScores = seed(b.stat, 40);
        S_story.level = 20; S_story.xp = 0; S_story.gold = 0; S_story.inventory = [];
        if (flag) S_story[flag] = false;
        S_story.quests = { [q.id]:'active' };
        _rollCeremonia(q.id);
        const tok = S_story.inventory.find(i => i.flagRef === flag);
        if (!(S_story.quests[q.id] === 'done' && S_story[flag] === true && tok &&
              tok.name === _flagToLabel(flag) + ' Token' && tok.type === 'mission_bit' &&
              S_story.xp === 0 && S_story.gold === 0 && S_story.inventory.length === 1)) passBad.push(q.id);
        // FAIL
        S_story.abilityScores = seed(b.stat, -100);
        S_story.level = 1; S_story.day = 5; S_story.skillCheckAttempts = {};
        S_story.xp = 0; S_story.gold = 0; S_story.inventory = [];
        if (flag) S_story[flag] = false;
        S_story.quests = { [q.id]:'active' };
        _rollCeremonia(q.id);
        if (!(S_story.quests[q.id] === 'failed' && S_story[flag] === false && S_story.inventory.length === 0)) failBad.push(q.id);
        // GATE
        const g = q.gate || {};
        if (g.flags && g.flags.length) {
          const gf = g.flags[0];
          S_story[gf] = false; const c0 = QuestRuntime.canActivate(q.id);
          S_story[gf] = true;  const c1 = QuestRuntime.canActivate(q.id);
          if (!(c0 === false && c1 === true)) gateBad.push(q.id);
        } else if (QuestRuntime.canActivate(q.id) !== true) gateBad.push(q.id);
      }
      return { count:gdn.length, passBad, failBad, gateBad };
    });
    expect(r.count).toBe(35);
    expect(r.passBad).toEqual([]);
    expect(r.failBad).toEqual([]);
    expect(r.gateBad).toEqual([]);
  });
});

// §ARCH-01 Wave 2aj — boo_* family (35 skill_check acts — 7 chapters × 5 acts,
// single `boo_NN_actN` convention, `booCNAMDone` flags; Prose Edda / Gylfaginning
// arc — Þökk's refusal to weep for Baldr / Loki's Capture / the Bound Fenrir
// (Gleipnir) / Draupnir's Return). SIXTH head from the post-blq re-scope (twin of
// inv_*/bhd_*/sdq_*/plw_*/gdn_*). STRUCTURAL TWIN of inv_*/…/gci_*/lcy_*/lgw_*:
// UNIFORM-flag — all 35 carry a checkPassFlag → onPass:[mission_bit{flag}]
// (0 flagless); gates form ONE linear 35-act chain (only boo_01_act1 ungated; the
// other 34 trivial `()=>!!S_story.<priorFlag>` → gate:{flags:[…]}) ⇒ split
// {flags:34, empty:1}. UPPERCASE-checkStat (all six abilities CHA/CON/DEX/INT/STR/
// WIS); legacy raw-case read ⇒ silent +0 mod (§SKILLFIX-01), UQF lowercases ⇒ real
// mod; golden seeded under BOTH cases. CLEAN — `skill→ability mapped 0`, 0 skill-
// names, NOT §SKILLFIX-02. No type-gated siblings, no prefix bleed. Self-contained.
test.describe('§ARCH-01 Wave 2aj — boo_* family (bulk-migrated, 35 acts; uniform flag-bearing)', () => {
  test('every boo_* skill_check is UQF-1.0, validates, onFail:[], NO residual activateCond; onPass = mission_bit', async ({ page }) => {
    const errs = []; page.on('pageerror', e => errs.push(String(e)));
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const boo = Object.values(QUEST_DB).filter(q => /^boo_/.test(q.id) && q.type === 'skill_check');
      return boo.map(q => {
        const b = (q.bits || []).find(x => x.kind === 'skill_check');
        const mb = b && b.onPass.find(x => x.kind === 'mission_bit');
        const gate = q.gate || {};
        return { id:q.id, schema:q.schema, valid:validateQuest(q).valid,
          noAC: typeof q.activateCond === 'undefined',
          gateShape: gate.flags ? 'flags' : (JSON.stringify(gate) === '{}' ? 'empty' : 'other'),
          hasStat:!!(b && b.stat), abilOk: b ? ['STR','DEX','CON','INT','WIS','CHA'].includes(b.stat) : false,
          hasDc:typeof (b && b.dc) === 'number', noSkill: b ? !('skill' in b) : false,
          onPassK:b ? b.onPass.map(x => x.kind) : null, onFailLen:b ? b.onFail.length : null,
          mbHasLabel:mb ? ('label' in mb) : null };
      });
    });
    expect(errs).toEqual([]);
    expect(r.length).toBe(35);
    const gateShapes = { flags:0, empty:0 };
    for (const q of r) {
      expect(q.schema).toBe('UQF-1.0');
      expect(q.valid).toBe(true);
      expect(q.noAC).toBe(true);
      expect(['flags', 'empty']).toContain(q.gateShape);
      expect(q.hasStat).toBe(true);
      expect(q.abilOk).toBe(true);         // CLEAN family — stat is a real ability abbrev
      expect(q.noSkill).toBe(true);        // not §SKILLFIX-02 — no skill name retained
      expect(q.hasDc).toBe(true);
      expect(q.onFailLen).toBe(0);
      expect(q.onPassK).toEqual(['mission_bit']);
      expect(q.mbHasLabel).toBe(false);
      gateShapes[q.gateShape]++;
    }
    expect(gateShapes).toEqual({ flags:34, empty:1 });
  });

  test('PASS/FAIL parity across all 35 + gate behavior; every act grants a token on pass', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const seed = (k, v) => ({ [k]: v, [k.toLowerCase()]: v });
      const boo = Object.values(QUEST_DB).filter(q => /^boo_/.test(q.id) && q.type === 'skill_check');
      let passBad = [], failBad = [], gateBad = [];
      for (const q of boo) {
        const b = q.bits.find(x => x.kind === 'skill_check');
        const mb = b.onPass.find(x => x.kind === 'mission_bit');
        const flag = mb ? mb.flag : null;
        // PASS
        S_story.abilityScores = seed(b.stat, 40);
        S_story.level = 20; S_story.xp = 0; S_story.gold = 0; S_story.inventory = [];
        if (flag) S_story[flag] = false;
        S_story.quests = { [q.id]:'active' };
        _rollCeremonia(q.id);
        const tok = S_story.inventory.find(i => i.flagRef === flag);
        if (!(S_story.quests[q.id] === 'done' && S_story[flag] === true && tok &&
              tok.name === _flagToLabel(flag) + ' Token' && tok.type === 'mission_bit' &&
              S_story.xp === 0 && S_story.gold === 0 && S_story.inventory.length === 1)) passBad.push(q.id);
        // FAIL
        S_story.abilityScores = seed(b.stat, -100);
        S_story.level = 1; S_story.day = 5; S_story.skillCheckAttempts = {};
        S_story.xp = 0; S_story.gold = 0; S_story.inventory = [];
        if (flag) S_story[flag] = false;
        S_story.quests = { [q.id]:'active' };
        _rollCeremonia(q.id);
        if (!(S_story.quests[q.id] === 'failed' && S_story[flag] === false && S_story.inventory.length === 0)) failBad.push(q.id);
        // GATE
        const g = q.gate || {};
        if (g.flags && g.flags.length) {
          const gf = g.flags[0];
          S_story[gf] = false; const c0 = QuestRuntime.canActivate(q.id);
          S_story[gf] = true;  const c1 = QuestRuntime.canActivate(q.id);
          if (!(c0 === false && c1 === true)) gateBad.push(q.id);
        } else if (QuestRuntime.canActivate(q.id) !== true) gateBad.push(q.id);
      }
      return { count:boo.length, passBad, failBad, gateBad };
    });
    expect(r.count).toBe(35);
    expect(r.passBad).toEqual([]);
    expect(r.failBad).toEqual([]);
    expect(r.gateBad).toEqual([]);
  });
});

// §ARCH-01 Wave 2ak — alf_* family (35 skill_check acts — 7 chapters × 5 acts,
// single `alf_NN_actN` convention, `alfCNAMDone` flags; Kalevala arc — Kullervo's
// Sword / the Sampo Fragment / the Kantele at the Bottom / Pohjola's Gate / the
// Origin-Words Tablet). SEVENTH head from the post-blq re-scope (twin of
// inv_*/bhd_*/sdq_*/plw_*/gdn_*/boo_*). STRUCTURAL TWIN of inv_*/…/gci_*/lcy_*/
// lgw_*: UNIFORM-flag — all 35 carry a checkPassFlag → onPass:[mission_bit{flag}]
// (0 flagless); gates form ONE linear 35-act chain (only alf_01_act1 ungated; the
// other 34 trivial `()=>!!S_story.<priorFlag>` → gate:{flags:[…]}) ⇒ split
// {flags:34, empty:1}. UPPERCASE-checkStat (CHA/CON/STR/WIS); legacy raw-case read
// ⇒ silent +0 mod (§SKILLFIX-01), UQF lowercases ⇒ real mod; golden seeded under
// BOTH cases. CLEAN — `skill→ability mapped 0`, 0 skill-names, NOT §SKILLFIX-02.
// No type-gated siblings, no prefix bleed (all 35 `alf_` ids migrated). Self-contained.
test.describe('§ARCH-01 Wave 2ak — alf_* family (bulk-migrated, 35 acts; uniform flag-bearing)', () => {
  test('every alf_* skill_check is UQF-1.0, validates, onFail:[], NO residual activateCond; onPass = mission_bit', async ({ page }) => {
    const errs = []; page.on('pageerror', e => errs.push(String(e)));
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const alf = Object.values(QUEST_DB).filter(q => /^alf_/.test(q.id) && q.type === 'skill_check');
      return alf.map(q => {
        const b = (q.bits || []).find(x => x.kind === 'skill_check');
        const mb = b && b.onPass.find(x => x.kind === 'mission_bit');
        const gate = q.gate || {};
        return { id:q.id, schema:q.schema, valid:validateQuest(q).valid,
          noAC: typeof q.activateCond === 'undefined',
          gateShape: gate.flags ? 'flags' : (JSON.stringify(gate) === '{}' ? 'empty' : 'other'),
          hasStat:!!(b && b.stat), abilOk: b ? ['STR','DEX','CON','INT','WIS','CHA'].includes(b.stat) : false,
          hasDc:typeof (b && b.dc) === 'number', noSkill: b ? !('skill' in b) : false,
          onPassK:b ? b.onPass.map(x => x.kind) : null, onFailLen:b ? b.onFail.length : null,
          mbHasLabel:mb ? ('label' in mb) : null };
      });
    });
    expect(errs).toEqual([]);
    expect(r.length).toBe(35);
    const gateShapes = { flags:0, empty:0 };
    for (const q of r) {
      expect(q.schema).toBe('UQF-1.0');
      expect(q.valid).toBe(true);
      expect(q.noAC).toBe(true);
      expect(['flags', 'empty']).toContain(q.gateShape);
      expect(q.hasStat).toBe(true);
      expect(q.abilOk).toBe(true);         // CLEAN family — stat is a real ability abbrev
      expect(q.noSkill).toBe(true);        // not §SKILLFIX-02 — no skill name retained
      expect(q.hasDc).toBe(true);
      expect(q.onFailLen).toBe(0);
      expect(q.onPassK).toEqual(['mission_bit']);
      expect(q.mbHasLabel).toBe(false);
      gateShapes[q.gateShape]++;
    }
    expect(gateShapes).toEqual({ flags:34, empty:1 });
  });

  test('PASS/FAIL parity across all 35 + gate behavior; every act grants a token on pass', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const seed = (k, v) => ({ [k]: v, [k.toLowerCase()]: v });
      const alf = Object.values(QUEST_DB).filter(q => /^alf_/.test(q.id) && q.type === 'skill_check');
      let passBad = [], failBad = [], gateBad = [];
      for (const q of alf) {
        const b = q.bits.find(x => x.kind === 'skill_check');
        const mb = b.onPass.find(x => x.kind === 'mission_bit');
        const flag = mb ? mb.flag : null;
        // PASS
        S_story.abilityScores = seed(b.stat, 40);
        S_story.level = 20; S_story.xp = 0; S_story.gold = 0; S_story.inventory = [];
        if (flag) S_story[flag] = false;
        S_story.quests = { [q.id]:'active' };
        _rollCeremonia(q.id);
        const tok = S_story.inventory.find(i => i.flagRef === flag);
        if (!(S_story.quests[q.id] === 'done' && S_story[flag] === true && tok &&
              tok.name === _flagToLabel(flag) + ' Token' && tok.type === 'mission_bit' &&
              S_story.xp === 0 && S_story.gold === 0 && S_story.inventory.length === 1)) passBad.push(q.id);
        // FAIL
        S_story.abilityScores = seed(b.stat, -100);
        S_story.level = 1; S_story.day = 5; S_story.skillCheckAttempts = {};
        S_story.xp = 0; S_story.gold = 0; S_story.inventory = [];
        if (flag) S_story[flag] = false;
        S_story.quests = { [q.id]:'active' };
        _rollCeremonia(q.id);
        if (!(S_story.quests[q.id] === 'failed' && S_story[flag] === false && S_story.inventory.length === 0)) failBad.push(q.id);
        // GATE
        const g = q.gate || {};
        if (g.flags && g.flags.length) {
          const gf = g.flags[0];
          S_story[gf] = false; const c0 = QuestRuntime.canActivate(q.id);
          S_story[gf] = true;  const c1 = QuestRuntime.canActivate(q.id);
          if (!(c0 === false && c1 === true)) gateBad.push(q.id);
        } else if (QuestRuntime.canActivate(q.id) !== true) gateBad.push(q.id);
      }
      return { count:alf.length, passBad, failBad, gateBad };
    });
    expect(r.count).toBe(35);
    expect(r.passBad).toEqual([]);
    expect(r.failBad).toEqual([]);
    expect(r.gateBad).toEqual([]);
  });
});

// §ARCH-01 Wave 2al — ksu_* family (35 skill_check acts — 7 chapters × 5 acts,
// single `ksu_NN_actN` convention, `ksuCNAMDone` flags; St. Olaf canonization arc
// (Óláfs saga helga) — the First Miracle / the Incorrupt Body / the Canonization
// Document / the Incorrupt Hair / Sigvat's Lament). EIGHTH head from the post-blq
// re-scope (twin of inv_*/bhd_*/sdq_*/plw_*/gdn_*/boo_*/alf_*). STRUCTURAL TWIN of
// inv_*/…/gci_*/lcy_*/lgw_*: UNIFORM-flag — all 35 carry a checkPassFlag →
// onPass:[mission_bit{flag}] (0 flagless); gates form ONE linear 35-act chain (only
// ksu_01_act1 ungated; the other 34 trivial `()=>!!S_story.<priorFlag>` →
// gate:{flags:[…]}) ⇒ split {flags:34, empty:1}. UPPERCASE-checkStat (CHA/CON/STR/
// WIS); legacy raw-case read ⇒ silent +0 mod (§SKILLFIX-01), UQF lowercases ⇒ real
// mod; golden seeded under BOTH cases. CLEAN — `skill→ability mapped 0`, 0 skill-
// names, NOT §SKILLFIX-02. No type-gated siblings, no prefix bleed. Self-contained.
test.describe('§ARCH-01 Wave 2al — ksu_* family (bulk-migrated, 35 acts; uniform flag-bearing)', () => {
  test('every ksu_* skill_check is UQF-1.0, validates, onFail:[], NO residual activateCond; onPass = mission_bit', async ({ page }) => {
    const errs = []; page.on('pageerror', e => errs.push(String(e)));
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const ksu = Object.values(QUEST_DB).filter(q => /^ksu_/.test(q.id) && q.type === 'skill_check');
      return ksu.map(q => {
        const b = (q.bits || []).find(x => x.kind === 'skill_check');
        const mb = b && b.onPass.find(x => x.kind === 'mission_bit');
        const gate = q.gate || {};
        return { id:q.id, schema:q.schema, valid:validateQuest(q).valid,
          noAC: typeof q.activateCond === 'undefined',
          gateShape: gate.flags ? 'flags' : (JSON.stringify(gate) === '{}' ? 'empty' : 'other'),
          hasStat:!!(b && b.stat), abilOk: b ? ['STR','DEX','CON','INT','WIS','CHA'].includes(b.stat) : false,
          hasDc:typeof (b && b.dc) === 'number', noSkill: b ? !('skill' in b) : false,
          onPassK:b ? b.onPass.map(x => x.kind) : null, onFailLen:b ? b.onFail.length : null,
          mbHasLabel:mb ? ('label' in mb) : null };
      });
    });
    expect(errs).toEqual([]);
    expect(r.length).toBe(35);
    const gateShapes = { flags:0, empty:0 };
    for (const q of r) {
      expect(q.schema).toBe('UQF-1.0');
      expect(q.valid).toBe(true);
      expect(q.noAC).toBe(true);
      expect(['flags', 'empty']).toContain(q.gateShape);
      expect(q.hasStat).toBe(true);
      expect(q.abilOk).toBe(true);         // CLEAN family — stat is a real ability abbrev
      expect(q.noSkill).toBe(true);        // not §SKILLFIX-02 — no skill name retained
      expect(q.hasDc).toBe(true);
      expect(q.onFailLen).toBe(0);
      expect(q.onPassK).toEqual(['mission_bit']);
      expect(q.mbHasLabel).toBe(false);
      gateShapes[q.gateShape]++;
    }
    expect(gateShapes).toEqual({ flags:34, empty:1 });
  });

  test('PASS/FAIL parity across all 35 + gate behavior; every act grants a token on pass', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const seed = (k, v) => ({ [k]: v, [k.toLowerCase()]: v });
      const ksu = Object.values(QUEST_DB).filter(q => /^ksu_/.test(q.id) && q.type === 'skill_check');
      let passBad = [], failBad = [], gateBad = [];
      for (const q of ksu) {
        const b = q.bits.find(x => x.kind === 'skill_check');
        const mb = b.onPass.find(x => x.kind === 'mission_bit');
        const flag = mb ? mb.flag : null;
        // PASS
        S_story.abilityScores = seed(b.stat, 40);
        S_story.level = 20; S_story.xp = 0; S_story.gold = 0; S_story.inventory = [];
        if (flag) S_story[flag] = false;
        S_story.quests = { [q.id]:'active' };
        _rollCeremonia(q.id);
        const tok = S_story.inventory.find(i => i.flagRef === flag);
        if (!(S_story.quests[q.id] === 'done' && S_story[flag] === true && tok &&
              tok.name === _flagToLabel(flag) + ' Token' && tok.type === 'mission_bit' &&
              S_story.xp === 0 && S_story.gold === 0 && S_story.inventory.length === 1)) passBad.push(q.id);
        // FAIL
        S_story.abilityScores = seed(b.stat, -100);
        S_story.level = 1; S_story.day = 5; S_story.skillCheckAttempts = {};
        S_story.xp = 0; S_story.gold = 0; S_story.inventory = [];
        if (flag) S_story[flag] = false;
        S_story.quests = { [q.id]:'active' };
        _rollCeremonia(q.id);
        if (!(S_story.quests[q.id] === 'failed' && S_story[flag] === false && S_story.inventory.length === 0)) failBad.push(q.id);
        // GATE
        const g = q.gate || {};
        if (g.flags && g.flags.length) {
          const gf = g.flags[0];
          S_story[gf] = false; const c0 = QuestRuntime.canActivate(q.id);
          S_story[gf] = true;  const c1 = QuestRuntime.canActivate(q.id);
          if (!(c0 === false && c1 === true)) gateBad.push(q.id);
        } else if (QuestRuntime.canActivate(q.id) !== true) gateBad.push(q.id);
      }
      return { count:ksu.length, passBad, failBad, gateBad };
    });
    expect(r.count).toBe(35);
    expect(r.passBad).toEqual([]);
    expect(r.failBad).toEqual([]);
    expect(r.gateBad).toEqual([]);
  });
});

// §ARCH-01 Wave 2am — cdg_* family (35 skill_check acts — 7 chapters × 5 acts,
// single `cdg_NN_actN` convention, `cdgCNAMDone` flags; The Three Musketeers /
// "The Affair of the Diamond Studs" arc (Dumas) — the Duke's Goodbye / the Convent
// Letter / the Cardinal's Sealed Order / the Goldsmith's Receipt / Athos's Past /
// Planchet's Loyalty / the Musketeers' Billet). NINTH head from the post-blq re-
// scope (twin of inv_*/bhd_*/sdq_*/plw_*/gdn_*/boo_*/alf_*/ksu_*). STRUCTURAL TWIN
// of inv_*/…/gci_*/lcy_*/lgw_*: UNIFORM-flag — all 35 carry a checkPassFlag →
// onPass:[mission_bit{flag}] (0 flagless); gates form ONE linear 35-act chain (only
// cdg_01_act1 ungated; the other 34 trivial `()=>!!S_story.<priorFlag>` →
// gate:{flags:[…]}, chaining act→act AND chapter→chapter) ⇒ split {flags:34,
// empty:1}. UPPERCASE-checkStat (STR/DEX/CON/WIS/CHA); legacy raw-case read ⇒
// silent +0 mod (§SKILLFIX-01), UQF lowercases ⇒ real mod; golden seeded under BOTH
// cases. CLEAN — `skill→ability mapped 0`, 0 skill-names, NOT §SKILLFIX-02. No
// type-gated siblings, no prefix bleed (all 35 `cdg_` ids migrated). Self-contained.
test.describe('§ARCH-01 Wave 2am — cdg_* family (bulk-migrated, 35 acts; uniform flag-bearing)', () => {
  test('every cdg_* skill_check is UQF-1.0, validates, onFail:[], NO residual activateCond; onPass = mission_bit', async ({ page }) => {
    const errs = []; page.on('pageerror', e => errs.push(String(e)));
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const cdg = Object.values(QUEST_DB).filter(q => /^cdg_/.test(q.id) && q.type === 'skill_check');
      return cdg.map(q => {
        const b = (q.bits || []).find(x => x.kind === 'skill_check');
        const mb = b && b.onPass.find(x => x.kind === 'mission_bit');
        const gate = q.gate || {};
        return { id:q.id, schema:q.schema, valid:validateQuest(q).valid,
          noAC: typeof q.activateCond === 'undefined',
          gateShape: gate.flags ? 'flags' : (JSON.stringify(gate) === '{}' ? 'empty' : 'other'),
          hasStat:!!(b && b.stat), abilOk: b ? ['STR','DEX','CON','INT','WIS','CHA'].includes(b.stat) : false,
          hasDc:typeof (b && b.dc) === 'number', noSkill: b ? !('skill' in b) : false,
          onPassK:b ? b.onPass.map(x => x.kind) : null, onFailLen:b ? b.onFail.length : null,
          mbHasLabel:mb ? ('label' in mb) : null };
      });
    });
    expect(errs).toEqual([]);
    expect(r.length).toBe(35);
    const gateShapes = { flags:0, empty:0 };
    for (const q of r) {
      expect(q.schema).toBe('UQF-1.0');
      expect(q.valid).toBe(true);
      expect(q.noAC).toBe(true);
      expect(['flags', 'empty']).toContain(q.gateShape);
      expect(q.hasStat).toBe(true);
      expect(q.abilOk).toBe(true);         // CLEAN family — stat is a real ability abbrev
      expect(q.noSkill).toBe(true);        // not §SKILLFIX-02 — no skill name retained
      expect(q.hasDc).toBe(true);
      expect(q.onFailLen).toBe(0);
      expect(q.onPassK).toEqual(['mission_bit']);
      expect(q.mbHasLabel).toBe(false);
      gateShapes[q.gateShape]++;
    }
    expect(gateShapes).toEqual({ flags:34, empty:1 });
  });

  test('PASS/FAIL parity across all 35 + gate behavior; every act grants a token on pass', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const seed = (k, v) => ({ [k]: v, [k.toLowerCase()]: v });
      const cdg = Object.values(QUEST_DB).filter(q => /^cdg_/.test(q.id) && q.type === 'skill_check');
      let passBad = [], failBad = [], gateBad = [];
      for (const q of cdg) {
        const b = q.bits.find(x => x.kind === 'skill_check');
        const mb = b.onPass.find(x => x.kind === 'mission_bit');
        const flag = mb ? mb.flag : null;
        // PASS
        S_story.abilityScores = seed(b.stat, 40);
        S_story.level = 20; S_story.xp = 0; S_story.gold = 0; S_story.inventory = [];
        if (flag) S_story[flag] = false;
        S_story.quests = { [q.id]:'active' };
        _rollCeremonia(q.id);
        const tok = S_story.inventory.find(i => i.flagRef === flag);
        if (!(S_story.quests[q.id] === 'done' && S_story[flag] === true && tok &&
              tok.name === _flagToLabel(flag) + ' Token' && tok.type === 'mission_bit' &&
              S_story.xp === 0 && S_story.gold === 0 && S_story.inventory.length === 1)) passBad.push(q.id);
        // FAIL
        S_story.abilityScores = seed(b.stat, -100);
        S_story.level = 1; S_story.day = 5; S_story.skillCheckAttempts = {};
        S_story.xp = 0; S_story.gold = 0; S_story.inventory = [];
        if (flag) S_story[flag] = false;
        S_story.quests = { [q.id]:'active' };
        _rollCeremonia(q.id);
        if (!(S_story.quests[q.id] === 'failed' && S_story[flag] === false && S_story.inventory.length === 0)) failBad.push(q.id);
        // GATE
        const g = q.gate || {};
        if (g.flags && g.flags.length) {
          const gf = g.flags[0];
          S_story[gf] = false; const c0 = QuestRuntime.canActivate(q.id);
          S_story[gf] = true;  const c1 = QuestRuntime.canActivate(q.id);
          if (!(c0 === false && c1 === true)) gateBad.push(q.id);
        } else if (QuestRuntime.canActivate(q.id) !== true) gateBad.push(q.id);
      }
      return { count:cdg.length, passBad, failBad, gateBad };
    });
    expect(r.count).toBe(35);
    expect(r.passBad).toEqual([]);
    expect(r.failBad).toEqual([]);
    expect(r.gateBad).toEqual([]);
  });
});

// §ARCH-01 Wave 2an — vie_* family (35 skill_check acts — 7 chapters × 5 acts,
// single `vie_NN_actN` convention, `vieCNAMDone` flags; Goethe's Faust arc —
// Margarete's Account / the Perjured Record / the Scholar's Confession / the
// Widow's Contract / the Mayor's Commission / the Wager's Record / the Undelivered
// Release). TENTH head from the post-blq re-scope (twin of inv_*/bhd_*/sdq_*/plw_*/
// gdn_*/boo_*/alf_*/ksu_*/cdg_*). STRUCTURAL TWIN of inv_*/…/gci_*/lcy_*/lgw_*:
// UNIFORM-flag — all 35 carry a checkPassFlag → onPass:[mission_bit{flag}] (0
// flagless); gates form ONE linear 35-act chain (only vie_01_act1 ungated; the
// other 34 trivial `()=>!!S_story.<priorFlag>` → gate:{flags:[…]}, chaining act→act
// AND chapter→chapter) ⇒ split {flags:34, empty:1}. UPPERCASE-checkStat (STR/DEX/
// CON/WIS/CHA); legacy raw-case read ⇒ silent +0 mod (§SKILLFIX-01), UQF lowercases
// ⇒ real mod; golden seeded under BOTH cases. CLEAN — `skill→ability mapped 0`, 0
// skill-names, NOT §SKILLFIX-02. No type-gated siblings, no prefix bleed. Self-contained.
test.describe('§ARCH-01 Wave 2an — vie_* family (bulk-migrated, 35 acts; uniform flag-bearing)', () => {
  test('every vie_* skill_check is UQF-1.0, validates, onFail:[], NO residual activateCond; onPass = mission_bit', async ({ page }) => {
    const errs = []; page.on('pageerror', e => errs.push(String(e)));
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const vie = Object.values(QUEST_DB).filter(q => /^vie_/.test(q.id) && q.type === 'skill_check');
      return vie.map(q => {
        const b = (q.bits || []).find(x => x.kind === 'skill_check');
        const mb = b && b.onPass.find(x => x.kind === 'mission_bit');
        const gate = q.gate || {};
        return { id:q.id, schema:q.schema, valid:validateQuest(q).valid,
          noAC: typeof q.activateCond === 'undefined',
          gateShape: gate.flags ? 'flags' : (JSON.stringify(gate) === '{}' ? 'empty' : 'other'),
          hasStat:!!(b && b.stat), abilOk: b ? ['STR','DEX','CON','INT','WIS','CHA'].includes(b.stat) : false,
          hasDc:typeof (b && b.dc) === 'number', noSkill: b ? !('skill' in b) : false,
          onPassK:b ? b.onPass.map(x => x.kind) : null, onFailLen:b ? b.onFail.length : null,
          mbHasLabel:mb ? ('label' in mb) : null };
      });
    });
    expect(errs).toEqual([]);
    expect(r.length).toBe(35);
    const gateShapes = { flags:0, empty:0 };
    for (const q of r) {
      expect(q.schema).toBe('UQF-1.0');
      expect(q.valid).toBe(true);
      expect(q.noAC).toBe(true);
      expect(['flags', 'empty']).toContain(q.gateShape);
      expect(q.hasStat).toBe(true);
      expect(q.abilOk).toBe(true);         // CLEAN family — stat is a real ability abbrev
      expect(q.noSkill).toBe(true);        // not §SKILLFIX-02 — no skill name retained
      expect(q.hasDc).toBe(true);
      expect(q.onFailLen).toBe(0);
      expect(q.onPassK).toEqual(['mission_bit']);
      expect(q.mbHasLabel).toBe(false);
      gateShapes[q.gateShape]++;
    }
    expect(gateShapes).toEqual({ flags:34, empty:1 });
  });

  test('PASS/FAIL parity across all 35 + gate behavior; every act grants a token on pass', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const seed = (k, v) => ({ [k]: v, [k.toLowerCase()]: v });
      const vie = Object.values(QUEST_DB).filter(q => /^vie_/.test(q.id) && q.type === 'skill_check');
      let passBad = [], failBad = [], gateBad = [];
      for (const q of vie) {
        const b = q.bits.find(x => x.kind === 'skill_check');
        const mb = b.onPass.find(x => x.kind === 'mission_bit');
        const flag = mb ? mb.flag : null;
        // PASS
        S_story.abilityScores = seed(b.stat, 40);
        S_story.level = 20; S_story.xp = 0; S_story.gold = 0; S_story.inventory = [];
        if (flag) S_story[flag] = false;
        S_story.quests = { [q.id]:'active' };
        _rollCeremonia(q.id);
        const tok = S_story.inventory.find(i => i.flagRef === flag);
        if (!(S_story.quests[q.id] === 'done' && S_story[flag] === true && tok &&
              tok.name === _flagToLabel(flag) + ' Token' && tok.type === 'mission_bit' &&
              S_story.xp === 0 && S_story.gold === 0 && S_story.inventory.length === 1)) passBad.push(q.id);
        // FAIL
        S_story.abilityScores = seed(b.stat, -100);
        S_story.level = 1; S_story.day = 5; S_story.skillCheckAttempts = {};
        S_story.xp = 0; S_story.gold = 0; S_story.inventory = [];
        if (flag) S_story[flag] = false;
        S_story.quests = { [q.id]:'active' };
        _rollCeremonia(q.id);
        if (!(S_story.quests[q.id] === 'failed' && S_story[flag] === false && S_story.inventory.length === 0)) failBad.push(q.id);
        // GATE
        const g = q.gate || {};
        if (g.flags && g.flags.length) {
          const gf = g.flags[0];
          S_story[gf] = false; const c0 = QuestRuntime.canActivate(q.id);
          S_story[gf] = true;  const c1 = QuestRuntime.canActivate(q.id);
          if (!(c0 === false && c1 === true)) gateBad.push(q.id);
        } else if (QuestRuntime.canActivate(q.id) !== true) gateBad.push(q.id);
      }
      return { count:vie.length, passBad, failBad, gateBad };
    });
    expect(r.count).toBe(35);
    expect(r.passBad).toEqual([]);
    expect(r.failBad).toEqual([]);
    expect(r.gateBad).toEqual([]);
  });
});

// §ARCH-01 Wave 2ao — erf_* family (35 skill_check acts — 7 chapters × 5 acts,
// single `erf_NN_actN` convention, `erfCNAMDone` flags; Brothers Grimm fairytale
// arc — Falada Speaks (the Goose Girl) / Faithful John / the Name in the Forest
// (Rumpelstiltskin) / the Third Task / Godfather's Ledger (Godfather Death) / the
// Bones' Song (the Singing Bone) / the Name in the Soup). ELEVENTH & LAST head of
// the post-blq 35-tier (twin of inv_*/bhd_*/sdq_*/plw_*/gdn_*/boo_*/alf_*/ksu_*/
// cdg_*/vie_*) — completes the 11-family CLEAN 35-tier. STRUCTURAL TWIN of inv_*/…/
// gci_*/lcy_*/lgw_*: UNIFORM-flag — all 35 carry a checkPassFlag →
// onPass:[mission_bit{flag}] (0 flagless); gates form ONE linear 35-act chain (only
// erf_01_act1 ungated; the other 34 trivial `()=>!!S_story.<priorFlag>` →
// gate:{flags:[…]}, chaining act→act AND chapter→chapter) ⇒ split {flags:34,
// empty:1}. UPPERCASE-checkStat (CHA/CON/STR/WIS); legacy raw-case read ⇒ silent +0
// mod (§SKILLFIX-01), UQF lowercases ⇒ real mod; golden seeded under BOTH cases.
// CLEAN — `skill→ability mapped 0`, 0 skill-names, NOT §SKILLFIX-02. No type-gated
// siblings, no prefix bleed (all 35 `erf_` ids migrated). Self-contained.
test.describe('§ARCH-01 Wave 2ao — erf_* family (bulk-migrated, 35 acts; uniform flag-bearing)', () => {
  test('every erf_* skill_check is UQF-1.0, validates, onFail:[], NO residual activateCond; onPass = mission_bit', async ({ page }) => {
    const errs = []; page.on('pageerror', e => errs.push(String(e)));
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const erf = Object.values(QUEST_DB).filter(q => /^erf_/.test(q.id) && q.type === 'skill_check');
      return erf.map(q => {
        const b = (q.bits || []).find(x => x.kind === 'skill_check');
        const mb = b && b.onPass.find(x => x.kind === 'mission_bit');
        const gate = q.gate || {};
        return { id:q.id, schema:q.schema, valid:validateQuest(q).valid,
          noAC: typeof q.activateCond === 'undefined',
          gateShape: gate.flags ? 'flags' : (JSON.stringify(gate) === '{}' ? 'empty' : 'other'),
          hasStat:!!(b && b.stat), abilOk: b ? ['STR','DEX','CON','INT','WIS','CHA'].includes(b.stat) : false,
          hasDc:typeof (b && b.dc) === 'number', noSkill: b ? !('skill' in b) : false,
          onPassK:b ? b.onPass.map(x => x.kind) : null, onFailLen:b ? b.onFail.length : null,
          mbHasLabel:mb ? ('label' in mb) : null };
      });
    });
    expect(errs).toEqual([]);
    expect(r.length).toBe(35);
    const gateShapes = { flags:0, empty:0 };
    for (const q of r) {
      expect(q.schema).toBe('UQF-1.0');
      expect(q.valid).toBe(true);
      expect(q.noAC).toBe(true);
      expect(['flags', 'empty']).toContain(q.gateShape);
      expect(q.hasStat).toBe(true);
      expect(q.abilOk).toBe(true);         // CLEAN family — stat is a real ability abbrev
      expect(q.noSkill).toBe(true);        // not §SKILLFIX-02 — no skill name retained
      expect(q.hasDc).toBe(true);
      expect(q.onFailLen).toBe(0);
      expect(q.onPassK).toEqual(['mission_bit']);
      expect(q.mbHasLabel).toBe(false);
      gateShapes[q.gateShape]++;
    }
    expect(gateShapes).toEqual({ flags:34, empty:1 });
  });

  test('PASS/FAIL parity across all 35 + gate behavior; every act grants a token on pass', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const seed = (k, v) => ({ [k]: v, [k.toLowerCase()]: v });
      const erf = Object.values(QUEST_DB).filter(q => /^erf_/.test(q.id) && q.type === 'skill_check');
      let passBad = [], failBad = [], gateBad = [];
      for (const q of erf) {
        const b = q.bits.find(x => x.kind === 'skill_check');
        const mb = b.onPass.find(x => x.kind === 'mission_bit');
        const flag = mb ? mb.flag : null;
        // PASS
        S_story.abilityScores = seed(b.stat, 40);
        S_story.level = 20; S_story.xp = 0; S_story.gold = 0; S_story.inventory = [];
        if (flag) S_story[flag] = false;
        S_story.quests = { [q.id]:'active' };
        _rollCeremonia(q.id);
        const tok = S_story.inventory.find(i => i.flagRef === flag);
        if (!(S_story.quests[q.id] === 'done' && S_story[flag] === true && tok &&
              tok.name === _flagToLabel(flag) + ' Token' && tok.type === 'mission_bit' &&
              S_story.xp === 0 && S_story.gold === 0 && S_story.inventory.length === 1)) passBad.push(q.id);
        // FAIL
        S_story.abilityScores = seed(b.stat, -100);
        S_story.level = 1; S_story.day = 5; S_story.skillCheckAttempts = {};
        S_story.xp = 0; S_story.gold = 0; S_story.inventory = [];
        if (flag) S_story[flag] = false;
        S_story.quests = { [q.id]:'active' };
        _rollCeremonia(q.id);
        if (!(S_story.quests[q.id] === 'failed' && S_story[flag] === false && S_story.inventory.length === 0)) failBad.push(q.id);
        // GATE
        const g = q.gate || {};
        if (g.flags && g.flags.length) {
          const gf = g.flags[0];
          S_story[gf] = false; const c0 = QuestRuntime.canActivate(q.id);
          S_story[gf] = true;  const c1 = QuestRuntime.canActivate(q.id);
          if (!(c0 === false && c1 === true)) gateBad.push(q.id);
        } else if (QuestRuntime.canActivate(q.id) !== true) gateBad.push(q.id);
      }
      return { count:erf.length, passBad, failBad, gateBad };
    });
    expect(r.count).toBe(35);
    expect(r.passBad).toEqual([]);
    expect(r.failBad).toEqual([]);
    expect(r.gateBad).toEqual([]);
  });
});
