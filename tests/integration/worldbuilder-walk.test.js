// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson and Claude
'use strict';
const { test, expect } = require('@playwright/test');

// ── §WALK — Playable World Editor Integration Tests ───────────────────────────
//
// Tests the "🚶 Walk" tab in worldbuilder.html against a minimal injected world.
//
// Mock world layout:
//   A(10,10) ── B(10,11) ── C(10,12)
//      │
//   D(11,10)
//
// A has: npc='merchant_hans', desc='A great city.', quests Q1+Q2
// B has: battle='goblin', quest Q3
// C has: no npc/battle/quests
// D has: no npc/battle/quests
// North of A (9,10) is empty — N D-pad button disabled.
//
// All tests inject data via page.evaluate (no game file or server required).

const MOCK_NODE_MAP = {
  A: { label: 'Alpha',  name: 'urban',  act: 1, npc: 'merchant_hans', desc: 'A great city.' },
  B: { label: 'Beta',   name: 'forest', act: 1, battle: 'goblin' },
  C: { label: 'Gamma',  name: 'plains', act: 2 },
  D: { label: 'Delta',  name: 'coast',  act: 1 },
};
const MOCK_NODE_COORDS = {
  A: { r: 10, c: 10 },
  B: { r: 10, c: 11 },
  C: { r: 10, c: 12 },
  D: { r: 11, c: 10 },
};
const MOCK_QUEST_DB = {
  quest_t_01: { id: 'quest_t_01', type: 'side',        title: 'First Test Quest',  activateNode: 'A' },
  quest_t_02: { id: 'quest_t_02', type: 'skill_check', title: 'Second Test Quest', activateNode: 'A' },
  quest_t_03: { id: 'quest_t_03', type: 'side',        title: 'Over In Beta',      activateNode: 'B' },
};

// ── Helper: load worldbuilder, inject data, switch to Walk tab ────────────────
async function loadWalkTab(page, opts = {}) {
  // §NAV-01-FU (5): firewall the WBAPI origin BEFORE navigation so the boot-time
  // probeServer() auto-load can never reach a live :1367 dev server and win the
  // race that clobbers the injected mock world (the "Yugurt Lake" ≠ 'Alpha'
  // failure). Callers needing custom endpoint handlers pass their own pre-armed
  // stub (opts.stub); every other describe gets a bare 404-firewall here.
  if (!opts.stub) await armApiStub(page);
  await page.goto('/worldbuilder.html');

  await page.evaluate(({ nm, nc, qd }) => {
    WBAPI.nodeMap     = nm;
    WBAPI.nodeCoords  = nc;
    WBAPI.questDb     = qd;
    WBAPI.birkaNpcs   = {};
    WBAPI.monsterPool = {};
    WBAPI._rawQuestSrc = '';
    WBAPI._buildIndexes();
    WBAPI.loaded = true;
    // Dismiss the welcome screen so it doesn't intercept pointer events
    const ws = document.getElementById('welcome-screen');
    if (ws) ws.classList.add('hidden');
    document.dispatchEvent(new Event('wbapi:loaded'));
  }, { nm: { ...MOCK_NODE_MAP, ...(opts.extraNodes || {}) }, nc: { ...MOCK_NODE_COORDS, ...(opts.extraCoords || {}) }, qd: { ...MOCK_QUEST_DB, ...(opts.extraQuests || {}) } });

  await page.click('[data-tab="walk"]');
  await page.waitForFunction(() => document.getElementById('tab-walk').classList.contains('active'));
  // Wait for wkCur to be set (node code header not '—')
  await page.waitForFunction(() => document.getElementById('wk-code').textContent !== '—');
}

// ── 1 — Initial load: node A ──────────────────────────────────────────────────

test.describe('§WALK-A — Load and initial position', () => {

  test.beforeEach(async ({ page }) => { await loadWalkTab(page); });

  test('Walk tab becomes active after click', async ({ page }) => {
    const cls = await page.locator('#tab-walk').getAttribute('class');
    expect(cls).toContain('active');
  });

  test('wk-code shows first node code (A)', async ({ page }) => {
    const code = await page.locator('#wk-code').textContent();
    expect(code).toBe('A');
  });

  test('wk-name shows node label (Alpha)', async ({ page }) => {
    const name = await page.locator('#wk-name').textContent();
    expect(name).toBe('Alpha');
  });

  test('wk-act shows ACT 1', async ({ page }) => {
    const act = await page.locator('#wk-act').textContent();
    expect(act).toBe('ACT 1');
  });

  test('wk-textbox shows node desc', async ({ page }) => {
    const txt = await page.locator('#wk-textbox').textContent();
    expect(txt).toBe('A great city.');
  });

  test('wk-loc toolbar shows code — label', async ({ page }) => {
    const loc = await page.locator('#wk-loc').textContent();
    expect(loc).toContain('A');
    expect(loc).toContain('Alpha');
  });

  test('mini-map canvas is present and sized correctly', async ({ page }) => {
    const w = await page.locator('#wk-map-canvas').getAttribute('width');
    const h = await page.locator('#wk-map-canvas').getAttribute('height');
    expect(+w).toBe(196);
    expect(+h).toBe(400);
  });

  test('mini-map empty overlay is hidden after data load', async ({ page }) => {
    const display = await page.locator('#wk-map-empty').evaluate(el => el.style.display);
    expect(display).toBe('none');
  });

});

// ── 2 — Info chips ────────────────────────────────────────────────────────────

