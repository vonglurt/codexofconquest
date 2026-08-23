// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson and Claude
'use strict';
// rooms.js — §NAV-01c unified room-description kernel: the single source of
// "what does this cell look like" shared by the SP client (inlined into
// index.html) and the MUD server (require('./rooms'), §NAV-01f).
// PURE: no DOM, no SSE, no Math.random (prose variants are picked by a
// deterministic per-cell hash so client, server, and tests always agree).
//
// The region between the ROOMS:CORE sentinels is inlined BYTE-IDENTICALLY into
// index.html; scripts/check-rooms-parity.js asserts the two copies match.
// Do not edit one copy without the other.
//
// world (read-only snapshot — the mover world of §4.1 plus room lookups):
//   { proj:{ROWS,COLS},            // §2.1 equirectangular 1° — 360 cols × 90 rows
//     impassable,                  // Set "r,c"  (sea minus lanes)
//     cellCodes:(r,c)=>string[],   // locale list at a cell ([] = empty)
//     terrainAt:(r,c)=>key,        // terrain at a cell (sea-lane→ocean, road→road)
//     roadCells,                   // Set "r,c"  — §NAV-01b ROAD_CELLS
//     laneCells,                   // Set "r,c"  — SEA_LANES
//     nodeLabel:(code)=>string,    // display label for a node code
//     terrainInfo:(key)=>{label,icon} }  // WORLD_DB lookup w/ fallback
// pos: {r,c}  ->  Room (a description; caller renders it):
//   { icon, title, sub, terrain, prose,
//     exits:[{dir,kind:'node'|'road'|'lane'|'terrain'|'blocked',label,hint,steps}],
//     signposts:[string], landmarks:[{code,label,steps,dir}] }

// ◆◆◆ ROOMS:CORE:START ◆◆◆
const __ROOM_DIRS = { N: [-1, 0], S: [1, 0], E: [0, 1], W: [0, -1] };
const __ROOM_DIRWORD = { N: 'north', S: 'south', E: 'east', W: 'west' };

// Deterministic per-cell hash — prose must be identical across client/server/tests.
function __roomHash(r, c) {
  let h = ((r * 73856093) ^ (c * 19349663)) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 0x5bd1e995) >>> 0;
  return (h ^ (h >>> 15)) >>> 0;
}

// Same topology as the mover kernel: rows clamp at the band edges, cols wrap E↔W.
function __roomStep(proj, r, c, dr, dc) {
  const nr = r + dr;
  const nc = (((c + dc) % proj.COLS) + proj.COLS) % proj.COLS;
  return { nr, nc, oob: nr < 0 || nr >= proj.ROWS };
}

// Display labels are often "Name — Epithet"; signage wants just the name.
function __roomShortLabel(label) { return String(label).split(' — ')[0]; }

// Per-terrain prose variants ({label} is substituted with the terrain's display
// label, so the _default set reads sensibly for all 60+ terrain keys).
const __ROOM_PROSE = {
  road: [
    'The old highway runs straight and sure here, its stones worn smooth by centuries of boots and cartwheels.',
    'A paved road cuts through the country, verges cropped short, milestones squatting in the grass like patient toads.',
    'The road is quiet. Wind, wheel-ruts, and the far-off smell of someone else\'s cooking fire.',
    'Flagstones underfoot — the highway holds its line across the land, and nothing on it means you harm.',
  ],
  ocean: [
    'Open water. The lane holds — a channel of slack sea where the ferrymen swear the crossing is honest.',
    'Grey swell on either side. You follow the sea-lane, and the sea, for now, permits it.',
    'Salt spray and gull-cry. The crossing runs true; land is a rumor in the haze ahead.',
  ],
  midlands: [
    'Rolling open country — hedgerows, larks, and a horizon that promises more of the same.',
    'Grassland stretches out, seamed with old field-walls no one has claimed in a generation.',
    'A wide green nowhere. Good walking, no shelter, and the sky watching everything.',
    'Meadow and thistle. Somewhere far off a dog barks twice, then thinks better of it.',
  ],
  forest: [
    'The trees close in — resin, birdsong, and a green light that keeps its own counsel.',
    'Old forest. Roots ridge the ground like knuckles, and the canopy swallows the sky whole.',
    'Deadfall and fern. Every hundred paces something small stops moving until you pass.',
  ],
  highlands: [
    'The land tilts upward — scree, heather, and wind with an opinion.',
    'High country. Stone shoulders through thin turf, and the cold arrives before the view does.',
    'A ridge line staggers on ahead. The valleys below hold their mist like a grudge.',
  ],
  swamp: [
    'The ground goes soft and dishonest. Black water pools in every low place.',
    'Reed and rot. Each step makes a sound like the marsh tasting you.',
    'Mosquito haze over standing water. Whatever path there was is a matter of faith now.',
  ],
  hag_swamp: [
    'The marsh here is wrong — the water too still, the reeds bent as if listening.',
    'Rag-strips knotted in the willows. Someone marks territory here, and it is not the birds.',
  ],
  desert: [
    'Sand and shale under a flat, punishing sky. Distances lie to you here.',
    'The dunes keep their silence. Your shadow is the only companion that stays.',
    'Heat shimmer bends the horizon. Somewhere beneath the grit, an older road sleeps.',
  ],
  jungle: [
    'Green walls on every side — vines, wet heat, and the constant argument of unseen birds.',
    'The undergrowth fights for every yard. Something bright and venomous watches from a leaf.',
  ],
  beach: [
    'Hard wet sand and wrack-line salvage. The tide keeps its ledger either way.',
    'Dune grass and driftwood. The sea worries the shore like it forgot something here.',
  ],
  city: [
    'Outskirts — kitchen gardens, wash-lines, and walls close enough to smell the smoke.',
    'The traffic thickens: handcarts, gossip, and the particular mud of a town\'s doorstep.',
  ],
  city_slums: [
    'Lean-tos and patched tarpaulin. The city\'s shadow is longer than its walls.',
    'Narrow tracks between shanties. Eyes count your gear from doorways without doors.',
  ],
  alley: [
    'A pinched back-way between walls, all puddles and painted-over warnings.',
    'The alley smells of cats and old arguments. Keep your purse on the inside.',
  ],
  _default: [
    'The land here answers to {label}. The path continues, and the country keeps its thoughts to itself.',
    '{label}, mile after mile of it. No signpost claims this ground, but the walking is fair.',
    'Open country in the manner of {label}. Nothing marks this place except your passing through it.',
  ],
};

