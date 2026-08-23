// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
//
// Captures cropped feature screenshots from the live game for the landing page.
// Run: node src/tools/capture-screens.mjs   (from the repo root, after `make install`)
//
// Each shot seeds localStorage, opens one surface, and screenshots a single
// element — so the output is a crop of that feature, not a whole page.
import pw from '../node_modules/@playwright/test/index.js';
const { chromium } = pw;
import { createServer } from 'node:http';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT  = path.join(ROOT, 'assets', 'screenshots');
mkdirSync(OUT, { recursive: true });

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
const server = createServer((req, res) => {
  const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html';
  const file = path.join(ROOT, rel);
  if (!file.startsWith(ROOT) || !existsSync(file)) { res.writeHead(404); return res.end('nope'); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
  res.end(readFileSync(file));
});
await new Promise(r => server.listen(7655, r));
const BASE = 'http://localhost:7655';

const SEED = {
  active: true, currentCode: 'BOO', checkpointNode: 'BOO',
  hp: 46, hpMax: 58, gold: 214, xp: 5200, day: 17, level: 6, shards: 3,
  voidPressure: 2, atkBonus: 3, acBonus: 0, shortRests: 2,
  abilityScores: { str: 16, dex: 14, con: 15, int: 10, wis: 12, cha: 11 },
  inventory: [
    { name: 'Codex Shard', icon: '◈', type: 'quest', sell: 0, desc: 'One of seven. Warm to the touch.' },
    { name: 'Fishing Rod', icon: '🎣', type: 'weapon', atkBonus: 1, dmgDie: 4, dmgCount: 1, dmgFlat: 0, sell: 10, desc: 'Standard rod.' },
    { name: 'Longsword', icon: '⚔', type: 'weapon', atkBonus: 2, dmgDie: 8, dmgCount: 1, dmgFlat: 1, sell: 45, desc: 'Notched, reliable.' },
    { name: "Froberger's Journal", icon: '📓', type: 'quest', sell: 0, desc: 'Entry 41 stops mid-page.' },
    { name: 'Healing Draught', icon: '🧪', type: 'consumable', sell: 25, desc: 'Restores 2d4+2 HP.' },
  ],
  fishingCatchLog: [], fishingQuestFlags: {},
  tackleboxZoneUnlocks: { shore: true, reeds: true, deep: false },
  defeatedBattles: {}, quests: {}, knowledge: [], visited: { BOO: true },
  log: [], journalRead: {}, npcFavorability: {}, npcVisitCounts: {},
  sleptAtNodes: {}, shortRestedAtNodes: {}, countedMissedInns: {}, missedSleeps: 0,
  battleDis: 0, dropsCollected: 0, pendingBattle: null,
  battleTurn: 'player', battleRound: 1,
  usedMainAttack: false, usedBonusAction: false, usedRealAttack: false,
  rngState: 424242, visitedCells: {},
};

const SHOTS = [
  { name: '01-character-creation', sel: '#charcreate-card',
    caption: 'Character creation — origin, then the sheet you will carry for 49 days',
    setup: async p => { await p.evaluate(() => window._showCharCreate && window._showCharCreate()); } },

  { name: '02-stat-point-buy', sel: '#charcreate-card',
    caption: 'Point-buy — the standard 27-point budget, spent in the open',
    setup: async p => {
      await p.evaluate(() => window._showCharCreate && window._showCharCreate());
      await p.evaluate(() => {
        const plus = [...document.querySelectorAll('#charcreate-card button')].filter(b => b.textContent.trim() === '+');
        for (let i = 0; i < 5 && plus[0]; i++) plus[0].click();
        for (let i = 0; i < 4 && plus[1]; i++) plus[1].click();
        for (let i = 0; i < 3 && plus[2]; i++) plus[2].click();
      });
    } },

  { name: '03-inventory', sel: '#inv-list',
    caption: 'Inventory — every item says what it is and what it is worth',
    setup: async p => { await p.evaluate(() => window.storyInventoryToggle && window.storyInventoryToggle()); } },

  { name: '04-character-sheet', sel: '#char-sheet-body',
    caption: 'The character sheet — six abilities, Luck as a seventh, and every modifier shown',
    setup: async p => { await p.evaluate(() => window.storyCharToggle && window.storyCharToggle()); } },

  { name: '05-fishing', sel: '#fishing-card',
    caption: 'Fishing — bait, zones and DCs; several games, not one',
    setup: async p => { await p.evaluate(() => window.storyFishing && window.storyFishing()); } },

  { name: '06-battle', sel: '#center-col', tight: true,
    caption: 'Combat — the advantaged d20, the modifier, the DC and the result, all on screen',
    setup: async p => {
      await p.evaluate(() => window.storyToggle && window.storyToggle());   // story -> battle tracker
      await p.waitForTimeout(400);
      await p.evaluate(() => { window.rollInit && window.rollInit(); });
    } },

  { name: '07-level-up', sel: '#story-levelup-modal > div',
    caption: 'Level up — the hit die you roll, and the sheet it changes',
    setup: async p => { await p.evaluate(() => {
        const S = window.S_story; if (S) { S.xp = 14000; }
        window._showLevelUpModal && window._showLevelUpModal(7);   // takes the level
      }); } },

  { name: '08-death-saves', sel: '#death-save-ui', tight: true,
    caption: 'Death saves — three successes or three failures, rolled in the open',
    setup: async p => {
      await p.evaluate(() => window.storyToggle && window.storyToggle());
      await p.waitForTimeout(400);
      await p.evaluate(() => {
        const S = window.S_story; if (S) { S.hp = 0; S.deathSaves = { s: 1, f: 1 }; }
        window._storyEnterDeathSaves && window._storyEnterDeathSaves();
        const el = document.querySelector('#death-save-ui'); if (el) el.style.display = '';
      });
    } },
  { name: '09-victory', sel: '#battle-victory-banner', tight: true,
    caption: 'Victory — the banner that closes a fight, and what it paid',
    setup: async p => {
      await p.evaluate(() => window.storyToggle && window.storyToggle());
      await p.waitForTimeout(400);
      await p.evaluate(() => {
        const b = document.querySelector('#battle-victory-banner');
        if (b) { b.classList.add('show'); b.classList.remove('auto-dismiss'); }
      });
    } },
];

const browser = await chromium.launch();
const results = [];
for (const shot of SHOTS) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
  try {
    await page.addInitScript(s => { localStorage.clear(); localStorage.setItem('coc_autosave', JSON.stringify(s)); }, SEED);
    await page.goto(`${BASE}/play.html`, { waitUntil: 'domcontentloaded' });
    // The continue gate must be answered with "load", or the game starts a
    // NEW game and every shot shows default stats instead of the seed.
    await page.locator('#story-continue-modal').waitFor({ state: 'visible', timeout: 10000 });
    await page.locator('#btn-continue-load').click();
    await page.waitForTimeout(900);
    await shot.setup(page);
    await page.waitForTimeout(600);
    const el = await page.$(shot.sel);
    const visible = el && await el.isVisible().catch(() => false);
    if (!visible) throw new Error(`selector not visible: ${shot.sel}`);
    if (shot.tight) {
      const box = await page.evaluate(sel => {
        const root = document.querySelector(sel);
        let x1 = 1e9, y1 = 1e9, x2 = -1e9, y2 = -1e9;
        for (const n of root.querySelectorAll('*')) {
          const r = n.getBoundingClientRect();
          if (r.width < 2 || r.height < 2) continue;
          const st = getComputedStyle(n);
          if (st.visibility === 'hidden' || st.display === 'none' || +st.opacity === 0) continue;
          x1 = Math.min(x1, r.left); y1 = Math.min(y1, r.top);
          x2 = Math.max(x2, r.right); y2 = Math.max(y2, r.bottom);
        }
        const P = 26;
        return { x: Math.max(0, x1 - P), y: Math.max(0, y1 - P),
                 width: (x2 - x1) + P * 2, height: (y2 - y1) + P * 2 };
      }, shot.sel);
      await page.screenshot({ path: path.join(OUT, `${shot.name}.png`), clip: box });
    } else {
      await el.screenshot({ path: path.join(OUT, `${shot.name}.png`) });
    }
    results.push({ ...shot, ok: true });
    console.log(`  ✓ ${shot.name}`);
  } catch (e) {
    results.push({ ...shot, ok: false, err: e.message.split('\n')[0].slice(0, 90) });
    console.log(`  ✗ ${shot.name} — ${e.message.split('\n')[0].slice(0, 90)}`);
  }
  await page.close();
}
await browser.close();
server.close();
console.log(`\n${results.filter(r => r.ok).length}/${SHOTS.length} captured → assets/screenshots/`);