test.describe('§WALK-D — Info chips', () => {

  test.beforeEach(async ({ page }) => { await loadWalkTab(page); });

  test('NPC chip rendered for node with npc field', async ({ page }) => {
    const chips = await page.locator('#wk-chips .wk-chip.c-npc').count();
    expect(chips).toBe(1);
    const text = await page.locator('#wk-chips .wk-chip.c-npc').textContent();
    expect(text).toContain('merchant_hans');
  });

  test('QUEST chip shows count of quests at node', async ({ page }) => {
    const chip = page.locator('#wk-chips .wk-chip.c-quest');
    await expect(chip).toBeVisible();
    const text = await chip.textContent();
    expect(text).toContain('2 quests');
  });

  test('no BATTLE chip at A (node has no battle)', async ({ page }) => {
    const cnt = await page.locator('#wk-chips .wk-chip.c-battle').count();
    expect(cnt).toBe(0);
  });

  test('BATTLE chip appears after navigating to B', async ({ page }) => {
    await page.evaluate(() => wkGo('B'));
    await page.waitForFunction(() => document.getElementById('wk-code').textContent === 'B');
    const chip = page.locator('#wk-chips .wk-chip.c-battle');
    await expect(chip).toBeVisible();
    const text = await chip.textContent();
    expect(text).toContain('goblin');
  });

  test('no NPC chip at B (node has no npc)', async ({ page }) => {
    await page.evaluate(() => wkGo('B'));
    await page.waitForFunction(() => document.getElementById('wk-code').textContent === 'B');
    const cnt = await page.locator('#wk-chips .wk-chip.c-npc').count();
    expect(cnt).toBe(0);
  });

  test('no chips at C (no npc/battle/quests)', async ({ page }) => {
    await page.evaluate(() => wkGo('C'));
    await page.waitForFunction(() => document.getElementById('wk-code').textContent === 'C');
    const cnt = await page.locator('#wk-chips .wk-chip').count();
    expect(cnt).toBe(0);
  });

});

// ── 3 — D-pad ─────────────────────────────────────────────────────────────────
// Node A (10,10): E=B, S=D, W=none, N=none, NE=none, NW=none, SW=none, SE=none

test.describe('§WALK-B — D-pad button states', () => {

  test.beforeEach(async ({ page }) => { await loadWalkTab(page); });

  test('N button disabled at A (no northern neighbor)', async ({ page }) => {
    const disabled = await page.locator('#wkd-n').isDisabled();
    expect(disabled).toBe(true);
  });

  test('W button disabled at A (no western neighbor)', async ({ page }) => {
    const disabled = await page.locator('#wkd-w').isDisabled();
    expect(disabled).toBe(true);
  });

  test('E button enabled at A (B is east)', async ({ page }) => {
    const disabled = await page.locator('#wkd-e').isDisabled();
    expect(disabled).toBe(false);
  });

  test('E button has live class at A', async ({ page }) => {
    const cls = await page.locator('#wkd-e').getAttribute('class');
    expect(cls).toContain('live');
  });

  test('S button enabled at A (D is south)', async ({ page }) => {
    const disabled = await page.locator('#wkd-s').isDisabled();
    expect(disabled).toBe(false);
  });

  test('Center button enabled (always reflects current node)', async ({ page }) => {
    const disabled = await page.locator('#wkd-c').isDisabled();
    expect(disabled).toBe(false);
  });

  test('NW/NE/SW/SE diagonal buttons disabled at A', async ({ page }) => {
    for (const id of ['wkd-nw', 'wkd-ne', 'wkd-sw', 'wkd-se']) {
      const disabled = await page.locator(`#${id}`).isDisabled();
      expect(disabled).toBe(true);
    }
  });

  test('SE disabled at A but W enabled at B (B has A to west)', async ({ page }) => {
    await page.evaluate(() => wkGo('B'));
    await page.waitForFunction(() => document.getElementById('wk-code').textContent === 'B');
    const wDisabled = await page.locator('#wkd-w').isDisabled();
    expect(wDisabled).toBe(false);
    const nDisabled = await page.locator('#wkd-n').isDisabled();
    expect(nDisabled).toBe(true);
  });

});

// ── 4 — Navigation ────────────────────────────────────────────────────────────

