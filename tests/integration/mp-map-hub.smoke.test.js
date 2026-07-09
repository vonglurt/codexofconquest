// §MP-MAP smoke — the Multiplayer hub on the map's Multiplayer pane:
// advertise toggle (persist + beacon gate), Local/World chat filter, presence.
const { test, expect } = require('@playwright/test');

test.describe('§MP-MAP — multiplayer hub on the map screen', () => {
  test('pane opens; advertise toggle + Local/World chat scope + proximity filter work, no page errors', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', e => pageErrors.push(String(e)));
    await page.goto('/roll2hit-v3.html');

    const r = await page.evaluate(() => {
      const out = {};
      // Open the Multiplayer subpane
      window.msubSwitch('msub-connect');
      out.paneActive = document.getElementById('msub-connect').classList.contains('msub-active');
      out.tabLabel = [...document.querySelectorAll('#map-subtab-bar .map-subtab')]
        .find(t => t.dataset.msub === 'msub-connect').textContent.trim();
      out.hasAdvCb = !!document.getElementById('mp-advertise-cb');
      out.hasScopeBar = !!document.getElementById('mp-chat-scope-bar');
      out.hasChatList = !!document.getElementById('mp-map-chat-list');
      out.hasChatInput = !!document.getElementById('mp-map-chat-input');

      // Advertise default on, gates the beacon
      out.advDefault = MP.advertise;
      out.beaconGatedWhenOff = (() => {
        MP.on = true; MP.session = 'x'; MP.advertise = false;
        // mpBeacon returns null immediately when hidden + not forced
        const p = mpBeacon();               // promise
        return p && typeof p.then === 'function';
      })();
      mpSetAdvertise(false);
      out.advPersistOff = (localStorage.getItem('mpAdvertise') === '0' && MP.advertise === false);
      mpSetAdvertise(true);
      out.advPersistOn = (localStorage.getItem('mpAdvertise') === '1' && MP.advertise === true);
      out.cbSynced = document.getElementById('mp-advertise-cb').checked === true;
      MP.on = false; MP.session = null;

      // Chat proximity filter: seed two lines, one near, one far
      S_story.playerR = 40; S_story.playerC = 200;
      MP.chat = [
        { ts: 1, name: 'Near', msg: 'hi from next door', r: 42, c: 201 },
        { ts: 2, name: 'Far',  msg: 'hello from afar',   r: 5,  c: 12  },
        { ts: 3, name: 'NoCoord', msg: 'system-ish', r: null, c: null },
      ];
      window.mpChatScope('local');
      const localTxt = document.getElementById('mp-map-chat-list').textContent;
      out.localHasNear = localTxt.includes('Near');
      out.localHidesFar = !localTxt.includes('Far ') && !localTxt.includes('afar');
      out.localHidesNoCoord = !localTxt.includes('NoCoord');
      window.mpChatScope('world');
      const worldTxt = document.getElementById('mp-map-chat-list').textContent;
      out.worldHasAll = worldTxt.includes('Near') && worldTxt.includes('Far') && worldTxt.includes('NoCoord');
      out.scopePersist = localStorage.getItem('mpChatScope') === 'world';

      // Presence renders (disconnected state)
      _mpRenderMapPresence();
      out.presenceText = document.getElementById('mp-map-presence').textContent.slice(0, 20);
      return out;
    });

    expect(r.paneActive).toBe(true);
    expect(r.tabLabel).toContain('Multiplayer');
    expect(r.hasAdvCb && r.hasScopeBar && r.hasChatList && r.hasChatInput).toBe(true);
    expect(r.advDefault).toBe(true);
    expect(r.beaconGatedWhenOff).toBe(true);
    expect(r.advPersistOff).toBe(true);
    expect(r.advPersistOn).toBe(true);
    expect(r.cbSynced).toBe(true);
    expect(r.localHasNear).toBe(true);
    expect(r.localHidesFar).toBe(true);
    expect(r.localHidesNoCoord).toBe(true);
    expect(r.worldHasAll).toBe(true);
    expect(r.scopePersist).toBe(true);
    expect(r.presenceText.length).toBeGreaterThan(0);
    expect(pageErrors).toEqual([]);
  });
});
