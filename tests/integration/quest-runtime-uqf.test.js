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
    expect(r.kinds).toBe('_legacy_fn,choice,combat,favor,flag_write,item_check,item_remove,mission_bit,narrative,reward,skill_check,unlock');   // favor added in W7c
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

  test('adaptLegacyQuest is a §W7d no-op: identity passthrough for legacy AND UQF entries', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      // Pre-W7d this wrapped legacy entries in a '0.legacy' UQF shell; the shim is
      // retired with the legacy execution paths (nothing left to adapt).
      const legacy = { id:'quest_demo', type:'skill_check', title:'Demo',
        activateNode:'DK', activateCond:()=>true,
        checkAbility:'wis', checkLabel:'Insight', checkDC:13,
        onPass:(S)=>{ S.demoPassed = true; }, onFail:(S)=>{}, retryable:false };
      const uqf = { schema:'UQF-1.0', id:'x' };
      return {
        stillExported: typeof adaptLegacyQuest === 'function' && QuestRuntime.adaptLegacyQuest === adaptLegacyQuest,
        legacyIdentity: adaptLegacyQuest('quest_demo', legacy) === legacy,   // returned unwrapped
        uqfIdentity: adaptLegacyQuest('x', uqf) === uqf,
      };
    });
    expect(r.stillExported).toBe(true);
    expect(r.legacyIdentity).toBe(true);
    expect(r.uqfIdentity).toBe(true);
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

  test('§W7d: the legacy roll path is RETIRED — a non-UQF skill_check roll is a warned no-op', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      S_story.quests = {}; S_story.abilityScores = { wis:14 }; S_story.level = 1; S_story.xp = 0; S_story.day = 1;
      S_story.inventory = []; delete S_story.__legacyDone;
      // Pre-W7d this DC-1 legacy quest resolved to 'done' + flag + xp on the legacy
      // branch. The branch is retired: no state may change.
      QUEST_DB.__legacy = { id:'__legacy', type:'skill_check', title:'Legacy Demo', activateNode:'DK',
        checkAbility:'wis', checkLabel:'Insight', checkDC:1, checkPassFlag:'__legacyDone',
        xpAward:10, passText:'legacy pass', failText:'legacy fail', retryable:false };
      S_story.quests.__legacy = 'active';
      const warns = [];
      const origWarn = console.warn; console.warn = (...a) => warns.push(a.join(' '));
      _rollCeremonia('__legacy');
      console.warn = origWarn;
      const out = {
        status: S_story.quests.__legacy,         // untouched — still active
        legacyFlag: S_story.__legacyDone,        // never granted
        xp: S_story.xp,                          // never awarded
        warned: warns.some(w => /legacy roll path retired/.test(w) && /__legacy/.test(w)),
      };
      delete QUEST_DB.__legacy;
      return out;
    });
    expect(r.status).toBe('active');
    expect(r.legacyFlag).toBeUndefined();
    expect(r.xp).toBe(0);
    expect(r.warned).toBe(true);
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
      return { sc, side:{ schema:side.schema, valid:validateQuest(side).valid, completion:!!(side.completion&&side.completion.flags), bits:side.bits.length, onComplete:Array.isArray(side.onComplete) } };
    }, SKILL);
    expect(r.sc.every(x => x.schema==='UQF-1.0' && x.valid && x.bit==='skill_check' && x.hasLegacy)).toBe(true);
    expect(r.sc).toMatchObject([
      { id:'quest_whisper_01', stat:'WIS', dc:12, xp:150 },
      { id:'quest_whisper_02', stat:'INT', dc:13, xp:175 },
      { id:'quest_whisper_03', stat:'WIS', dc:12, xp:175 },
      { id:'quest_whisper_04', stat:'WIS', dc:14, xp:200 },
      { id:'quest_whisper_06', stat:'CHA', dc:13, xp:225 },
    ]);
    // side quest: declarative completion gate, empty bits, onComplete is a W7b completion bit chain
    expect(r.side).toMatchObject({ schema:'UQF-1.0', valid:true, completion:true, bits:0, onComplete:true });
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
               bits:s6.bits.length, onComplete:Array.isArray(s6.onComplete) } };
    }, SKILL);
    expect(r.sc.every(x => x.schema==='UQF-1.0' && x.valid && x.hasLegacy)).toBe(true);
    expect(r.sc).toMatchObject([
      { id:'quest_glut_01', stat:'WIS', dc:13, xp:150 },
      { id:'quest_glut_02', stat:'CHA', dc:13, xp:175 },
      { id:'quest_glut_03', stat:'INT', dc:14, xp:200 },
      { id:'quest_glut_04', stat:'WIS', dc:13, xp:200 },
      { id:'quest_glut_05', stat:'WIS', dc:15, xp:225 },
    ]);
    // side quest: FLAG activation gate + flag completion gate, onComplete is a W7b bit chain
    expect(r.side).toMatchObject({ schema:'UQF-1.0', valid:true, gateFlags:['glut_gift_held'],
      completionFlags:['glutGiftReturned'], bits:0, onComplete:true });
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
               hasOnComplete:Array.isArray(q.onComplete) };
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
               hasOnComplete:Array.isArray(q.onComplete) };
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
               completion:JSON.stringify(q.completion), hasOnComplete:Array.isArray(q.onComplete),
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
// 'fight' (the branch fallthrough — then sb_fight's gate activates). sb_fight
// formerly carried BOTH onComplete(+400xp) AND xpAward:400 → a latent +800xp
// double-count; the redundant top-level xpAward was removed 2026-07-07 (open-gaps
// item 4), leaving the onComplete reward{xp:400} as the sole vector → +400 total.

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

  test('sb_fight onComplete grants +400xp + Letter of Marque + sbResolved (double-count fixed: xpAward removed → +400 total, not +800)', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      S_story.xp = 0; S_story.gold = 0; S_story.inventory = []; S_story.sbResolved = false;
      QuestRuntime.execBits(QUEST_DB.quest_sb_fight.onComplete, {});   // the bit-chain portion only (W7b)
      return { xp:S_story.xp, gold:S_story.gold, resolved:S_story.sbResolved,
               letter:S_story.inventory.some(i=>i.name==='Letter of Marque (Keel)'),
               xpAward:QUEST_DB.quest_sb_fight.xpAward };
    });
    expect(r.xp).toBe(400); expect(r.gold).toBe(200); expect(r.resolved).toBe(true); expect(r.letter).toBe(true);
    expect(r.xpAward).toBeUndefined();   // redundant xpAward removed 2026-07-07 — the side-quest engine path no longer double-adds
  });
});

// ── §ARCH-01 Wave 1o — Lake/Relay Monster Hunt arcs (quest_hunt_* / quest_hunt2_*) ──
//
// Two structurally identical investigate→clear arcs: hunt2 (Night Hag relay
// road, WRO→BNX) and hunt (lake drowners, HFT→VAW). Each: structural hook side
// (_01, gate:{}), 2 retryable:false skill_checks (_02/_03, checkStat → pure
// parity, mission_bit{flag}+onPass/onFail _legacy_fn), and a lair-clear side
// (_04, battle completion). hunt_04/hunt2_04 formerly shared the sb_fight latent
// double-count (onComplete +Nxp ∧ xpAward:N) — the redundant xpAward was removed
// 2026-07-07 (open-gaps item 4), so onComplete reward{xp} is now the sole vector.

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
        return { id, schema:q.schema, valid:validateQuest(q).valid, gate:JSON.stringify(q.gate), completion:JSON.stringify(q.completion), onComplete:Array.isArray(q.onComplete) };
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

  test('lair-clear onComplete closures grant item + knowledge + gold/xp (double-count fixed: xpAward removed → single-count)', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const run = (id) => {
        S_story.xp = 0; S_story.gold = 0; S_story.inventory = []; S_story.knowledge = [];
        QuestRuntime.execBits(QUEST_DB[id].onComplete, {});   // W7b bit chain
        return { xp:S_story.xp, gold:S_story.gold, knowledge:S_story.knowledge.length, inv:S_story.inventory.map(i=>i.name), xpAward:QUEST_DB[id].xpAward };
      };
      return { hag:run('quest_hunt2_04'), den:run('quest_hunt_04') };
    });
    expect(r.hag.xp).toBe(600); expect(r.hag.gold).toBe(400); expect(r.hag.knowledge).toBe(1);
    expect(r.hag.inv).toContain('Relay Station Token'); expect(r.hag.xpAward).toBeUndefined();  // xpAward removed — no second +600
    expect(r.den.xp).toBe(500); expect(r.den.gold).toBe(500); expect(r.den.knowledge).toBe(1);
    expect(r.den.inv).toContain('Drowned Compass'); expect(r.den.xpAward).toBeUndefined();      // xpAward removed — no second +500
  });
});

// ── §ARCH-01 Wave 1p — Bilge Mystery (§WHODUNIT-01, quest_bilge_01..04) ──
//
// Same investigate→clear shape as the hunt arcs: hook side (_01, flag gate),
// 2 retryable:false checkStat skill_checks (_02 INT Investigation DC12, _03 WIS
// Insight DC13; mission_bit{flag} no-label + onPass/onFail _legacy_fn), lair-clear
// side (_04, battle completion + verbatim onComplete). bilge_04 formerly shared
// the sb_fight/hunt_04 latent double-count (onComplete +600 ∧ xpAward:600 → +1200xp);
// xpAward removed 2026-07-07 (open-gaps item 4) → onComplete +600 is the sole vector.

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
        return { id, schema:q.schema, valid:validateQuest(q).valid, gate:JSON.stringify(q.gate), completion:JSON.stringify(q.completion), onComplete:Array.isArray(q.onComplete) };
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

  test('bilge_04 onComplete: +600gp/+600xp + Sea Spawn Scale Fragment + knowledge + solved flag (double-count fixed: xpAward removed → +600, not +1200)', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      S_story.xp = 0; S_story.gold = 0; S_story.inventory = []; S_story.knowledge = []; S_story.whodunit2Solved = false;
      QuestRuntime.execBits(QUEST_DB.quest_bilge_04.onComplete, {});   // W7b bit chain
      return { xp:S_story.xp, gold:S_story.gold, knowledge:S_story.knowledge.length, solved:S_story.whodunit2Solved,
               frag:S_story.inventory.some(i=>i.name==='Sea Spawn Scale Fragment'), xpAward:QUEST_DB.quest_bilge_04.xpAward };
    });
    expect(r.xp).toBe(600); expect(r.gold).toBe(600); expect(r.knowledge).toBe(1);
    expect(r.solved).toBe(true); expect(r.frag).toBe(true); expect(r.xpAward).toBeUndefined();  // xpAward removed — no second +600 on completion
  });
});

