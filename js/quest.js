// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson and Claude
'use strict';
// quest.js — §VM-01-D unified quest-VM kernel: the single source of the UQF
// runtime shared by the SP client (inlined into roll2hit-v3.html) and, when a
// consumer is wired, the WBAPI server (require('./quest')). The engine that runs
// all ~2,850 quests — its opcode table, gate evaluators, and bit-chain executor.
//
// UNLIKE mover/rooms/duel it is NOT pure-standalone: the quest VM has real side
// effects (combat, narrative, favor, level-up, item mint) and reads live progress
// state. So it is a HOST-INJECTED kernel — createQuestRuntime({getState, effects})
// binds a getState() (returns the live state) + an `effects` table of the ~10 host
// side-effects, and the block below names NO module global (no S_story, no
// QUEST_DB, no NODE_MAP, no storyX). §VM-01-C (ctx.state) was the prerequisite:
// it moved the state WRITES off the global; §VM-01-D moves the remaining ~10 host
// CALLS behind `effects`, so the whole runtime can run headless in Node.
//
// The region between the QUEST:CORE sentinels is inlined BYTE-IDENTICALLY into
// roll2hit-v3.html; scripts/check-quest-parity.js asserts the two copies match.
// Do not edit one copy without the other (or run: node scripts/check-quest-parity.js).
//
// host: { getState: () => state,          // returns the live progress state (S_story)
//         effects: {                      // each thunk carries its own host guard
//           getQuest:(id)=>quest, getNode:(code)=>node,
//           rng:()=>[0,1),                // §VM-01-B seeded stream
//           lakeMagic:()=>({allAbility}), checkLevelUp:(), mint:(item),
//           preBattle:(node), msg:(text), grantMissionBit:(flag,label,state),
//           setFavor:(npc,level), getFavor:(npc)=>number } }
// createQuestRuntime(host) -> { canActivate, canComplete, execBits, _rollSkill,
//   resolveSkillCheck, HANDLERS, validateQuest, adaptLegacyQuest, SCHEMA_VERSION }

// ◆◆◆ QUEST:CORE:START ◆◆◆
const SCHEMA_VERSION = 'UQF-1.0';

/* Bit contracts — required/optional fields + a structural validator per kind.
   Used by validateQuest() (and, later, the worldbuilder's Quest Editor). */
const BIT_CONTRACTS = {
  skill_check: { required:['stat','dc'],        optional:['skill','adv','onPass','onFail'],
    validate: b => ['STR','DEX','CON','INT','WIS','CHA'].includes(String(b.stat).toUpperCase()) && typeof b.dc === 'number' && (b.onPass || b.onFail) },
  flag_write:  { required:[],                    optional:['set','clear'],
    validate: b => ((b.set||[]).length + (b.clear||[]).length) > 0 },
  reward:      { required:[],                    optional:['xp','gold','items','knowledge'],
    validate: b => !!(b.xp || b.gold || (b.items && b.items.length) || b.knowledge) },
  // §VM-01-G4a — the PRICE leaf, reward's inverse. `reward` with a negative gold
  // "works" arithmetically with no affordability test and the word *reward* on a
  // price — a write into a real-but-wrong object, which never throws (WBAPI Hazard
  // #2's standing lesson). This is the leaf that says price out loud.
  cost:        { required:[],                    optional:['gold','resource','count','refuse'],
    validate: b => (typeof b.gold === 'number' && b.gold > 0) || (typeof b.resource === 'string' && b.resource.length > 0) },
  combat:      { required:['key','label'],       optional:['count','nodeCode'],
    validate: b => typeof b.key === 'string' && typeof b.label === 'string' },
  narrative:   { required:[],                    optional:['msg','template'],
    validate: b => !!(b.msg || b.template) },
  item_remove: { required:['name'],              optional:[],
    validate: b => typeof b.name === 'string' && b.name.length > 0 },
  item_check:  { required:['name'],              optional:['count'],   // lab Open-Q #3
    validate: b => typeof b.name === 'string' && b.name.length > 0 },
  mission_bit: { required:['flag'],              optional:['label'],   // §MBIT-01 token grant
    validate: b => typeof b.flag === 'string' && b.flag.length > 0 },
  favor:       { required:['npc'],               optional:['set','add','cap'],   // §ARCH-01 W7c — NPC favorability
    validate: b => typeof b.npc === 'string' && b.npc.length > 0 && (typeof b.set === 'number' || typeof b.add === 'number') },
  unlock:      { required:[],                    optional:['quests','npcs'],
    validate: b => ((b.quests||[]).length + (b.npcs||[]).length) > 0 },
  choice:      { required:['prompt','options'],  optional:[],
    validate: b => Array.isArray(b.options) && b.options.length >= 2 && b.options.every(o => o.label && Array.isArray(o.bits)) },
  _legacy_fn:  { required:['fn'],                optional:[],          // adapter escape hatch
    validate: b => typeof b.fn === 'function' || b.fn == null },
};

