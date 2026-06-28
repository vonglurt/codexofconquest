'use strict';
const { test, expect } = require('@playwright/test');

// ── §WBAPI-01 ph4 — Quest Creator array-field support ─────────────────────────
//
// The ✏ Editor tab (§EDITOR-01) gained targetMonsterKeys + killGoals inputs
// (it already had completeItems). These feed edBuildQuestObj → Export JS / POST.
// Export JS is fully client-side (no server), so we fill the form, click
// ◇ Export JS, and assert the generated QUEST_DB entry serializes all three
// array fields correctly (killGoals as an object array).

test.describe('Quest Creator — array fields (§WBAPI-01 ph4)', () => {
  test('Export JS serializes completeItems, targetMonsterKeys, and killGoals', async ({ page }) => {
    await page.goto('/worldbuilder.html');
    await page.evaluate(() => window.switchTab('editor'));

    // Fill the side-quest form including the two new array fields.
    await page.evaluate(() => {
      const set = (id, v) => { const el = document.getElementById(id); el.value = v; };
      set('ed-id', 'quest_test_hunt');
      set('ed-type', 'side');
      document.getElementById('ed-type').dispatchEvent(new Event('change'));
      set('ed-title', 'Test Hunt');
      set('ed-completeItems', 'Trophy Pelt, Bounty Token');
      set('ed-targetMonsterKeys', 'stray_alley_cat, fluffy_cat');
      set('ed-killGoals', 'stray_alley_cat:5:Stray\nfluffy_cat:3:Fluffy');
    });
    await page.click('#ed-btn-export');

    const out = await page.inputValue('#ed-export-out');
    expect(out).toContain('completeItems:["Trophy Pelt","Bounty Token"]');
    expect(out).toContain('targetMonsterKeys:["stray_alley_cat","fluffy_cat"]');
    expect(out).toContain('killGoals:[{key:"stray_alley_cat",need:5,label:"Stray"},{key:"fluffy_cat",need:3,label:"Fluffy"}]');
  });

  // ── §EDITOR-01-D — Quest Creator itemChain authoring ───────────────────────
  test('Export JS serializes the declarative itemChain (all four action kinds)', async ({ page }) => {
    await page.goto('/worldbuilder.html');
    await page.evaluate(() => window.switchTab('editor'));
    await page.evaluate(() => {
      const set = (id, v) => { const el = document.getElementById(id); el.value = v; };
      set('ed-id', 'quest_test_chain');
      set('ed-type', 'side');
      document.getElementById('ed-type').dispatchEvent(new Event('change'));
      set('ed-title', 'Chain Test');
      // §EDITOR-01-D-FU(a): the textarea is gone — seed the visual widget instead.
      window.__edChain.setSteps([
        { action: 'grant', name: 'Pip Bead', icon: '🪵', type: 'misc', sell: 1, desc: 'A token' },
        { action: 'take', name: "Smalt's Trust", all: true },
        { action: 'grantBit', flag: 'harmonyChainComplete', label: 'Harmony Chain' },
        { action: 'takeBit', flag: 'harmonyChainComplete' },
      ]);
    });
    await page.click('#ed-btn-export');
    const out = await page.inputValue('#ed-export-out');
    expect(out).toContain('itemChain:[' +
      '{action:"grant",name:"Pip Bead",icon:"🪵",type:"misc",sell:1,desc:"A token"},' +
      '{action:"take",name:"Smalt\'s Trust",all:true},' +
      '{action:"grantBit",flag:"harmonyChainComplete",label:"Harmony Chain"},' +
      '{action:"takeBit",flag:"harmonyChainComplete"}]');
  });

  test('itemChain grant fills optional fields only when present', async ({ page }) => {
    await page.goto('/worldbuilder.html');
    await page.evaluate(() => window.switchTab('editor'));
    await page.evaluate(() => {
      const set = (id, v) => { const el = document.getElementById(id); el.value = v; };
      set('ed-id', 'quest_test_chain2');
      set('ed-type', 'side');
      document.getElementById('ed-type').dispatchEvent(new Event('change'));
      window.__edChain.setSteps([{ action: 'grant', name: 'Bare Item' }]);   // name only — defaults applied at runtime, not serialized
    });
    await page.click('#ed-btn-export');
    const out = await page.inputValue('#ed-export-out');
    expect(out).toContain('itemChain:[{action:"grant",name:"Bare Item"}]');
  });

  test('killGoals label defaults to key, need defaults to 1 when omitted', async ({ page }) => {
    await page.goto('/worldbuilder.html');
    await page.evaluate(() => window.switchTab('editor'));
    await page.evaluate(() => {
      const set = (id, v) => { const el = document.getElementById(id); el.value = v; };
      set('ed-id', 'quest_test_hunt2');
      set('ed-type', 'side');
      document.getElementById('ed-type').dispatchEvent(new Event('change'));
      set('ed-killGoals', 'beefy_tom');          // no need, no label
    });
    await page.click('#ed-btn-export');
    const out = await page.inputValue('#ed-export-out');
    expect(out).toContain('killGoals:[{key:"beefy_tom",need:1,label:"beefy_tom"}]');
  });
});