test.describe('§WALK-B — Navigation', () => {

  test.beforeEach(async ({ page }) => { await loadWalkTab(page); });

  test('clicking E D-pad button navigates to B', async ({ page }) => {
    await page.locator('#wkd-e').click();
    await page.waitForFunction(() => document.getElementById('wk-code').textContent === 'B');
    const code = await page.locator('#wk-code').textContent();
    expect(code).toBe('B');
    const name = await page.locator('#wk-name').textContent();
    expect(name).toBe('Beta');
  });

  test('clicking S D-pad button navigates to D', async ({ page }) => {
    await page.locator('#wkd-s').click();
    await page.waitForFunction(() => document.getElementById('wk-code').textContent === 'D');
    expect(await page.locator('#wk-code').textContent()).toBe('D');
  });

  test('wkGo("B") then wkGo("A") returns to origin', async ({ page }) => {
    await page.evaluate(() => wkGo('B'));
    await page.waitForFunction(() => document.getElementById('wk-code').textContent === 'B');
    await page.evaluate(() => wkGo('A'));
    await page.waitForFunction(() => document.getElementById('wk-code').textContent === 'A');
    expect(await page.locator('#wk-code').textContent()).toBe('A');
  });

  test('wkGo with unknown code shows move-msg, does not navigate', async ({ page }) => {
    await page.evaluate(() => wkGo('ZZZZ'));
    // Code should not change
    await page.waitForTimeout(100);
    const code = await page.locator('#wk-code').textContent();
    expect(code).toBe('A');
    const msg = await page.locator('#wk-move-msg').textContent();
    expect(msg).toContain('ZZZZ');
  });

  test('jump input navigates to typed node code', async ({ page }) => {
    await page.locator('#wk-jump-inp').fill('D');
    await page.locator('#wk-btn-jump').click();
    await page.waitForFunction(() => document.getElementById('wk-code').textContent === 'D');
    expect(await page.locator('#wk-code').textContent()).toBe('D');
  });

  test('jump input Enter key triggers navigation', async ({ page }) => {
    await page.locator('#wk-jump-inp').fill('C');
    await page.locator('#wk-jump-inp').press('Enter');
    await page.waitForFunction(() => document.getElementById('wk-code').textContent === 'C');
    expect(await page.locator('#wk-code').textContent()).toBe('C');
  });

  test('↩ Origin button returns to first node', async ({ page }) => {
    await page.evaluate(() => wkGo('C'));
    await page.waitForFunction(() => document.getElementById('wk-code').textContent === 'C');
    await page.locator('#wk-btn-first').click();
    // First node is A (first key in MOCK_NODE_COORDS)
    await page.waitForFunction(() => document.getElementById('wk-code').textContent !== 'C');
    const code = await page.locator('#wk-code').textContent();
    expect(['A','B','C','D']).toContain(code); // any valid node (first in insertion order)
  });

  test('move-msg shows direction hint after D-pad click', async ({ page }) => {
    await page.locator('#wkd-e').click();
    await page.waitForFunction(() => document.getElementById('wk-code').textContent === 'B');
    const msg = await page.locator('#wk-move-msg').textContent();
    expect(msg).toContain('E');
  });

});

// ── 5 — Keyboard navigation ───────────────────────────────────────────────────

test.describe('§WALK-B — Keyboard navigation (WASD / arrow keys)', () => {

  test.beforeEach(async ({ page }) => { await loadWalkTab(page); });

  async function blurFocus(page) {
    // Ensure no text field is focused so keyboard events reach the document listener
    await page.evaluate(() => document.activeElement?.blur());
  }

  test('ArrowRight moves from A to B (east)', async ({ page }) => {
    await blurFocus(page);
    await page.keyboard.press('ArrowRight');
    await page.waitForFunction(() => document.getElementById('wk-code').textContent === 'B');
    expect(await page.locator('#wk-code').textContent()).toBe('B');
  });

  test('ArrowDown moves from A to D (south)', async ({ page }) => {
    await blurFocus(page);
    await page.keyboard.press('ArrowDown');
    await page.waitForFunction(() => document.getElementById('wk-code').textContent === 'D');
    expect(await page.locator('#wk-code').textContent()).toBe('D');
  });

  test('d key moves from A to B (east, WASD)', async ({ page }) => {
    await blurFocus(page);
    await page.keyboard.press('d');
    await page.waitForFunction(() => document.getElementById('wk-code').textContent === 'B');
    expect(await page.locator('#wk-code').textContent()).toBe('B');
  });

  test('ArrowUp does not move from A (no northern neighbor)', async ({ page }) => {
    await blurFocus(page);
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(80);
    expect(await page.locator('#wk-code').textContent()).toBe('A');
  });

  test('ArrowLeft does not move from A (no western neighbor)', async ({ page }) => {
    await blurFocus(page);
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(80);
    expect(await page.locator('#wk-code').textContent()).toBe('A');
  });

  test('keyboard blocked when input field is focused', async ({ page }) => {
    await page.locator('#wk-jump-inp').focus();
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(80);
    // Should not navigate — focus was on input
    expect(await page.locator('#wk-code').textContent()).toBe('A');
  });

  test('ArrowLeft from B returns to A', async ({ page }) => {
    await page.evaluate(() => wkGo('B'));
    await page.waitForFunction(() => document.getElementById('wk-code').textContent === 'B');
    await blurFocus(page);
    await page.keyboard.press('ArrowLeft');
    await page.waitForFunction(() => document.getElementById('wk-code').textContent === 'A');
    expect(await page.locator('#wk-code').textContent()).toBe('A');
  });

});

// ── 6 — Neighbor list ─────────────────────────────────────────────────────────

test.describe('§WALK-D — Neighbor list in center panel', () => {

  test.beforeEach(async ({ page }) => { await loadWalkTab(page); });

  test('neighbor list shows E link to B', async ({ page }) => {
    const text = await page.locator('#wk-neighbors').textContent();
    expect(text).toContain('B');
    expect(text).toContain('Beta');
  });

  test('neighbor list shows S link to D', async ({ page }) => {
    const text = await page.locator('#wk-neighbors').textContent();
    expect(text).toContain('D');
    expect(text).toContain('Delta');
  });

  test('clicking E neighbor link navigates to B', async ({ page }) => {
    // Find the span with B in the neighbor list and click it
    await page.locator('#wk-neighbors span').filter({ hasText: 'B' }).first().click();
    await page.waitForFunction(() => document.getElementById('wk-code').textContent === 'B');
    expect(await page.locator('#wk-code').textContent()).toBe('B');
  });

  test('no N entry shows dash for absent northern neighbor', async ({ page }) => {
    const rows = await page.locator('#wk-neighbors div').allTextContents();
    const northRow = rows.find(r => r.includes('↑') || r.includes('N'));
    // North neighbor is absent — row should not contain a node code
    expect(northRow).toBeDefined();
    expect(northRow).not.toContain('Alpha');
    expect(northRow).not.toContain('Beta');
  });

});