// ── open-gaps item 3 — dead skill_check '=== complete' gate on the mimic rename ──
//
// quest_d0208_a5 (Mimic Meadows Act V) is a skill_check: on PASS the resolver sets
// S_story.quests[id]='done' (L6647) — skill_checks never reach 'complete'. The LIM
// (Mimic Meadows) render gated the "name your mimic" prompt on '=== complete', so it
// was dead — the player could never rename the Baby Mimic. Fixed to '=== done'.
test.describe('open-gaps item 3 — mimic rename prompt (skill_check terminal is "done")', () => {
  test('LIM render shows the rename prompt when d0208_a5 is done + still named Baby Mimic; hidden while active', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const renderWith = (status) => {
        S_story.currentCode = 'LIM';
        S_story.quests = { quest_d0208_a5: status };
        S_story.mimicPetName = 'Baby Mimic';
        const old = document.getElementById('mm-panel'); if (old) old.remove();
        storyRender(NODE_MAP['LIM']);
        const panel = document.getElementById('mm-panel');
        return panel ? panel.innerHTML : '';
      };
      return {
        doneShowsPrompt:   renderWith('done').includes('Give a name'),
        activeHidesPrompt: renderWith('active').includes('Give a name'),
        // the old buggy value must NOT satisfy the gate — proves the terminal is 'done', not 'complete'
        completeHidesPrompt: renderWith('complete').includes('Give a name'),
      };
    });
    expect(r.doneShowsPrompt).toBe(true);
    expect(r.activeHidesPrompt).toBe(false);
    expect(r.completeHidesPrompt).toBe(false);
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
        return { id, schema:q.schema, type:q.type, valid:validateQuest(q).valid, gate:JSON.stringify(q.gate), completion:JSON.stringify(q.completion), onComplete:Array.isArray(q.onComplete) };
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
  { id:'quest_df_02', stat:'wis', skill:'Insight',    dc:11, flag:'dfBarterLearned',    token:'DF Barter Learned Token',   /* §MBIT-02 expander: df → DF */    gateFlag:'dunfallAccessed',  gold:100, xp:250, item:'Highland Herb Pouch' },
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

// §ARCH-01 Wave 2ap — mla_* family (34 skill_check acts across 7 sub-arcs:
// mla001 ×5, mla002 ×4 [no act4], mla02/mla03/mla04/mla05/mla06 ×5 each — a
// Renaissance/classical-lives arc, "The Comparisons" / Tiro / Alcibiades /
// Gracchus). FIRST head of the post-35-tier CLEAN mid-tail. UNIFORM-flag — all 34
// carry a checkPassFlag → onPass:[mission_bit{flag}] (0 flagless). Gates form ONE
// cross-arc linear chain (only mla001_act1 ungated; the other 33 trivial
// `()=>!!S_story.<priorFlag>` → gate:{flags:[…]}, chaining act→act AND arc→arc via
// inter-arc completion flags) ⇒ split {flags:33, empty:1}. LOWERCASE-checkStat
// (dex/cha/int/wis — 4 abilities present) ⇒ legacy reads real mod (no §SKILLFIX-01
// silent +0); golden seeded under BOTH cases anyway. CLEAN — `skill→ability mapped
// 0`, 0 skill-names, NOT §SKILLFIX-02. No type-gated siblings, no prefix bleed (all
// 34 `mla` skill_checks migrated). Self-contained.
test.describe('§ARCH-01 Wave 2ap — mla_* family (bulk-migrated, 34 acts; uniform flag-bearing)', () => {
  test('every mla* skill_check is UQF-1.0, validates, onFail:[], NO residual activateCond; onPass = mission_bit', async ({ page }) => {
    const errs = []; page.on('pageerror', e => errs.push(String(e)));
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const mla = Object.values(QUEST_DB).filter(q => /^mla/.test(q.id) && q.type === 'skill_check');
      return mla.map(q => {
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
    expect(r.length).toBe(34);
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
    expect(gateShapes).toEqual({ flags:33, empty:1 });
  });

  test('PASS/FAIL parity across all 34 + gate behavior; every act grants a token on pass', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const seed = (k, v) => ({ [k]: v, [k.toLowerCase()]: v });
      const mla = Object.values(QUEST_DB).filter(q => /^mla/.test(q.id) && q.type === 'skill_check');
      let passBad = [], failBad = [], gateBad = [];
      for (const q of mla) {
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
      return { count:mla.length, passBad, failBad, gateBad };
    });
    expect(r.count).toBe(34);
    expect(r.passBad).toEqual([]);
    expect(r.failBad).toEqual([]);
    expect(r.gateBad).toEqual([]);
  });
});

// §ARCH-01 Wave 2aq — mse_* family (34 skill_check acts — 7 chapters × 5 acts,
// single `mse_cNaM` ids; a Theseus/tournament classical arc). SECOND head of the
// CLEAN mid-tail. UNIFORM-flag — all 34 carry a checkPassFlag →
// onPass:[mission_bit{flag}] (0 flagless). Gates form SEVEN per-chapter internal
// chains (each chapter's act1 ungated → 7 `gate:{}`; the other 27 trivial
// `()=>!!S_story.<priorFlag>` → gate:{flags:[…]}, chaining act→act WITHIN a chapter)
// ⇒ split {flags:27, empty:7}. UPPERCASE-checkStat (CHA/CON/INT/STR/WIS — 5
// abilities, no DEX); legacy raw-case read ⇒ silent +0 mod (§SKILLFIX-01), UQF
// lowercases ⇒ real mod; golden seeded under BOTH cases. CLEAN — `skill→ability
// mapped 0`, 0 skill-names, NOT §SKILLFIX-02. ONE combat type-gated sibling
// (`mse_c2a4`, correctly skipped — skill_check filter excludes it, so chapter 2 has
// 4 skill_check acts a1/a2/a3/a5). No prefix bleed. Self-contained.
test.describe('§ARCH-01 Wave 2aq — mse_* family (bulk-migrated, 34 acts; uniform flag-bearing)', () => {
  test('every mse_* skill_check is UQF-1.0, validates, onFail:[], NO residual activateCond; onPass = mission_bit', async ({ page }) => {
    const errs = []; page.on('pageerror', e => errs.push(String(e)));
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const mse = Object.values(QUEST_DB).filter(q => /^mse_/.test(q.id) && q.type === 'skill_check');
      return mse.map(q => {
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
    expect(r.length).toBe(34);
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
    expect(gateShapes).toEqual({ flags:27, empty:7 });
  });

  test('PASS/FAIL parity across all 34 + gate behavior; every act grants a token on pass', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const seed = (k, v) => ({ [k]: v, [k.toLowerCase()]: v });
      const mse = Object.values(QUEST_DB).filter(q => /^mse_/.test(q.id) && q.type === 'skill_check');
      let passBad = [], failBad = [], gateBad = [];
      for (const q of mse) {
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
      return { count:mse.length, passBad, failBad, gateBad };
    });
    expect(r.count).toBe(34);
    expect(r.passBad).toEqual([]);
    expect(r.failBad).toEqual([]);
    expect(r.gateBad).toEqual([]);
  });
});

// §ARCH-01 Wave 2ar — lhr_* family (34 skill_check acts — 7 chapters × 5 acts,
// single `lhr_NN_actN` ids). THIRD head of the CLEAN mid-tail; STRUCTURAL TWIN of
// mse_*. UNIFORM-flag — all 34 carry a checkPassFlag → onPass:[mission_bit{flag}]
// (0 flagless). Gates form SEVEN per-chapter internal chains (each chapter's act1
// ungated → 7 `gate:{}`; the other 27 trivial `()=>!!S_story.<priorFlag>` →
// gate:{flags:[…]}, chaining act→act WITHIN a chapter, NO cross-chapter chain) ⇒
// split {flags:27, empty:7}. UPPERCASE-checkStat (CHA/INT/STR/WIS — 4 abilities, no
// DEX/CON); legacy raw-case read ⇒ silent +0 mod (§SKILLFIX-01), UQF lowercases ⇒
// real mod; golden seeded under BOTH cases. CLEAN — `skill→ability mapped 0`, 0
// skill-names, NOT §SKILLFIX-02. ONE combat type-gated sibling (`lhr_02_act2`,
// correctly skipped — skill_check filter excludes it, so chapter 2 has 4
// skill_check acts a1/a3/a4/a5). No prefix bleed. Self-contained.
test.describe('§ARCH-01 Wave 2ar — lhr_* family (bulk-migrated, 34 acts; uniform flag-bearing)', () => {
  test('every lhr_* skill_check is UQF-1.0, validates, onFail:[], NO residual activateCond; onPass = mission_bit', async ({ page }) => {
    const errs = []; page.on('pageerror', e => errs.push(String(e)));
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const lhr = Object.values(QUEST_DB).filter(q => /^lhr_/.test(q.id) && q.type === 'skill_check');
      return lhr.map(q => {
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
    expect(r.length).toBe(34);
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
    expect(gateShapes).toEqual({ flags:27, empty:7 });
  });

  test('PASS/FAIL parity across all 34 + gate behavior; every act grants a token on pass', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const seed = (k, v) => ({ [k]: v, [k.toLowerCase()]: v });
      const lhr = Object.values(QUEST_DB).filter(q => /^lhr_/.test(q.id) && q.type === 'skill_check');
      let passBad = [], failBad = [], gateBad = [];
      for (const q of lhr) {
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
      return { count:lhr.length, passBad, failBad, gateBad };
    });
    expect(r.count).toBe(34);
    expect(r.passBad).toEqual([]);
    expect(r.failBad).toEqual([]);
    expect(r.gateBad).toEqual([]);
  });
});

// §ARCH-01 Wave 2as — cid_* family (34 skill_check acts — 7 chapters × 5 acts,
// single `cid_cNaM` ids). FOURTH head of the CLEAN mid-tail; STRUCTURAL TWIN of
// mse_*/lhr_*. UNIFORM-flag — all 34 carry a checkPassFlag →
// onPass:[mission_bit{flag}] (0 flagless). Gates form SEVEN per-chapter internal
// chains (each chapter's act1 ungated → 7 `gate:{}`; the other 27 trivial
// `()=>!!S_story.<priorFlag>` → gate:{flags:[…]}, chaining act→act WITHIN a chapter)
// ⇒ split {flags:27, empty:7}. UPPERCASE-checkStat, ALL SIX abilities
// (CHA/CON/DEX/INT/STR/WIS); legacy raw-case read ⇒ silent +0 mod (§SKILLFIX-01),
// UQF lowercases ⇒ real mod; golden seeded under BOTH cases. CLEAN — `skill→ability
// mapped 0`, 0 skill-names, NOT §SKILLFIX-02. ONE combat type-gated sibling
// (`cid_c2a4`, correctly skipped — skill_check filter excludes it, so chapter 2 has
// 4 skill_check acts a1/a2/a3/a5). No prefix bleed. Self-contained.
test.describe('§ARCH-01 Wave 2as — cid_* family (bulk-migrated, 34 acts; uniform flag-bearing)', () => {
  test('every cid_* skill_check is UQF-1.0, validates, onFail:[], NO residual activateCond; onPass = mission_bit', async ({ page }) => {
    const errs = []; page.on('pageerror', e => errs.push(String(e)));
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const cid = Object.values(QUEST_DB).filter(q => /^cid_/.test(q.id) && q.type === 'skill_check');
      return cid.map(q => {
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
    expect(r.length).toBe(34);
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
    expect(gateShapes).toEqual({ flags:27, empty:7 });
  });

  test('PASS/FAIL parity across all 34 + gate behavior; every act grants a token on pass', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const seed = (k, v) => ({ [k]: v, [k.toLowerCase()]: v });
      const cid = Object.values(QUEST_DB).filter(q => /^cid_/.test(q.id) && q.type === 'skill_check');
      let passBad = [], failBad = [], gateBad = [];
      for (const q of cid) {
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
      return { count:cid.length, passBad, failBad, gateBad };
    });
    expect(r.count).toBe(34);
    expect(r.passBad).toEqual([]);
    expect(r.failBad).toEqual([]);
    expect(r.gateBad).toEqual([]);
  });
});

// §ARCH-01 Wave 2at — lbc_* family (33 skill_check acts — 7 chapters × 5 acts
// minus 2 hybrid siblings, single `lbc_cNaM` ids). FIFTH head of the CLEAN
// mid-tail; STRUCTURAL TWIN of mse_*/lhr_*/cid_* (per-chapter chains). UNIFORM-flag
// — all 33 carry a checkPassFlag → onPass:[mission_bit{flag}] (0 flagless). Gates
// form SEVEN per-chapter internal chains (each chapter's act1 ungated → 7 `gate:{}`;
// the other 26 trivial `()=>!!S_story.<priorFlag>` → gate:{flags:[…]}, chaining
// act→act WITHIN a chapter) ⇒ split {flags:26, empty:7}. UPPERCASE-checkStat, ALL
// SIX abilities (CHA/CON/DEX/INT/STR/WIS); legacy raw-case read ⇒ silent +0 mod
// (§SKILLFIX-01), UQF lowercases ⇒ real mod; golden seeded under BOTH cases. CLEAN
// — `skill→ability mapped 0`, 0 skill-names, NOT §SKILLFIX-02. TWO `hybrid`
// type-gated siblings (`lbc_c1a3`, `lbc_c5a4`, correctly skipped — skill_check
// filter excludes them, so c1 has acts a1/a2/a4/a5 and c5 has a1/a2/a3/a5). No
// prefix bleed. Self-contained.
test.describe('§ARCH-01 Wave 2at — lbc_* family (bulk-migrated, 33 acts; uniform flag-bearing)', () => {
  test('every lbc_* skill_check is UQF-1.0, validates, onFail:[], NO residual activateCond; onPass = mission_bit', async ({ page }) => {
    const errs = []; page.on('pageerror', e => errs.push(String(e)));
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const lbc = Object.values(QUEST_DB).filter(q => /^lbc_/.test(q.id) && q.type === 'skill_check');
      return lbc.map(q => {
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
    expect(r.length).toBe(33);
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
    expect(gateShapes).toEqual({ flags:26, empty:7 });
  });

  test('PASS/FAIL parity across all 33 + gate behavior; every act grants a token on pass', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const seed = (k, v) => ({ [k]: v, [k.toLowerCase()]: v });
      const lbc = Object.values(QUEST_DB).filter(q => /^lbc_/.test(q.id) && q.type === 'skill_check');
      let passBad = [], failBad = [], gateBad = [];
      for (const q of lbc) {
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
      return { count:lbc.length, passBad, failBad, gateBad };
    });
    expect(r.count).toBe(33);
    expect(r.passBad).toEqual([]);
    expect(r.failBad).toEqual([]);
    expect(r.gateBad).toEqual([]);
  });
});

// §ARCH-01 Wave 2au — hty_* family (33 skill_check acts — 7 chapters × 5 acts
// minus 2 combat siblings, no-underscore `htyNN_actN` ids). SIXTH head of the CLEAN
// mid-tail; FIRST MIXED flag/flagless mid-tail family. 26 acts carry a
// checkPassFlag → onPass:[mission_bit{flag}]; 7 acts (each chapter's act5 finale)
// have NO checkPassFlag → onPass:[] (legacy pass→done granted nothing; reproduced
// byte-for-byte). Gates form SEVEN per-chapter internal chains (each chapter's act1
// ungated → 7 `gate:{}`; the other 26 trivial `()=>!!S_story.<priorFlag>` →
// gate:{flags:[…]}) ⇒ split {flags:26, empty:7}. LOWERCASE-checkStat (cha/int/wis —
// 3 abilities) ⇒ legacy reads the real mod (no §SKILLFIX-01 silent +0); golden
// seeded under BOTH cases anyway. CLEAN — `skill→ability mapped 0`, 0 skill-names,
// NOT §SKILLFIX-02. TWO `combat` type-gated siblings (`hty02_act4`, `hty06_act4`,
// correctly skipped — skill_check filter excludes them, so c2 has a1/a2/a3/a5 and
// c6 has a1/a2/a3/a5). No prefix bleed. Self-contained.
test.describe('§ARCH-01 Wave 2au — hty_* family (bulk-migrated, 33 acts; mixed flag/flagless)', () => {
  test('every hty* skill_check is UQF-1.0, validates, onFail:[], NO residual activateCond; onPass = mission_bit OR empty', async ({ page }) => {
    const errs = []; page.on('pageerror', e => errs.push(String(e)));
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const hty = Object.values(QUEST_DB).filter(q => /^hty/.test(q.id) && q.type === 'skill_check');
      return hty.map(q => {
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
    expect(r.length).toBe(33);
    const gateShapes = { flags:0, empty:0 };
    const passShapes = { mission_bit:0, none:0 };
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
    expect(gateShapes).toEqual({ flags:26, empty:7 });
    expect(passShapes).toEqual({ mission_bit:26, none:7 });
  });

  test('PASS/FAIL parity across all 33 + gate behavior; flag-bearing grant a token, flagless grant nothing', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const seed = (k, v) => ({ [k]: v, [k.toLowerCase()]: v });
      const hty = Object.values(QUEST_DB).filter(q => /^hty/.test(q.id) && q.type === 'skill_check');
      let passBad = [], failBad = [], gateBad = [];
      for (const q of hty) {
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
      return { count:hty.length, passBad, failBad, gateBad };
    });
    expect(r.count).toBe(33);
    expect(r.passBad).toEqual([]);
    expect(r.failBad).toEqual([]);
    expect(r.gateBad).toEqual([]);
  });
});

// §ARCH-01 Wave 2av — fro_* family (32 skill_check acts — 7 chapters × 5 acts
// minus 3 siblings: 2 hybrid (`fro_c1a3`, `fro_c5a3`) + 1 combat (`fro_c2a4`),
// single `fro_cNaM` ids). SEVENTH head of the CLEAN mid-tail. UNIFORM-flag —
// all 32 carry a checkPassFlag → onPass:[mission_bit{flag}] (0 flagless). Gates
// form SEVEN per-chapter internal chains (each chapter's act1 ungated → 7
// `gate:{}`; the other 25 trivial `()=>!!S_story.<priorFlag>` → gate:{flags:[…]},
// chaining act→act WITHIN a chapter) ⇒ split {flags:25, empty:7}. UPPERCASE-
// checkStat (WIS 14, CHA 9, INT 5, DEX 3, CON 1). CLEAN — 0 skill-names, NOT
// §SKILLFIX-02. THREE type-gated siblings (2 hybrid + 1 combat, correctly skipped).
// No prefix bleed. Self-contained.
test.describe('§ARCH-01 Wave 2av — fro_* family (bulk-migrated, 32 acts; uniform flag-bearing)', () => {
  test('every fro_* skill_check is UQF-1.0, validates, onFail:[], NO residual activateCond; onPass = mission_bit', async ({ page }) => {
    const errs = []; page.on('pageerror', e => errs.push(String(e)));
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const fro = Object.values(QUEST_DB).filter(q => /^fro_/.test(q.id) && q.type === 'skill_check');
      return fro.map(q => {
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
    expect(r.length).toBe(32);
    const gateShapes = { flags:0, empty:0 };
    for (const q of r) {
      expect(q.schema).toBe('UQF-1.0');
      expect(q.valid).toBe(true);
      expect(q.noAC).toBe(true);
      expect(['flags', 'empty']).toContain(q.gateShape);
      expect(q.hasStat).toBe(true);
      expect(q.abilOk).toBe(true);
      expect(q.noSkill).toBe(true);
      expect(q.hasDc).toBe(true);
      expect(q.onFailLen).toBe(0);
      expect(q.onPassK).toEqual(['mission_bit']);
      expect(q.mbHasLabel).toBe(false);
      gateShapes[q.gateShape]++;
    }
    expect(gateShapes).toEqual({ flags:25, empty:7 });
  });

  test('PASS/FAIL parity across all 32 + gate behavior; every act grants a token on pass', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const seed = (k, v) => ({ [k]: v, [k.toLowerCase()]: v });
      const fro = Object.values(QUEST_DB).filter(q => /^fro_/.test(q.id) && q.type === 'skill_check');
      let passBad = [], failBad = [], gateBad = [];
      for (const q of fro) {
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
      return { count:fro.length, passBad, failBad, gateBad };
    });
    expect(r.count).toBe(32);
    expect(r.passBad).toEqual([]);
    expect(r.failBad).toEqual([]);
    expect(r.gateBad).toEqual([]);
  });
});

// §ARCH-01 Wave 2aw — mol* family (30 skill_check acts — 7 chapters × 5 acts
// minus 5 combat siblings (one act3 per chapter in c1/c4/c5/c6/c7; c2 and c3
// have all 5 acts), no-underscore `molNNN_actN` ids). EIGHTH head of the CLEAN
// mid-tail. Laxdæla saga arc (Gudrun's Debt + related sub-arcs). UNIFORM-flag
// — all 30 carry a checkPassFlag → onPass:[mission_bit{flag}] (0 flagless).
// Gates form SEVEN per-chapter internal chains (each chapter's act1 ungated →
// 7 `gate:{}`; the other 23 trivial `()=>!!S_story.<priorFlag>` →
// gate:{flags:[…]}, chaining act→act WITHIN a chapter) ⇒ split {flags:23,
// empty:7}. UPPERCASE-checkStat (WIS 13, CHA 15, DEX 1, STR 1). CLEAN — 0
// skill-names, NOT §SKILLFIX-02. FIVE `combat` type-gated siblings correctly
// skipped. No prefix bleed. Self-contained.
test.describe('§ARCH-01 Wave 2aw — mol* family (bulk-migrated, 30 acts; uniform flag-bearing)', () => {
  test('every mol* skill_check is UQF-1.0, validates, onFail:[], NO residual activateCond; onPass = mission_bit', async ({ page }) => {
    const errs = []; page.on('pageerror', e => errs.push(String(e)));
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const mol = Object.values(QUEST_DB).filter(q => /^mol/.test(q.id) && q.type === 'skill_check');
      return mol.map(q => {
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
    expect(r.length).toBe(30);
    const gateShapes = { flags:0, empty:0 };
    for (const q of r) {
      expect(q.schema).toBe('UQF-1.0');
      expect(q.valid).toBe(true);
      expect(q.noAC).toBe(true);
      expect(['flags', 'empty']).toContain(q.gateShape);
      expect(q.hasStat).toBe(true);
      expect(q.abilOk).toBe(true);
      expect(q.noSkill).toBe(true);
      expect(q.hasDc).toBe(true);
      expect(q.onFailLen).toBe(0);
      expect(q.onPassK).toEqual(['mission_bit']);
      expect(q.mbHasLabel).toBe(false);
      gateShapes[q.gateShape]++;
    }
    expect(gateShapes).toEqual({ flags:23, empty:7 });
  });

  test('PASS/FAIL parity across all 30 + gate behavior; every act grants a token on pass', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const seed = (k, v) => ({ [k]: v, [k.toLowerCase()]: v });
      const mol = Object.values(QUEST_DB).filter(q => /^mol/.test(q.id) && q.type === 'skill_check');
      let passBad = [], failBad = [], gateBad = [];
      for (const q of mol) {
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
      return { count:mol.length, passBad, failBad, gateBad };
    });
    expect(r.count).toBe(30);
    expect(r.passBad).toEqual([]);
    expect(r.failBad).toEqual([]);
    expect(r.gateBad).toEqual([]);
  });
});

// §ARCH-01 Wave 2bc — quest_* singletons (11 newly-migrated skill_check quests out of 82 total;
// 71 already UQF, 11 legacy). MIXED gates: 7 _legacyFn (complex activateCond preserved) + 3 flags
// + 1 empty. ALL have xpAward → onPass includes 'reward'; 10/11 also have a mission_bit passFlag
// (quest_sir_jullean is flagless). 3 also have goldAward. Skills via checkAbility (lowercase abbrev)
// or checkStat; skill→ability mapped 0 (all were already abilities). Self-contained.
test.describe('§ARCH-01 Wave 2bc — quest_* singletons (11 newly-migrated; xp/gold rewards, mixed gates)', () => {
  test('every newly-migrated quest_* is UQF-1.0, validates, onFail:[], has reward bit; mission_bit where flagged', async ({ page }) => {
    const errs = []; page.on('pageerror', e => errs.push(String(e)));
    await page.goto('/roll2hit-v3.html');
    const NEWLY_MIGRATED = new Set([
      'quest_muffat_01','quest_ezzir','quest_governor_cyprus','quest_lame_lystra',
      'quest_prison_phillam','quest_areopagus','quest_ephesus_riot','quest_shipwreck_melta',
      'quest_sir_jullean','quest_courier_release','quest_crypt_survey',
    ]);
    const r = await page.evaluate((ids) => {
      const ABILS = new Set(['STR','DEX','CON','INT','WIS','CHA']);
      return [...ids].map(id => {
        const q = QUEST_DB[id];
        if (!q) return { id, missing: true };
        const b = (q.bits || []).find(x => x.kind === 'skill_check');
        const mb = b && b.onPass.find(x => x.kind === 'mission_bit');
        const rw = b && b.onPass.find(x => x.kind === 'reward');
        const gate = q.gate || {};
        return { id, schema:q.schema, valid:validateQuest(q).valid,
          noAC: typeof q.activateCond === 'undefined',
          gateShape: gate._legacyFn ? 'legacyFn' : (gate.flags ? 'flags' : (JSON.stringify(gate) === '{}' ? 'empty' : 'other')),
          hasStat:!!(b && b.stat), abilOk: b ? ABILS.has(b.stat) : false,
          hasDc:typeof (b && b.dc) === 'number',
          hasReward: !!rw, hasMb: !!mb,
          onPassK:b ? b.onPass.map(x => x.kind) : null, onFailLen:b ? b.onFail.length : null };
      });
    }, [...NEWLY_MIGRATED]);
    expect(errs).toEqual([]);
    expect(r.length).toBe(11);
    const gateShapes = { legacyFn:0, flags:0, empty:0 };
    let withMb = 0;
    for (const q of r) {
      expect(q.missing).toBeFalsy();
      expect(q.schema).toBe('UQF-1.0');
      expect(q.valid).toBe(true);
      expect(q.hasStat).toBe(true);
      expect(q.abilOk).toBe(true);
      expect(q.hasDc).toBe(true);
      expect(q.hasReward).toBe(true);
      expect(q.onFailLen).toBe(0);
      expect(q.onPassK).toContain('reward');
      gateShapes[q.gateShape] = (gateShapes[q.gateShape] || 0) + 1;
      if (q.hasMb) withMb++;
    }
    expect(gateShapes).toEqual({ legacyFn:7, flags:3, empty:1 });
    expect(withMb).toBe(10); // quest_sir_jullean is flagless
  });

  test('PASS/FAIL parity across all 11; xp/gold granted on pass, nothing on fail', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const NEWLY_MIGRATED = [
      'quest_muffat_01','quest_ezzir','quest_governor_cyprus','quest_lame_lystra',
      'quest_prison_phillam','quest_areopagus','quest_ephesus_riot','quest_shipwreck_melta',
      'quest_sir_jullean','quest_courier_release','quest_crypt_survey',
    ];
    const r = await page.evaluate((ids) => {
      const seed = (k, v) => ({ [k]: v, [k.toLowerCase()]: v });
      let passBad = [], failBad = [];
      for (const id of ids) {
        const q = QUEST_DB[id];
        const b = q.bits.find(x => x.kind === 'skill_check');
        const mb = b.onPass.find(x => x.kind === 'mission_bit');
        const rw = b.onPass.find(x => x.kind === 'reward');
        const flag = mb ? mb.flag : null;
        // PASS
        S_story.abilityScores = seed(b.stat, 40);
        S_story.level = 20; S_story.xp = 0; S_story.gold = 0; S_story.inventory = [];
        if (flag) S_story[flag] = false;
        S_story.quests = { [id]:'active' };
        _rollCeremonia(id);
        const passXpOk = rw ? S_story.xp === rw.xp : true;
        const passGoldOk = rw && rw.gold ? S_story.gold === rw.gold : true;
        const passFlagOk = flag ? S_story[flag] === true : true;
        if (!(S_story.quests[id] === 'done' && passXpOk && passGoldOk && passFlagOk)) passBad.push(id);
        // FAIL
        S_story.abilityScores = seed(b.stat, -100);
        S_story.level = 1; S_story.day = 5; S_story.skillCheckAttempts = {};
        S_story.xp = 0; S_story.gold = 0; S_story.inventory = [];
        if (flag) S_story[flag] = false;
        S_story.quests = { [id]:'active' };
        _rollCeremonia(id);
        const failFlagOk = flag ? S_story[flag] === false : true;
        // retryable quests stay 'active' on fail (not 'failed'); non-retryable → 'failed'
        const failStatusOk = q.retryable ? S_story.quests[id] !== 'done' : S_story.quests[id] === 'failed';
        if (!(failStatusOk && S_story.xp === 0 && S_story.gold === 0 && failFlagOk)) failBad.push(id);
      }
      return { count:ids.length, passBad, failBad };
    }, NEWLY_MIGRATED);
    expect(r.count).toBe(11);
    expect(r.passBad).toEqual([]);
    expect(r.failBad).toEqual([]);
  });
});

