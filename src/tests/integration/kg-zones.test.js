// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
'use strict';
const { test, expect } = require('@playwright/test');
const { seedAndLoad, dismissContinue } = require('./helpers.js');

// ── §KG Increment 2 — St. Petersburg → Moscow "kindergarten" zones ────────────
//
// The low-level Soviet-cyberpunk corridor (TLL → SPB → KMS → ZVD → FBR → TVR → SVO):
//   • 5 new nodes, each with a new low-level terrain (name = terrain key).
//   • 6 new "training" monsters calibrated to a 1→4 _monsterLevel ladder.
//   • ZVD/FBR carry signature honor-duel / sim-overload battles.
//   • Corridor cells are real road (encounter-free); grinding happens off-road
//     near the zone nodes (each ringed by its low terrain pool) + Hunt Mode.
// Design: lab-reports/lab-report-kg-russia-kindergarten-zones.md
const LHR = { code: 'LHR', r: 10, c: 197 };
const seedAt = (n, extra = {}) => ({ currentCode: n.code, playerR: n.r, playerC: n.c, visited: { [n.code]: true }, ...extra });

// LOCKED design table (lab report §2/§3/§5)
const NODES = {
  SPB: { label: 'Nevsky Checkpoint',        terrain: 'soviet_checkpoint', r: 10, c: 210, npc: 'Recruiter Volkov' },
  KMS: { label: 'Komsomol School',          terrain: 'komsomol_school',   r: 11, c: 211, npc: 'Commissar-Instructor Roshkova' },
  ZVD: { label: 'Gulag Gladiator Zavod',    terrain: 'gladiator_zavod',   r: 12, c: 213, npc: 'Pit-Master Grimka' },
  FBR: { label: 'The Skill Fabrika',        terrain: 'skill_fabrika',     r: 13, c: 215, npc: 'Technician Iosif' },
  TVR: { label: 'Rzhev Transit Waystation', terrain: 'soviet_transit',    r: 13, c: 216, npc: 'Quartermaster Lena' },
};
const MLEVEL = { sparring_droid: 1, komsomol_cadet: 2, zavod_sparbot: 2, gladiator_bot: 3, fabrika_enforcer: 3, trainer_bot_prime: 4 };
const TERRAIN_POOLS = {
  soviet_checkpoint: ['sparring_droid', 'komsomol_cadet', 'commoner'],
  komsomol_school:   ['komsomol_cadet', 'sparring_droid', 'zavod_sparbot'],
  gladiator_zavod:   ['zavod_sparbot', 'gladiator_bot', 'trainer_bot_prime'],
  skill_fabrika:     ['fabrika_enforcer', 'gladiator_bot', 'trainer_bot_prime'],
  soviet_transit:    ['komsomol_cadet', 'zavod_sparbot', 'commoner'],
};