/* Validate a UQF quest object against the bit registry. Pure — no side effects. */
function validateQuest(q) {
  const errors = [];
  if (!q || typeof q !== 'object') return { valid:false, errors:['Quest is not an object'] };
  if (!q.schema)            errors.push('Missing schema version');
  if (!q.id)                errors.push('Missing id');
  // A quest needs a bit chain OR a declarative completion gate (passive side quest).
  if ((!q.bits || !q.bits.length) && !q.completion) errors.push('No mission bits defined');
  // §ARCH-01 W7: an array-valued onComplete is a completion bit chain — validate it too.
  for (const bit of [...(q.bits || []), ...(Array.isArray(q.onComplete) ? q.onComplete : [])]) {
    const c = BIT_CONTRACTS[bit.kind];
    if (!c) { errors.push('Unknown bit kind: ' + bit.kind); continue; }
    for (const req of c.required) if (bit[req] === undefined) errors.push('Bit "' + bit.kind + '" missing required field: ' + req);
    if (!c.validate(bit)) errors.push('Bit "' + bit.kind + '" failed contract validation');
  }
  return { valid: errors.length === 0, errors };
}

/* §ARCH-01 W7d — NO-OP. The legacy→UQF wrapping shim is retired with the legacy
   execution paths: Phase 3 is type-complete, so there is nothing left to adapt
   (the surviving non-UQF entries — quest_math_01–05 §MATH-01 gap + the 30 dead
   blq_05–10 book-stubs — are activate-only and never execute). Kept as an
   identity passthrough because it is exported on QuestRuntime + window. */
function adaptLegacyQuest(id, q) {
  return q;
}

/* §VM-01-D — kernel-internal migration shim: pump a bit-chain generator to
   completion, THROWING on an unresolved ask. The pure twin of the host driver's
   _uqfRunToCompletion (lab-report-vm01a §6.2); resolveSkillCheck's inner
   synchronous pump uses it so a require('./quest') server needs no host driver.
   Plain chains (every live skill_check onPass/onFail — scope-fenced against a
   `choice`) pump straight through, byte-identical to the host driver. */
function _questRunToCompletion(gen) {
  let step = gen.next();
  while (!step.done) {
    if (step.value && step.value.ask) throw new Error('[UQF] runToCompletion hit an unresolved ask: ' + step.value.ask);
    step = gen.next();
  }
}

/* §VM-01-F — the ACTIVATION gate leaf: the ~15 declarative activation terms,
   ALL-required (implicit AND across the terms of one leaf object). Pure — reads
   only the leaf `g` and the state `st`. Extracted verbatim from canActivate so a
   bare gate (no all/any/not) dispatches straight here, byte-identical. */
