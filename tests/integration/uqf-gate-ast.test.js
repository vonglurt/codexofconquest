// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson and Claude
'use strict';
// §VM-01-F — gate expression AST + compile-once.
// The gate evaluators became a compiled boolean tree — {all}/{any}/{not} over the
// existing leaf terms, bare gate = implicit `all` — and `itemsMinAny` was deleted
// (quest_wm_01 re-expressed as {any:[flagsAny, itemsAll≥3]}). These browser tests
// run over the REAL live QUEST_DB (a global here, not node-requireable): (1) a
// full-corpus differential — the compiled kernel agrees with an independent
// in-page reference interpreter over every gate/completion × a state matrix;
// (2) quest_wm_01 completes on letter OR 3 seals, and no live gate still carries
// the deleted itemsMinAny term. Headless algebra/leaf/migration proofs live in
// scripts/check-gate-parity.js. Design: lab-reports/lab-report-vm01f-gate-expression-ast.md.
const { test, expect } = require('@playwright/test');

test.describe('§VM-01-F — gate expression AST', () => {

  test('full-corpus differential: compiled kernel === reference interpreter over every live gate', async ({ page }) => {
    await page.goto('/index.html');
    const r = await page.evaluate(() => {
      // ── an independent reference interpreter (re-implemented, not the kernel) ──
      const pathVal = (st, p) => p.split('.').reduce((o, k) => (o == null ? undefined : o[k]), st);
      const asCount = v => (typeof v === 'number') ? v : Array.isArray(v) ? v.length : (v && typeof v === 'object') ? Object.keys(v).length : 0;
      const invExact = (st, name) => (st.inventory || []).filter(i => i.name === name).length;
      function refActivation(g, st) {
        const t = [];
        if (g.flags) t.push(g.flags.every(f => !!st[f]));
        if (g.flagsAny && g.flagsAny.length) t.push(g.flagsAny.some(f => !!st[f]));
        if (g.notFlags) t.push(!g.notFlags.some(f => !!st[f]));
        if (g.flagEquals) t.push(Object.keys(g.flagEquals).every(k => st[k] === g.flagEquals[k]));
        if (g.nodes) t.push(g.nodes.every(n => !!(st.visited || st.visitedNodes || {})[n]));
        if (g.questsAttempted) t.push(g.questsAttempted.every(id => ((st.quests || {})[id] || '') !== ''));
        if (g.questsDone) t.push(g.questsDone.every(id => { const s = (st.quests || {})[id]; return s === 'done' || s === 'complete'; }));
        if (g.favorMin) t.push(Object.keys(g.favorMin).every(n => ((st.npcFavorability || {})[n] || 0) >= g.favorMin[n]));
        if (g.battles) t.push(g.battles.every(b => !!(st.defeatedBattles || {})[b]));
        if (g.notBattles) t.push(!g.notBattles.some(b => !!(st.defeatedBattles || {})[b]));
        if (g.shardsMin != null) t.push((st.shards || 0) >= g.shardsMin);
        if (g.restedAtMin) t.push(Object.keys(g.restedAtMin).every(nd => ((st.shortRestedAtNodes || {})[nd] || 0) >= g.restedAtMin[nd]));
        if (g.sleptAt) t.push(g.sleptAt.every(nd => !!(st.sleptAtNodes || {})[nd]));
        if (g.flagsPath) t.push(g.flagsPath.every(p => !!pathVal(st, p)));
        if (g.countMin) t.push(g.countMin.every(c => asCount(pathVal(st, c.path)) >= c.min));
        if (g.dayMin != null || g.dayMax != null) { const d = st.day || 1; t.push((g.dayMin == null || d >= g.dayMin) && (g.dayMax == null || d < g.dayMax)); }
        return t.every(Boolean);
      }
      function refCompletion(g, st) {
        if (g.flags && !g.flags.every(f => !!st[f])) return false;
        const or = [];
        (g.flagsAny || []).forEach(f => or.push(!!st[f]));
        (g.battles || []).forEach(b => or.push(!!(st.defeatedBattles || {})[b]));
        (g.questsComplete || []).forEach(id => or.push((st.quests || {})[id] === 'complete'));
        (g.items || []).forEach(ci => or.push((st.inventory || []).some(iv => iv.name.includes(ci) || ci.includes(iv.name))));
        if (or.length && !or.some(Boolean)) return false;
        if (g.notFlags && g.notFlags.some(f => !!st[f])) return false;
        if (g.atNode != null && st.currentCode !== g.atNode) return false;
        if (g.flagsPath && !g.flagsPath.every(p => !!pathVal(st, p))) return false;
        if (g.countMin && !g.countMin.every(c => asCount(pathVal(st, c.path)) >= c.min)) return false;
        if (g.itemsAll && !g.itemsAll.every(e => { const nm = (typeof e === 'string') ? e : e.name, mn = (typeof e === 'string') ? 1 : (e.min || 1); return invExact(st, nm) >= mn; })) return false;
        return true;
      }
      function refEval(node, st, kind) {
        if (node && node.all) return node.all.every(n => refEval(n, st, kind));
        if (node && node.any) return node.any.some(n => refEval(n, st, kind));
        if (node && node.not) return !refEval(node.not, st, kind);
        return kind === 'complete' ? refCompletion(node, st) : refActivation(node, st);
      }
      // ── a best-effort satisfier: build a state that tends to make `node` pass ──
      // (verdict need not be `true`; the assertion is kernel === ref for ANY state).
      const setPath = (st, p, val) => { const ks = p.split('.'); let o = st; for (let i = 0; i < ks.length - 1; i++) { o[ks[i]] = o[ks[i]] || {}; o = o[ks[i]]; } o[ks[ks.length - 1]] = val; };
      function satisfy(node, st) {
        if (!node || typeof node !== 'object') return;
        if (node.all) { node.all.forEach(n => satisfy(n, st)); return; }
        if (node.any) { node.any.forEach(n => satisfy(n, st)); return; }
        if (node.not) return;   // leave inner unsatisfied → `not` passes
        (node.flags || []).forEach(f => st[f] = true);
        (node.flagsAny || []).forEach(f => st[f] = true);
        if (node.flagEquals) for (const k in node.flagEquals) st[k] = node.flagEquals[k];
        (node.nodes || []).forEach(n => { (st.visited = st.visited || {})[n] = 1; });
        (node.questsAttempted || []).forEach(id => { (st.quests = st.quests || {})[id] = 'active'; });
        (node.questsDone || []).forEach(id => { (st.quests = st.quests || {})[id] = 'done'; });
        if (node.favorMin) { st.npcFavorability = st.npcFavorability || {}; for (const n in node.favorMin) st.npcFavorability[n] = node.favorMin[n]; }
        (node.battles || []).forEach(b => { (st.defeatedBattles = st.defeatedBattles || {})[b] = true; });
        if (node.shardsMin != null) st.shards = Math.max(st.shards || 0, node.shardsMin);
        if (node.restedAtMin) { st.shortRestedAtNodes = st.shortRestedAtNodes || {}; for (const nd in node.restedAtMin) st.shortRestedAtNodes[nd] = node.restedAtMin[nd]; }
        (node.sleptAt || []).forEach(nd => { (st.sleptAtNodes = st.sleptAtNodes || {})[nd] = true; });
        (node.flagsPath || []).forEach(p => setPath(st, p, true));
        (node.countMin || []).forEach(c => setPath(st, c.path, c.min));
        if (node.dayMin != null || node.dayMax != null) st.day = node.dayMin != null ? node.dayMin : (node.dayMax - 1);   // §BOARD-01-VOID-GATE — land inside the window
        (node.questsComplete || []).forEach(id => { (st.quests = st.quests || {})[id] = 'complete'; });
        (node.items || []).forEach(ci => { (st.inventory = st.inventory || []).push({ name: ci }); });
        (node.itemsAll || []).forEach(e => { const nm = (typeof e === 'string') ? e : e.name, mn = (typeof e === 'string') ? 1 : (e.min || 1); st.inventory = st.inventory || []; for (let i = 0; i < mn; i++) st.inventory.push({ name: nm }); });
        if (node.atNode != null) st.currentCode = node.atNode;
      }

      // ── one scratch runtime, mutable state + quest via the injected getters ──
      let cur = {}, curNode = null, curKind = 'activate';
      const rt = createQuestRuntime({
        getState: () => cur,
        effects: { getQuest: id => (curKind === 'complete' ? { id, completion: curNode } : { id, gate: curNode }) },
      });
      const kEval = (kind, node, st) => { cur = st; curKind = kind; curNode = node; return kind === 'complete' ? rt.canComplete('q') : rt.canActivate('q'); };

      const statesFor = node => { const max = {}; satisfy(node, max); return [{}, max]; };
      const mismatches = []; let gates = 0, compls = 0;
      for (const q of Object.values(QUEST_DB)) {
        if (q.gate && typeof q.gate === 'object' && !q.gate._legacyFn) {
          for (const st of statesFor(q.gate)) {
            const k = kEval('activate', q.gate, st), ref = refEval(q.gate, st, 'activate');
            if (k !== ref) mismatches.push({ id: q.id, kind: 'activate', k, ref, st });
            gates++;
          }
        }
        if (q.completion && typeof q.completion === 'object') {
          for (const st of statesFor(q.completion)) {
            const k = kEval('complete', q.completion, st), ref = refEval(q.completion, st, 'complete');
            if (k !== ref) mismatches.push({ id: q.id, kind: 'complete', k, ref, st });
            compls++;
          }
        }
      }
      return { hasCreate: typeof createQuestRuntime === 'function', gates, compls, mismatchCount: mismatches.length, sample: mismatches.slice(0, 8) };
    });
    expect(r.hasCreate).toBe(true);
    expect(r.mismatchCount, 'kernel/reference divergences: ' + JSON.stringify(r.sample)).toBe(0);
    expect(r.gates).toBeGreaterThan(1000);        // ~2,800 UQF gates × 2 states
    expect(r.compls).toBeGreaterThan(200);
  });

  test('quest_wm_01 completes on letter OR 3 seals (grammar); no live gate uses itemsMinAny', async ({ page }) => {
    await page.goto('/index.html');
    const r = await page.evaluate(() => {
      const q = QUEST_DB['quest_wm_01'];
      const evalC = st => createQuestRuntime({ getState: () => st, effects: { getQuest: () => q } }).canComplete('quest_wm_01');
      const seals = n => ({ inventory: Array.from({ length: n }, () => ({ name: "Scholar Kings' Seal" })) });
      // recursively scan every live gate + completion for the deleted term
      const hasIMA = node => {
        if (!node || typeof node !== 'object') return false;
        if ('itemsMinAny' in node) return true;
        if (Array.isArray(node.all) && node.all.some(hasIMA)) return true;
        if (Array.isArray(node.any) && node.any.some(hasIMA)) return true;
        if (node.not && hasIMA(node.not)) return true;
        return false;
      };
      let ima = 0;
      for (const qq of Object.values(QUEST_DB)) if (hasIMA(qq.gate) || hasIMA(qq.completion)) ima++;
      return {
        isAst: !!(q.completion && Array.isArray(q.completion.any)),
        none: evalC(seals(0)), two: evalC(seals(2)), three: evalC(seals(3)),
        letter: evalC({ archiveLetterObtained: true }), letterPlus: evalC({ archiveLetterObtained: true, ...seals(1) }),
        ima,
      };
    });
    expect(r.isAst).toBe(true);
    expect(r.none).toBe(false);
    expect(r.two).toBe(false);
    expect(r.three).toBe(true);
    expect(r.letter).toBe(true);
    expect(r.letterPlus).toBe(true);
    expect(r.ima).toBe(0);
  });

});
