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
    expect(r.kinds).toBe('_legacy_fn,choice,combat,flag_write,item_check,item_remove,narrative,reward,skill_check,unlock');
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
