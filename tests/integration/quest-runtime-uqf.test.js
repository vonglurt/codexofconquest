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