// ── §EDITOR-01-D-FU(a) Inc 3 — visual itemChain widget wired into Quest Creator ─
//
// The #ed-itemChain textarea is replaced by a mounted buildChainEditor instance
// (#ed-itemChain-editor). edBuildQuestObj now sources q.itemChain from
// edChain.getSteps(); Export JS therefore round-trips whatever the widget holds.
// These tests drive the real DOM (Add step / kind select / data-cf inputs / ▲▼)
// — no setSteps shortcut — to prove the wiring end to end.

test.describe('Quest Creator — itemChain visual editor wiring (§EDITOR-01-D-FU a)', () => {
  // Author one row through the live widget DOM, exactly as a user would.
  async function authorRow(page, kind, fields) {
    await page.evaluate(({ kind, fields }) => {
      const wrap = document.getElementById('ed-itemChain-editor');
      wrap.querySelector('.chain-ed > button').click();          // + Add step
      const row = wrap.querySelector('.chain-row:last-child');
      const sel = row.querySelector('.chain-kind');
      sel.value = kind; sel.dispatchEvent(new Event('change'));   // re-renders fields for the kind
      for (const [f, v] of Object.entries(fields)) {
        const el = row.querySelector(`[data-cf="${f}"]`);
        if (el.type === 'checkbox') { el.checked = !!v; el.dispatchEvent(new Event('change')); }
        else { el.value = v; el.dispatchEvent(new Event('input')); }
      }
    }, { kind, fields });
  }

  test('authoring a mixed chain through the widget DOM exports the right itemChain', async ({ page }) => {
    await page.goto('/worldbuilder.html');
    await page.evaluate(() => window.switchTab('editor'));
    await page.evaluate(() => {
      const set = (id, v) => { const el = document.getElementById(id); el.value = v; };
      set('ed-id', 'quest_widget_chain');
      set('ed-type', 'side');
      document.getElementById('ed-type').dispatchEvent(new Event('change'));
      set('ed-title', 'Widget Chain');
    });
    await authorRow(page, 'grant', { name: 'Pip Bead', icon: '🪵', type: 'misc', sell: '1', desc: 'A token' });
    await authorRow(page, 'take', { name: "Smalt's Trust", all: true });
    await authorRow(page, 'grantBit', { flag: 'harmonyChainComplete', label: 'Harmony Chain' });
    await authorRow(page, 'takeBit', { flag: 'harmonyChainComplete' });

    await page.click('#ed-btn-export');
    const out = await page.inputValue('#ed-export-out');
    expect(out).toContain('itemChain:[' +
      '{action:"grant",name:"Pip Bead",icon:"🪵",type:"misc",sell:1,desc:"A token"},' +
      '{action:"take",name:"Smalt\'s Trust",all:true},' +
      '{action:"grantBit",flag:"harmonyChainComplete",label:"Harmony Chain"},' +
      '{action:"takeBit",flag:"harmonyChainComplete"}]');
  });

  test('rich grant (bonus/readText) authored via the widget exports valid JS', async ({ page }) => {
    await page.goto('/worldbuilder.html');
    await page.evaluate(() => window.switchTab('editor'));
    await page.evaluate(() => {
      const set = (id, v) => { const el = document.getElementById(id); el.value = v; };
      set('ed-id', 'quest_rich'); set('ed-type', 'side');
      document.getElementById('ed-type').dispatchEvent(new Event('change'));
      window.__edChain.setSteps([{
        action: 'grant', name: 'Field Tome', icon: '📗', type: 'tome', sell: 0,
        bonus: { deathSave: 1 }, readText: 'a', silent: true,
      }]);
    });
    await page.click('#ed-btn-export');
    const out = await page.inputValue('#ed-export-out');
    // bonus serializes as JSON (the b1 fix — not "[object Object]"); silent + readText carried.
    expect(out).toContain('itemChain:[{action:"grant",name:"Field Tome"');
    expect(out).toContain('bonus:{"deathSave":1}');
    expect(out).toContain('readText:"a"');
    expect(out).toContain('silent:true');
  });

  test('grant.once unchecked in the widget serializes once:false', async ({ page }) => {
    await page.goto('/worldbuilder.html');
    await page.evaluate(() => window.switchTab('editor'));
    await page.evaluate(() => {
      const set = (id, v) => { const el = document.getElementById(id); el.value = v; };
      set('ed-id', 'quest_once'); set('ed-type', 'side');
      document.getElementById('ed-type').dispatchEvent(new Event('change'));
    });
    await authorRow(page, 'grant', { name: 'Repeatable', once: false });
    await page.click('#ed-btn-export');
    const out = await page.inputValue('#ed-export-out');
    expect(out).toContain('itemChain:[{action:"grant",name:"Repeatable",once:false}]');
  });

  test('▲/▼ reorder in the widget is reflected in the exported itemChain order', async ({ page }) => {
    await page.goto('/worldbuilder.html');
    await page.evaluate(() => window.switchTab('editor'));
    await page.evaluate(() => {
      const set = (id, v) => { const el = document.getElementById(id); el.value = v; };
      set('ed-id', 'quest_reorder'); set('ed-type', 'side');
      document.getElementById('ed-type').dispatchEvent(new Event('change'));
      window.__edChain.setSteps([
        { action: 'grantBit', flag: 'one' },
        { action: 'grantBit', flag: 'two' },
        { action: 'grantBit', flag: 'three' },
      ]);
      // move the last row ("three") up one → [one, three, two]
      const rows = document.querySelectorAll('#ed-itemChain-editor .chain-row');
      rows[2].querySelector('.chain-up').click();
    });
    await page.click('#ed-btn-export');
    const out = await page.inputValue('#ed-export-out');
    expect(out).toContain('itemChain:[' +
      '{action:"grantBit",flag:"one"},' +
      '{action:"grantBit",flag:"three"},' +
      '{action:"grantBit",flag:"two"}]');
  });

  test('applying the blank preset clears the widget rows (no itemChain exported)', async ({ page }) => {
    await page.goto('/worldbuilder.html');
    await page.evaluate(() => window.switchTab('editor'));
    await page.evaluate(() => {
      document.getElementById('ed-id').value = 'quest_reset'; // any seed
      window.__edChain.setSteps([{ action: 'grantBit', flag: 'stale' }]);
    });
    // Blank preset must wipe the chain rows.
    await page.click('#ed-pre-blank');
    const rowCount = await page.evaluate(() =>
      document.querySelectorAll('#ed-itemChain-editor .chain-row').length);
    expect(rowCount).toBe(0);

    await page.evaluate(() => {
      document.getElementById('ed-id').value = 'quest_reset';
      document.getElementById('ed-type').value = 'side';
      document.getElementById('ed-type').dispatchEvent(new Event('change'));
    });
    await page.click('#ed-btn-export');
    const out = await page.inputValue('#ed-export-out');
    expect(out).not.toContain('itemChain:');
  });
});