// §ARCH-01 Wave 2bb — stn_* family (11 skill_check acts — mixed-type chapters, stn_cNaN ids).
// THIRD & LAST §SKILLFIX-02 family of the trio. UNIFORM-flag — all 11 carry a
// mission_bit onPass (0 flagless). Gates: 5 empty (chapter act1s) + 6 flags ⇒
// {flags:6, empty:5}. Many type-gated siblings (escort/dialogue/combat per chapter).
// §SKILLFIX-02: 10/11 use D&D skill names; 1 uses full ability word "Wisdom" →
// WIS (direct ability check — migrator sets stat:WIS, skill:null for this one).
// skill→ability mapped 10. Self-contained.
test.describe('§ARCH-01 Wave 2bb — stn_* family (bulk-migrated, 11 acts; §SKILLFIX-02)', () => {
  test('every stn_* skill_check is UQF-1.0, validates, onFail:[], ability mapped; 10 have skill name + 1 raw-ability', async ({ page }) => {
    const errs = []; page.on('pageerror', e => errs.push(String(e)));
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const ABILS = new Set(['STR','DEX','CON','INT','WIS','CHA']);
      const stn = Object.values(QUEST_DB).filter(q => /^stn_c/.test(q.id) && q.type === 'skill_check');
      return stn.map(q => {
        const b = (q.bits || []).find(x => x.kind === 'skill_check');
        const mb = b && b.onPass.find(x => x.kind === 'mission_bit');
        const gate = q.gate || {};
        return { id:q.id, schema:q.schema, valid:validateQuest(q).valid,
          noAC: typeof q.activateCond === 'undefined',
          gateShape: gate.flags ? 'flags' : (JSON.stringify(gate) === '{}' ? 'empty' : 'other'),
          hasStat:!!(b && b.stat), abilOk: b ? ABILS.has(b.stat) : false,
          hasDc:typeof (b && b.dc) === 'number',
          hasSkill: b ? ('skill' in b && b.skill !== null) : false,
          onPassK:b ? b.onPass.map(x => x.kind) : null, onFailLen:b ? b.onFail.length : null,
          mbHasLabel:mb ? ('label' in mb) : null };
      });
    });
    expect(errs).toEqual([]);
    expect(r.length).toBe(11);
    const gateShapes = { flags:0, empty:0 };
    let skillCount = 0;
    for (const q of r) {
      expect(q.schema).toBe('UQF-1.0');
      expect(q.valid).toBe(true);
      expect(q.noAC).toBe(true);
      expect(['flags', 'empty']).toContain(q.gateShape);
      expect(q.hasStat).toBe(true);
      expect(q.abilOk).toBe(true);
      expect(q.hasDc).toBe(true);
      expect(q.onFailLen).toBe(0);
      expect(q.onPassK).toEqual(['mission_bit']);
      expect(q.mbHasLabel).toBe(false);
      gateShapes[q.gateShape]++;
      if (q.hasSkill) skillCount++;
    }
    expect(gateShapes).toEqual({ flags:6, empty:5 });
    expect(skillCount).toBe(10); // 10 skill names; 1 raw-ability ("Wisdom"→WIS, skill:null)
  });

  test('PASS/FAIL parity across all 11 + gate behavior; every act grants a token on pass', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const seed = (k, v) => ({ [k]: v, [k.toLowerCase()]: v });
      const stn = Object.values(QUEST_DB).filter(q => /^stn_c/.test(q.id) && q.type === 'skill_check');
      let passBad = [], failBad = [], gateBad = [];
      for (const q of stn) {
        const b = q.bits.find(x => x.kind === 'skill_check');
        const mb = b.onPass.find(x => x.kind === 'mission_bit');
        const flag = mb ? mb.flag : null;
        // PASS — seed by governing ability (b.stat)
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
      return { count:stn.length, passBad, failBad, gateBad };
    });
    expect(r.count).toBe(11);
    expect(r.passBad).toEqual([]);
    expect(r.failBad).toEqual([]);
    expect(r.gateBad).toEqual([]);
  });
});

// §ARCH-01 Wave 2ba — sen_* family (19 skill_check acts — 7 chapters, sen_cNaN ids).
// SECOND §SKILLFIX-02 family of the trio. UNIFORM-flag — all 19 carry a mission_bit
// onPass (0 flagless). Gates form SEVEN per-chapter internal chains (each chapter's
// act1 ungated → 7 `gate:{}`; remaining 12 carry prior-act/combat-sibling flag
// dependencies → gate:{flags:[…]}) ⇒ split {flags:12, empty:7}. TWO combat
// type-gated siblings (sen_c6a2/sen_c7a2, correctly skipped). §SKILLFIX-02: all 19
// use D&D skill names (Stealth/Deception/Perception/Insight/Courage/Persuasion/
// Athletics) → mapped to governing ability (DEX/CHA/WIS/STR). Self-contained.
test.describe('§ARCH-01 Wave 2ba — sen_* family (bulk-migrated, 19 acts; §SKILLFIX-02)', () => {
  test('every sen_* skill_check is UQF-1.0, validates, onFail:[], skill name preserved, ability mapped', async ({ page }) => {
    const errs = []; page.on('pageerror', e => errs.push(String(e)));
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const ABILS = new Set(['STR','DEX','CON','INT','WIS','CHA']);
      const sen = Object.values(QUEST_DB).filter(q => /^sen_/.test(q.id) && q.type === 'skill_check');
      return sen.map(q => {
        const b = (q.bits || []).find(x => x.kind === 'skill_check');
        const mb = b && b.onPass.find(x => x.kind === 'mission_bit');
        const gate = q.gate || {};
        return { id:q.id, schema:q.schema, valid:validateQuest(q).valid,
          noAC: typeof q.activateCond === 'undefined',
          gateShape: gate.flags ? 'flags' : (JSON.stringify(gate) === '{}' ? 'empty' : 'other'),
          hasStat:!!(b && b.stat), abilOk: b ? ABILS.has(b.stat) : false,
          hasDc:typeof (b && b.dc) === 'number',
          hasSkill: b ? ('skill' in b) : false,
          skillMapped: b ? ABILS.has(b.stat) : false,
          onPassK:b ? b.onPass.map(x => x.kind) : null, onFailLen:b ? b.onFail.length : null,
          mbHasLabel:mb ? ('label' in mb) : null };
      });
    });
    expect(errs).toEqual([]);
    expect(r.length).toBe(19);
    const gateShapes = { flags:0, empty:0 };
    for (const q of r) {
      expect(q.schema).toBe('UQF-1.0');
      expect(q.valid).toBe(true);
      expect(q.noAC).toBe(true);
      expect(['flags', 'empty']).toContain(q.gateShape);
      expect(q.hasStat).toBe(true);
      expect(q.abilOk).toBe(true);
      expect(q.hasDc).toBe(true);
      expect(q.hasSkill).toBe(true);
      expect(q.skillMapped).toBe(true);
      expect(q.onFailLen).toBe(0);
      expect(q.onPassK).toEqual(['mission_bit']);
      expect(q.mbHasLabel).toBe(false);
      gateShapes[q.gateShape]++;
    }
    expect(gateShapes).toEqual({ flags:12, empty:7 });
  });

  test('PASS/FAIL parity across all 19 + gate behavior; every act grants a token on pass', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const seed = (k, v) => ({ [k]: v, [k.toLowerCase()]: v });
      const sen = Object.values(QUEST_DB).filter(q => /^sen_/.test(q.id) && q.type === 'skill_check');
      let passBad = [], failBad = [], gateBad = [];
      for (const q of sen) {
        const b = q.bits.find(x => x.kind === 'skill_check');
        const mb = b.onPass.find(x => x.kind === 'mission_bit');
        const flag = mb ? mb.flag : null;
        // PASS — seed by governing ability (b.stat)
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
      return { count:sen.length, passBad, failBad, gateBad };
    });
    expect(r.count).toBe(19);
    expect(r.passBad).toEqual([]);
    expect(r.failBad).toEqual([]);
    expect(r.gateBad).toEqual([]);
  });
});

// §ARCH-01 Wave 2az — man_* family (23 skill_check acts — 7 chapters, man_cNaN ids).
// ELEVENTH head of the CLEAN mid-tail; FIRST §SKILLFIX-02 family. UNIFORM-flag —
// all 23 carry a mission_bit onPass (0 flagless). Gates form SEVEN per-chapter
// internal chains (each chapter's act1 ungated → 7 `gate:{}`; remaining 16
// carry prior-act flag dependencies → gate:{flags:[…]}) ⇒ split {flags:16, empty:7}.
// §SKILLFIX-02: all 23 use D&D skill names (Stealth/Deception/Persuasion/Perception/
// Courage/Insight/Presence/Athletics/Sleight of Hand) → mapped to governing ability
// (DEX/CHA/WIS/STR); skill name preserved in bits[0].skill. Self-contained.
test.describe('§ARCH-01 Wave 2az — man_* family (bulk-migrated, 23 acts; §SKILLFIX-02)', () => {
  test('every man_* skill_check is UQF-1.0, validates, onFail:[], skill name preserved, ability mapped', async ({ page }) => {
    const errs = []; page.on('pageerror', e => errs.push(String(e)));
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const ABILS = new Set(['STR','DEX','CON','INT','WIS','CHA']);
      const man = Object.values(QUEST_DB).filter(q => /^man_/.test(q.id) && q.type === 'skill_check');
      return man.map(q => {
        const b = (q.bits || []).find(x => x.kind === 'skill_check');
        const mb = b && b.onPass.find(x => x.kind === 'mission_bit');
        const gate = q.gate || {};
        return { id:q.id, schema:q.schema, valid:validateQuest(q).valid,
          noAC: typeof q.activateCond === 'undefined',
          gateShape: gate.flags ? 'flags' : (JSON.stringify(gate) === '{}' ? 'empty' : 'other'),
          hasStat:!!(b && b.stat), abilOk: b ? ABILS.has(b.stat) : false,
          hasDc:typeof (b && b.dc) === 'number',
          hasSkill: b ? ('skill' in b) : false,
          skillMapped: b ? ABILS.has(b.stat) : false,
          onPassK:b ? b.onPass.map(x => x.kind) : null, onFailLen:b ? b.onFail.length : null,
          mbHasLabel:mb ? ('label' in mb) : null };
      });
    });
    expect(errs).toEqual([]);
    expect(r.length).toBe(23);
    const gateShapes = { flags:0, empty:0 };
    for (const q of r) {
      expect(q.schema).toBe('UQF-1.0');
      expect(q.valid).toBe(true);
      expect(q.noAC).toBe(true);
      expect(['flags', 'empty']).toContain(q.gateShape);
      expect(q.hasStat).toBe(true);
      expect(q.abilOk).toBe(true);
      expect(q.hasDc).toBe(true);
      expect(q.hasSkill).toBe(true);
      expect(q.skillMapped).toBe(true);
      expect(q.onFailLen).toBe(0);
      expect(q.onPassK).toEqual(['mission_bit']);
      expect(q.mbHasLabel).toBe(false);
      gateShapes[q.gateShape]++;
    }
    expect(gateShapes).toEqual({ flags:16, empty:7 });
  });

  test('PASS/FAIL parity across all 23 + gate behavior; every act grants a token on pass', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const seed = (k, v) => ({ [k]: v, [k.toLowerCase()]: v });
      const man = Object.values(QUEST_DB).filter(q => /^man_/.test(q.id) && q.type === 'skill_check');
      let passBad = [], failBad = [], gateBad = [];
      for (const q of man) {
        const b = q.bits.find(x => x.kind === 'skill_check');
        const mb = b.onPass.find(x => x.kind === 'mission_bit');
        const flag = mb ? mb.flag : null;
        // PASS — seed by governing ability (b.stat), not skill name
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
      return { count:man.length, passBad, failBad, gateBad };
    });
    expect(r.count).toBe(23);
    expect(r.passBad).toEqual([]);
    expect(r.failBad).toEqual([]);
    expect(r.gateBad).toEqual([]);
  });
});