// Follow the road/lane net from the neighbour cell in `dir` to the nearest named
// cell (BFS constrained to road∪lane∪named cells, never back through the origin).
// Returns {code, steps} or null. Deterministic: FIFO BFS, N/S/E/W expansion order.
function __roadDestination(world, pos, dir, maxSteps) {
  const d0 = __ROOM_DIRS[dir];
  if (!d0) return null;
  const s0 = __roomStep(world.proj, pos.r, pos.c, d0[0], d0[1]);
  if (s0.oob) return null;
  const originKey = pos.r + ',' + pos.c;
  const startKey = s0.nr + ',' + s0.nc;
  const onNet = (k, r, c) => world.roadCells.has(k) || world.laneCells.has(k) ||
                             (world.cellCodes(r, c) || []).length > 0;
  if (!onNet(startKey, s0.nr, s0.nc)) return null;
  const seen = new Set([originKey, startKey]);
  let frontier = [[s0.nr, s0.nc]];
  for (let steps = 1; steps <= (maxSteps || 40) && frontier.length; steps++) {
    const next = [];
    for (const [r, c] of frontier) {
      const codes = world.cellCodes(r, c) || [];
      if (codes.length) return { code: codes[0], steps };
      for (const dk of ['N', 'S', 'E', 'W']) {
        const dd = __ROOM_DIRS[dk];
        const s = __roomStep(world.proj, r, c, dd[0], dd[1]);
        if (s.oob) continue;
        const k = s.nr + ',' + s.nc;
        if (seen.has(k) || world.impassable.has(k) || !onNet(k, s.nr, s.nc)) continue;
        seen.add(k);
        next.push([s.nr, s.nc]);
      }
    }
    frontier = next;
  }
  return null;
}

// Nearest named cells over open ground (BFS over passable cells, radius maxR).
// Each: {code, steps, dir} where dir is the first step taken from the origin.
// Deterministic: results sorted by (steps, code), truncated to maxN.
function __nearestLandmarks(world, pos, maxR, maxN) {
  const found = [];
  const seen = new Set([pos.r + ',' + pos.c]);
  let frontier = [];
  for (const dk of ['N', 'S', 'E', 'W']) {
    const dd = __ROOM_DIRS[dk];
    const s = __roomStep(world.proj, pos.r, pos.c, dd[0], dd[1]);
    if (s.oob) continue;
    const k = s.nr + ',' + s.nc;
    if (world.impassable.has(k)) continue;
    seen.add(k);
    frontier.push([s.nr, s.nc, dk]);
  }
  for (let steps = 1; steps <= (maxR || 12) && frontier.length; steps++) {
    const next = [];
    for (const [r, c, dir0] of frontier) {
      const codes = world.cellCodes(r, c) || [];
      if (codes.length) { found.push({ code: codes[0], steps, dir: dir0 }); continue; }
      for (const dk of ['N', 'S', 'E', 'W']) {
        const dd = __ROOM_DIRS[dk];
        const s = __roomStep(world.proj, r, c, dd[0], dd[1]);
        if (s.oob) continue;
        const k = s.nr + ',' + s.nc;
        if (seen.has(k) || world.impassable.has(k)) continue;
        seen.add(k);
        next.push([s.nr, s.nc, dir0]);
      }
    }
    frontier = next;
  }
  found.sort((a, b) => a.steps - b.steps || (a.code < b.code ? -1 : 1));
  return found.slice(0, maxN || 3);
}