function _matchActivationLeaf(g, st) {
  if (g.flags    && !g.flags.every(f => !!st[f]))   return false;
  if (g.flagsAny && g.flagsAny.length && !g.flagsAny.some(f => !!st[f])) return false;
  if (g.notFlags && g.notFlags.some(f => !!st[f]))  return false;
  // flagEquals → { field: value }, strict equality on a state field (ALL required).
  // Replaces enum/branch-state gates like `sbChosenRole === 'fight'` (role choices).
  if (g.flagEquals) { for (const k in g.flagEquals) if (st[k] !== g.flagEquals[k]) return false; }
  if (g.nodes    && !g.nodes.every(n => (st.visited || st.visitedNodes || {})[n])) return false;
  // Sequential-arc chaining (replaces `(quests['prev']||'') !== ''` and `=== 'done'`):
  // questsAttempted → every listed quest has a non-empty status (active/done/failed/complete);
  // questsDone      → every listed quest has reached a terminal pass status (done/complete).
  const QS = st.quests || {};
  if (g.questsAttempted && !g.questsAttempted.every(id => (QS[id] || '') !== '')) return false;
  if (g.questsDone && !g.questsDone.every(id => QS[id] === 'done' || QS[id] === 'complete')) return false;
  // NPC-favor threshold (replaces `(npcFavorability||{}).<npc> >= n`):
  // favorMin → object of { npcKey: minFavor }, all required.
  if (g.favorMin) { const fav = st.npcFavorability || {}; for (const npc in g.favorMin) if ((fav[npc] || 0) < g.favorMin[npc]) return false; }
  // Defeated-battle prerequisite (replaces `!!defeatedBattles[code]` in
  // activateCond); ALL listed battle codes must be defeated. Mirrors the
  // `battles` term in canComplete but as an AND-gate on activation.
  if (g.battles && !g.battles.every(b => !!(st.defeatedBattles || {})[b])) return false;
  // notBattles → NONE of the listed battles may be defeated yet (`!defeatedBattles[code]`).
  if (g.notBattles && g.notBattles.some(b => !!(st.defeatedBattles || {})[b])) return false;
  // shardsMin → shards must meet a threshold (`(shards||0) >= n`).
  if (g.shardsMin && (st.shards || 0) < g.shardsMin) return false;
  // restedAtMin → { nodeCode: minRests } against shortRestedAtNodes, all required.
  if (g.restedAtMin) { const rst = st.shortRestedAtNodes || {}; for (const nd in g.restedAtMin) if ((rst[nd] || 0) < g.restedAtMin[nd]) return false; }
  // sleptAt → array of node codes that must each have a truthy sleptAtNodes[code]
  // (replaces `!!(sleptAtNodes||{})[code]` in activateCond).
  if (g.sleptAt && !g.sleptAt.every(nd => !!(st.sleptAtNodes || {})[nd])) return false;
  // flagsPath → dot-paths from the state, ALL truthy (§ARCH-01 W3b; same semantics as
  // the canComplete term — nested flag objects like `yugurtTourBeat.pip`).
  if (g.flagsPath && !g.flagsPath.every(p => !!p.split('.').reduce((o, k) => (o == null ? undefined : o[k]), st))) return false;
  // countMin → [{path, min}], ALL required (§ARCH-01 W4; same coercion as the
  // canComplete term — number → itself · array → length · object → key count ·
  // missing → 0). Activation thresholds like `(fishingCatchLog||[]).length >= 1`.
  if (g.countMin && !g.countMin.every(c => {
    const v = c.path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), st);
    const num = (typeof v === 'number') ? v : Array.isArray(v) ? v.length : (v && typeof v === 'object') ? Object.keys(v).length : 0;
    return num >= c.min;
  })) return false;
  // dayMin/dayMax → a doom-clock day window on the day counter (`st.day || 1`, the
  // fresh-save default): dayMin is an INCLUSIVE lower bound, dayMax an EXCLUSIVE
  // upper bound; either may be omitted for an open-ended window. §BOARD-01-VOID-GATE:
  // replaces the §BOARD-01-FU8 Void-tide `activateCond` closures (`day>=21 && day<35`
  // …) — a clock gate the grammar can now express, so no per-quest _legacy_fn.
  if (g.dayMin != null || g.dayMax != null) {
    const d = st.day || 1;
    if (g.dayMin != null && d < g.dayMin) return false;
    if (g.dayMax != null && d >= g.dayMax) return false;
  }
  return true;
}

/* §VM-01-F — the COMPLETION gate leaf (replaces completeFn). `flags` are ALL-required
   (AND); `flagsAny` + `battles` + `questsComplete` + `items` form a single OR-group
   (any one satisfies it); `notFlags` are NONE-allowed. Pure — reads only `g` + `st`.
   Extracted verbatim from canComplete, minus the deleted single-use `itemsMinAny`
   term (§VM-01-F: OR-position exact-name count is now `itemsAll` under `{any}`). */