// §ARCH-01 Wave 2ay — clr_* family (5 skill_check acts — single chapter × 5 acts,
// `clr_01_actN` ids). TENTH & LAST head of the CLEAN mid-tail. UNIFORM-flag —
// all 5 carry a mission_bit onPass (0 flagless). ALL OPEN GATES — no chaining
// between acts, every act is always-available ⇒ split {flags:0, empty:5}. Stats:
// INT(2) + WIS(2) + CHA(1). CLEAN — 0 skill-names, NOT §SKILLFIX-02. Zero
// type-gated siblings. Pre-migrated (UQF at authoring time; bulk migrator
// reports skipped:5). Self-contained.
test.describe('§ARCH-01 Wave 2ay — clr_* family (pre-migrated, 5 acts; uniform flag-bearing)', () => {
  test('every clr_* skill_check is UQF-1.0, validates, onFail:[], NO residual activateCond; onPass = mission_bit', async ({ page }) => {
    const errs = []; page.on('pageerror', e => errs.push(String(e)));
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const clr = Object.values(QUEST_DB).filter(q => /^clr_/.test(q.id) && q.type === 'skill_check');
      return clr.map(q => {
        const b = (q.bits || []).find(x => x.kind === 'skill_check');
        const mb = b && b.onPass.find(x => x.kind === 'mission_bit');
        const gate = q.gate || {};
        return { id:q.id, schema:q.schema, valid:validateQuest(q).valid,
          noAC: typeof q.activateCond === 'undefined',
          gateShape: gate.flags ? 'flags' : (JSON.stringify(gate) === '{}' ? 'empty' : 'other'),
          hasStat:!!(b && b.stat), abilOk: b ? ['STR','DEX','CON','INT','WIS','CHA'].includes(b.stat) : false,
          hasDc:typeof (b && b.dc) === 'number',
          onPassK:b ? b.onPass.map(x => x.kind) : null, onFailLen:b ? b.onFail.length : null,
          mbHasLabel:mb ? ('label' in mb) : null };
      });
    });
    expect(errs).toEqual([]);
    expect(r.length).toBe(5);
    const gateShapes = { flags:0, empty:0 };
    for (const q of r) {
      expect(q.schema).toBe('UQF-1.0');
      expect(q.valid).toBe(true);
      expect(q.noAC).toBe(true);
      expect(q.gateShape).toBe('empty');
      expect(q.hasStat).toBe(true);
      expect(q.abilOk).toBe(true);
      expect(q.hasDc).toBe(true);
      expect(q.onFailLen).toBe(0);
      expect(q.onPassK).toEqual(['mission_bit']);
      expect(q.mbHasLabel).toBe(false);
      gateShapes[q.gateShape]++;
    }
    expect(gateShapes).toEqual({ flags:0, empty:5 });
  });

  test('PASS/FAIL parity across all 5 + gate behavior (all open); every act grants a token on pass', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const seed = (k, v) => ({ [k]: v, [k.toLowerCase()]: v });
      const clr = Object.values(QUEST_DB).filter(q => /^clr_/.test(q.id) && q.type === 'skill_check');
      let passBad = [], failBad = [], gateBad = [];
      for (const q of clr) {
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
        // GATE — all clr_* are ungated (gate:{})
        if (QuestRuntime.canActivate(q.id) !== true) gateBad.push(q.id);
      }
      return { count:clr.length, passBad, failBad, gateBad };
    });
    expect(r.count).toBe(5);
    expect(r.passBad).toEqual([]);
    expect(r.failBad).toEqual([]);
    expect(r.gateBad).toEqual([]);
  });
});

// §ARCH-01 Wave 2ax — cph* family (29 skill_check acts — 7 chapters × 5 acts
// minus 6 combat siblings, no-underscore `cphNNN_actN` ids). NINTH head of the
// CLEAN mid-tail. UNIFORM-flag — all 29 carry a checkPassFlag →
// onPass:[mission_bit{flag}] (0 flagless). Gates form SEVEN per-chapter internal
// chains (each chapter's act1 ungated → 7 `gate:{}`; the other 22 trivial
// `()=>!!S_story.<priorFlag>` → gate:{flags:[…]}) ⇒ split {flags:22, empty:7}.
// UPPERCASE-checkStat (WIS 13, CHA 16 — two abilities only). CLEAN — 0
// skill-names, NOT §SKILLFIX-02. SIX `combat` type-gated siblings (c1 has 2
// siblings at act2+act4; c2/c3/c5/c7 each have 1 at act3 or act4) correctly
// skipped. No prefix bleed. Self-contained.
test.describe('§ARCH-01 Wave 2ax — cph* family (bulk-migrated, 29 acts; uniform flag-bearing)', () => {
  test('every cph* skill_check is UQF-1.0, validates, onFail:[], NO residual activateCond; onPass = mission_bit', async ({ page }) => {
    const errs = []; page.on('pageerror', e => errs.push(String(e)));
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const cph = Object.values(QUEST_DB).filter(q => /^cph/.test(q.id) && q.type === 'skill_check');
      return cph.map(q => {
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
    expect(r.length).toBe(29);
    const gateShapes = { flags:0, empty:0 };
    for (const q of r) {
      expect(q.schema).toBe('UQF-1.0');
      expect(q.valid).toBe(true);
      expect(q.noAC).toBe(true);
      expect(['flags', 'empty']).toContain(q.gateShape);
      expect(q.hasStat).toBe(true);
      expect(q.abilOk).toBe(true);
      expect(q.noSkill).toBe(true);
      expect(q.hasDc).toBe(true);
      expect(q.onFailLen).toBe(0);
      expect(q.onPassK).toEqual(['mission_bit']);
      expect(q.mbHasLabel).toBe(false);
      gateShapes[q.gateShape]++;
    }
    expect(gateShapes).toEqual({ flags:22, empty:7 });
  });

  test('PASS/FAIL parity across all 29 + gate behavior; every act grants a token on pass', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const seed = (k, v) => ({ [k]: v, [k.toLowerCase()]: v });
      const cph = Object.values(QUEST_DB).filter(q => /^cph/.test(q.id) && q.type === 'skill_check');
      let passBad = [], failBad = [], gateBad = [];
      for (const q of cph) {
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
      return { count:cph.length, passBad, failBad, gateBad };
    });
    expect(r.count).toBe(29);
    expect(r.passBad).toEqual([]);
    expect(r.failBad).toEqual([]);
    expect(r.gateBad).toEqual([]);
  });
});

// ── §ARCH-01 Wave 3a — side quests → declarative completion (61 migrated) ────
//
// The first Wave-3 batch: every legacy `side` quest whose completeFn/completeItems
// was expressible with existing canComplete terms plus the NEW `completion.items`
// OR-term (fuzzy two-way substring, mirroring the legacy completeItems check
// byte-for-byte). Sides keep `onComplete`/`xpAward`/itemChain verbatim — those
// fire schema-agnostically from storyCheckQuests (no completion-bit execution
// point exists yet; that is the deferred Wave-3 engine task). 38 sides with
// counter/nested-path/item-count completeFns stay legacy for Wave 3b.

test.describe('§ARCH-01 Wave 3a — side-quest declarative completion (61 migrated + items term)', () => {
  const W3A = ['sq_1','sq_2','quest_ng_02','quest_ng_03','quest_wm_02','quest_wm_03','quest_wm_04','quest_wm_05',
    'quest_va_01','quest_va_02','quest_va_03','quest_va_04','quest_tl_01','quest_tl_02','quest_tl_03',
    'quest_muffat_05','quest_solm_01','quest_antecedent_01','quest_signal_01','quest_muffat_03','quest_muffat_02',
    'quest_road_damascus','quest_anath','quest_hellenists_jerusalem','quest_barnach_finds','quest_antioch_commission',
    'quest_philippi','quest_corinth_letters','quest_rome_arrest','quest_snake_melta','quest_inn_05','quest_inn_06',
    'quest_whisper_kelpie','quest_glut_mudcrab','quest_wane_spawn','quest_whisper_witch','quest_glut_octopus',
    'quest_wane_demon','quest_inn_eel','quest_shore_01','quest_ca_01','quest_depth_01','quest_df_01','quest_sk_01',
    'quest_sk_hull','quest_vs_01','quest_vs_02','quest_vs_03','quest_vs_warden','quest_cat_04','quest_cat_06',
    'quest_la_riva_01','quest_la_riva_03','quest_horned_shark','quest_shale_drop','quest_night_eel',
    'quest_no_fishing_sign','quest_guide_05','quest_brynn_firewood','quest_void_below','quest_city_watch_patrol'];
  // Wave 3b later migrated 32 of the original 38 skips; W7d migrated wm_01 (the
  // last completeFn → flagsAny + the new itemsMinAny OR-term). The 5 math
  // placeholders (the terminal legacy holdouts) migrated 2026-07-07 (§MATH-01
  // completions ship) — legacyCount pin flipped 5 → 0.
  const W3B = ['quest_math_01','quest_math_02','quest_math_03','quest_math_04','quest_math_05'];
  const GATE_KEPT = ['quest_wm_05','quest_road_damascus','quest_inn_06'];

  test('all 61 are UQF-1.0, validate, bits:[], completion present, no completeFn; legacy holdouts untouched', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(({ w3a, w3b, kept }) => {
      const bad = [];
      for (const id of w3a) {
        const q = QUEST_DB[id];
        if (!q) { bad.push(id + ':missing'); continue; }
        if (q.schema !== 'UQF-1.0') bad.push(id + ':schema');
        if (!validateQuest(q).valid) bad.push(id + ':invalid');
        if (!q.completion) bad.push(id + ':no-completion');
        if ((q.bits || []).length) bad.push(id + ':bits');
        if (q.completeFn) bad.push(id + ':completeFn-residue');
        if (q.type !== 'side') bad.push(id + ':type');
        if (kept.includes(id)) {
          if (typeof q.activateCond !== 'function') bad.push(id + ':lost-activateCond');
          if (!q.gate || q.gate._legacyFn !== true) bad.push(id + ':gate-not-legacyFn');
        }
      }
      const legacyStill = w3b.filter(id => QUEST_DB[id] && QUEST_DB[id].schema === undefined);
      return { bad, legacyCount: legacyStill.length };
    }, { w3a: W3A, w3b: W3B, kept: GATE_KEPT });
    expect(r.bad).toEqual([]);
    expect(r.legacyCount).toBe(0);   // §MATH-01 2026-07-07: the last 5 legacy holdouts are UQF now
  });

  test('completion.items engine term: fuzzy two-way OR matching, composes with flags AND-group', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      QUEST_DB.q_w3_items = { schema:'UQF-1.0', id:'q_w3_items', type:'side', title:'x',
        gate:{}, bits:[], completion:{ flags:['w3Gate'], items:['Trade Seal (Shard #9)','Ghost Rope'] } };
      const out = {};
      S_story.inventory = []; S_story.w3Gate = true;
      out.noItem = QuestRuntime.canComplete('q_w3_items');                       // OR-group unsatisfied
      S_story.inventory = [{ name:'Trade Seal' }];                               // ci.includes(inv.name)
      out.invSubstr = QuestRuntime.canComplete('q_w3_items');
      S_story.inventory = [{ name:'Old Ghost Rope of the Fen' }];                // inv.name.includes(ci)
      out.ciSubstr = QuestRuntime.canComplete('q_w3_items');
      S_story.inventory = [{ name:'Unrelated Thing' }];
      out.wrongItem = QuestRuntime.canComplete('q_w3_items');
      S_story.inventory = [{ name:'Ghost Rope' }]; S_story.w3Gate = false;       // AND-group must still hold
      out.flagUnmet = QuestRuntime.canComplete('q_w3_items');
      delete QUEST_DB.q_w3_items; delete S_story.w3Gate;
      return out;
    });
    expect(r).toEqual({ noItem:false, invSubstr:true, ciSubstr:true, wrongItem:false, flagUnmet:false });
  });

  test('flag1 + per-id effect parity: quest_wm_04 completes on flag, grants +300 gold via its W7c onComplete chain', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      S_story.level = 20; S_story.gold = 10000;
      S_story.quests.quest_wm_04 = 'active';
      storyCheckQuests({ code:'ZZZ' });                                          // flag unset → stays active
      const before = S_story.quests.quest_wm_04;
      S_story.wmFirstResearcherKnown = true;
      storyCheckQuests({ code:'ZZZ' });
      return { before, after: S_story.quests.quest_wm_04, goldDelta: S_story.gold - 10000 };
    });
    expect(r).toEqual({ before:'active', after:'complete', goldDelta:300 });
  });

  test('flagAND truth-table (quest_wm_02) + flagsAny either-branch (quest_tl_02)', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const out = {};
      S_story.quests.quest_wm_02 = 'active';
      S_story.wmDoc1Read = true; S_story.wmDoc2Read = true;                      // 2 of 3
      storyCheckQuests({ code:'ZZZ' });
      out.twoOfThree = S_story.quests.quest_wm_02;
      S_story.wmDoc3Read = true;
      storyCheckQuests({ code:'ZZZ' });
      out.allThree = S_story.quests.quest_wm_02;
      S_story.quests.quest_tl_02 = 'active';
      out.tlNeither = QuestRuntime.canComplete('quest_tl_02');
      S_story.tlEmbargoDismissed = true;                                         // either branch alone
      out.tlOne = QuestRuntime.canComplete('quest_tl_02');
      return out;
    });
    expect(r).toEqual({ twoOfThree:'active', allThree:'complete', tlNeither:false, tlOne:true });
  });

  test('battle completion + questsAttempted gate (quest_inn_eel): lists only after inn_03 attempted, completes on INN_EEL', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const q = QUEST_DB.quest_inn_eel;
      const node = { code: q.activateNode };
      const out = {};
      storyCheckQuests(node);                                                    // inn_03 never attempted
      out.gatedOut = S_story.quests.quest_inn_eel || '(not listed)';
      S_story.quests.quest_inn_03 = 'active';
      storyCheckQuests(node);
      out.listed = S_story.quests.quest_inn_eel;
      storyCheckQuests(node);                                                    // battle not fought yet
      out.beforeBattle = S_story.quests.quest_inn_eel;
      S_story.defeatedBattles.INN_EEL = true;
      storyCheckQuests(node);
      return { ...out, afterBattle: S_story.quests.quest_inn_eel };
    });
    expect(r).toEqual({ gatedOut:'(not listed)', listed:'active', beforeBattle:'active', afterBattle:'complete' });
  });

  test('atNode (quest_shore_01, gate battles) + flag∧atNode (quest_inn_05) + items-only (sq_1 fuzzy)', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const out = {};
      out.shoreGateClosed = QuestRuntime.canActivate('quest_shore_01');          // HCA_BOSS not defeated
      S_story.defeatedBattles.HCA_BOSS = true;
      out.shoreGateOpen = QuestRuntime.canActivate('quest_shore_01');
      S_story.quests.quest_shore_01 = 'active';
      S_story.currentCode = 'LHR';
      out.shoreElsewhere = QuestRuntime.canComplete('quest_shore_01');
      S_story.currentCode = 'DS0';
      out.shoreAtNode = QuestRuntime.canComplete('quest_shore_01');
      S_story.quests.quest_inn_05 = 'active';
      S_story.currentCode = 'INN';
      out.innFlagUnset = QuestRuntime.canComplete('quest_inn_05');               // at node but not departed
      S_story.innDeparted = true; S_story.currentCode = 'LHR';
      out.innWrongNode = QuestRuntime.canComplete('quest_inn_05');               // departed but elsewhere
      S_story.currentCode = 'INN';
      out.innBoth = QuestRuntime.canComplete('quest_inn_05');
      S_story.quests.sq_1 = 'active';
      S_story.inventory = [{ name:'Trade Seal (Shard #1)' }];                    // legacy fuzzy behavior
      out.sq1 = QuestRuntime.canComplete('sq_1');
      return out;
    });
    expect(r).toEqual({ shoreGateClosed:false, shoreGateOpen:true, shoreElsewhere:false, shoreAtNode:true,
      innFlagUnset:false, innWrongNode:false, innBoth:true, sq1:true });
  });
});

// ── §ARCH-01 Wave 3b — counter/nested-path/item-count sides (32 migrated) ────
//
// Three new AND-position canComplete terms, each serving many quests:
// countMin (dot-path threshold; number/array-length/object-size coercion),
// itemsAll (exact-name inventory requirement, optional min copies — vs the fuzzy
// OR `items` term), flagsPath (nested dot-path flags, also added to canActivate
// for the tour gates). Holdouts stayed legacy by design: quest_wm_01 (bespoke
// function-body OR — migrated in W7d via the itemsMinAny OR-term) +
// quest_math_01–05 (no completion mechanism — §MATH-01 gap, still legacy).
// guide_02/03/06 keep their `quests.X === 'done'` activateConds verbatim behind
// gate:{_legacyFn:true} — suspected DEAD gates (side quests reach 'complete',
// never 'done') — flagged in plan.md, parity preserved.