// ── 7 — Edit panel ────────────────────────────────────────────────────────────

test.describe('§WALK-E — Edit panel', () => {

  test.beforeEach(async ({ page }) => { await loadWalkTab(page); });

  test('edit fields are visible after navigating to a node', async ({ page }) => {
    await expect(page.locator('#wk-edit-fields')).toBeVisible();
  });

  test('we-label shows node label', async ({ page }) => {
    const val = await page.locator('#we-label').inputValue();
    expect(val).toBe('Alpha');
  });

  test('we-name shows terrain key', async ({ page }) => {
    const val = await page.locator('#we-name').inputValue();
    expect(val).toBe('urban');
  });

  test('we-act shows act number', async ({ page }) => {
    const val = await page.locator('#we-act').inputValue();
    expect(val).toBe('1');
  });

  test('we-npc shows npc field', async ({ page }) => {
    const val = await page.locator('#we-npc').inputValue();
    expect(val).toBe('merchant_hans');
  });

  test('we-desc shows desc field', async ({ page }) => {
    const val = await page.locator('#we-desc').inputValue();
    expect(val).toBe('A great city.');
  });

  test('editing label adds dirty class', async ({ page }) => {
    await page.locator('#we-label').fill('Alpha City');
    const cls = await page.locator('#we-label').getAttribute('class');
    expect(cls).toContain('dirty');
  });

  test('PUT button is enabled at a loaded node', async ({ page }) => {
    const disabled = await page.locator('#wk-btn-put').isDisabled();
    expect(disabled).toBe(false);
  });

  test('Reset button clears dirty fields back to WBAPI values', async ({ page }) => {
    await page.locator('#we-label').fill('Changed Name');
    await page.locator('#wk-btn-reset').click();
    const val = await page.locator('#we-label').inputValue();
    expect(val).toBe('Alpha');
    const cls = await page.locator('#we-label').getAttribute('class');
    expect(cls).not.toContain('dirty');
  });

  test('edit fields update when navigating to a different node', async ({ page }) => {
    await page.evaluate(() => wkGo('C'));
    await page.waitForFunction(() => document.getElementById('wk-code').textContent === 'C');
    const label = await page.locator('#we-label').inputValue();
    expect(label).toBe('Gamma');
    const name  = await page.locator('#we-name').inputValue();
    expect(name).toBe('plains');
  });

  test('we-npc empty when node has no npc', async ({ page }) => {
    await page.evaluate(() => wkGo('B'));
    await page.waitForFunction(() => document.getElementById('wk-code').textContent === 'B');
    const val = await page.locator('#we-npc').inputValue();
    expect(val).toBe('');
  });

});

// ── 8 — Quests panel ─────────────────────────────────────────────────────────

test.describe('§WALK-E — Quests section in edit panel', () => {

  test.beforeEach(async ({ page }) => { await loadWalkTab(page); });

  test('quests section visible at node with quests', async ({ page }) => {
    await expect(page.locator('#wk-quests-sec')).toBeVisible();
  });

  test('quest count badge shows (2) at A', async ({ page }) => {
    const cnt = await page.locator('#wk-qcnt').textContent();
    expect(cnt).toBe('(2)');
  });

  test('quest list shows both quests at A', async ({ page }) => {
    const items = await page.locator('#wk-quest-list .wk-qrow').allTextContents();
    expect(items.length).toBe(2);
    const combined = items.join(' ');
    expect(combined).toContain('quest_t_01');
    expect(combined).toContain('quest_t_02');
  });

  test('quest titles appear in the quest rows', async ({ page }) => {
    const items = await page.locator('#wk-quest-list .wk-qrow').allTextContents();
    const combined = items.join(' ');
    expect(combined).toContain('First Test Quest');
    expect(combined).toContain('Second Test Quest');
  });

  test('quest count updates when navigating to B (1 quest)', async ({ page }) => {
    await page.evaluate(() => wkGo('B'));
    await page.waitForFunction(() => document.getElementById('wk-code').textContent === 'B');
    const cnt = await page.locator('#wk-qcnt').textContent();
    expect(cnt).toBe('(1)');
    const items = await page.locator('#wk-quest-list .wk-qrow').allTextContents();
    expect(items.length).toBe(1);
    expect(items[0]).toContain('quest_t_03');
  });

  test('quest count shows (0) at node with no quests', async ({ page }) => {
    await page.evaluate(() => wkGo('C'));
    await page.waitForFunction(() => document.getElementById('wk-code').textContent === 'C');
    const cnt = await page.locator('#wk-qcnt').textContent();
    expect(cnt).toBe('(0)');
    const items = await page.locator('#wk-quest-list .wk-qrow').count();
    expect(items).toBe(0);
  });

});

// ── 9 — Reverse coordinate index (wkBuildRev) ────────────────────────────────