function _matchCompletionLeaf(g, st) {
  if (g.flags && !g.flags.every(f => !!st[f])) return false;
  const QS = st.quests || {};
  // OR-group: any of flagsAny / defeated battles / questsComplete (strict
  // `=== 'complete'`, for chaining off a *side* quest's completion) satisfies it.
  // items → §ARCH-01 W3 item_check term (replaces legacy `completeItems`): each
  // listed name is one OR entry, matched with the SAME fuzzy two-way substring
  // rule as the legacy storyCheckQuests check (`inv.name.includes(ci) || ci.includes(inv.name)`).
  const orList = (g.flagsAny || []).map(f => !!st[f])
    .concat((g.battles || []).map(b => !!(st.defeatedBattles || {})[b]))
    .concat((g.questsComplete || []).map(id => QS[id] === 'complete'))
    .concat((g.items || []).map(ci => (st.inventory || []).some(inv => inv.name.includes(ci) || ci.includes(inv.name))));
  const orCount = (g.flagsAny || []).length + (g.battles || []).length + (g.questsComplete || []).length + (g.items || []).length;
  if (orCount && !orList.some(Boolean)) return false;
  if (g.notFlags && g.notFlags.some(f => !!st[f])) return false;
  // atNode → completes only while the player is currently standing at this node
  // (replaces completeFn:()=>currentCode==='CODE'; waypoint-arrival completion).
  if (g.atNode && st.currentCode !== g.atNode) return false;
  // §ARCH-01 W3b terms (all AND-position):
  // flagsPath → dot-paths from the state, ALL truthy — nested flag objects like
  // `yugurtTourBeat.pip` (replaces `!!(yugurtTourBeat||{}).pip`).
  if (g.flagsPath && !g.flagsPath.every(p => !!p.split('.').reduce((o, k) => (o == null ? undefined : o[k]), st))) return false;
  // countMin → [{path, min}], ALL required. Value coerced like the legacy counters:
  // number → itself · array → length · object → key count · missing → 0
  // (replaces `(pitTrainingWins||0)>=3`, `(fishingCatchLog||[]).length>=n`,
  // `Object.keys(defeatedBattles).length>=n`, `(catKills||{}).beefy_tom>=n`).
  if (g.countMin && !g.countMin.every(c => {
    const v = c.path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), st);
    const num = (typeof v === 'number') ? v : Array.isArray(v) ? v.length : (v && typeof v === 'object') ? Object.keys(v).length : 0;
    return num >= c.min;
  })) return false;
  // itemsAll → AND-position exact-name inventory requirement (vs the fuzzy OR `items`
  // term above): each entry is a name string (≥1 copy) or {name, min} (≥min copies);
  // exact `.some(i => i.name === X)` / `.filter(...).length >= min` parity. §VM-01-F:
  // also the OR-position exact-count matcher (place under `{any}`) — supersedes itemsMinAny.
  if (g.itemsAll && !g.itemsAll.every(e => {
    const name = (typeof e === 'string') ? e : e.name, min = (typeof e === 'string') ? 1 : (e.min || 1);
    return (st.inventory || []).filter(i => i.name === name).length >= min;
  })) return false;
  return true;
}

/* §VM-01-F — the gate expression compiler. A gate NODE is either a boolean
   combinator over child nodes — {all:[…]} (∧) · {any:[…]} (∨) · {not:node} (¬) —
   or a LEAF: a bare object of the declarative terms above, evaluated by the mode's
   leaf matcher. A bare gate (no all/any/not) is a single leaf, so all pre-F gates
   compile to `st => _match…Leaf(g, st)` — byte-identical behaviour. Returns a
   closure of `st`, so the compiled predicate closes over NOTHING runtime-specific
   (safe to share across the live runtime and a headless scratch runtime). */