test.describe('§ARCH-01 Wave 3b — counter/nested-path/item-count sides (32 migrated + 3 terms)', () => {
  const W3B = ['sq_battling','sq_leveling','quest_ng_01','quest_inn_01','quest_iodine_02','quest_iodine_03',
    'quest_forge_02','quest_sunken_02','quest_cat_01','quest_cat_02','quest_cat_03','quest_cat_05','quest_cat_void',
    'quest_la_riva_02','quest_fishing_guide','quest_fish_01','quest_tour_01','quest_tour_02','quest_tour_03',
    'quest_tour_04','quest_tour_05','quest_tour_06','quest_guide_01','quest_guide_02','quest_guide_03',
    'quest_guide_06','quest_slums_cleanup','quest_brynn_ledger','quest_couperin_lute','quest_pachelbel_shipment',
    'quest_pit_training','quest_pit_debut'];
  const HOLDOUTS = ['quest_math_01','quest_math_02','quest_math_03','quest_math_04','quest_math_05'];
  // §ARCH-01 W4: guide_02/03/06 moved OFF the _legacyFn gate — their `=== 'done'`
  // activateConds were DEAD (side quests only reach 'complete'); now gate.questsDone.
  const GATE_KEPT = ['quest_fish_01','quest_tour_01','quest_guide_01'];

  test('all 32 are UQF-1.0, validate, bits:[], completion, no completeFn; holdouts stay legacy', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(({ w3b, holdouts, kept }) => {
      const bad = [];
      for (const id of w3b) {
        const q = QUEST_DB[id];
        if (!q) { bad.push(id + ':missing'); continue; }
        if (q.schema !== 'UQF-1.0') bad.push(id + ':schema');
        if (!validateQuest(q).valid) bad.push(id + ':invalid');
        if (!q.completion) bad.push(id + ':no-completion');
        if ((q.bits || []).length) bad.push(id + ':bits');
        if (q.completeFn) bad.push(id + ':completeFn-residue');
        if (kept.includes(id) && (typeof q.activateCond !== 'function' || q.gate._legacyFn !== true))
          bad.push(id + ':gate-kept-broken');
      }
      const stillLegacy = holdouts.filter(id => QUEST_DB[id] && QUEST_DB[id].schema === undefined);
      return { bad, legacyCount: stillLegacy.length };
    }, { w3b: W3B, holdouts: HOLDOUTS, kept: GATE_KEPT });
    expect(r.bad).toEqual([]);
    expect(r.legacyCount).toBe(0);   // §MATH-01 2026-07-07: math holdouts migrated (see §MATH-01 describe)
  });

  test('countMin coercion truth-table: number, array length, object keys, nested path, missing', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      QUEST_DB.q_w3_count = { schema:'UQF-1.0', id:'q_w3_count', type:'side', title:'x', gate:{}, bits:[],
        completion:{ countMin:[{ path:'w3Num', min:3 }, { path:'w3Deep.k', min:2 }] } };
      const out = {};
      out.missing = QuestRuntime.canComplete('q_w3_count');                       // both absent → 0
      S_story.w3Num = 3; S_story.w3Deep = { k: 1 };
      out.oneShort = QuestRuntime.canComplete('q_w3_count');                      // nested below min
      S_story.w3Deep.k = 2;
      out.bothMet = QuestRuntime.canComplete('q_w3_count');
      QUEST_DB.q_w3_count.completion = { countMin:[{ path:'w3Arr', min:2 }, { path:'w3Obj', min:2 }] };
      S_story.w3Arr = ['a']; S_story.w3Obj = { a:1, b:2 };
      out.arrShort = QuestRuntime.canComplete('q_w3_count');                      // array length 1 < 2
      S_story.w3Arr.push('b');
      out.arrObj = QuestRuntime.canComplete('q_w3_count');                        // length 2, keys 2
      delete QUEST_DB.q_w3_count; delete S_story.w3Num; delete S_story.w3Deep; delete S_story.w3Arr; delete S_story.w3Obj;
      return out;
    });
    expect(r).toEqual({ missing:false, oneShort:false, bothMet:true, arrShort:false, arrObj:true });
  });

  test('itemsAll exact-name AND semantics with min copies (vs fuzzy items): cat_02 + iodine_02 truth-tables', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const out = {};
      S_story.quests.quest_cat_02 = 'active';
      S_story.catKills = { beefy_tom: 3 };
      S_story.inventory = [{ name:'Cracked Claw' }, { name:'Cracked Claw' }];
      out.twoClaws = QuestRuntime.canComplete('quest_cat_02');                    // needs 3 copies
      S_story.inventory.push({ name:'Cracked Claw Fragment' });                   // exact-name: does NOT count
      out.fuzzyRejected = QuestRuntime.canComplete('quest_cat_02');
      S_story.inventory.push({ name:'Cracked Claw' });
      out.threeClaws = QuestRuntime.canComplete('quest_cat_02');
      S_story.catKills.beefy_tom = 2;                                             // counter side of the AND
      out.counterShort = QuestRuntime.canComplete('quest_cat_02');
      S_story.quests.quest_iodine_02 = 'active';
      S_story.inventory = [{ name:'Swamp Kelp' }, { name:'Swamp Kelp' }];
      S_story.currentCode = 'INN';
      out.kelpAtInn = QuestRuntime.canComplete('quest_iodine_02');                // {min:2} + atNode
      S_story.currentCode = 'LHR';
      out.kelpElsewhere = QuestRuntime.canComplete('quest_iodine_02');
      return out;
    });
    expect(r).toEqual({ twoClaws:false, fuzzyRejected:false, threeClaws:true, counterShort:false,
      kelpAtInn:true, kelpElsewhere:false });
  });

  test('flagsPath in gate AND completion: tour chain listing + storyCheckQuests flip', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const q = QUEST_DB.quest_tour_02;
      const node = { code: q.activateNode };
      const out = {};
      storyCheckQuests(node);                                                     // pip not beaten → gated out
      out.gatedOut = S_story.quests.quest_tour_02 || '(not listed)';
      S_story.yugurtTourBeat = { pip: true };
      storyCheckQuests(node);
      out.listed = S_story.quests.quest_tour_02;
      storyCheckQuests(node);                                                     // renard not beaten yet
      out.beforeRenard = S_story.quests.quest_tour_02;
      S_story.yugurtTourBeat.renard = true;
      S_story.level = 20; const xp0 = S_story.xp;
      storyCheckQuests(node);
      out.afterRenard = S_story.quests.quest_tour_02;
      out.xpAwardFired = (S_story.xp - xp0) === 150;                              // side xpAward stays live
      return out;
    });
    expect(r).toEqual({ gatedOut:'(not listed)', listed:'active', beforeRenard:'active',
      afterRenard:'complete', xpAwardFired:true });
  });

  test('real counter flips: pit_debut via pitTrainingWins; forge_02 fuzzy-OR items + flags + atNode', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const out = {};
      S_story.level = 20; S_story.gold = 10000;
      S_story.quests.quest_pit_debut = 'active';
      storyCheckQuests({ code:'ZZZ' });
      out.noWins = S_story.quests.quest_pit_debut;
      S_story.pitTrainingWins = 1;
      storyCheckQuests({ code:'ZZZ' });
      out.oneWin = S_story.quests.quest_pit_debut;
      out.perIdGold = S_story.gold - 10000;                                       // +100 from the W7c onComplete chain
      S_story.quests.quest_forge_02 = 'active';
      S_story.forgeActivated = true; S_story.currentCode = 'DSF';
      S_story.inventory = [{ name:'Iodine Salt' }];                               // either salt satisfies the OR
      out.plainSalt = QuestRuntime.canComplete('quest_forge_02');
      S_story.inventory = [{ name:'Charged Iodine Salt' }];
      out.chargedSalt = QuestRuntime.canComplete('quest_forge_02');
      S_story.inventory = [];
      out.noSalt = QuestRuntime.canComplete('quest_forge_02');
      return out;
    });
    expect(r).toEqual({ noWins:'active', oneWin:'complete', perIdGold:100, plainSalt:true, chargedSalt:true, noSalt:false });
  });
});

// ── §ARCH-01 Wave 4 — combat quests → fight-roll resolver (78 migrated) ──────
//
// Recon finding (2026-07-03): ALL legacy type:'combat' quests were DEAD in live
// play — _rollCeremonia refused non-skill_check types, no combat quest carried
// completeFn/completeItems/waypointNode, and nothing else ever set their
// checkPassFlags. Every arc stalled at its combat act. The user-approved W4
// design resolves them through the same roll machinery as skill checks but
// presents a FIGHT card (⚔, 'Fight — STAT DC n'); placeholder checkStat:null /
// checkDC:0 and absent stat/DC default to STR DC 12. There is NO legacy roll
// behavior to golden-capture (the resolver was unreachable), so these tests
// assert structure + display intact + NEW deterministic behavior, per the
// §SKILLFIX-02 protocol.
test.describe('§ARCH-01 Wave 4 — combat quests (fight-roll resolver, 78 migrated)', () => {
  test('all 78 type:combat quests are UQF-1.0, valid, skill_check bit, no legacy residue', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const combats = Object.values(QUEST_DB).filter(q => q.type === 'combat');
      const bad = [];
      let withFlag = 0, gateFlags = 0, gateEmpty = 0;
      for (const q of combats) {
        if (q.schema !== 'UQF-1.0') { bad.push(q.id + ':schema'); continue; }
        if (!validateQuest(q).valid) bad.push(q.id + ':invalid');
        const sc = (q.bits || []).find(b => b.kind === 'skill_check');
        if (!sc) { bad.push(q.id + ':no-bit'); continue; }
        if (!['STR','DEX','CON','INT','WIS','CHA'].includes(sc.stat)) bad.push(q.id + ':stat');
        if (typeof sc.dc !== 'number' || sc.dc < 1) bad.push(q.id + ':dc');
        for (const f of ['checkStat','checkPassFlag','checkDC','activateCond','onPass','onFail'])
          if (f in q) bad.push(q.id + ':residual-' + f);
        if ((sc.onPass || []).some(b => b.kind === 'mission_bit')) withFlag++;
        if ((q.gate.flags || []).length) gateFlags++; else if (!q.gate._legacyFn) gateEmpty++;
      }
      return { total: combats.length, bad, withFlag, gateFlags, gateEmpty };
    });
    expect(r.bad).toEqual([]);
    expect(r.total).toBe(78);
    expect(r.withFlag).toBe(63);            // checkPassFlag carriers → mission_bit onPass
    expect(r.gateFlags).toBe(57);           // trivial ()=>!!S_story.flag activateConds
    expect(r.gateEmpty).toBe(21);           // ungated + ()=>true
  });

  test('placeholder + defaulted stats: null/0 and absent stat/DC became STR DC 12', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const pick = id => { const b = QUEST_DB[id].bits.find(x => x.kind === 'skill_check'); return b.stat + ' ' + b.dc; };
      return {
        nullStat: pick('ost_01_act2'),      // was checkStat:null, checkDC:0
        noStat:   pick('sen_c6a2'),         // never had checkStat/checkDC
        kept:     pick('hty02_act4'),       // "str"/12 → STR 12 (real value, not default)
        keptWis:  pick('mol001_act3'),      // "wis"/12
        flag:     QUEST_DB.sen_c6a2.bits[0].onPass[0].flag,
      };
    });
    expect(r.nullStat).toBe('STR 12');
    expect(r.noStat).toBe('STR 12');
    expect(r.kept).toBe('STR 12');
    expect(r.keptWis).toBe('WIS 12');
    expect(r.flag).toBe('sen6A2Passed');
  });

  test('FIGHT card renders for an active combat quest (⚔ + Fight button, not ROLL)', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      S_story.quests = { hty02_act4: 'active' };   // isolate: the card list renders only the first 6 active quests
      storyRender(NODE_MAP[S_story.currentCode]);
      const html = document.getElementById('story-info-row').innerHTML;
      return {
        hasFightLbl: html.includes('FIGHT'),
        hasFightBtn: html.includes('Fight — STR DC 12'),
        noRollBtnForIt: !html.includes('Roll Ceremonia — STR DC 12'),
        hasSword: html.includes('⚔ Draupadi'),
      };
    });
    expect(r).toEqual({ hasFightLbl:true, hasFightBtn:true, noRollBtnForIt:true, hasSword:true });
  });

  test('PASS grants the pass flag + token and opens the downstream sibling gate', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      S_story.level = 20; S_story.xp = 100000;                 // suppress level-up noise
      S_story.abilityScores = { ...S_story.abilityScores, str: 40 };  // guaranteed pass
      S_story.quests.hty02_act4 = 'active';
      const beforeGate = QuestRuntime.canActivate('hty02_act5');
      _rollCeremonia('hty02_act4');
      return {
        beforeGate,
        status: S_story.quests.hty02_act4,
        flag: !!S_story.hty02a4,
        token: !!(S_story.inventory || []).find(i => i.flagRef === 'hty02a4' && i.type === 'mission_bit'),
        afterGate: QuestRuntime.canActivate('hty02_act5'),
      };
    });
    expect(r).toEqual({ beforeGate:false, status:'done', flag:true, token:true, afterGate:true });
  });

  test('FAIL on a non-retryable fight → failed, grants nothing; 1367 retryable fight → stays active', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      S_story.level = 20; S_story.xp = 100000;
      S_story.abilityScores = { ...S_story.abilityScores, str: -100 }; // mod −55: fails any DC
      S_story.hty02a4 = false;
      S_story.quests.hty02_act4 = 'active';
      _rollCeremonia('hty02_act4');
      const bulk = { status: S_story.quests.hty02_act4, flag: !!S_story.hty02a4 };
      S_story.quests.quest_1367_a_najera = 'active';
      _rollCeremonia('quest_1367_a_najera');
      const najFail = {
        status: S_story.quests.quest_1367_a_najera,
        attempts: !!(S_story.skillCheckAttempts || {}).quest_1367_a_najera,
      };
      return { bulk, najFail };
    });
    expect(r.bulk).toEqual({ status:'failed', flag:false });
    expect(r.najFail).toEqual({ status:'active', attempts:true });   // retryable:true
  });

  test('1367 najera PASS: reward xp then faction_hansa −1 via _legacy_fn (legacy order)', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      S_story.level = 20; S_story.xp = 100000;
      S_story.abilityScores = { ...S_story.abilityScores, str: 40 };
      S_story.faction_hansa = 0;
      const xp0 = S_story.xp;
      S_story.quests.quest_1367_a_najera = 'active';
      _rollCeremonia('quest_1367_a_najera');
      return {
        status: S_story.quests.quest_1367_a_najera,
        xpDelta: S_story.xp - xp0,
        hansa: S_story.faction_hansa,
      };
    });
    expect(r).toEqual({ status:'done', xpDelta:150, hansa:-1 });
  });

  test('guide_02/03/06 dead gates fixed: questsDone accepts complete; countMin gate term works', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const out = {};
      out.g2NoPrior = QuestRuntime.canActivate('quest_guide_02');
      S_story.quests.quest_guide_01 = 'complete';               // side quests only reach 'complete'
      out.g2NoCatch = QuestRuntime.canActivate('quest_guide_02'); // countMin conjunct still unmet
      S_story.fishingCatchLog = [{ fish:'x' }];
      out.g2Ready = QuestRuntime.canActivate('quest_guide_02');
      out.g3Before = QuestRuntime.canActivate('quest_guide_03');
      S_story.quests.quest_guide_02 = 'complete';
      out.g3After = QuestRuntime.canActivate('quest_guide_03');
      out.g6Before = QuestRuntime.canActivate('quest_guide_06');
      S_story.quests.quest_guide_05 = 'complete';
      out.g6After = QuestRuntime.canActivate('quest_guide_06');
      // no residual activateCond on the fixed three
      out.residue = ['quest_guide_02','quest_guide_03','quest_guide_06']
        .filter(id => typeof QUEST_DB[id].activateCond === 'function');
      return out;
    });
    expect(r).toEqual({ g2NoPrior:false, g2NoCatch:false, g2Ready:true, g3Before:false, g3After:true,
      g6Before:false, g6After:true, residue:[] });
  });

  test('worldbuilder-export artifact purged: no string-typed activateCond dups (ath/zth/cid crash fix)', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const strCond = Object.values(QUEST_DB).filter(q => typeof q.activateCond === 'string').map(q => q.id);
      // W4 kept the two hybrids' FUNCTION gates; W5 then migrated them fully:
      // the same condition now lives in gate.flags (no activateCond at all).
      return { strCond,
        athGate: (QUEST_DB.ath_c1a3.gate.flags || []).join(','),
        zthGate: (QUEST_DB.zth_c1a3.gate.flags || []).join(','),
        residue: ['ath_c1a3','zth_c1a3'].filter(id => 'activateCond' in QUEST_DB[id]) };
    });
    expect(r).toEqual({ strCond:[], athGate:'athC1A2Done', zthGate:'zthC1A2Done', residue:[] });
  });
});