test.describe('§KG Increment 2 — Russia kindergarten zones', () => {
  test.beforeEach(async ({ page }) => {
    await seedAndLoad(page, seedAt(LHR, { level: 3, xp: 900 }));
    await dismissContinue(page);
  });

  test('the 5 corridor nodes exist with the locked terrain / coords / NPC', async ({ page }) => {
    const r = await page.evaluate((NODES) => {
      const out = {};
      for (const code of Object.keys(NODES)) {
        const n = NODE_MAP[code];
        const co = NODE_COORDS[code];
        out[code] = n ? { label: n.label, terrain: n.name, npc: n.npc, r: co && co.r, c: co && co.c } : null;
      }
      return out;
    }, NODES);
    for (const [code, want] of Object.entries(NODES)) {
      expect(r[code], `${code} present`).not.toBeNull();
      expect(r[code].label).toBe(want.label);
      expect(r[code].terrain).toBe(want.terrain);
      expect(r[code].npc).toBe(want.npc);
      expect(r[code].r).toBe(want.r);
      expect(r[code].c).toBe(want.c);
    }
  });

  test('the 6 training monsters calibrate to the 1→4 mLevel ladder', async ({ page }) => {
    const r = await page.evaluate((keys) => {
      const out = {};
      for (const k of keys) out[k] = MONSTER_POOL[k] ? _monsterLevel(MONSTER_POOL[k]) : 'MISSING';
      return out;
    }, Object.keys(MLEVEL));
    for (const [k, want] of Object.entries(MLEVEL)) expect(r[k], k).toBe(want);
    // The whole new band sits at/below level 4 — this IS the training tier.
    expect(Math.max(...Object.values(r))).toBeLessThanOrEqual(4);
  });

  test('the 5 zone terrains resolve to a valid, low monster pool', async ({ page }) => {
    const r = await page.evaluate((POOLS) => {
      const out = {};
      for (const t of Object.keys(POOLS)) {
        const db = WORLD_DB[t];
        out[t] = db ? {
          keys: db.monsters.map((m) => m && m.key),
          maxLevel: Math.max(...db.monsters.map(_monsterLevel)),
        } : null;
      }
      return out;
    }, TERRAIN_POOLS);
    for (const [t, wantKeys] of Object.entries(TERRAIN_POOLS)) {
      expect(r[t], `${t} in WORLD_DB`).not.toBeNull();
      expect(r[t].keys).toEqual(wantKeys);        // exact pool, order-sensitive
      expect(r[t].maxLevel).toBeLessThanOrEqual(4); // no hard monster leaks into a training zone
    }
  });

  test('ZVD / FBR carry their signature battles; TVR is a rest stop', async ({ page }) => {
    const r = await page.evaluate(() => ({
      zvd: NODE_MAP.ZVD.battle, fbr: NODE_MAP.FBR.battle,
      tvrSleep: NODE_MAP.TVR.sleep, spbBattle: NODE_MAP.SPB.battle,
    }));
    expect(r.zvd).toMatchObject({ key: 'gladiator_bot', count: 1 });
    expect(r.fbr).toMatchObject({ key: 'trainer_bot_prime', count: 1 });
    expect(r.tvrSleep).toBe(true);
    expect(r.spbBattle == null).toBe(true);  // talk/hub node — encounters come from terrain + Hunt Mode
  });

  // §DX-02e (2026-07-29): this test used to pin six hardcoded sample cells from the
  // lab report's original road-lay. `ROAD_RUNS` is GENERATED (scripts/build-roads.js),
  // and §DX-01a's regen rerouted the TLL→SPB leg off the Gulf-of-Finland sea cell
  // 10,207 via the row-8 TUO corridor — so four of the six samples stopped being road
  // while the design promise (encounter-free travel between the zone nodes) stayed
  // true. Assert the PROMISE against the engine's own route, not the generator's
  // coordinates: pin the property, and a future re-lay can never make this red again
  // unless it actually breaks the corridor.
  test('the corridor is real road (encounter-free travel between nodes)', async ({ page }) => {
    const CORRIDOR = ['TLL', 'SPB', 'KMS', 'ZVD', 'FBR', 'TVR', 'SVO'];
    const r = await page.evaluate((codes) => {
      // The exact router auto-travel walks (§NAV-01d road-weighted Dijkstra: road /
      // sea-lane cells cost 1, everything else 2) — window.__maptabs._roadGridPathCore.
      const route = window.__maptabs._roadGridPathCore;
      const legs = [];
      for (let i = 0; i < codes.length - 1; i++) {
        const a = codes[i], b = codes[i + 1];
        const path = route(NODE_COORDS[a], NODE_COORDS[b]);
        // Every cell but the destination node itself is walked as terrain; a cell is
        // safe if it is road (rate 0) or is itself a settlement (arrival, not a roll).
        const offRoad = path.slice(0, -1)
          .map((p) => `${p.r},${p.c}`)
          .filter((k) => !ROAD_CELLS.has(k) && !cellCode(k));
        legs.push({ a, b, steps: path.length, cells: path.map((p) => `${p.r},${p.c}`), offRoad });
      }
      return { legs, roadRate: TERRAIN_ENCOUNTER_RATE.road };
    }, CORRIDOR);

    expect(r.roadRate).toBe(0);           // road terrain never rolls an encounter
    for (const leg of r.legs) {
      expect(leg.steps, `${leg.a} → ${leg.b} has a route`).toBeGreaterThan(0);
      expect(leg.offRoad, `${leg.a} → ${leg.b} route [${leg.cells.join(' ')}] leaves the road at`).toEqual([]);
    }
  });
});