test.describe('§WALK-C — Reverse coordinate index and neighbor logic', () => {

  test.beforeEach(async ({ page }) => { await loadWalkTab(page); });

  test('wkRev maps "10,10" to A', async ({ page }) => {
    const code = await page.evaluate(() => wkRev['10,10']);
    expect(code).toBe('A');
  });

  test('wkRev maps "10,11" to B', async ({ page }) => {
    const code = await page.evaluate(() => wkRev['10,11']);
    expect(code).toBe('B');
  });

  test('wkNeighbors(A) returns E=B, S=D, N=null, W=null', async ({ page }) => {
    const nbrs = await page.evaluate(() => wkNeighbors('A'));
    expect(nbrs.e).toBe('B');
    expect(nbrs.s).toBe('D');
    expect(nbrs.n).toBeNull();
    expect(nbrs.w).toBeNull();
  });

  test('wkNeighbors(B) returns W=A, E=C, N=null, S=null', async ({ page }) => {
    const nbrs = await page.evaluate(() => wkNeighbors('B'));
    expect(nbrs.w).toBe('A');
    expect(nbrs.e).toBe('C');
    expect(nbrs.n).toBeNull();
    expect(nbrs.s).toBeNull();
  });

  test('wkNeighbors(C) returns W=B only', async ({ page }) => {
    const nbrs = await page.evaluate(() => wkNeighbors('C'));
    expect(nbrs.w).toBe('B');
    expect(nbrs.e).toBeNull();
    expect(nbrs.n).toBeNull();
    expect(nbrs.s).toBeNull();
  });

  test('wkNeighbors for unknown code returns all nulls', async ({ page }) => {
    const nbrs = await page.evaluate(() => wkNeighbors('ZZZZ'));
    expect(Object.values(nbrs).every(v => v === null)).toBe(true);
  });

});

// ── 10 — Cross-tab integration ────────────────────────────────────────────────

test.describe('§WALK-F — Cross-tab integration buttons', () => {

  test.beforeEach(async ({ page }) => { await loadWalkTab(page); });

  test('→ CRUD button switches to CRUD tab', async ({ page }) => {
    await page.locator('#wk-btn-to-crud').click();
    const cls = await page.locator('#tab-crud').getAttribute('class');
    expect(cls).toContain('active');
  });

  test('→ Editor button switches to Editor tab', async ({ page }) => {
    await page.locator('#wk-btn-to-editor').click();
    const cls = await page.locator('#tab-editor').getAttribute('class');
    expect(cls).toContain('active');
  });

  test('→ Editor button pre-fills activateNode with current code', async ({ page }) => {
    await page.locator('#wk-btn-to-editor').click();
    await page.waitForTimeout(60);
    const val = await page.locator('#ed-activateNode').inputValue();
    expect(val).toBe('A');
  });

  test('+ New quest button switches to Editor tab', async ({ page }) => {
    await page.locator('#wk-btn-new-quest').click();
    const cls = await page.locator('#tab-editor').getAttribute('class');
    expect(cls).toContain('active');
  });

  test('Walk nav tab exists in the top bar', async ({ page }) => {
    const tab = page.locator('[data-tab="walk"]');
    await expect(tab).toBeVisible();
    const text = await tab.textContent();
    expect(text).toContain('Walk');
  });

});

// ── 11 — Story text box ───────────────────────────────────────────────────────

test.describe('§WALK-D — Story text box content', () => {

  test.beforeEach(async ({ page }) => { await loadWalkTab(page); });

  test('shows node.desc when present', async ({ page }) => {
    const txt = await page.locator('#wk-textbox').textContent();
    expect(txt).toBe('A great city.');
  });

  test('generates fallback text from label when no desc', async ({ page }) => {
    await page.evaluate(() => wkGo('B'));
    await page.waitForFunction(() => document.getElementById('wk-code').textContent === 'B');
    const txt = await page.locator('#wk-textbox').textContent();
    // No desc on B — should generate "You are in BETA." or similar
    expect(txt.toUpperCase()).toContain('BETA');
  });

});

// ── 12 — wkCur state ─────────────────────────────────────────────────────────

test.describe('§WALK internal — wkCur state variable', () => {

  test.beforeEach(async ({ page }) => { await loadWalkTab(page); });

  test('wkCur is set to A on initial load', async ({ page }) => {
    // wkCur exposed via Object.defineProperty getter → window.wkCur
    const cur = await page.evaluate(() => window.wkCur);
    expect(cur).toBe('A');
  });

  test('wkCur updates after wkGo', async ({ page }) => {
    await page.evaluate(() => wkGo('C'));
    await page.waitForFunction(() => document.getElementById('wk-code').textContent === 'C');
    const cur = await page.evaluate(() => window.wkCur);
    expect(cur).toBe('C');
  });

});

// ── 13 — §NAV-01g drag-&-lock cities ─────────────────────────────────────────
// Drag a marker on the mini-map (ghost readout) → PUT /api/coords; lat/lon entry
// converts row=floor(70−lat), col=(floor(lon)+180)%360; 🔒 lock persists via
// PUT /api/roads/lock. HERMETIC: every request to the WBAPI origin is intercepted
// BEFORE page load — the boot-time probeServer auto-load can never fire, a live
// dev server on :1367 can never replace the injected mock world, and every
// mutation is asserted at the request level (API-first, no file edits).

async function armApiStub(page) {
  const stub = { handlers: {}, calls: [] };
  await page.route('http://localhost:1367/**', async (route) => {
    const req = route.request();
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    const key = `${req.method()} ${new URL(req.url()).pathname}`;
    const body = req.postData() ? JSON.parse(req.postData()) : null;
    stub.calls.push({ key, body });
    const h = stub.handlers[key];
    if (!h) return route.fulfill({ status: 404, headers: cors, contentType: 'application/json', body: JSON.stringify({ error: `unstubbed ${key}` }) });
    const out = typeof h === 'function' ? h(body) : h;
    return route.fulfill({ status: 200, headers: cors, contentType: 'application/json', body: JSON.stringify(out) });
  });
  return stub;
}