// ── §ARCH-01 Wave 5 — delivery/escort/dialogue/hybrid/main (106 migrated) ────
//
// Same recon result as W4: the 99 delivery/escort/dialogue/hybrid quests were
// ALL DEAD in legacy (no resolver accepted their types, no completion path).
// User-approved design: typed default rolls — delivery → CHA DC 12 (📦 DELIVER
// card), escort → STR DC 12 (🛡 ESCORT), dialogue → real skill-name stat via
// SKILL_TO_ABILITY (💬 TALK), hybrid → real stat (plain 🎲 ROLL card). The 7
// main quests (mq_1–7) were ALIVE via completeItems → pure-parity
// completion:{items} migration (fuzzy-OR term = the legacy matching rule).
test.describe('§ARCH-01 Wave 5 — other types (typed-roll resolvers + main parity, 106 migrated)', () => {
  test('all 99 dead-type quests are UQF-1.0 + valid with typed defaults; no legacy residue', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const bad = [];
      const byType = { delivery:0, escort:0, dialogue:0, hybrid:0 };
      let deliveryDefault = 0, escortDefault = 0, dialogueSkill = 0;
      for (const q of Object.values(QUEST_DB)) {
        if (!(q.type in byType)) continue;
        byType[q.type]++;
        if (q.schema !== 'UQF-1.0') { bad.push(q.id + ':schema'); continue; }
        if (!validateQuest(q).valid) bad.push(q.id + ':invalid');
        const sc = (q.bits || []).find(b => b.kind === 'skill_check');
        if (!sc) { bad.push(q.id + ':no-bit'); continue; }
        if (!['STR','DEX','CON','INT','WIS','CHA'].includes(sc.stat)) bad.push(q.id + ':stat');
        for (const f of ['checkStat','checkPassFlag','checkDC','activateCond'])
          if (f in q) bad.push(q.id + ':residual-' + f);
        if (q.type === 'delivery' && sc.stat === 'CHA' && sc.dc === 12) deliveryDefault++;
        if (q.type === 'escort' && sc.stat === 'STR' && sc.dc === 12) escortDefault++;
        if (q.type === 'dialogue' && sc.skill) dialogueSkill++;
      }
      return { bad, byType, deliveryDefault, escortDefault, dialogueSkill };
    });
    expect(r.bad).toEqual([]);
    expect(r.byType).toEqual({ delivery:57, escort:22, dialogue:7, hybrid:13 });
    expect(r.deliveryDefault).toBe(57);      // no delivery carried a stat/DC → all defaulted
    expect(r.escortDefault).toBe(22);        // ditto escorts
    expect(r.dialogueSkill).toBe(6);         // 6 stn dialogues keep skill names; stn_c7a2 carried a raw ability (WIS)
  });

  test('skill-name mapping: stn dialogue + cai hybrid stats govern correctly', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const pick = id => { const b = QUEST_DB[id].bits.find(x => x.kind === 'skill_check'); return [b.stat, b.skill || null, b.dc].join('|'); };
      return {
        toll: pick('stn_c1a2'),        // Persuasion 12 → CHA
        insight: pick('stn_c5a1'),     // Insight 14 → WIS
        caiAth: pick('cai_c1a3'),      // Athletics 10 → STR
        lbcCha: pick('lbc_c1a3'),      // real ability CHA 14 → no skill field
      };
    });
    expect(r.toll).toBe('CHA|Persuasion|12');
    expect(r.insight).toBe('WIS|Insight|14');
    expect(r.caiAth).toBe('STR|Athletics|10');
    expect(r.lbcCha).toBe('CHA||14');       // no skill field — join renders null as ''
  });

  test('main quests mq_1–7: pure-parity completion:{items}; canComplete matches the legacy fuzzy rule', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const bad = [];
      for (let i = 1; i <= 7; i++) {
        const q = QUEST_DB['mq_' + i];
        if (!q || q.schema !== 'UQF-1.0') { bad.push('mq_' + i + ':schema'); continue; }
        if (!validateQuest(q).valid) bad.push('mq_' + i + ':invalid');
        if (!(q.completion && (q.completion.items || []).length)) bad.push('mq_' + i + ':no-items');
        if ('completeItems' in q) bad.push('mq_' + i + ':residual');
        if (!q.waypointNode) bad.push('mq_' + i + ':waypoint-lost');
      }
      S_story.quests.mq_1 = 'active';
      S_story.inventory = [];
      const before = QuestRuntime.canComplete('mq_1');
      S_story.inventory.push({ name:'Trade Seal (Shard #1)' });
      const exact = QuestRuntime.canComplete('mq_1');
      S_story.inventory = [{ name:'Trade Seal' }];                    // fuzzy two-way substring — matches legacy
      const fuzzy = QuestRuntime.canComplete('mq_1');
      return { bad, before, exact, fuzzy };
    });
    expect(r.bad).toEqual([]);
    expect(r).toMatchObject({ before:false, exact:true, fuzzy:true });
  });

  test('typed cards render: DELIVER, ESCORT, TALK with typed buttons', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      S_story.quests = { zth_08_act5:'active', stn_c1a1:'active', stn_c1a2:'active' };
      storyRender(NODE_MAP[S_story.currentCode]);
      const html = document.getElementById('story-info-row').innerHTML;
      return {
        deliver: html.includes('DELIVER') && html.includes('Deliver — CHA DC 12'),
        escort: html.includes('ESCORT') && html.includes('Escort — STR DC 12'),
        talk: html.includes('TALK') && html.includes('Talk — Persuasion DC 12'),
      };
    });
    expect(r).toEqual({ deliver:true, escort:true, talk:true });
  });

  test('delivery PASS grants flag + token; escort FAIL is terminal and grants nothing', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      S_story.level = 20; S_story.xp = 100000;
      S_story.abilityScores = { ...S_story.abilityScores, cha: 40, str: -100 };
      S_story.quests.zth_08_act5 = 'active';
      _rollCeremonia('zth_08_act5');                                  // CHA 40 → guaranteed pass
      const del = { status: S_story.quests.zth_08_act5, flag: !!S_story.zth_08_act5,
        token: !!(S_story.inventory || []).find(i => i.flagRef === 'zth_08_act5' && i.type === 'mission_bit') };
      S_story.quests.stn_c1a1 = 'active';
      _rollCeremonia('stn_c1a1');                                     // STR −100 → guaranteed fail
      const esc = { status: S_story.quests.stn_c1a1, flag: !!S_story.stn_c1a1_done };
      return { del, esc };
    });
    expect(r.del).toEqual({ status:'done', flag:true, token:true });
    expect(r.esc).toEqual({ status:'failed', flag:false });
  });
});

// ── §ARCH-01 Wave 6 — epic quests (40 = 20 EB primary/return pairs, parity) ──
//
// Unlike W4/W5, epics were ALIVE: their lifecycle machinery lives OUTSIDE the
// quest objects (EB NPC modal activates _primary, the boss-victory hook
// activates _return, _storyEbReturnBeat sets ebReturnDone, and the schema-
// agnostic completion loop runs their completeFns). The quests themselves are
// passive completion watchers — the W3 side-quest shape — so W6 is a pure
// parity migration onto EXISTING terms: defeatedBattles[X] → completion.battles,
// ebReturnDone[X] → completion.flagsPath. Zero engine changes; the epic
// activation exclusion (`if (q.type==='epic') return;`) is untouched.
test.describe('§ARCH-01 Wave 6 — epic quests (EB pairs, parity completion, 40 migrated)', () => {
  test('all 40 epics are UQF-1.0 + valid: 20 battles-completions, 20 flagsPath-completions, fields kept', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const epics = Object.values(QUEST_DB).filter(q => q.type === 'epic');
      const bad = [];
      let battles = 0, paths = 0, rewards = 0;
      for (const q of epics) {
        if (q.schema !== 'UQF-1.0') { bad.push(q.id + ':schema'); continue; }
        if (!validateQuest(q).valid) bad.push(q.id + ':invalid');
        if (q.completeFn) bad.push(q.id + ':completeFn-residue');
        if ((q.bits || []).length) bad.push(q.id + ':bits');
        if (!q.waypointNode || !q.npc) bad.push(q.id + ':fields-lost');
        if ((q.completion.battles || []).length === 1) battles++;
        if ((q.completion.flagsPath || []).length === 1) paths++;
        if (typeof q.reward === 'number') rewards++;
      }
      return { total: epics.length, bad, battles, paths, rewards };
    });
    expect(r.bad).toEqual([]);
    expect(r.total).toBe(40);
    expect(r.battles).toBe(20);          // primaries: defeatedBattles[X]
    expect(r.paths).toBe(20);            // returns: ebReturnDone.X
    expect(r.rewards).toBe(20);          // return payment field kept verbatim
  });

  test('epic activation exclusion untouched: storyCheckQuests never auto-activates an epic', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      delete S_story.quests.quest_ef_primary;
      storyCheckQuests({ code: QUEST_DB.quest_ef_primary.activateNode });   // FRO — would activate any non-epic
      return { activated: S_story.quests.quest_ef_primary || '(not activated)' };
    });
    expect(r.activated).toBe('(not activated)');
  });

  test('primary parity: active + boss defeated → storyCheckQuests flips to complete', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      S_story.quests.quest_ef_primary = 'active';
      const before = QuestRuntime.canComplete('quest_ef_primary');
      storyCheckQuests({ code:'ZZZ' });
      const stillActive = S_story.quests.quest_ef_primary;
      S_story.defeatedBattles.PRN = true;
      const can = QuestRuntime.canComplete('quest_ef_primary');
      storyCheckQuests({ code:'ZZZ' });
      return { before, stillActive, can, after: S_story.quests.quest_ef_primary };
    });
    expect(r).toEqual({ before:false, stillActive:'active', can:true, after:'complete' });
  });

  test('return parity: ebReturnDone.PRN drives completion via flagsPath', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      S_story.quests.quest_ef_return = 'active';
      const before = QuestRuntime.canComplete('quest_ef_return');
      S_story.ebReturnDone = { PRN: true };
      const can = QuestRuntime.canComplete('quest_ef_return');
      storyCheckQuests({ code:'ZZZ' });
      return { before, can, after: S_story.quests.quest_ef_return };
    });
    expect(r).toEqual({ before:false, can:true, after:'complete' });
  });
});

// ── §ARCH-01 Wave 7 (Phase 4) — completion-bit execution point ──
//
// W7a builds the gatekeeper deferred since Wave 3: when storyCheckQuests flips a
// quest to 'complete', an ARRAY-valued onComplete is executed as a UQF bit chain
// (QuestRuntime.execBits) instead of being called as a closure. Narrative bits
// route into the storyCheckQuests msgs stream (ctx.pushMsg) — same presentation
// as the per-id hardcoded effects block — and validateQuest now walks the
// completion chain too. Function-valued onComplete is byte-identical legacy.

test.describe('§ARCH-01 W7 — completion-bit execution point (Phase 4)', () => {
  test('an array-valued onComplete executes as a bit chain on completion', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      QUEST_DB.quest___w7a = { id:'quest___w7a', type:'side', schema:'UQF-1.0', gate:{},
        bits:[], completion:{ flags:['__w7aReady'] }, title:'W7a Probe',
        onComplete:[
          { kind:'reward', xp:120, gold:45 },
          { kind:'mission_bit', flag:'__w7aBitGranted' },
          { kind:'flag_write', set:['__w7aFlagSet'] },
          { kind:'narrative', msg:'🧪 W7a completion narrative' },
        ] };
      S_story.quests = { quest___w7a:'active' };
      S_story.xp = 0; S_story.gold = 0; S_story.inventory = [];
      delete S_story.__w7aReady; delete S_story.__w7aBitGranted; delete S_story.__w7aFlagSet;
      const preMsgs = storyCheckQuests({ code:'__none' });          // gate unmet ⇒ no fire
      const stillActive = S_story.quests.quest___w7a;
      const xpPre = S_story.xp;
      S_story.__w7aReady = true;
      const msgs = storyCheckQuests({ code:'__none' });
      const out = { preMsgs, stillActive, xpPre,
        status: S_story.quests.quest___w7a, xp: S_story.xp, gold: S_story.gold,
        bitGranted: !!S_story.__w7aBitGranted, flagSet: !!S_story.__w7aFlagSet,
        tokenInInv: (S_story.inventory || []).some(i => i.type === 'mission_bit'),
        narrativeInMsgs: msgs.some(m => /W7a completion narrative/.test(m)) };
      delete QUEST_DB.quest___w7a;
      return out;
    });
    expect(r.preMsgs).toEqual([]);
    expect(r.stillActive).toBe('active');
    expect(r.xpPre).toBe(0);
    expect(r.status).toBe('complete');
    expect(r.xp).toBe(120);
    expect(r.gold).toBe(45);
    expect(r.bitGranted).toBe(true);
    expect(r.flagSet).toBe(true);
    expect(r.tokenInInv).toBe(true);                    // mission_bit went through _grantMissionBit
    expect(r.narrativeInMsgs).toBe(true);               // narrative rode the msgs stream, not storyMsg
  });

  test('a function-valued onComplete still fires as a legacy closure (unchanged path)', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      QUEST_DB.quest___w7b = { id:'quest___w7b', type:'side', schema:'UQF-1.0', gate:{},
        bits:[], completion:{ flags:['__w7bReady'] }, title:'W7b Probe',
        onComplete:() => { S_story.__w7bClosureRan = true; } };
      S_story.quests = { quest___w7b:'active' };
      delete S_story.__w7bReady; delete S_story.__w7bClosureRan;
      S_story.__w7bReady = true;
      storyCheckQuests({ code:'__none' });
      const out = { status: S_story.quests.quest___w7b, closureRan: !!S_story.__w7bClosureRan };
      delete QUEST_DB.quest___w7b;
      return out;
    });
    expect(r.status).toBe('complete');
    expect(r.closureRan).toBe(true);
  });

  test('validateQuest walks an array-valued onComplete chain', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const good = validateQuest({ id:'x', schema:'UQF-1.0', completion:{ flags:['f'] },
        onComplete:[{ kind:'reward', xp:10 }] });
      const badKind = validateQuest({ id:'x', schema:'UQF-1.0', completion:{ flags:['f'] },
        onComplete:[{ kind:'teleport' }] });
      const badContract = validateQuest({ id:'x', schema:'UQF-1.0', completion:{ flags:['f'] },
        onComplete:[{ kind:'reward' }] });                        // empty reward fails contract
      return { good, badKind, badContract };
    });
    expect(r.good.valid).toBe(true);
    expect(r.badKind.valid).toBe(false);
    expect(r.badKind.errors.some(e => /Unknown bit kind: teleport/.test(e))).toBe(true);
    expect(r.badContract.valid).toBe(false);
  });

  test('narrative bits outside a msgs context still fall back to storyMsg', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      QuestRuntime.execBits([{ kind:'narrative', msg:'🧪 W7 direct narrative' }], {});
      return document.getElementById('story-move-msg').textContent;
    });
    expect(r).toContain('W7 direct narrative');
  });
});

// ── §ARCH-01 Wave 7b — the 27 QUEST_DB onComplete closures → completion bit chains ──
//
// Every function-valued onComplete in QUEST_DB is now an ARRAY of bits executed by
// the W7a execution point. Decomposition: flag sets → flag_write, xp/gold/items/
// knowledge → reward, exact-name removals → item_remove, storyMsg → narrative
// (rides the msgs stream, same presentation as the per-id block). _legacy_fn keeps
// the inexpressible parts (_innKindness threshold key grant, charged-vs-plain
// iodine preference, INT+1 ability bump, numeric mazeSolvedChecks). The known xp
// double-counts (sb_fight/hunt_04/hunt2_04/bilge_04/sk_hull: bit xp ∧ xpAward)
// are PRESERVED, not fixed.

test.describe('§ARCH-01 W7b — QUEST_DB onComplete closures folded into bit chains', () => {
  test('no function-valued onComplete remains in QUEST_DB; all chains validate', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const carriers = Object.values(QUEST_DB).filter(q => q.onComplete);
      const fns = carriers.filter(q => typeof q.onComplete === 'function').map(q => q.id);
      const arrays = carriers.filter(q => Array.isArray(q.onComplete));
      // §W7d: quest_wm_01 (the last legacy carrier) is now UQF, so EVERY carrier
      // whole-quest-validates — no BIT_CONTRACTS side-channel needed anymore.
      const uqf = arrays.filter(q => q.schema === 'UQF-1.0');
      const invalid = uqf.map(q => ({ id:q.id, v: validateQuest(q) })).filter(x => !x.v.valid);
      const nonUqf = arrays.filter(q => q.schema !== 'UQF-1.0').map(q => q.id);
      return { total: carriers.length, fns, arrayCount: arrays.length, nonUqf, uqfCount: uqf.length,
               invalid: invalid.map(x => x.id + ': ' + x.v.errors.join('; ')) };
    });
    expect(r.fns).toEqual([]);              // zero closures left
    expect(r.arrayCount).toBe(r.total);     // every carrier is an array chain
    expect(r.arrayCount).toBe(93);          // 27 (W7b closures) + 61 (W7c per-id block) + 5 (§MATH-01 gold chains)
    expect(r.nonUqf).toEqual([]);           // §W7d — the last legacy carrier (wm_01) migrated
    expect(r.uqfCount).toBe(93);
    expect(r.invalid).toEqual([]);          // every chain passes bit contracts
  });

  test('glut_06 full-chain parity: flags, gift removal, kindness, crown flag', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      S_story.quests = { quest_glut_06:'active' };
      S_story.inventory = [{ name:"Glut's Gift", icon:'🫙', sell:0 }];
      S_story.glut_gift_held = true; S_story.innmotherKindness = 0;
      delete S_story.glutGiftReturned; delete S_story.glutCrownComplete;
      S_story.glutGiftReturned = true;                     // completion flag (set by story beat)
      storyCheckQuests({ code:'__none' });
      return { status: S_story.quests.quest_glut_06,
               giftGone: !(S_story.inventory || []).some(i => i.name === "Glut's Gift"),
               heldCleared: S_story.glut_gift_held === false,
               kindness: S_story.innmotherKindness,
               crown: !!S_story.glutCrownComplete };
    });
    expect(r.status).toBe('complete');
    expect(r.giftGone).toBe(true);
    expect(r.heldCleared).toBe(true);
    expect(r.kindness).toBe(1);
    expect(r.crown).toBe(true);
  });

  test('sb_fight battle completion: bit chain fires; xpAward double-count fixed (removed) → single +400', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      S_story.quests = { quest_sb_fight:'active' };
      S_story.inventory = []; S_story.xp = 0; S_story.gold = 0; S_story.level = 20; // level cap avoids level-up churn
      delete S_story.sbResolved;
      S_story.defeatedBattles = { SB_PRIVATEER: true };
      const msgs = storyCheckQuests({ code:'__none' });
      return { status: S_story.quests.quest_sb_fight,
               resolved: !!S_story.sbResolved, gold: S_story.gold, xp: S_story.xp,
               letter: (S_story.inventory || []).some(i => i.name === 'Letter of Marque (Keel)'),
               narrativeShown: msgs.some(m => /privateer crew is cleared/.test(m)) };
    });
    expect(r.status).toBe('complete');
    expect(r.resolved).toBe(true);
    expect(r.gold).toBe(200);
    expect(r.xp).toBe(400);                 // 400 (reward bit) only — redundant xpAward removed 2026-07-07 (open-gaps item 4), no double-count
    expect(r.letter).toBe(true);
    expect(r.narrativeShown).toBe(true);
  });

  test('iodine_02 counted consumption: exactly 2 of 3 Swamp Kelp removed, 2 Iodine Salt granted', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const kelp = () => ({ name:'Swamp Kelp', icon:'🌿', sell:3, type:'craft' });
      S_story.quests = { quest_iodine_02:'active' };
      S_story.inventory = [kelp(), kelp(), kelp()];
      S_story.innmotherKindness = 0; S_story.currentCode = 'INN';
      storyCheckQuests({ code:'INN' });
      const inv = S_story.inventory || [];
      return { status: S_story.quests.quest_iodine_02,
               kelpLeft: inv.filter(i => i.name === 'Swamp Kelp').length,
               salt: inv.filter(i => i.name === 'Iodine Salt').length };
    });
    expect(r.status).toBe('complete');
    expect(r.kelpLeft).toBe(1);
    expect(r.salt).toBe(2);
  });
});