function _compileGate(node, mode) {
  if (node && node.all) { const k = node.all.map(n => _compileGate(n, mode)); return st => k.every(f => f(st)); }
  if (node && node.any) { const k = node.any.map(n => _compileGate(n, mode)); return st => k.some(f => f(st)); }
  if (node && node.not) { const c = _compileGate(node.not, mode);            return st => !c(st); }
  return mode === 'complete' ? (st => _matchCompletionLeaf(node, st)) : (st => _matchActivationLeaf(node, st));
}
/* Compile-once memo — keyed by the immutable gate object, so a compiled predicate
   is built the first time a gate is evaluated and reused every render thereafter
   (don't interpret the tree per render). The key is authored data that never
   mutates, so the cache is correct forever and needs no invalidation. */
const _gateCache = new WeakMap();
function _gatePred(node, mode) {
  let f = _gateCache.get(node);
  if (!f) { f = _compileGate(node, mode); _gateCache.set(node, f); }
  return f;
}

/* §VM-01-D — the quest VM as a host-injected kernel. `host.getState()` returns
   the live progress state (resolved at CALL time, so §VM-01-C's per-call
   execBits(chain,{state}) seam survives and a mutating load is always seen);
   `host.effects` is the table of ~10 host side-effects, each a thunk carrying its
   own `typeof`-guard. On the live path getState()===S_story and each effect calls
   the same host fn it replaced, so the runtime is byte-identical to the pre-D
   object literal — the whole quest-runtime regression is the no-op proof. */
