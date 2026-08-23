// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson and Claude
// §DEATH-01 — Death, Loot & the Grave. Drives the REAL death/NG+/chip surfaces:
//  Inc A — honest respawn message (equipped gear survives) + finding #5 atomic-save pin
//  Inc B — persistent corpse signal chip (names where the body is; click opens the map)
//  Inc C — NG+ warn+confirm guards an unrecovered corpse from silent deletion
const { test, expect } = require('@playwright/test');

test.describe('§DEATH-01 — death, loot & the grave', () => {

  test('Inc A — respawn message tells the truth; equipped gear survives; save is atomic', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      storyNewGame({ str:10, dex:8, con:8, int:8, wis:8, cha:8 });
      // Loose bag: 2 ordinary items + 1 protected shard; 100 gold; a fall node.
      S_story.inventory = [
        { name:'Torch', icon:'🔦', type:'misc', sell:1 },
        { name:'Rope',  icon:'🪢', type:'misc', sell:1 },
        { name:'Codex Shard I', icon:'🔮', type:'shard', sell:0 },
      ];
      S_story.gold = 100;
      S_story.currentCode = 'LHR';
      S_story.pendingBattle = null;
      const mwBefore = S_story.equippedMainWeapon && S_story.equippedMainWeapon.name;
      const owBefore = S_story.equippedWeapon && S_story.equippedWeapon.name;
      try { localStorage.removeItem('r2h_autosave'); } catch(e) {}

      _storyDeathSaveFall();

      const msg = document.getElementById('story-move-msg').textContent;
      const corpse = S_story.corpsesQuests[S_story.corpsesQuests.length - 1];
      return {
        msg,
        mwBefore, mwAfter: S_story.equippedMainWeapon && S_story.equippedMainWeapon.name,
        owBefore, owAfter: S_story.equippedWeapon && S_story.equippedWeapon.name,
        corpseItems: corpse.items.length,
        corpseGold: corpse.goldDropped,
        invHasShard: S_story.inventory.some(i => i.type === 'shard'),
        goldZeroed: S_story.gold,
        saved: (() => { try { return !!localStorage.getItem('r2h_autosave'); } catch(e){ return false; } })(),
      };
    });
    // Equipped slots untouched by death (they live outside inventory)
    expect(r.mwAfter).toBe(r.mwBefore);
    expect(r.mwAfter).toBeTruthy();
    expect(r.owAfter).toBe(r.owBefore);
    // Message is honest: no lie, states gear survived, names the corpse + wake point
    expect(r.msg).not.toContain('rusted dagger is all you carry');
    expect(r.msg).toContain('stayed with you');
    expect(r.msg).toContain('Your body lies there');
    expect(r.msg).toContain('You wake at');
    // Only loose bag + 100% gold went to the corpse; shard protected, gold zeroed
    expect(r.corpseItems).toBe(2);
    expect(r.corpseGold).toBe(100);
    expect(r.invHasShard).toBe(true);
    expect(r.goldZeroed).toBe(0);
    // Finding #5 — the death persisted atomically (storyRender's terminal autosave fired)
    expect(r.saved).toBe(true);
  });

  test('Inc A — zero-loot death reads honestly (no "0 item(s)")', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const msg = await page.evaluate(() => {
      storyNewGame({ str:10, dex:8, con:8, int:8, wis:8, cha:8 });
      S_story.inventory = [];       // nothing loose to drop
      S_story.gold = 0;
      S_story.currentCode = 'LHR';
      S_story.pendingBattle = null;
      _storyDeathSaveFall();
      return document.getElementById('story-move-msg').textContent;
    });
    expect(msg).toContain('nothing of value');
    expect(msg).not.toContain('0 item(s)');
    expect(msg).toContain('stayed with you');
  });

  test('Inc B — corpse chip: hidden at 0, names 1 place, "N places" for many, click opens map', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      storyNewGame({ str:10, dex:8, con:8, int:8, wis:8, cha:8 });
      const chip = document.getElementById('corpse-chip');
      // 0 corpses → hidden
      S_story.corpsesQuests = [];
      _renderCorpseChip();
      const hidden0 = chip.style.display === 'none';
      // 1 corpse → shows count + single place name
      S_story.corpsesQuests = [{ id:'c1', nodeCode:'TVR', nodeName:'Rzhev', items:[{},{}], goldDropped:40 }];
      _renderCorpseChip();
      const one = { shown: chip.style.display !== 'none', text: chip.textContent };
      // 2 corpses at distinct nodes → "2 places"
      S_story.corpsesQuests = [
        { id:'c1', nodeCode:'TVR', nodeName:'Rzhev', items:[{}], goldDropped:40 },
        { id:'c2', nodeCode:'SPB', nodeName:'Nevsky', items:[], goldDropped:0 },
      ];
      _renderCorpseChip();
      const many = chip.textContent;
      // click opens the map (spy storyMapToggle)
      let opened = 0; const orig = window.storyMapToggle; window.storyMapToggle = () => { opened++; };
      chip.click();
      window.storyMapToggle = orig;
      return { hidden0, one, many, opened };
    });
    expect(r.hidden0).toBe(true);
    expect(r.one.shown).toBe(true);
    expect(r.one.text).toContain('1 body');
    expect(r.one.text).toContain('Rzhev');
    expect(r.many).toContain('2 bodies');
    expect(r.many).toContain('2 places');
    expect(r.opened).toBe(1);
  });

  test('Inc C — NG+ warns and aborts on decline; proceeds on accept; no prompt with no corpse', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const out = {};
      // (1) decline → NG+ aborts, corpse intact
      storyNewGame({ str:10, dex:8, con:8, int:8, wis:8, cha:8 });
      S_story.corpsesQuests = [{ id:'c1', nodeCode:'TVR', nodeName:'Rzhev', items:[{}], goldDropped:40 }];
      S_story.ngPlusRun = 7;                                   // sentinel that survives an abort
      let confirmCalls = 0; const origC = window.confirm;
      window.confirm = () => { confirmCalls++; return false; };
      storyNewGamePlus();
      out.declineConfirmCalls = confirmCalls;
      out.declineCorpsesKept = S_story.corpsesQuests.length;   // 1 = not wiped
      out.declineSentinelKept = S_story.ngPlusRun;             // 7 = NG+ did not run

      // (2) accept → NG+ proceeds, corpses wiped
      S_story.corpsesQuests = [{ id:'c1', nodeCode:'TVR', nodeName:'Rzhev', items:[{}], goldDropped:40 }];
      window.confirm = () => true;
      storyNewGamePlus();
      out.acceptCorpsesWiped = S_story.corpsesQuests.length;   // 0

      // (3) no corpse → confirm never called
      S_story.corpsesQuests = [];
      confirmCalls = 0;
      window.confirm = () => { confirmCalls++; return true; };
      storyNewGamePlus();
      out.noCorpseConfirmCalls = confirmCalls;

      window.confirm = origC;
      return out;
    });
    expect(r.declineConfirmCalls).toBe(1);
    expect(r.declineCorpsesKept).toBe(1);
    expect(r.declineSentinelKept).toBe(7);
    expect(r.acceptCorpsesWiped).toBe(0);
    expect(r.noCorpseConfirmCalls).toBe(0);
  });
});