// ── §ARCH-01 Wave 7c — the storyCheckQuests per-id effects block → onComplete chains ──
//
// The 61-id hardcoded effects block ("Layer 41 quest completion side effects" …
// "Layer 81: Mimic Meadows") is DELETED from storyCheckQuests; every effect now
// lives on its quest as a W7a-executed onComplete bit chain. New `favor` bit
// kind wraps _setNpcFavor (set = absolute level, add = increment clamped to
// cap, default 3; _setNpcFavor itself never lowers). _legacy_fn handlers now
// receive ctx, so conditional entries (scar_04 mercy branch, vs_warden
// three-way, lame_lystra, wm_01 seal spend, tl_01/tl_03 runtime items,
// fishing_guide's lazy FISHING_GUIDE_TEXT) keep exact legacy behavior.
// Known presentation-only change: chain messages print BEFORE the '✓ title'
// line (the legacy block printed after it). Entries that were dead in legacy
// (skill_check quests with no completion gate: basket_damascus, ezzir,
// governor_cyprus, lame_lystra, stoning_lystra, d0206_a5, d0208_a4/a5) stay
// dead — storyCheckQuests never flips them to 'complete'.

test.describe('§ARCH-01 W7c — per-id effects block folded into onComplete chains', () => {
  test('the id-keyed block is gone from storyCheckQuests', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => storyCheckQuests.toString().includes("if (id === '"));
    expect(r).toBe(false);
  });

  test('favor bit kind: set / add-with-cap semantics ride the monotonic _setNpcFavor', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const out = {};
      S_story.npcFavorability = {};
      QuestRuntime.execBits([{ kind:'favor', npc:'__w7c', set:1 }], {});
      out.set1 = _npcFavor('__w7c');
      QuestRuntime.execBits([{ kind:'favor', npc:'__w7c', add:1 }], {});
      out.add1 = _npcFavor('__w7c');
      QuestRuntime.execBits([{ kind:'favor', npc:'__w7c', add:5 }], {});
      out.capDefault3 = _npcFavor('__w7c');
      QuestRuntime.execBits([{ kind:'favor', npc:'__w7c', set:1 }], {});
      out.neverLowers = _npcFavor('__w7c');
      S_story.npcFavorability.__w7c2 = 0;
      QuestRuntime.execBits([{ kind:'favor', npc:'__w7c2', add:5, cap:2 }], {});
      out.explicitCap = _npcFavor('__w7c2');
      const mk = bits => validateQuest({ id:'x', schema:'UQF-1.0', completion:{ flags:['f'] }, onComplete:bits }).valid;
      out.validSet   = mk([{ kind:'favor', npc:'x', set:1 }]);
      out.validAdd   = mk([{ kind:'favor', npc:'x', add:1 }]);
      out.noMode     = mk([{ kind:'favor', npc:'x' }]);
      out.noNpc      = mk([{ kind:'favor', set:1 }]);
      delete S_story.npcFavorability.__w7c; delete S_story.npcFavorability.__w7c2;
      return out;
    });
    expect(r).toEqual({ set1:1, add1:2, capDefault3:3, neverLowers:3, explicitCap:2,
      validSet:true, validAdd:true, noMode:false, noNpc:false });
  });

  test('slums_cleanup parity flip: +80 gold, yael favor 1, message in the msgs stream', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      S_story.level = 20; S_story.gold = 0; S_story.xp = 0;
      S_story.npcFavorability = {};
      S_story.quests = { quest_slums_cleanup:'active' };
      S_story.slStalksWon = 3;
      const msgs = storyCheckQuests({ code:'__none' });
      return { status: S_story.quests.quest_slums_cleanup, gold: S_story.gold, xp: S_story.xp,
               yael: _npcFavor('yael'), msg: msgs.some(m => /\+80gp from Yael/.test(m)) };
    });
    expect(r).toEqual({ status:'complete', gold:80, xp:0, yael:1, msg:true });
  });

  test('city_watch_patrol: reward gold+xp, favor add raises 2→3 and clamps at 3', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const run = startFavor => {
        S_story.level = 20; S_story.gold = 0; S_story.xp = 0;
        S_story.npcFavorability = { yael: startFavor };
        S_story.quests = { quest_city_watch_patrol:'active' };
        S_story.patrolRouteComplete = true;
        storyCheckQuests({ code:'__none' });
        return { gold: S_story.gold, xp: S_story.xp, yael: _npcFavor('yael') };
      };
      return { from2: run(2), from3: run(3) };
    });
    expect(r.from2).toEqual({ gold:50, xp:150, yael:3 });
    expect(r.from3).toEqual({ gold:50, xp:150, yael:3 });   // Math.min(3, 3+1) → no-op
  });

  test('scar_04 branches: mercy path grants one-shot WIS+1 + mercy message; refuse path plain', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const run = (choice, preGranted) => {
        S_story.level = 20; S_story.xp = 0;
        S_story.abilityScores = { wis: 12 };
        S_story.gretChoice = choice; S_story.currentCode = 'NUE';
        S_story.scar01WisGranted = preGranted; if (!preGranted) delete S_story.scar01WisGranted;
        delete S_story.gretComplete;
        S_story.npcFavorability = {};
        S_story.quests = { quest_scar_04:'active' };
        const msgs = storyCheckQuests({ code:'__none' });
        return { wis: S_story.abilityScores.wis, granted: !!S_story.scar01WisGranted,
                 gret: _npcFavor('gret'), gretComplete: !!S_story.gretComplete, xp: S_story.xp,
                 mercy: msgs.some(m => /WIS \+1 \(mercy path\)/.test(m)),
                 plain: msgs.some(m => /Light obtained\.$/.test(m)) };
      };
      return { help: run('help', false), refuse: run('refuse', false), helpAgain: run('help', true) };
    });
    // mercy path: WIS 12→13, one-shot flag set, mercy message, favor 2, xpAward 350 still fires
    expect(r.help).toEqual({ wis:13, granted:true, gret:2, gretComplete:true, xp:350, mercy:true, plain:false });
    // refuse path: no WIS change, plain message
    expect(r.refuse).toEqual({ wis:12, granted:false, gret:2, gretComplete:true, xp:350, mercy:false, plain:true });
    // help path with the WIS already granted: plain message, no second bump
    expect(r.helpAgain).toEqual({ wis:12, granted:true, gret:2, gretComplete:true, xp:350, mercy:false, plain:true });
  });

  test('vs_warden three-way resolution message (neither / persuaded / defeated)', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const run = (persuaded, defeated) => {
        S_story.vsShamanPersuaded = persuaded; S_story.vshamanDefeated = defeated;
        S_story.wardensLegacyKnown = true;
        S_story.quests = { quest_vs_warden:'active' };
        const msgs = storyCheckQuests({ code:'__none' });
        return msgs.filter(m => m.startsWith('🔑'))[0];
      };
      return { neither: run(false, false), persuaded: run(true, false), defeated: run(false, true) };
    });
    expect(r.neither).toMatch(/mandate is resolved/);
    expect(r.persuaded).toMatch(/Persuasion path/);
    expect(r.defeated).toMatch(/Combat path/);
  });

  test('fishing_guide: lazy _legacy_fn grants the readable with the real FISHING_GUIDE_TEXT', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      S_story.level = 20;
      S_story.quests = { quest_fishing_guide:'active' };
      S_story.inventory = [];
      S_story.fishingCatchLog = [{ name:'Perch' }];
      S_story.currentCode = 'SSJ';
      const msgs = storyCheckQuests({ code:'__none' });
      const item = (S_story.inventory || []).find(i => i.name === 'Fishing Guide');
      return { status: S_story.quests.quest_fishing_guide, hasItem: !!item,
               textOk: !!item && item.readText === FISHING_GUIDE_TEXT && item.readText.length > 0,
               msg: msgs.some(m => /Fishing Guide received/.test(m)) };
    });
    expect(r).toEqual({ status:'complete', hasItem:true, textOk:true, msg:true });
  });

  test('wm_01 (legacy holdout) chain: 3 seals spent on the seal path, kept on the letter path', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const seal = () => ({ name:"Scholar Kings' Seal", icon:'📜', sell:0 });
      const run = viaLetter => {
        S_story.level = 20;
        S_story.archiveLetterObtained = viaLetter; if (!viaLetter) delete S_story.archiveLetterObtained;
        delete S_story.wmLowerArchiveUnlocked;
        S_story.inventory = [seal(), seal(), seal(), seal()];
        S_story.quests = { quest_wm_01:'active' };
        const msgs = storyCheckQuests({ code:'__none' });
        return { status: S_story.quests.quest_wm_01,
                 unlocked: !!S_story.wmLowerArchiveUnlocked,
                 sealsLeft: S_story.inventory.filter(i => i.name === "Scholar Kings' Seal").length,
                 msg: msgs.some(m => /Lower Archive access granted/.test(m)) };
      };
      return { seals: run(false), letter: run(true) };
    });
    expect(r.seals).toEqual({ status:'complete', unlocked:true, sealsLeft:1, msg:true });
    expect(r.letter).toEqual({ status:'complete', unlocked:true, sealsLeft:4, msg:true });
  });

  test('void_below chain: auros favor 2, bruhnsDepthsReported flag, narrative in stream', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      S_story.level = 20;
      S_story.npcFavorability = {};
      delete S_story.bruhnsDepthsReported;
      S_story.quests = { quest_void_below:'active' };
      S_story.defeatedBattles = { CY_VOID: true };
      const msgs = storyCheckQuests({ code:'__none' });
      return { status: S_story.quests.quest_void_below, auros: _npcFavor('auros'),
               reported: !!S_story.bruhnsDepthsReported,
               msg: msgs.some(m => /EMP Grenade from Auros/.test(m)) };
    });
    expect(r).toEqual({ status:'complete', auros:2, reported:true, msg:true });
  });

  test('_legacy_fn handlers receive ctx (pushMsg routing) and still get S_story first', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const got = [];
      QuestRuntime.execBits([{ kind:'_legacy_fn', fn:(S, ctx) => ctx.pushMsg('ctx-ok:' + (S === S_story)) }],
        { pushMsg: m => got.push(m) });
      return got;
    });
    expect(r).toEqual(['ctx-ok:true']);
  });
});

// ── §ARCH-01 Wave 7d — legacy branches retired ───────────────────────────────
//
// The declarative engine is now the ONLY quest execution surface: _rollCeremonia's
// legacy roll body is gone (warned no-op for non-UQF ids — see the rewritten
// Phase-2 test), storyCheckQuests' completeFn/completeItems completion terms are
// gone, and adaptLegacyQuest is an identity no-op (rewritten Phase-1 test).
// quest_wm_01 — the last completeFn carrier — migrated via the new OR-position
// completion term `itemsMinAny` (exact-name inventory count, [{name, min}]).
// Remaining non-UQF entries by design: quest_math_01–05 (activate-only, §MATH-01
// completion-design gap) + the 30 dead blq_05–blq_10 book-stubs (Wave 2ad).

test.describe('§ARCH-01 W7d — legacy branches retired; wm_01 migrated via itemsMinAny', () => {
  test('itemsMinAny truth table: exact-name count in OR position, composes with the OR-group', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const seal = () => ({ name:"Scholar Kings' Seal" });
      QUEST_DB.q_w7d_min = { schema:'UQF-1.0', id:'q_w7d_min', type:'side', title:'x', gate:{}, bits:[],
        completion:{ flagsAny:['w7dLetter'], itemsMinAny:[{ name:"Scholar Kings' Seal", min:3 }] } };
      const out = {};
      delete S_story.w7dLetter; S_story.inventory = [seal(), seal()];
      out.twoSeals = QuestRuntime.canComplete('q_w7d_min');                    // 2 < 3, no flag
      S_story.inventory = [seal(), seal(), seal()];
      out.threeSeals = QuestRuntime.canComplete('q_w7d_min');                  // count met
      S_story.inventory = [{ name:"Scholar Kings' Seal Fragment" }, seal(), seal()];
      out.fuzzyRejected = QuestRuntime.canComplete('q_w7d_min');               // EXACT name — no substring match
      S_story.inventory = []; S_story.w7dLetter = true;
      out.flagAlone = QuestRuntime.canComplete('q_w7d_min');                   // OR-group: flag satisfies
      // default min = 1 when omitted
      QUEST_DB.q_w7d_min.completion = { itemsMinAny:[{ name:'Lone Token' }] };
      delete S_story.w7dLetter; S_story.inventory = [{ name:'Lone Token' }];
      out.defaultMin = QuestRuntime.canComplete('q_w7d_min');
      delete QUEST_DB.q_w7d_min; delete S_story.w7dLetter;
      return out;
    });
    expect(r).toEqual({ twoSeals:false, threeSeals:true, fuzzyRejected:false, flagAlone:true, defaultMin:true });
  });

  test('quest_wm_01 is UQF: validates, completion is the letter-OR-3-seals gate, no completeFn residue', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const q = QUEST_DB.quest_wm_01;
      return { schema: q.schema, valid: validateQuest(q).valid, noFn: !('completeFn' in q),
               flagsAny: q.completion.flagsAny, minEntry: q.completion.itemsMinAny[0],
               chainKept: Array.isArray(q.onComplete) && q.onComplete.length === 3 };
    });
    expect(r.schema).toBe('UQF-1.0');
    expect(r.valid).toBe(true);
    expect(r.noFn).toBe(true);
    expect(r.flagsAny).toEqual(['archiveLetterObtained']);
    expect(r.minEntry).toEqual({ name:"Scholar Kings' Seal", min:3 });
    expect(r.chainKept).toBe(true);
  });

  test('storyCheckQuests no longer honors legacy completeFn / completeItems terms', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      S_story.level = 20; S_story.inventory = [{ name:'Relic Token' }];
      // Pre-W7d both of these would complete on this pass; the terms are retired.
      QUEST_DB.__w7d_fn = { id:'__w7d_fn', type:'side', title:'fn', completeFn:() => true };
      QUEST_DB.__w7d_items = { id:'__w7d_items', type:'side', title:'it', completeItems:['Relic Token'] };
      S_story.quests = { __w7d_fn:'active', __w7d_items:'active' };
      storyCheckQuests({ code:'__none' });
      const out = { fn: S_story.quests.__w7d_fn, items: S_story.quests.__w7d_items };
      delete QUEST_DB.__w7d_fn; delete QUEST_DB.__w7d_items;
      return out;
    });
    expect(r).toEqual({ fn:'active', items:'active' });   // neither completes anymore
  });

  test('§W8a canonical fields: no QUEST_DB entry carries a dead legacy field (completeItems / root check* / bitLabel / goldAward)', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      // Root-level legacy fields swept in W8a. NB checkStat/checkDC etc. are fine
      // INSIDE bits (that is the UQF home for stat/dc) — this checks quest roots only.
      const DEAD = ['completeItems','completeFn','checkStat','checkSkill','checkLabel',
                    'checkAbility','checkDC','checkPassFlag','checkFailFlag','bitLabel','goldAward'];
      const bad = [];
      for (const q of Object.values(QUEST_DB))
        for (const f of DEAD) if (f in q) bad.push(q.id + ':' + f);
      // xpAward is LIVE only as the side-quest completion award — nowhere else.
      const xpNonSide = Object.values(QUEST_DB).filter(q => 'xpAward' in q && q.type !== 'side').map(q => q.id);
      return { bad, xpNonSide };
    });
    expect(r.bad).toEqual([]);
    expect(r.xpNonSide).toEqual([]);
  });

  test('the full non-UQF residue is exactly the 30 blq stubs (all activate-only, no completion surface)', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const nonUqf = Object.values(QUEST_DB).filter(q => q.schema !== 'UQF-1.0');
      return {
        ids: nonUqf.map(q => q.id).sort(),
        withCompletionSurface: nonUqf.filter(q =>
          q.completeFn || (q.completeItems || []).length || q.completion).map(q => q.id),
      };
    });
    // §MATH-01 2026-07-07: quest_math_01–05 migrated to UQF — residue 35 → 30.
    expect(r.ids.length).toBe(30);
    expect(r.ids.filter(id => /^quest_math_/.test(id)).length).toBe(0);
    expect(r.ids.filter(id => /^blq_(05|06|07|08|09|10)_/.test(id)).length).toBe(30);
    expect(r.withCompletionSurface).toEqual([]);   // none of them can ever complete — nothing rides the retired terms
  });
});