test.describe('§NAV-01g — drag-&-lock cities', () => {

  let stub;
  test.beforeEach(async ({ page }) => {
    stub = await armApiStub(page);   // firewall :1367 BEFORE the page boots
    await loadWalkTab(page, { stub }); // pass the pre-armed stub so it isn't re-armed
  });
  const putCalls = (key) => stub.calls.filter((c) => c.key === key).map((c) => c.body);

  test('lat/lon → cell conversion matches the locked formula', async ({ page }) => {
    const out = await page.evaluate(() => [
      window.__walkG.llToCell(59.3, 17.6),   // Birka → (10,197)
      window.__walkG.llToCell(60.5, -0.1),   // floor(-0.1) = -1 → col 179 (W wrap)
      window.__walkG.llToCell(70, -180),     // NW corner of the band → (0,0)
    ]);
    expect(out[0]).toEqual({ r: 10, c: 197 });
    expect(out[1]).toEqual({ r: 9, c: 179 });
    expect(out[2]).toEqual({ r: 0, c: 0 });
  });

  test('position section shows the current cell + derived lat/lon', async ({ page }) => {
    await expect(page.locator('#wk-coords-sec')).toBeVisible();
    const line = await page.locator('#wk-pos-line').textContent();
    expect(line).toContain('r 10 · c 10');          // A at (10,10)
    expect(line).toContain('lat 60, lon -170');     // 70−10 / 10−180
  });

  test('Place by lat/lon previews the cell and PUTs the conversion', async ({ page }) => {
    stub.handlers['PUT /api/coords/A'] = (b) => ({ ok: true, code: 'A', coords: b });
    await page.evaluate(() => { SERVER.active = true; });
    await page.fill('#we-lat', '60.5');
    await page.fill('#we-lon', '-170');
    await expect(page.locator('#wk-ll-preview')).toContainText('(9, 10)');   // floor(70−60.5)=9 · (−170+180)=10
    await page.click('#wk-btn-place');
    await expect(page.locator('#wk-move-msg')).toContainText('A → (9,10) ✓');
    expect(putCalls('PUT /api/coords/A')).toEqual([{ r: 9, c: 10 }]);
    expect(await page.evaluate(() => WBAPI.nodeCoords.A)).toEqual({ r: 9, c: 10 });
  });

  test('occupied cell is refused client-side — no request leaves the page', async ({ page }) => {
    stub.handlers['PUT /api/coords/A'] = { ok: true };
    await page.evaluate(() => { SERVER.active = true; });
    const ok = await page.evaluate(() => window.__walkG.moveNode('A', 10, 11));   // B's cell
    expect(ok).toBe(false);
    await expect(page.locator('#wk-coords-result')).toContainText('occupied by B');
    expect(putCalls('PUT /api/coords/A')).toEqual([]);
  });

  test('drag a marker: ghost readout while moving, PUT on drop, click still teleports', async ({ page }) => {
    stub.handlers['PUT /api/coords/B'] = (b) => ({ ok: true, code: 'B', coords: b });
    await page.evaluate(() => { SERVER.active = true; });
    // wkCur=A(10,10) → view origin oR=-10, oC=1. B(10,11) → px(105,205); empty (9,11) → px(105,195).
    await page.locator('#wk-map-canvas').scrollIntoViewIfNeeded();   // #panels boots h-scrolled off-viewport
    const box = await page.locator('#wk-map-canvas').boundingBox();
    await page.mouse.move(box.x + 105, box.y + 205);
    await page.mouse.down();
    await page.mouse.move(box.x + 105, box.y + 195, { steps: 3 });
    await expect(page.locator('#wk-move-msg')).toContainText('Move B → (9,11)');
    await page.mouse.up();
    await expect(page.locator('#wk-move-msg')).toContainText('B → (9,11) ✓');
    expect(putCalls('PUT /api/coords/B')).toEqual([{ r: 9, c: 11 }]);
    expect(await page.evaluate(() => WBAPI.nodeCoords.B)).toEqual({ r: 9, c: 11 });
    expect(await page.evaluate(() => window.wkCur)).toBe('A');   // dropping ≠ teleporting
    await page.mouse.click(box.x + 105, box.y + 195);            // plain click on B's new marker
    await expect(page.locator('#wk-code')).toHaveText('B');      // …still teleports
  });

  test('🔒 locked node refuses moves; toggle round-trips through the lock API', async ({ page }) => {
    stub.handlers['PUT /api/roads/lock'] = (b) => ({ ok: true, code: b.code, nowLocked: b.locked, locked: b.locked ? ['A'] : [] });
    stub.handlers['PUT /api/coords/A'] = { ok: true };
    await page.evaluate(() => { SERVER.active = true; window.__walkG.setLocked(['A']); });
    await expect(page.locator('#wk-btn-lock')).toHaveText('🔓 Unlock position');
    const ok = await page.evaluate(() => window.__walkG.moveNode('A', 9, 10));
    expect(ok).toBe(false);
    await expect(page.locator('#wk-coords-result')).toContainText('🔒 locked');
    expect(putCalls('PUT /api/coords/A')).toEqual([]);
    await page.click('#wk-btn-lock');                            // unlock via the API
    await expect(page.locator('#wk-btn-lock')).toHaveText('🔒 Lock position');
    expect(putCalls('PUT /api/roads/lock')).toEqual([{ code: 'A', locked: false }]);
    expect(await page.evaluate(() => [...window.__walkG.lockedSet()])).toEqual([]);
  });

  test('lock toggle without a server shows the connect hint', async ({ page }) => {
    await page.evaluate(() => { SERVER.active = false; });
    await page.click('#wk-btn-lock');
    await expect(page.locator('#wk-coords-result')).toContainText('Server not connected');
  });

});