function createQuestRuntime(host) {
  const H = host || {};
  const E = H.effects || {};
  const S = () => (typeof H.getState === 'function' ? H.getState() : undefined);
  const rt = {
    SCHEMA_VERSION,
    _schema: SCHEMA_VERSION,   // back-compat alias for the prior stub field

    /* Declarative activation gate (replaces the activateCond arrow function).
       No gate, or only a legacy-wrapped gate, evaluates permissively here —
       legacy quests keep using their own activateCond on the live path.
       §VM-01-F: the gate is compiled once (memoised by _gatePred) into a boolean
       tree over the activation-leaf terms, then called with the live state. */
    canActivate(questId) {
      const q = E.getQuest ? E.getQuest(questId) : null;
      if (!q) return false;
      const g = q.gate;
      if (!g || g._legacyFn) return true;
      return _gatePred(g, 'activate')(S());   // §VM-01-C/D seam: state resolved at CALL time
    },

    /* Declarative completion gate for UQF side quests (replaces completeFn).
       §VM-01-F: compiled once (memoised by _gatePred) into a boolean tree over the
       completion-leaf terms. The leaf models "AND(pages) ∧ (flag OR battle OR item)"
       (lab Open-Q #5); {all}/{any}/{not} now compose leaves for any other shape. */
    canComplete(questId) {
      const q = E.getQuest ? E.getQuest(questId) : null;
      if (!q || !q.completion) return false;
      return _gatePred(q.completion, 'complete')(S());   // §VM-01-C/D seam: state resolved at CALL time
    },

    /* Execute an ordered bit chain. §VM-01-A: this is a GENERATOR — a handler
       written as a function* (choice, below) may suspend by yielding an `ask`
       envelope; a plain handler returns undefined and runs to completion exactly as
       before. §VM-01-C: ctx.state is the _ENV (defaults to the live state via
       getState). Unknown kinds are warned + skipped. Synchronous callers wrap the
       returned generator in a runToCompletion (throws on an unresolved ask, so
       plain chains are byte-identical to the old straight-line loop).
       §VM-01-G4a: a handler may FAIL the chain by setting ctx._halt (only `cost`
       does — an unaffordable price). The flag is deliberately never cleared here:
       ctx is shared with any nested execBits (a choice option's bits), so a halt
       inside a branch aborts the whole chain it belongs to rather than letting the
       outer bits run on unpaid. One ctx per run — the drivers build a fresh one. */
    *execBits(bits, ctx) {
      const c = ctx || {};
      if (!c.state) c.state = S();   // §VM-01-C: the _ENV — handlers write/read c.state, defaulting to the live state
      for (const bit of (bits || [])) {
        const h = rt.HANDLERS[bit.kind];
        if (!h) { console.warn('[UQF] unknown bit kind:', bit.kind); continue; }
        const r = h(bit, c);
        if (r && typeof r.next === 'function') yield* r;   // handler suspended → propagate its yields
        if (c._halt) break;                                // §VM-01-G4a: an unaffordable cost fails the rest of the chain
      }
    },

    /* Pure roll — single source of the skill-check math, mirroring
       _rollCeremonia(): mod = ⌊(score-10)/2⌋, prof = 2+⌊(level-1)/4⌋, plus the
       one-shot iodine buff (consumed here, exactly like the legacy resolver) and
       the lake-magic all-ability bonus. Returns every component for display.
       §VM-01-B: the d20 draws the injected seeded stream (effects.rng), so the roll
       is reproducible from a save. §VM-01-D: the sheet + buff ride the live state
       via getState (host-fence, §4.3) — the roll reads/consumes the real sheet. */
    _rollSkill(stat) {
      const st = S();
      const ability    = String(stat || '').toLowerCase();
      const abilityVal = ((st.abilityScores || {})[ability] || 10);
      const mod  = Math.floor((abilityVal - 10) / 2);
      const prof = 2 + Math.floor(((st.level || 1) - 1) / 4);
      const d20  = Math.ceil(E.rng() * 20);
      const iodineBonus = st.iodineBuffActive ? (st.iodineBuffBonus || 3) : 0;
      if (st.iodineBuffActive) { st.iodineBuffActive = false; st.iodineBuffBonus = 0; }
      const lmAll = E.lakeMagic ? ((E.lakeMagic() || {}).allAbility || 0) : 0;
      return { d20, mod, prof, iodineBonus, lmAll, total: d20 + mod + prof + iodineBonus + lmAll };
    },

    /* Resolve a skill_check bit: roll, then route into onPass / onFail. */
    resolveSkillCheck(bit, ctx) {
      const r = rt._rollSkill(bit.stat);
      const pass = r.total >= bit.dc;
      _questRunToCompletion(rt.execBits(pass ? (bit.onPass || []) : (bit.onFail || []), ctx));   // §VM-01-A/D (skill_check stays synchronous — a choice in onPass/onFail throws, by scope-fence)
      return { d20: r.d20, total: r.total, pass };
    },

    /* Each handler is bound to ctx.state (the _ENV) + the injected effects. */
    HANDLERS: {
      skill_check(bit, ctx) { rt.resolveSkillCheck(bit, ctx); },
      // §VM-01-C: state effects write ctx.state (the _ENV). On the live path
      // ctx.state IS the live state (execBits default), so this is byte-identical.
      flag_write(bit, ctx)  { const st = ctx.state; (bit.set || []).forEach(f => st[f] = true); (bit.clear || []).forEach(f => st[f] = false); },
      reward(bit, ctx) {
        const st = ctx.state;   // §VM-01-C — progress state rides the env; checkLevelUp/mint stay host effects (§4.3)
        if (bit.xp)   { st.xp = (st.xp || 0) + bit.xp; if (E.checkLevelUp) E.checkLevelUp(); }
        if (bit.gold) { st.gold = (st.gold || 0) + bit.gold; }
        // mint — §MESH-01i slice 2b: acquisition-while-connected mints the item
        // (async; stamps mintId on the pushed copy). No-op offline/SP.
        if (bit.items && bit.items.length) { st.inventory = st.inventory || []; bit.items.forEach(i => { const it = { ...i }; st.inventory.push(it); if (E.mint) E.mint(it); }); }
        if (bit.knowledge) { st.knowledge = st.knowledge || []; st.knowledge.push(bit.knowledge); }
      },
      // §VM-01-G4a — pay a price. REFUSE-AT-CLICK is the shipped contract (user
      // design call 2026-08-04, lab-report-vm01g4-per-verb §12): the verb always
      // renders and an unaffordable price refuses out loud, byte-for-byte what all
      // six hand-written gold sites do today — the game states what it wants rather
      // than quietly withholding the option. `cost` therefore never contributes to a
      // verb's `when`; a future opt-in hideWhenUnaffordable would be the other call.
      // Both currencies are TESTED before either is SPENT, so a mixed price can
      // never part-pay. hp is deliberately not a currency: the Memory Gate's −15 is
      // narrated damage on a branch that always succeeds, so it is that option's
      // effect, not its price.
      cost(bit, ctx) {
        const st = ctx.state;
        const need = (bit.count == null) ? 1 : bit.count;
        const shortGold = (typeof bit.gold === 'number') && (st.gold || 0) < bit.gold;
        const shortRes  = !!bit.resource && (st[bit.resource] || 0) < need;
        if (shortGold || shortRes) {
          if (bit.refuse) { if (ctx.pushMsg) ctx.pushMsg(bit.refuse); else if (E.msg) E.msg(bit.refuse); }
          ctx._halt = true; ctx._refused = true; return;
        }
        if (typeof bit.gold === 'number') st.gold = (st.gold || 0) - bit.gold;
        if (bit.resource) st[bit.resource] = (st[bit.resource] || 0) - need;
      },
      combat(bit) { if (E.preBattle) E.preBattle({ ...(E.getNode ? E.getNode(S().currentCode) : null), code: bit.nodeCode || bit.key, battle: { label: bit.label, key: bit.key, count: bit.count || 1 } }); },
      narrative(bit, ctx) { if (!bit.msg) return; if (ctx && ctx.pushMsg) ctx.pushMsg(bit.msg); else if (E.msg) E.msg(bit.msg); /* template path: Phase 2 renderNamedTemplate */ },
      item_remove(bit, ctx) { const inv = ctx.state.inventory || []; const i = inv.findIndex(x => x.name === bit.name); if (i > -1) inv.splice(i, 1); },   // §VM-01-C: env inventory
      mission_bit(bit, ctx) { if (E.grantMissionBit) E.grantMissionBit(bit.flag, bit.label, ctx.state); else ctx.state[bit.flag] = true; },   // §VM-01-C/D: host grant, else env fallback
      // §ARCH-01 W7c — NPC favorability: `set` writes an absolute level; `add`
      // increments the current level, clamped to `cap` (default 3 = Dear Friend).
      favor(bit) {
        if (!E.setFavor) return;
        if (typeof bit.add === 'number') E.setFavor(bit.npc, Math.min(bit.cap == null ? 3 : bit.cap, (E.getFavor ? E.getFavor(bit.npc) : 0) + bit.add));
        else E.setFavor(bit.npc, bit.set);
      },
      item_check(bit, ctx) { const inv = ctx.state.inventory || []; ctx._itemCheck = inv.filter(x => x.name === bit.name).length >= (bit.count || 1); },   // §VM-01-C: reads the env inventory
      unlock(bit, ctx) { (bit.quests || []).forEach(qid => { const st = ctx.state; st.quests = st.quests || {}; if (!st.quests[qid]) st.quests[qid] = 'active'; }); },   // §VM-01-C: env quests
      // §VM-01-A — the first SUSPENDING handler. Its contract already validates (choice
      // in BIT_CONTRACTS: prompt + ≥2 options, each a {label, bits[]}). It yields an `ask`
      // envelope; the driver renders the choice + resumes with the picked index; ONLY the
      // chosen option's bits apply — AFTER the pick, so a tab-close mid-choice writes no
      // partial state. The resume value is an index, so the data author never couples to
      // presentation.
      *choice(bit, ctx) {
        const picked = yield { ask: 'choice', prompt: bit.prompt, options: (bit.options || []).map(o => o.label) };
        const opt = (bit.options || [])[picked];
        if (opt) yield* rt.execBits(opt.bits || [], ctx || {});
      },
      // ctx is passed through (W7c) so conditional completion effects can route
      // messages into the storyCheckQuests msgs stream via ctx.pushMsg; pre-W7c
      // fns take (S) only and ignore it.
      _legacy_fn(bit, ctx) { if (typeof bit.fn === 'function') bit.fn(ctx.state, ctx); },   // §VM-01-C: legacy fns receive the env. Still runs arbitrary code — §VM-01-E's blocker.
    },

    validateQuest, adaptLegacyQuest,
  };
  return rt;
}
// ◆◆◆ QUEST:CORE:END ◆◆◆

if (typeof module === 'object' && module.exports) {
  module.exports = { createQuestRuntime, validateQuest, adaptLegacyQuest, BIT_CONTRACTS, SCHEMA_VERSION };
}