// ── §ARCH-01 W8c — storyRender audit: the engine is the SOLE quest-completer ──
//
// The storyRender per-node hooks are UI wiring — they set world flags/status the
// engine observes; NONE read a legacy quest-execution field (checkStat/onPass/
// completeFn/… all grep to 0 outside QuestRuntime + storyCheckQuests). W8c removed
// the last two REDUNDANT inline completion shortcuts: the Yugurt tournament win
// (quest_tour_0N) and the free-rod coupon redemption (quest_no_fishing_sign) each
// set '=complete'+xp inline AND carried a live, tested engine completion gate
// (completion:{flagsPath|flags} + xpAward). The two xp values are identical for
// every act (opp.xp === xpAward: pip 100 … master 1000; coupon +50 === xpAward:50),
// so deleting the inline shortcut is behaviour-preserving and leaves the engine the
// single completion authority. quest_la_riva_02 is the sole documented exception —
// its inline AMS hook grants +500g / the account book / +Aldo favor / activates
// la_riva_03, rewards its engine completion:{countMin,itemsAll} gate does NOT carry
// (no onComplete / no xpAward), so formalising it is deferred §GR work (lab-report
// gated); it stays inline-authoritative by design.
test.describe('§ARCH-01 W8c — storyRender audit: engine is the sole completer', () => {
  test('tour + no_fishing_sign are engine-completable, and opp.xp === xpAward for every act (no divergence)', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const bad = [];
      for (const id of ['quest_tour_01','quest_tour_02','quest_tour_03','quest_tour_04',
                        'quest_tour_05','quest_tour_06','quest_no_fishing_sign']) {
        const q = QUEST_DB[id];
        if (!q.completion) bad.push(id + ':no-completion');
        if (typeof q.xpAward !== 'number') bad.push(id + ':no-xpAward');
      }
      // the inline value the shortcut used to grant must equal the engine's xpAward
      const mismatches = NPC_TOUR_OPPONENTS
        .filter(o => QUEST_DB['quest_tour_0' + o.order].xpAward !== o.xp)
        .map(o => o.key + ':' + o.xp + '!=' + QUEST_DB['quest_tour_0' + o.order].xpAward);
      return { bad, mismatches };
    });
    expect(r.bad).toEqual([]);
    expect(r.mismatches).toEqual([]);
  });

  test('engine completes tour_01 + no_fishing_sign with a SINGLE xpAward grant (a re-added inline shortcut would double it)', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      S_story.level = 20;                                   // avoid level-up churn; xp is cumulative
      // tour_01: completion flagsPath yugurtTourBeat.pip, xpAward 100
      S_story.quests = { quest_tour_01: 'active' };
      S_story.yugurtTourBeat = { pip: true };
      let xp0 = S_story.xp;
      storyCheckQuests({ code: 'SSJ' });
      const tour = { status: S_story.quests.quest_tour_01, xpDelta: S_story.xp - xp0 };
      // no_fishing_sign: completion flags fishingRodCouponRedeemed, xpAward 50
      S_story.quests = { quest_no_fishing_sign: 'active' };
      S_story.yugurtTourBeat = {};                          // clear so tour_01 can't re-complete and pollute the delta
      S_story.fishingRodCouponRedeemed = true;
      xp0 = S_story.xp;
      storyCheckQuests({ code: 'SSJ' });
      const fish = { status: S_story.quests.quest_no_fishing_sign, xpDelta: S_story.xp - xp0 };
      return { tour, fish };
    });
    expect(r.tour).toEqual({ status: 'complete', xpDelta: 100 });
    expect(r.fish).toEqual({ status: 'complete', xpDelta: 50 });
  });

  test('the two inline completion shortcuts are gone from source; la_riva_02 remains the documented inline exception', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const src = await page.evaluate(() => document.documentElement.outerHTML);
    expect(src.includes("S_story.quests[qId] = 'complete'")).toBe(false);                     // tournament win — engine now
    expect(src.includes("S_story.quests['quest_no_fishing_sign'] = 'complete'")).toBe(false); // coupon redeem — engine now
    expect(src.includes("S_story.quests['quest_la_riva_02'] = 'complete'")).toBe(true);       // §GR inline reward — deferred by design
  });
});

// ─── §MATH-01 (2026-07-07) — Mathematical World completions ─────────────────
// The five quest_math quests migrated from legacy activate-only to UQF collect
// quests: completion:{ itemsAll:[<document>], atNode:<collect node> }, gold via
// onComplete reward bits, xpAward paid by the engine. Nodes EHZ/ZERO/MONS/CNTR
// moved to the walkable 2×2 pocket NE of HKG "Neon Undercity" (29,247 / 28,247 /
// 29,248 / 28,248) — each the sole code on its cell, so activation and node.loot
// pickup work. Design: lab-reports/lab-report-math01-completions.md.
test.describe('§MATH-01 — quest_math_01–05 UQF completions', () => {
  const SHAPES = {
    quest_math_01: { item: 'Zero Treatise',            at: 'ZERO', gold: 300, xp: 350 },
    quest_math_02: { item: '12-Symmetry Manuscript',   at: 'MONS', gold: 350, xp: 400 },
    quest_math_03: { item: 'Hamadani Failure Record',  at: 'EHZ',  gold: 350, xp: 400 },
    quest_math_04: { item: 'Counting Document Bundle', at: 'ZERO', gold: 500, xp: 500 },
    quest_math_05: { item: 'Moonshine Memo',           at: 'CNTR', gold: 600, xp: 600 },
  };

  test('all five are UQF-1.0, validate, gate:{}, bits:[], itemsAll+atNode shapes as designed', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate((shapes) => {
      const bad = [];
      for (const [id, s] of Object.entries(shapes)) {
        const q = QUEST_DB[id];
        if (!q) { bad.push(id + ':missing'); continue; }
        if (q.schema !== 'UQF-1.0') bad.push(id + ':schema');
        if (!validateQuest(q).valid) bad.push(id + ':invalid');
        if (!q.gate || Object.keys(q.gate).length) bad.push(id + ':gate');
        if ((q.bits || []).length) bad.push(id + ':bits');
        const c = q.completion || {};
        if (!Array.isArray(c.itemsAll) || c.itemsAll[0] !== s.item) bad.push(id + ':itemsAll');
        if (c.atNode !== s.at) bad.push(id + ':atNode');
        const gold = (q.onComplete || []).find(b => b.kind === 'reward');
        if (!gold || gold.gold !== s.gold) bad.push(id + ':gold');
        if (q.xpAward !== s.xp) bad.push(id + ':xpAward');
        if (q.completeFn || q.activateCond) bad.push(id + ':legacy-residue');
      }
      return bad;
    }, SHAPES);
    expect(r).toEqual([]);
  });

  test('math nodes occupy the HKG pocket, one code per cell, cells passable; node.loot carries the documents', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const want = { EHZ: '29,247', ZERO: '28,247', MONS: '29,248', CNTR: '28,248' };
      const bad = [];
      for (const [code, key] of Object.entries(want)) {
        const cs = CELL_GRID[key] || [];
        if (cs.length !== 1 || cs[0] !== code) bad.push(code + ':cell=' + cs.join('/'));
        if (IMPASSABLE_CELLS.has(key)) bad.push(code + ':impassable');
        const co = NODE_COORDS[code];
        if (!co || `${co.r},${co.c}` !== key) bad.push(code + ':coords');
      }
      const loot = {
        EHZ: 'Hamadani Failure Record', MONS: '12-Symmetry Manuscript',
        ZERO: 'Zero Treatise · Counting Document Bundle', CNTR: 'Moonshine Memo · ∞-Fragment',
      };
      for (const [code, l] of Object.entries(loot))
        if (NODE_MAP[code].loot !== l) bad.push(code + ':loot');
      return bad;
    });
    expect(r).toEqual([]);
  });

  test('functional: arrival at ZERO grants both documents and completes active math_01 + math_04 same visit (xp+gold)', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      S_story.level = 20; S_story.gold = 1000; S_story.xp = 0;
      S_story.inventory = []; S_story.visited = {};
      S_story.quests.quest_math_01 = 'active';
      S_story.quests.quest_math_04 = 'active';
      S_story.currentCode = 'ZERO';
      const node = { ...NODE_MAP.ZERO, code: 'ZERO' };
      const lootMsg = storyCollectLoot(node);
      const msgs = storyCheckQuests(node);
      return {
        lootMsg,
        inv: S_story.inventory.map(i => i.name),
        q1: S_story.quests.quest_math_01, q4: S_story.quests.quest_math_04,
        gold: S_story.gold, xp: S_story.xp,
        msgs: msgs.join(' | '),
      };
    });
    expect(r.inv).toContain('Zero Treatise');
    expect(r.inv).toContain('Counting Document Bundle');
    expect(r.q1).toBe('complete');
    expect(r.q4).toBe('complete');
    expect(r.gold).toBe(1000 + 300 + 500);
    expect(r.xp).toBe(350 + 500);
    expect(r.msgs).toContain('✓ The Number That Means Nothing');
    expect(r.msgs).toContain('✓ The Counting Quest');
  });

  test('functional: math_02 activates at EHZ, does NOT complete there, completes at MONS on pickup', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      S_story.level = 20; S_story.gold = 0; S_story.xp = 0;
      S_story.inventory = []; S_story.visited = {};
      S_story.currentCode = 'EHZ';
      const ehz = { ...NODE_MAP.EHZ, code: 'EHZ' };
      storyCollectLoot(ehz);
      storyCheckQuests(ehz);
      const afterEhz = S_story.quests.quest_math_02;
      S_story.currentCode = 'MONS';
      const mons = { ...NODE_MAP.MONS, code: 'MONS' };
      storyCollectLoot(mons);
      storyCheckQuests(mons);
      return { afterEhz, afterMons: S_story.quests.quest_math_02,
               canBefore: afterEhz === 'active', gold: S_story.gold };
    });
    expect(r.afterEhz).toBe('active');
    expect(r.afterMons).toBe('complete');
    expect(r.gold).toBe(350);
  });

  test('functional: atNode holds — holding the Moonshine Memo does not complete math_05 away from CNTR', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      S_story.quests.quest_math_05 = 'active';
      S_story.inventory = [{ name: 'Moonshine Memo' }];
      S_story.currentCode = 'MONS';
      const away = QuestRuntime.canComplete('quest_math_05');
      S_story.currentCode = 'CNTR';
      const there = QuestRuntime.canComplete('quest_math_05');
      return { away, there };
    });
    expect(r.away).toBe(false);
    expect(r.there).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// §MBIT-02 — _flagToLabel chain/act-aware expansion. Explicit bit labels
// always win upstream; this pins the FALLBACK names for the ~2,400
// label-less mission_bits (city-chain act flags, blq/d02xx generated ids).
// ══════════════════════════════════════════════════════════════════════════

test.describe('§MBIT-02 — _flagToLabel expander', () => {
  test('chain/act flags expand cleanly; plain camelCase is unchanged', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => [
      'athC1A1Done', 'bgw_c1a1_passed', 'lis_08_act1', 'WAW_002_act1Pass',
      'wisPage1_masks', 'blq02GatePassed', 'ams01a1', 'sbParleySucceeded',
      'dfBarterLearned', 'whodunit2ClueFound', 'ceremoniaPassed_yael_01',
      'bramBefriended', 'stoningEvent', 'catKingDefeated',
    ].map(_flagToLabel));
    expect(r).toEqual([
      'ATH C1 A1 Done', 'BGW C1 A1 Passed', 'LIS 08 Act 1', 'WAW 002 Act 1 Pass',
      'WIS Page 1 Masks', 'BLQ 02 Gate Passed', 'AMS 01 A1', 'SB Parley Succeeded',
      'DF Barter Learned', 'Whodunit 2 Clue Found', 'Ceremonia Passed Yael 01',
      'Bram Befriended', 'Stoning Event', 'Cat King Defeated',
    ]);
  });

  test('no fallback label in QUEST_DB is left with raw underscores or glued letter-digit runs', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const flags = new Set();
      const walk = (bits) => (bits || []).forEach(b => {
        if (b.kind === 'mission_bit' && !b.label) flags.add(b.flag);
        walk(b.onPass); walk(b.onFail);
      });
      Object.values(QUEST_DB).forEach(q => walk(q.bits));
      const bad = [];
      for (const f of flags) {
        const l = _flagToLabel(f);
        if (/_/.test(l) || /[a-z]\d|\d[a-z]/.test(l) || /\s\s/.test(l) || !/^[A-Z0-9]/.test(l)) bad.push(f + ' -> ' + l);
      }
      return { total: flags.size, bad };
    });
    expect(r.total).toBeGreaterThan(2000);   // census 2026-07-07: 2,420 label-less mission_bits
    expect(r.bad).toEqual([]);
  });

  test('Paul-arc mission_bits all carry explicit labels (fallback never used)', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const ids = ['quest_ezzir', 'quest_governor_cyprus', 'quest_lame_lystra', 'quest_stoning_lystra',
                   'quest_prison_phillam', 'quest_areopagus', 'quest_ephesus_riot', 'quest_basket_damascus',
                   'quest_shipwreck_melta'];
      const labels = [];
      const walk = (bits) => (bits || []).forEach(b => {
        if (b.kind === 'mission_bit') labels.push(b.label || null);
        walk(b.onPass); walk(b.onFail);
      });
      ids.forEach(id => walk(QUEST_DB[id].bits));
      return labels;
    });
    expect(r).toEqual(['Ezzir Standoff', 'Governor of Cyprus', 'Gate Healing',
                       'Lystra Stoning', 'Lystra Stoning', 'Philippi Jailer', 'Areopagus Speech',
                       'Ephesus Riot', 'Damascus Escape', 'Basket Rope', 'Malta Wreck']);
  });
});

// ── §MBIT-02 — _takeMissionBit: spend the token, never un-witness a gated event ──
//
// A mission bit is a permanent receipt of something that happened (§MBIT-02-E,
// keep-separate ontology). Its flag can be load-bearing for a downstream mission's
// gate (canActivate reads flags / flagsAny / notFlags). So SPENDING a token must
// always remove the physical item, but may clear the flag ONLY when no gate reads
// it — otherwise spending a token would retroactively open/close an arc's gate.
// There are no hardcoded _takeMissionBit call sites by design; the only author path
// is the declarative `takeBit` itemChain action, which this guard makes safe.
test.describe('§MBIT-02 — _takeMissionBit spends the token without un-gating an arc', () => {
  test('_gateFlagSet() collects flags/flagsAny/notFlags and includes a known gate flag', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => ({
      size: _gateFlagSet().size,
      hasEzzir: _gateFlagSet().has('ezzirConfronted'),   // gate:{flags:['ezzirConfronted']} on quest_governor_cyprus
    }));
    expect(r.size).toBeGreaterThan(20);
    expect(r.hasEzzir).toBe(true);
  });

  test('non-gating flag: token spent AND marker flag fully revoked', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      S_story.inventory = [];
      const flag = 'mbitTestNonGatingXyz';               // referenced by no gate
      _grantMissionBit(flag, 'Test Marker');
      const before = { flag: !!S_story[flag], tok: S_story.inventory.some(i => i.flagRef === flag) };
      _takeMissionBit(flag);
      return { before, gated: _gateFlagSet().has(flag),
               flag: !!S_story[flag], tok: S_story.inventory.some(i => i.flagRef === flag) };
    });
    expect(r.before).toEqual({ flag: true, tok: true });
    expect(r.gated).toBe(false);
    expect(r.tok).toBe(false);    // token spent
    expect(r.flag).toBe(false);   // non-gating marker → safe full revoke
  });

  test('gate-referenced flag: token spent, witnessed event (flag) preserved, warns', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      S_story.inventory = [];
      const warns = [];
      const orig = console.warn; console.warn = (m) => warns.push(String(m));
      const flag = 'ezzirConfronted';                    // gates quest_governor_cyprus
      _grantMissionBit(flag, 'Ezzir Standoff');
      _takeMissionBit(flag);
      console.warn = orig;
      return { gated: _gateFlagSet().has(flag), flag: !!S_story[flag],
               tok: S_story.inventory.some(i => i.flagRef === flag),
               warned: warns.some(w => w.includes(flag) && /§MBIT-02-E/.test(w)) };
    });
    expect(r.gated).toBe(true);
    expect(r.tok).toBe(false);    // physical token spent
    expect(r.flag).toBe(true);    // event stands → downstream gate intact
    expect(r.warned).toBe(true);
  });

  test('the takeBit itemChain action (only author path) routes through the guard', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      S_story.inventory = [];
      const flag = 'lyraConverted';                      // gate-referenced (2 gates)
      _grantMissionBit(flag, 'Lyra Converted');
      _applyItemChain({ itemChain: [{ action: 'takeBit', flag }] });
      return { flag: !!S_story[flag], tok: S_story.inventory.some(i => i.flagRef === flag) };
    });
    expect(r.tok).toBe(false);    // token spent via the declarative path
    expect(r.flag).toBe(true);    // arc gate survives the spend
  });
});

// ── §MBIT-02 — journal token timeline: Mission Tokens grouped/sorted by day ──
//
// _grantMissionBit stamps token.day; the inventory render groups tokens under a
// "Day N" divider, days ascending, grant order preserved within a day. This drives
// the real storyRenderInventory() into #inv-list and reads back the rendered order.
test.describe('§MBIT-02 — Mission Tokens journal timeline (grouped by day earned)', () => {
  test('tokens render grouped under ascending Day dividers, grant order within a day', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      S_story.inventory = [];
      // Grant out of day order to prove the render sorts, not insertion order.
      S_story.day = 3; _grantMissionBit('mbitTL_c', 'Third');
      S_story.day = 1; _grantMissionBit('mbitTL_a', 'First');
      S_story.day = 1; _grantMissionBit('mbitTL_b', 'Second');   // same day, later grant
      storyRenderInventory();
      const list = document.getElementById('inv-list');
      // Walk children after the "🪬 Mission Tokens" section header.
      const kids = Array.from(list.children);
      const hdIdx = kids.findIndex(k => k.className === 'inv-section-hd' && /Mission Tokens/.test(k.textContent));
      const seq = [];
      for (let i = hdIdx + 1; i < kids.length; i++) {
        const k = kids[i];
        if (k.className === 'inv-section-hd') break;           // next section ends the block
        // Day divider: its DIRECT children are spans; first is exactly "Day N".
        const firstSpan = k.querySelector(':scope > span');
        const dayHd = firstSpan && firstSpan.textContent.match(/^Day (\d+)$/);
        if (dayHd) { seq.push('DAY:' + dayHd[1]); continue; }
        // otherwise a grid of chips → record chip labels (skip the 🪬 icon span)
        Array.from(k.querySelectorAll('span')).forEach(s => {
          if (s.textContent && s.textContent !== '🪬') seq.push('CHIP:' + s.textContent);
        });
      }
      return seq;
    });
    // Day 1 group (First, then Second — grant order), then Day 3 group (Third).
    expect(r).toEqual([
      'DAY:1', 'CHIP:First', 'CHIP:Second',
      'DAY:3', 'CHIP:Third',
    ]);
  });

  test('legacy tokens without a day stamp fall into Day 1', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      S_story.inventory = [
        { name: 'Old Token', icon: '🪬', type: 'mission_bit', flagRef: 'mbitLegacy' }, // no .day
      ];
      storyRenderInventory();
      const list = document.getElementById('inv-list');
      const kids = Array.from(list.children);
      const hdIdx = kids.findIndex(k => k.className === 'inv-section-hd' && /Mission Tokens/.test(k.textContent));
      return { dayLabel: kids[hdIdx + 1] && kids[hdIdx + 1].textContent.startsWith('Day 1') };
    });
    expect(r.dayLabel).toBe(true);
  });
});
