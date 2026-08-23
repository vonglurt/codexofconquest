#!/usr/bin/env node
// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson and Claude
// Copyright (c) 2026 Paul Richeson <paul@roll2hit.com> — Roll2Hit.com
// layout-solve.js — exact constraint-propagation grid layout for N/E/S/W networks
//
// Springs are wrong for orthogonal grids: they converge to ~1-unit off-axis
// because conflicting forces settle at a compromise rather than snapping to integers.
//
// This solver uses BFS constraint propagation instead:
//   N/S edge A→N→B:  B.row = A.row - rest,  B.col = A.col  (same column)
//   E/W edge A→E→B:  B.col = A.col + rest,  B.row = A.row  (same row)
//
// Each node gets exactly one position. If a second path arrives at a different
// position it is a STRUCTURAL CONFLICT — that edge needs an elbow. Everything
// else can be fixed by writing the computed coordinates; no elbows required.
//
// Usage:
//   node layout-solve.js [--port 1367] [--rest-city N] [--rest-junction N] [--apply] [--help]

'use strict';
const http = require('http');

// ─── Defaults ─────────────────────────────────────────────────────────────────
const REST = {
  city:     1,
  airport:  1,
  site:     1,
  junction: 2,
  default:  1,
};

const DIR = {
  N: { dr: -1, dc:  0, axis: 'r', sign: -1, opp: 'S' },
  S: { dr: +1, dc:  0, axis: 'r', sign: +1, opp: 'N' },
  E: { dr:  0, dc: +1, axis: 'c', sign: +1, opp: 'W' },
  W: { dr:  0, dc: -1, axis: 'c', sign: -1, opp: 'E' },
};

const HELP = `
layout-solve.js — Exact Constraint-Propagation Grid Layout
═══════════════════════════════════════════════════════════

WHY NOT SPRINGS?
  Springs settle 1–2 units off-axis because conflicting forces reach a
  compromise. With 118 bendy connections all ≤4 units off, the spring
  layout was actually quite good — just not snapped to integers.

  Constraint propagation instead BFS-assigns exact positions:
    N/S edge A→N→B  →  B.row = A.row − rest,  B.col = A.col
    E/W edge A→E→B  →  B.col = A.col + rest,  B.row = A.row

  Result: every reachable node gets a single precise integer position.
  A conflict (two paths give different positions) is a STRUCTURAL CONFLICT
  that genuinely needs an elbow junction — not a simulation artifact.

USAGE
  node layout-solve.js [options]

OPTIONS
  --port N           WBAPI port (default: 1367)
  --rest-city N      Rest distance for city/airport/site edges (default: 1)
  --rest-junction N  Rest distance for junction edges (default: 2)
  --apply            Write computed coords via POST /api/layout/apply
  --help             Show this help

OUTPUT
  {
    "placed":     { CODE: {r,c} },      -- coords for every consistent node
    "conflicts":  [...],                 -- structural conflicts needing elbows
    "elbows":     [...],                 -- elbow suggestions for each conflict
    "unplaced":   [...],                 -- disconnected nodes (no BFS path)
    "stats":      { ... }
  }

CONFLICT TYPES
  ROW_CONFLICT   Node reached by two paths with different row values.
                 Caused by an E/W edge connecting two different N/S chains
                 that are at different heights.
  COL_CONFLICT   Node reached by two paths with different col values.
                 Caused by a N/S edge connecting two different E/W chains
                 that are at different horizontal positions.

ELBOW PLACEMENT FOR CONFLICTS
  For each conflicting edge (A.dir→B), an elbow junction is placed at the
  axis intersection: (A.row, B.col) for EW-bendy or (B.row, A.col) for NS-bendy.
  The elbow converts one diagonal into two orthogonal legs.

WORKFLOW
  # 1. Dry run — see how many structural conflicts vs. coordinate-fixable
  node layout-solve.js | jq .stats

  # 2. Apply computed coords (fixes coordinate-fixable issues instantly)
  node layout-solve.js --apply

  # 3. For remaining conflicts, apply elbow suggestions
  node layout-solve.js | jq -r '.elbows[].apiCmds[]'

  # 4. After elbows, fill gaps > 4 with fill-gap
  curl http://localhost:1367/api/graph/broken | jq .categories
`;