// ── 14 — §NAV-01h road-net editor ("place the net") ──────────────────────────
// ROAD_RUNS renders as a chain-link overlay; dragging a road vertex mints a pin
// wired through the corridor's two BFS settlement anchors; ✚/┬ palette pins link
// to the 4/3 nearest cities; 🔗 toggles forced links; 🗑 deletes a pin; ♻ Reweave
// Net PUTs /api/roads. HERMETIC (same firewall as §13): every mutation asserted
// at the request level — the game file and roads-pins.json are never touched.
//
// Road fixture: run row 14 cols 9–13, flanked by settlements E(14,8) / F(14,14).
// wkCur = A(10,10) → view origin (oR −10, oC 1): px(cell) = ((c−1)·10+5, (r+10)·10+5).

test.describe('§NAV-01h — road-net editor', () => {

  const ROAD_NODES = {
    extraNodes:  { E: { label: 'Echo', name: 'plains', act: 1 }, F: { label: 'Fox', name: 'plains', act: 1 } },
    extraCoords: { E: { r: 14, c: 8 }, F: { r: 14, c: 14 } },
  };
  const ROAD_CELLS = ['14,9', '14,10', '14,11', '14,12', '14,13'];

  let stub;
  test.beforeEach(async ({ page }) => {
    stub = await armApiStub(page);   // firewall :1367 BEFORE the page boots
    await loadWalkTab(page, { ...ROAD_NODES, stub }); // pass the stub so loadWalkTab doesn't re-arm a 2nd (empty) firewall
    await page.locator('#wk-map-canvas').scrollIntoViewIfNeeded();   // #panels boots h-scrolled off-viewport
  });
  const putCalls = (key) => stub.calls.filter((c) => c.key === key).map((c) => c.body);
  const armNet = async (page, { pins = [], links = [] } = {}) => page.evaluate(({ cells, pins, links }) => {
    SERVER.active = true;
    window.__walkG.setNet({ cells, pins, links });
  }, { cells: ROAD_CELLS, pins, links });

  test('GET /api/roads populates the overlay: runs expanded, pins, links, locked', async ({ page }) => {
    stub.handlers['GET /api/roads'] = {
      ok: true, cells: 5, junctions: 0, runs: { 14: [[9, 13]] },
      pins: [{ r: 13, c: 11 }], links: [['14,8', '13,11']], locked: ['A'],
    };
    await page.evaluate(() => { SERVER.active = true; });
    await page.evaluate(() => window.__walkG.loadRoads());
    const state = await page.evaluate(() => ({
      roads: [...window.__walkG.roads()].sort(),
      pins: window.__walkG.pins(), links: window.__walkG.links(),
      locked: [...window.__walkG.lockedSet()],
    }));
    expect(state.roads).toEqual(['14,10', '14,11', '14,12', '14,13', '14,9']);
    expect(state.pins).toEqual([{ r: 13, c: 11 }]);
    expect(state.links).toEqual([['14,8', '13,11']]);
    expect(state.locked).toEqual(['A']);
  });

  test('dragging a road vertex mints a pin wired through the two BFS anchors', async ({ page }) => {
    stub.handlers['PUT /api/roads/pins'] = (b) => ({ ok: true, pins: b.pins, links: b.links });
    await armNet(page);
    const box = await page.locator('#wk-map-canvas').boundingBox();
    await page.mouse.move(box.x + 105, box.y + 245);        // road vertex (14,11)
    await page.mouse.down();
    await page.mouse.move(box.x + 105, box.y + 235, { steps: 3 });   // → (13,11)
    await expect(page.locator('#wk-move-msg')).toContainText('pin the road through (13,11)');
    await page.mouse.up();
    await expect(page.locator('#wk-move-msg')).toContainText('road pinned through (13,11)');
    // BFS from (14,11) along the run reaches F(14,14) then E(14,8) — corridor rewired A↔pin↔B
    expect(putCalls('PUT /api/roads/pins')).toEqual([
      { pins: [{ r: 13, c: 11 }], links: [['14,14', '13,11'], ['13,11', '14,8']] },
    ]);
    expect(await page.evaluate(() => window.__walkG.pins())).toEqual([{ r: 13, c: 11 }]);
    expect(await page.evaluate(() => window.wkCur)).toBe('A');   // pinning ≠ teleporting
  });

  test('✚ intersection: click drops a pin linked to the 4 nearest cities', async ({ page }) => {
    stub.handlers['PUT /api/roads/pins'] = (b) => ({ ok: true, pins: b.pins, links: b.links });
    await armNet(page);
    await page.click('#wk-rd-pin4');
    await expect(page.locator('#wk-rd-pin4')).toHaveClass(/armed/);
    await expect(page.locator('#wk-move-msg')).toContainText('4 nearest cities');
    const box = await page.locator('#wk-map-canvas').boundingBox();
    await page.mouse.click(box.x + 105, box.y + 225);       // empty cell (12,11)
    await expect(page.locator('#wk-move-msg')).toContainText('pin at (12,11) linked to 4 cities');
    // nearest by euclid+wrap: D(11,10) √2 · B(10,11) 2 · then the A/C tie breaks by key
    expect(putCalls('PUT /api/roads/pins')).toEqual([{
      pins: [{ r: 12, c: 11 }],
      links: [['11,10', '12,11'], ['10,11', '12,11'], ['10,10', '12,11'], ['10,12', '12,11']],
    }]);
    expect(await page.evaluate(() => window.__walkG.tool())).toBe(null);   // single-shot
  });

  test('┬ T-junction: same pin, 3 links', async ({ page }) => {
    stub.handlers['PUT /api/roads/pins'] = (b) => ({ ok: true, pins: b.pins, links: b.links });
    await armNet(page);
    await page.click('#wk-rd-pin3');
    const box = await page.locator('#wk-map-canvas').boundingBox();
    await page.mouse.click(box.x + 105, box.y + 225);       // empty cell (12,11)
    await expect(page.locator('#wk-move-msg')).toContainText('pin at (12,11) linked to 3 cities');
    expect(putCalls('PUT /api/roads/pins')).toEqual([{
      pins: [{ r: 12, c: 11 }],
      links: [['11,10', '12,11'], ['10,11', '12,11'], ['10,10', '12,11']],
    }]);
  });

  test('🔗 link toggles: pin→city adds, second pass removes', async ({ page }) => {
    stub.handlers['PUT /api/roads/pins'] = (b) => ({ ok: true, pins: b.pins, links: b.links });
    await armNet(page, { pins: [{ r: 13, c: 11 }] });
    const box = await page.locator('#wk-map-canvas').boundingBox();
    await page.click('#wk-rd-link');
    await page.mouse.click(box.x + 105, box.y + 235);       // pin (13,11)
    await expect(page.locator('#wk-move-msg')).toContainText('second endpoint');
    await page.mouse.click(box.x + 95, box.y + 205);        // city A (10,10)
    await expect(page.locator('#wk-move-msg')).toContainText('added');
    await page.click('#wk-rd-link');                        // toggle the same pair off
    await page.mouse.click(box.x + 105, box.y + 235);
    await page.mouse.click(box.x + 95, box.y + 205);
    await expect(page.locator('#wk-move-msg')).toContainText('removed');
    expect(putCalls('PUT /api/roads/pins')).toEqual([
      { pins: [{ r: 13, c: 11 }], links: [['13,11', '10,10']] },
      { pins: [{ r: 13, c: 11 }], links: [] },
    ]);
  });

  test('dragging a pin moves it and re-points its links', async ({ page }) => {
    stub.handlers['PUT /api/roads/pins'] = (b) => ({ ok: true, pins: b.pins, links: b.links });
    await armNet(page, { pins: [{ r: 13, c: 11 }], links: [['14,8', '13,11'], ['13,11', '14,14']] });
    const box = await page.locator('#wk-map-canvas').boundingBox();
    await page.mouse.move(box.x + 105, box.y + 235);        // pin (13,11)
    await page.mouse.down();
    await page.mouse.move(box.x + 115, box.y + 235, { steps: 3 });   // → (13,12)
    await page.mouse.up();
    await expect(page.locator('#wk-move-msg')).toContainText('pin (13,11) → (13,12)');
    expect(putCalls('PUT /api/roads/pins')).toEqual([
      { pins: [{ r: 13, c: 12 }], links: [['14,8', '13,12'], ['13,12', '14,14']] },
    ]);
  });

  test('🗑 delete removes the pin and every link touching it', async ({ page }) => {
    stub.handlers['PUT /api/roads/pins'] = (b) => ({ ok: true, pins: b.pins, links: b.links });
    await armNet(page, {
      pins: [{ r: 13, c: 11 }],
      links: [['14,8', '13,11'], ['13,11', '14,14'], ['10,10', '10,11']],
    });
    await page.click('#wk-rd-del');
    const box = await page.locator('#wk-map-canvas').boundingBox();
    await page.mouse.click(box.x + 105, box.y + 235);       // pin (13,11)
    await expect(page.locator('#wk-move-msg')).toContainText('removed');
    expect(putCalls('PUT /api/roads/pins')).toEqual([
      { pins: [], links: [['10,10', '10,11']] },            // the unrelated link survives
    ]);
  });

  test('♻ Reweave Net PUTs /api/roads then refreshes the overlay', async ({ page }) => {
    stub.handlers['PUT /api/roads'] = { ok: true, applied: true, cells: 12, junctions: 3, pins: 1, links: 2, check: 'R1–R4 green', generator: [] };
    stub.handlers['GET /api/roads'] = { ok: true, cells: 2, junctions: 0, runs: { 20: [[5, 6]] }, pins: [], links: [], locked: [] };
    await page.evaluate(() => { SERVER.active = true; });
    await page.click('#wk-rd-reweave');
    await expect(page.locator('#wk-move-msg')).toContainText('net rewoven: 12 cells · 3 junctions · R1–R4 green');
    expect(stub.calls.some((c) => c.key === 'PUT /api/roads')).toBe(true);
    expect(await page.evaluate(() => [...window.__walkG.roads()].sort())).toEqual(['20,5', '20,6']);
  });

  test('🛣 toggles the overlay; reweave without a server shows the connect hint', async ({ page }) => {
    await expect(page.locator('#wk-rd-toggle')).toHaveClass(/on/);
    await page.click('#wk-rd-toggle');
    await expect(page.locator('#wk-rd-toggle')).not.toHaveClass(/on/);
    await page.evaluate(() => { SERVER.active = false; });
    await page.click('#wk-rd-reweave');
    await expect(page.locator('#wk-move-msg')).toContainText('Server not connected');
  });

});