// describeCell(world, pos) -> Room  (§NAV-01c locked signature)
function describeCell(world, pos) {
  const r = pos.r, c = pos.c;
  const key = r + ',' + c;
  const codes = world.cellCodes(r, c) || [];
  const terrain = world.terrainAt(r, c);
  const info = world.terrainInfo(terrain);

  // exits — one per compass direction, kernel topology
  const exits = [];
  for (const dk of ['N', 'S', 'E', 'W']) {
    const dd = __ROOM_DIRS[dk];
    const s = __roomStep(world.proj, r, c, dd[0], dd[1]);
    if (s.oob) { exits.push({ dir: dk, kind: 'blocked', label: 'the edge of the known world', hint: null, steps: null }); continue; }
    const nk = s.nr + ',' + s.nc;
    if (world.impassable.has(nk)) { exits.push({ dir: dk, kind: 'blocked', label: 'open sea', hint: null, steps: null }); continue; }
    const nCodes = world.cellCodes(s.nr, s.nc) || [];
    if (nCodes.length) {
      exits.push({ dir: dk, kind: 'node', label: world.nodeLabel(nCodes[0]), hint: null, steps: 1 });
    } else if (world.roadCells.has(nk) || world.laneCells.has(nk)) {
      const kind = world.roadCells.has(nk) ? 'road' : 'lane';
      const dest = __roadDestination(world, pos, dk, 40);
      const word = kind === 'lane' ? 'sea-lane' : 'road';
      exits.push({
        dir: dk, kind,
        label: word,
        hint: dest ? 'toward ' + __roomShortLabel(world.nodeLabel(dest.code)) + ' (' + dest.steps + ')' : 'an unmarked stretch',
        steps: dest ? dest.steps : null,
      });
    } else {
      exits.push({ dir: dk, kind: 'terrain', label: world.terrainInfo(world.terrainAt(s.nr, s.nc)).label, hint: null, steps: null });
    }
  }

  // signposts — road/lane signage first; falls back to the nearest landmark
  const signposts = [];
  for (const e of exits) {
    if ((e.kind === 'road' || e.kind === 'lane') && e.steps != null) {
      const word = e.kind === 'lane' ? 'sea-lane' : 'road';
      signposts.push('The ' + word + ' runs ' + __ROOM_DIRWORD[e.dir] + ' ' + e.hint + '.');
    }
  }
  const landmarks = __nearestLandmarks(world, pos, 12, 3);
  if (!signposts.length && landmarks.length) {
    const lm = landmarks[0];
    signposts.push(__roomShortLabel(world.nodeLabel(lm.code)) + ' lies ' + lm.steps +
      (lm.steps === 1 ? ' step ' : ' steps ') + __ROOM_DIRWORD[lm.dir] + ' of here.');
  }

  // prose — deterministic variant, {label} substituted
  const variants = __ROOM_PROSE[terrain] || __ROOM_PROSE._default;
  const prose = variants[__roomHash(r, c) % variants.length].replace(/\{label\}/g, info.label);

  // title/sub — named cells title by primary node; empty cells by terrain,
  // located relative to the nearest landmark (replaces the raw Row/Col line)
  let title, sub;
  if (codes.length) {
    title = world.nodeLabel(codes[0]);
    sub = codes.length > 1 ? codes.length + ' locales share this ground' : info.label;
  } else {
    title = info.label;
    sub = landmarks.length
      ? 'Near ' + __roomShortLabel(world.nodeLabel(landmarks[0].code)) + ' · ' + r + ',' + c
      : 'Deep wilderness · ' + r + ',' + c;
  }

  return { icon: info.icon, title, sub, terrain, prose, exits, signposts, landmarks };
}
// ◆◆◆ ROOMS:CORE:END ◆◆◆

if (typeof module === 'object' && module.exports) {
  module.exports = {
    describeCell,
    _hash: __roomHash,
    _roadDestination: __roadDestination,
    _nearestLandmarks: __nearestLandmarks,
    _prose: __ROOM_PROSE,
  };
}