// ─── HTTP helpers ─────────────────────────────────────────────────────────────
function apiGet(port, path) {
  return new Promise((resolve, reject) => {
    http.get({ host: '127.0.0.1', port, path }, res => {
      let buf = '';
      res.on('data', c => { buf += c; });
      res.on('end', () => { try { resolve(JSON.parse(buf)); } catch (e) { reject(e); } });
    }).on('error', reject);
  });
}

function apiPost(port, path, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const req = http.request({
      host: '127.0.0.1', port, path, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
    }, res => {
      let buf = '';
      res.on('data', c => { buf += c; });
      res.on('end', () => { try { resolve({ status: res.statusCode, body: JSON.parse(buf) }); } catch (e) { reject(e); } });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// ─── Edge rest distance ────────────────────────────────────────────────────────
function restFor(typeA, typeB, restCity, restJunction) {
  const isJunction = t => (t === 'junction');
  // If either endpoint is a junction, use junction rest (more space)
  return (isJunction(typeA) || isJunction(typeB)) ? restJunction : restCity;
}

// ─── Constraint propagation ───────────────────────────────────────────────────
// BFS from seedCode at seedR, seedC. Propagates exact integer positions.
//
// posMap: {r,c → code} — tracks which node owns each cell.
// When a DIFFERENT node arrives at an occupied cell, we nudge it to the nearest
// free adjacent cell and record a POSITION_CONFLICT so an elbow can be added.
function propagate(seedCode, seedR, seedC, nodeMap, pos, posMap, conflicts, restCity, restJunction) {
  const queue = [{ code: seedCode, r: seedR, c: seedC }];
  const NUDGE = [[0,1],[0,-1],[1,0],[-1,0],[1,1],[-1,-1],[1,-1],[-1,1],
                 [0,2],[2,0],[0,-2],[-2,0]];

  while (queue.length) {
    const { code, r, c } = queue.shift();
    const existing = pos[code];

    if (existing !== undefined) {
      // Same node reached again — check for position conflict
      if (existing.r !== r || existing.c !== c) {
        conflicts.push({
          type:        existing.r !== r ? 'ROW_CONFLICT' : 'COL_CONFLICT',
          node:        code,
          existingPos: { ...existing },
          proposedPos: { r, c },
          note:        `"${code}" reached by two paths: (${existing.r},${existing.c}) vs (${r},${c})`,
        });
      }
      continue;
    }

    // Check if target cell is occupied by a DIFFERENT node
    let finalR = r, finalC = c;
    const cellKey = `${r},${c}`;
    const occupier = posMap.get(cellKey);
    if (occupier && occupier !== code) {
      // Nudge to nearest free cell
      let nudged = false;
      for (const [dr, dc] of NUDGE) {
        const nr = r + dr, nc = c + dc;
        if (!posMap.has(`${nr},${nc}`)) {
          finalR = nr; finalC = nc;
          nudged = true;
          break;
        }
      }
      conflicts.push({
        type:     'POSITION_CONFLICT',
        node:     code,
        occupier,
        at:       { r, c },
        nudgedTo: nudged ? { r: finalR, c: finalC } : null,
        note:     `"${code}" and "${occupier}" both computed to (${r},${c}) — ${nudged ? `nudged to (${finalR},${finalC})` : 'no free cell found'}`,
      });
    }

    pos[code] = { r: finalR, c: finalC };
    posMap.set(`${finalR},${finalC}`, code);

    const n = nodeMap[code];
    for (const dir of ['N', 'E', 'S', 'W']) {
      const tgt = n[dir];
      if (!tgt || !nodeMap[tgt]) continue;

      const d   = DIR[dir];
      const rst = restFor(n.name || 'default', nodeMap[tgt].name || 'default', restCity, restJunction);

      const newR = d.axis === 'r' ? finalR + d.sign * rst : finalR;
      const newC = d.axis === 'c' ? finalC + d.sign * rst : finalC;

      queue.push({ code: tgt, r: newR, c: newC });
    }
  }
}

// ─── Normalize a single component's positions around a target origin ──────────
function shiftComponent(codes, pos, targetR, targetC) {
  if (!codes.length) return;
  const minR = Math.min(...codes.map(c => pos[c].r));
  const minC = Math.min(...codes.map(c => pos[c].c));
  const offR = targetR - minR;
  const offC = targetC - minC;
  for (const c of codes) {
    pos[c] = { r: pos[c].r + offR, c: pos[c].c + offC };
  }
}

// ─── Arrange disconnected components in a 2-D grid ───────────────────────────
// Primary component (largest) goes at top-left.
// Remaining components flow left-to-right then wrap downward.
function arrangeComponents(components, pos, gapR = 12, gapC = 20) {
  if (!components.length) return;

  // Sort by size descending (largest first)
  const sorted = components.slice().sort((a, b) => b.length - a.length);

  // Compute bounding box of each component
  function bbox(codes) {
    const rs = codes.map(c => pos[c].r);
    const cs = codes.map(c => pos[c].c);
    return { minR: Math.min(...rs), maxR: Math.max(...rs),
             minC: Math.min(...cs), maxC: Math.max(...cs) };
  }

  // Place main component at (8, 8)
  shiftComponent(sorted[0], pos, 8, 8);

  // Remaining components: pack in rows, wrapping when column > 400
  let cursorR = 8;
  let cursorC = bbox(sorted[0]).maxC + gapC;
  let rowMaxR = bbox(sorted[0]).maxR;

  for (let i = 1; i < sorted.length; i++) {
    const comp = sorted[i];
    const bb   = bbox(comp);
    const height = bb.maxR - bb.minR;
    const width  = bb.maxC - bb.minC;

    // Wrap to next row if too far right
    if (cursorC + width > 500) {
      cursorR = rowMaxR + gapR;
      cursorC = 8;
      rowMaxR = cursorR;
    }

    shiftComponent(comp, pos, cursorR, cursorC);
    const placed = bbox(comp);
    rowMaxR = Math.max(rowMaxR, placed.maxR);
    cursorC = placed.maxC + gapC;
  }
}

// ─── Signpost text generator ──────────────────────────────────────────────────
// Produces flavor text for a junction node that sits between two named places.
// terrain → rough monster / environment description used in the sign text.
const TERRAIN_SIGNS = {
  airport:  { env: 'open tarmac and wind-swept runways', monster: 'transit wolves and customs wraiths' },
  city:     { env: 'crowded streets and market squares',  monster: 'pickpockets and city wolves' },
  site:     { env: 'historic ruins and overgrown paths',  monster: 'site guardians and restless spirits' },
  junction: { env: 'crossroads and way-marker stones',    monster: 'highway bandits and road wraiths' },
  dungeon:  { env: 'dark tunnels and crumbling archways', monster: 'dungeon crawlers and cave beasts' },
  forest:   { env: 'dense woodland and mossy tracks',     monster: 'forest wolves and thorn sprites' },
  mountain: { env: 'rocky passes and thin air',           monster: 'mountain trolls and ice hawks' },
  sea:      { env: 'coastal cliffs and salt wind',        monster: 'sea wraiths and tidal crabs' },
  desert:   { env: 'scorched sand and shimmering heat',   monster: 'sand vipers and dust elementals' },
  default:  { env: 'open road and wild terrain',          monster: 'wandering beasts and road spirits' },
};

// Derive a road name from two place labels.
// Falls back to "The Road between A and B" if no obvious common name.
function roadName(labelA, labelB) {
  const clean = s => s.replace(/\s*(Airport|International|City|Town|Port)\s*/gi, '').replace(/^The\s+/i, '').trim();
  const a = clean(labelA || ''), b = clean(labelB || '');
  if (!a && !b) return 'The Road';
  if (!a) return `The ${b} Road`;
  if (!b) return `The ${a} Road`;
  return `The ${a}–${b} Road`;
}

function signpostText(labelA, labelB, terrain) {
  const signs = TERRAIN_SIGNS[terrain] || TERRAIN_SIGNS.default;
  const road  = roadName(labelA, labelB);
  return (
    `▲ ${road} ▲  ` +
    `You stand at a crossroads on ${signs.env}. ` +
    `${labelA || '(unknown)'} lies one way; ${labelB || '(unknown)'} the other. ` +
    `Beware of ${signs.monster} in this region — seasoned hunters find good sport nearby.`
  );
}

// ─── Terrain matcher ──────────────────────────────────────────────────────────
// Pick the terrain for the elbow junction based on the two connecting nodes.
// Priority: if both share a type, use it; otherwise prefer the non-junction type.
function elbowTerrain(typeA, typeB) {
  if (typeA === typeB) return typeA;
  if (typeA === 'junction') return typeB;
  if (typeB === 'junction') return typeA;
  // Both are non-junction but different — prefer city/airport hierarchy
  const rank = { city: 3, airport: 2, site: 1, junction: 0, default: 0 };
  return (rank[typeA] || 0) >= (rank[typeB] || 0) ? typeA : typeB;
}

// ─── Elbow suggestions ────────────────────────────────────────────────────────
function makeElbows(conflicts, pos, nodeMap, port) {
  const elbows = [];
  const seen   = new Set(); // avoid duplicate elbows for same edge
  let idx = 1;

  for (const conflict of conflicts) {
    const code = conflict.node;
    const n    = nodeMap[code];
    if (!n) continue;

    for (const dir of ['N', 'E', 'S', 'W']) {
      const tgt = n[dir]; if (!tgt || !nodeMap[tgt]) continue;
      const edgeKey = [code, tgt].sort().join('|');
      if (seen.has(edgeKey)) continue;

      const pa = pos[code];
      const pb = pos[tgt];
      if (!pa || !pb) continue;

      const d = DIR[dir];
      const isAxisAligned = d.axis === 'r' ? pa.c === pb.c : pa.r === pb.r;
      if (isAxisAligned) continue;

      seen.add(edgeKey);

      // Compute elbow position at the axis intersection
      let elbR, elbC, fwdDir;
      if (d.axis === 'r') {
        // N/S edge is bendy: elbow at (pb.r, pa.c), then E/W leg to B
        elbR = pb.r; elbC = pa.c;
        fwdDir = pb.c > elbC ? 'E' : 'W';
      } else {
        // E/W edge is bendy: elbow at (pa.r, pb.c), then N/S leg to B
        elbR = pa.r; elbC = pb.c;
        fwdDir = pb.r < elbR ? 'N' : 'S';
      }

      const backDir = DIR[dir].opp;
      const nA      = nodeMap[code];
      const nB      = nodeMap[tgt];
      const terrain = elbowTerrain(nA?.name || 'junction', nB?.name || 'junction');
      const labelA  = nA?.label || code;
      const labelB  = nB?.label || tgt;
      const elbCode = `ELB${String(idx++).padStart(3, '0')}`;
      const legA    = d.axis === 'r' ? Math.abs(elbR - pa.r) : Math.abs(elbC - pa.c);
      const legB    = d.axis === 'r' ? Math.abs(pb.c - elbC) : Math.abs(pb.r - elbR);
      const text    = signpostText(labelA, labelB, terrain);

      elbows.push({
        code:      elbCode,
        r:         elbR,
        c:         elbC,
        terrain,                      // matched from connecting nodes
        label:     `${labelA} ↔ ${labelB} Junction`,
        text,
        fixesEdge: `${code}.${dir}→${tgt}`,
        connect:   { [backDir]: code, [fwdDir]: tgt },
        legA, legB,
        warnings: [
          ...(Math.max(legA, legB) > 4 ? ['One or both legs > 4 — use fill-gap after inserting'] : []),
        ],
        // Convenience API commands
        apiCmds: [
          `curl -sX POST http://127.0.0.1:${port}/api/node \\`,
          `  -H 'Content-Type: application/json' \\`,
          `  -d '{"code":"${elbCode}","name":"${terrain}","label":"${labelA} ↔ ${labelB} Junction",` +
            `"text":${JSON.stringify(text)},"junction":true,` +
            `"${backDir}":"${code}","${fwdDir}":"${tgt}","r":${elbR},"c":${elbC}}'`,
          `curl -sX PUT http://127.0.0.1:${port}/api/node/${code} \\`,
          `  -H 'Content-Type: application/json' -d '{"${dir}":"${elbCode}"}'`,
          `curl -sX PUT http://127.0.0.1:${port}/api/node/${tgt} \\`,
          `  -H 'Content-Type: application/json' -d '{"${DIR[fwdDir].opp}":"${elbCode}"}'`,
        ],
      });
    }
  }

  return elbows;
}

// ─── Validate placed positions ────────────────────────────────────────────────
function validate(nodeMap, pos) {
  const issues = [];
  const posMap = {};
  for (const [code, p] of Object.entries(pos)) {
    const key = `${p.r},${p.c}`;
    if (posMap[key]) issues.push({ type: 'COLLISION', nodes: [code, posMap[key]] });
    else posMap[key] = code;
  }
  const seen = new Set();
  for (const [aC, n] of Object.entries(nodeMap)) {
    for (const dir of ['N', 'E', 'S', 'W']) {
      const bC = n[dir]; if (!bC || !nodeMap[bC]) continue;
      const key = [aC, bC].sort().join('|');
      if (seen.has(key)) continue; seen.add(key);
      const pa = pos[aC], pb = pos[bC];
      if (!pa || !pb) continue;
      const d = DIR[dir];
      const axisDist  = d.axis === 'r' ? Math.abs(pb.r - pa.r) : Math.abs(pb.c - pa.c);
      const crossDist = d.axis === 'r' ? Math.abs(pb.c - pa.c) : Math.abs(pb.r - pa.r);
      if (crossDist > 0) issues.push({ type: d.axis === 'r' ? 'BENDY_NS' : 'BENDY_EW',
        edge: `${aC}.${dir}→${bC}`, crossOff: crossDist });
      if (axisDist < 1 || axisDist > 4) issues.push({ type: 'RANGE_VIOL',
        edge: `${aC}.${dir}→${bC}`, dist: axisDist });
    }
  }
  return issues;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const argv = process.argv.slice(2);
  if (argv.includes('--help') || argv.includes('-h')) { console.log(HELP); process.exit(0); }

  const getNum = (f, def) => { const i = argv.indexOf(f); return i >= 0 && argv[i+1] ? +argv[i+1] : def; };
  const port          = getNum('--port', 1367);
  const restCity      = getNum('--rest-city', 1);
  const restJunction  = getNum('--rest-junction', 2);
  const apply         = argv.includes('--apply');
  const insertElbows  = argv.includes('--insert-elbows');

  const log = s => process.stderr.write(`[layout-solve] ${s}\n`);

  log(`port=${port} rest-city=${restCity} rest-junction=${restJunction} apply=${apply}`);

  // 1. Fetch data
  let nodeMapData, coordData;
  try {
    const [expRes, crdRes] = await Promise.all([
      apiGet(port, '/api/export/node_map?format=json'),
      apiGet(port, '/api/coords'),
    ]);
    nodeMapData = expRes.data || {};
    coordData   = crdRes.coords || {};
  } catch (e) {
    log(`ERROR: ${e.message}`);
    process.exit(1);
  }

  const allCodes = Object.keys(nodeMapData);
  log(`${allCodes.length} nodes, ${Object.keys(coordData).length} with existing coords`);

  // 2. BFS constraint propagation
  // Find the most-connected node as root
  const degree = c => ['N','E','S','W'].filter(d => nodeMapData[c]?.[d] && nodeMapData[nodeMapData[c][d]]).length;
  const root   = allCodes.reduce((b, c) => degree(c) > degree(b) ? c : b, allCodes[0]);

  const pos       = {};   // {code: {r,c}}
  const conflicts = [];   // structural conflicts

  // Propagate from root at (0,0) — we'll normalise later
  log(`Root: ${root} (degree ${degree(root)})`);

  // Propagate each connected component separately, tracking which codes belong to each.
  const components = [];  // [[code, ...], ...]
  const posMap = new Map(); // {r,c → code} for collision detection within each component

  for (const startCode of allCodes) {
    if (pos[startCode] !== undefined) continue;
    const before = new Set(Object.keys(pos));
    // Each component starts fresh at (0,0) with its own posMap
    const compPosMap = new Map();
    propagate(startCode, 0, 0, nodeMapData, pos, compPosMap, conflicts, restCity, restJunction);
    const compCodes = Object.keys(pos).filter(c => !before.has(c));
    if (compCodes.length) components.push(compCodes);
  }

  const componentCount = components.length;
  if (componentCount > 1) log(`${componentCount} disconnected components — arranging in 2-D grid`);

  // 3. Arrange components in a 2-D grid (largest first, orphans packed small)
  arrangeComponents(components, pos, 12, 20);

  const normPos = pos; // arrangeComponents already shifted everything

  // 4. Validate
  const issues = validate(nodeMapData, normPos);

  // 5. Make elbow suggestions for structural conflicts
  const elbows = makeElbows(conflicts, normPos, nodeMapData, port);

  // 6. Which nodes are unplaced (shouldn't happen after above BFS)
  const unplaced = allCodes.filter(c => normPos[c] === undefined);

  // 7. Stats
  const countIssue = t => issues.filter(i => i.type === t).length;
  const orphans    = allCodes.filter(c => ['N','E','S','W'].every(d => !nodeMapData[c]?.[d])).length;
  const maxR = Math.max(...Object.values(normPos).map(p => p.r));
  const maxC = Math.max(...Object.values(normPos).map(p => p.c));

  const stats = {
    nodes:             allCodes.length,
    placed:            Object.keys(normPos).length,
    unplaced:          unplaced.length,
    disconnectedComponents: componentCount,
    structural_conflicts:   conflicts.length,
    elbows_needed:          elbows.length,
    validation_bendy_ew:    countIssue('BENDY_EW'),
    validation_bendy_ns:    countIssue('BENDY_NS'),
    validation_range_viol:  countIssue('RANGE_VIOL'),
    validation_collisions:  countIssue('COLLISION'),
    orphans,
    grid_span:         `${maxR}r × ${maxC}c`,
    rest_city:         restCity,
    rest_junction:     restJunction,
  };

  const output = { ok: true, stats, conflicts, elbows, issues, unplaced, placed: normPos };
  process.stdout.write(JSON.stringify(output, null, 2) + '\n');

  // Summary log
  log('─'.repeat(60));
  log(`Structural conflicts: ${conflicts.length} (need elbows)`);
  log(`Validation: ${stats.validation_bendy_ew} BENDY_EW  ${stats.validation_bendy_ns} BENDY_NS  ${stats.validation_range_viol} RANGE_VIOL  ${stats.validation_collisions} COLLISION`);
  log(`Grid: ${stats.grid_span}  (rest-city=${restCity} rest-junction=${restJunction})`);

  // 8. Apply
  if (apply) {
    log(`Applying ${Object.keys(normPos).length} coords...`);
    try {
      const r = await apiPost(port, '/api/layout/apply', { coords: normPos });
      log(`Apply: HTTP ${r.status} — ${r.body?.ok ? 'OK' : JSON.stringify(r.body).slice(0, 120)}`);
    } catch (e) {
      log(`Apply failed: ${e.message}`);
    }
  } else {
    log('Dry run — add --apply to write coords, --insert-elbows to create junction nodes');
  }

  // 9. Auto-insert elbow junction nodes
  if (insertElbows && elbows.length) {
    log(`Inserting ${elbows.length} elbow junction nodes with matched terrain...`);
    let ok = 0, fail = 0;
    for (const elb of elbows) {
      try {
        // Create the node (POST /api/node accepts r,c for simultaneous coord write)
        // Infer act from connecting nodes (use max of the two)
        const connCodes = Object.values(elb.connect);
        const actA = nodeMapData[connCodes[0]]?.act || 1;
        const actB = nodeMapData[connCodes[1]]?.act || 1;
        const act  = Math.max(actA, actB);

        const nodeBody = {
          code:     elb.code,
          name:     elb.terrain,
          label:    elb.label,
          text:     elb.text,
          act,
          junction: true,
          ...elb.connect,
          r: elb.r,
          c: elb.c,
        };
        const cr = await apiPost(port, '/api/node', nodeBody);
        if (cr.status >= 400) {
          log(`  WARN ${elb.code}: HTTP ${cr.status} — ${JSON.stringify(cr.body).slice(0, 80)}`);
          fail++;
          continue;
        }

        // Patch the two connecting nodes to point to the elbow.
        // connect = { elbDir: connCode } — the direction FROM elbow TO that node.
        // From connCode's perspective, elbow is in the OPPOSITE direction.
        for (const [elbDir, connCode] of Object.entries(elb.connect)) {
          const connField = DIR[elbDir].opp; // e.g. elbow.S=LLA → LLA.N = elbCode
          await apiPost(port, `/api/node/${connCode}`, { [connField]: elb.code });
        }

        log(`  ✓ ${elb.code} [${elb.terrain}] "${elb.label}" at (${elb.r},${elb.c}) fixes ${elb.fixesEdge}`);
        if (elb.warnings.length) log(`    WARN: ${elb.warnings[0]}`);
        ok++;
      } catch (e) {
        log(`  ERROR ${elb.code}: ${e.message}`);
        fail++;
      }
    }
    log(`Elbow insertion: ${ok} created, ${fail} failed`);
    if (ok && !apply) {
      log('NOTE: coord file not updated for new elbows — run with --apply to write NODE_COORDS');
    }
  }
}

main().catch(e => {
  process.stderr.write(`[layout-solve] Fatal: ${e.message}\n${e.stack}\n`);
  process.exit(1);
});
