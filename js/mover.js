// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson and Claude
'use strict';
// mover.js — §WALK-2 unified mover kernel: the single source of movement truth
// shared by the SP client (inlined into roll2hit-v3.html) and the MUD server
// (require('./mover')).  PURE: no DOM, no SSE, no Math.random, no module globals.
//
// The region between the MOVER:CORE sentinels is inlined BYTE-IDENTICALLY into
// roll2hit-v3.html; §WALK-4 walk-parity asserts the two copies match. Do not
// edit one copy without the other (or run: node scripts/check-mover-parity.js).
//
// world (read-only geo-grid snapshot, §4.1):
//   { proj:{ROWS,COLS},          // §2.1 equirectangular 1° — 360 cols × 90 rows
//     impassable,                // Set "r,c"            (sea + IMPASSABLE_CELLS)
//     cellCodes:(r,c)=>string[], // §2.2 locale list at a cell ([] = empty)
//     terrainAt:(r,c)=>key,      // §2.4 terrain at a cell
//     encounterRate:(key)=>num } // TERRAIN_ENCOUNTER_RATE lookup (baseRate)
// §WALK-1.5 carries water crossings as SEA_LANES land bridges (passable cells), so
// the kernel has no ferry-edge mechanism: any impassable dest cell blocks (sea).
// pos: {r,c}   dir: 'N'|'S'|'E'|'W'   ->  MoveResult (a description; caller does effects)

// ◆◆◆ MOVER:CORE:START ◆◆◆
const __MOVER_DELTAS = { N: [-1, 0], S: [1, 0], E: [0, 1], W: [0, -1] };

// Geo-grid topology (§2.1): longitude wraps E↔W (mod COLS); latitude is clamped
// at the band edges (no pole wrap). E/W therefore never goes out of bounds.
function __moverStep(proj, r, c, dr, dc) {
  const ROWS = proj.ROWS, COLS = proj.COLS;
  const nr = r + dr;
  const nc = (((c + dc) % COLS) + COLS) % COLS;   // E↔W wrap
  const oob = nr < 0 || nr >= ROWS;               // N/S band edge only
  return { nr, nc, oob };
}

function __moverBlocked(from, reason) {
  return {
    ok: false, reason,
    from: { r: from.r, c: from.c }, to: { r: from.r, c: from.c }, via: null,
    destCodes: [], destKind: reason === 'sea' ? 'sea' : 'empty',
    terrain: null, encounter: { eligible: false, baseRate: 0 },
  };
}

// move(world, pos, dir) -> MoveResult  (§4.1 locked signature)
function moverMove(world, pos, dir) {
  const delta = __MOVER_DELTAS[dir];
  const from = { r: pos.r, c: pos.c };
  if (!delta) return __moverBlocked(from, 'oob');

  const s = __moverStep(world.proj, from.r, from.c, delta[0], delta[1]);
  if (s.oob) return __moverBlocked(from, 'oob');

  const key = s.nr + ',' + s.nc;
  const blocked = !!(world.impassable && world.impassable.has(key));
  if (blocked) return __moverBlocked(from, 'sea');

  const destCodes = (world.cellCodes && world.cellCodes(s.nr, s.nc)) || [];
  const destKind = destCodes.length ? 'named' : 'empty';
  const terrain = world.terrainAt ? world.terrainAt(s.nr, s.nc) : null;
  const baseRate = (destKind === 'empty' && world.encounterRate) ? world.encounterRate(terrain) : 0;

  return {
    ok: true, reason: null,
    from, to: { r: s.nr, c: s.nc }, via: 'step',
    destCodes, destKind, terrain,
    encounter: { eligible: destKind === 'empty', baseRate },
  };
}
// ◆◆◆ MOVER:CORE:END ◆◆◆

if (typeof module === 'object' && module.exports) {
  module.exports = { move: moverMove, _step: __moverStep, _blocked: __moverBlocked };
}
