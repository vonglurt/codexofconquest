#!/usr/bin/env node
// worldmap.js — terminal world map of major cities + geographic coordinate seeding
//
// Draws an ASCII map of the game world oriented by real-world lat/long,
// then optionally seeds NODE_COORDS so layout-solve starts from geography.
//
// Usage:
//   node worldmap.js                  — print terminal map
//   node worldmap.js --latlon         — add lat/lon column to list
//   node worldmap.js --seed           — apply geo-seeded coords via WBAPI
//   node worldmap.js --seed --dry-run — preview seed coords without applying
//   node worldmap.js --port 1367

'use strict';
const http = require('http');

// ─── Geographic reference data ────────────────────────────────────────────────
// lat/lon are real-world approximate positions for each game city.
// Groups are listed roughly west→east, north→south.
const GEO = {
  // Iceland / Far North
  HHL: { lat: 65.0, lon:-22.0, label: 'Herdholt',        region: 'Iceland' },

  // Scandinavia
  NID: { lat: 63.4, lon: 10.4, label: 'Nidaros',         region: 'Norway' },
  LYG: { lat: 62.0, lon:  9.0, label: 'Lyngvi Hall',     region: 'Norway' },
  ODD: { lat: 60.0, lon: 11.0, label: "Oddrun's Estate", region: 'Norway' },
  SIG: { lat: 59.5, lon: 11.5, label: "Siggeir's Hall",  region: 'Scandinavia' },
  LHR: { lat: 59.3, lon: 17.6, label: 'Birka',           region: 'Sweden' },
  HEO: { lat: 55.6, lon: 11.9, label: 'Lejre',           region: 'Denmark' },

  // British Isles
  GLA: { lat: 55.9, lon: -4.3, label: 'Glasgow',         region: 'Scotland' },
  EDI: { lat: 55.9, lon: -3.2, label: 'Edinburgh',       region: 'Scotland' },
  YRK: { lat: 53.9, lon: -1.1, label: 'York',            region: 'England' },
  GWN: { lat: 53.2, lon: -4.0, label: 'Gwynedd',         region: 'Wales' },
  MGL: { lat: 53.1, lon: -3.8, label: 'Deganwy',         region: 'Wales' },
  SHF: { lat: 52.9, lon: -1.2, label: 'Nottingham',      region: 'England' },
  HVY: { lat: 52.0, lon: -3.0, label: "Heveydd's Court", region: 'Wales' },
  HFD: { lat: 52.1, lon: -2.7, label: 'Hereford',        region: 'England' },
  LDN: { lat: 51.5, lon: -0.1, label: 'London (White Hill)', region:'England' },
  LON: { lat: 51.5, lon: -0.3, label: 'London (Chancellor)', region:'England' },
  BRK: { lat: 51.5, lon: -0.2, label: 'British Royal Ct',region: 'England' },
  MSE: { lat: 51.3, lon:  1.1, label: 'Canterbury',      region: 'England' },
  ACT: { lat: 50.6, lon: -4.7, label: "Arthur's Court",  region: 'England' },

  // France / Iberia
  CVP: { lat: 38.7, lon: -9.1, label: 'Lisbon',          region: 'Portugal' },
  BDX: { lat: 44.8, lon: -0.6, label: 'Bordeaux',        region: 'France' },
  SRL: { lat: 44.7, lon:  1.1, label: 'Beaulieu-en-Périgord', region:'France' },
  FRK: { lat: 48.9, lon:  2.3, label: 'Paris',           region: 'France' },
  MTP: { lat: 43.6, lon:  3.9, label: 'Montpellier',     region: 'France' },
  AVG: { lat: 43.9, lon:  4.8, label: 'Avignon',         region: 'France' },
  MAR: { lat: 43.3, lon:  5.4, label: 'Marseille',       region: 'France' },

  // Germany / Central Europe
  KOL: { lat: 50.9, lon:  6.9, label: 'Cologne',         region: 'Germany' },
  WOR: { lat: 49.6, lon:  8.4, label: 'Worms',           region: 'Germany' },
  REG: { lat: 49.0, lon: 12.1, label: 'Regensburg',      region: 'Germany' },
  SAL: { lat: 44.6, lon:  7.5, label: 'Saluzzo',         region: 'N Italy' },
  BDA: { lat: 47.5, lon: 19.0, label: 'Buda',            region: 'Hungary' },
  ETZ: { lat: 47.3, lon: 19.2, label: "Etzel's Court",   region: 'Hungary' },
  KRK: { lat: 50.1, lon: 19.9, label: 'Kraków',          region: 'Poland' },

  // Italy
  VEN: { lat: 45.4, lon: 12.3, label: 'Venice',          region: 'Italy' },
  FRR: { lat: 44.8, lon: 11.6, label: 'Ferrara',         region: 'Italy' },
  BOL: { lat: 44.5, lon: 11.3, label: 'Bologna',         region: 'Italy' },
  PRA: { lat: 43.9, lon: 11.1, label: 'Prato',           region: 'Italy' },
  PIS: { lat: 43.8, lon: 10.9, label: 'Pistoia',         region: 'Italy' },
  PSA: { lat: 43.7, lon: 10.4, label: 'Florence/Pisa',   region: 'Italy' },
  AOI: { lat: 43.6, lon: 13.5, label: 'Ancona',          region: 'Italy' },
  ROM: { lat: 41.9, lon: 12.5, label: 'Rome',            region: 'Italy' },
  SAU: { lat: 41.8, lon: 12.6, label: 'Appian Way',      region: 'Italy' },
  BAR: { lat: 41.1, lon: 16.9, label: 'Bari',            region: 'Italy' },
  PAR: { lat: 38.1, lon: 13.4, label: 'Palermo',         region: 'Sicily' },

  // Eastern Europe / Balkans
  BIS: { lat: 47.1, lon: 24.5, label: 'Bistritz',        region: 'Romania' },
  KLZ: { lat: 46.8, lon: 23.6, label: 'Klausenburg',     region: 'Romania' },
  SIB: { lat: 45.8, lon: 24.2, label: 'Sibiu',           region: 'Romania' },
  VAR: { lat: 43.2, lon: 27.9, label: 'Varna',           region: 'Bulgaria' },

  // Greece / Aegean
  THA: { lat: 40.6, lon: 22.9, label: 'Thessaloniki',    region: 'Greece' },
  LMO: { lat: 40.5, lon: 23.0, label: 'Thessaloniki Mon.',region: 'Greece' },
  PHC: { lat: 39.6, lon: 19.9, label: 'Phaeacia',        region: 'Greece (Corfu)' },
  ITH: { lat: 38.4, lon: 20.7, label: 'Ithaca',          region: 'Greece' },
  ORC: { lat: 38.5, lon: 22.9, label: 'Orchomenos',      region: 'Greece' },
  MYS: { lat: 37.1, lon: 22.4, label: 'Mystras',         region: 'Greece' },
  MSN: { lat: 36.9, lon: 21.7, label: 'Messenia',        region: 'Greece' },

  // Turkey / Anatolia
  CON: { lat: 41.0, lon: 28.9, label: 'Constantinople',  region: 'Turkey' },
  VRG: { lat: 41.1, lon: 28.8, label: 'Varangian Barr.', region: 'Turkey' },
  BTR: { lat: 41.0, lon: 29.1, label: 'Bosphorus',       region: 'Turkey' },
  BUR: { lat: 40.2, lon: 29.1, label: 'Bursa',           region: 'Turkey' },
  SIN: { lat: 42.0, lon: 35.2, label: 'Sinope',          region: 'Turkey' },
  TRB: { lat: 41.0, lon: 39.7, label: 'Trebizond',       region: 'Turkey' },
  ANT: { lat: 36.2, lon: 36.2, label: 'Antioch',         region: 'Turkey/Syria' },
  ALP: { lat: 36.2, lon: 37.2, label: 'Aleppo',          region: 'Syria' },
  ALB: { lat: 36.4, lon: 37.0, label: 'Aleppo Hills',    region: 'Syria' },

  // Middle East / Levant
  JAR: { lat: 31.8, lon: 35.2, label: 'Jerusalem',       region: 'Palestine' },
  OLN: { lat: 31.7, lon: 35.3, label: 'Jerusalem Inner', region: 'Palestine' },
  BGD: { lat: 33.3, lon: 44.4, label: 'Baghdad',         region: 'Iraq' },

  // North Africa
  TUN: { lat: 36.8, lon: 10.2, label: 'Tunis',           region: 'Tunisia' },

  // Caucasus / Persia
  GNJ: { lat: 40.7, lon: 46.3, label: 'Ganja',           region: 'Azerbaijan' },
  TBZ: { lat: 38.1, lon: 46.3, label: 'Tabriz',          region: 'Iran' },
  MRG: { lat: 37.4, lon: 46.5, label: 'Maragha',         region: 'Iran' },
  NIS: { lat: 36.2, lon: 58.8, label: 'Nishapur',        region: 'Iran' },

  // Central Asia
  MRV: { lat: 37.7, lon: 62.2, label: 'Merv',            region: 'Turkmenistan' },
  SAM: { lat: 39.6, lon: 66.9, label: 'Samarkand',       region: 'Uzbekistan' },

  // East Africa
  MLN: { lat: -3.2, lon: 40.1, label: 'Malindi',         region: 'Kenya' },
};

// ─── Map projection bounds ────────────────────────────────────────────────────
const MAP = {
  minLat: -8,
  maxLat: 68,
  minLon: -25,
  maxLon: 72,
  // Terminal display size
  WIDTH:  96,
  HEIGHT: 30,
};

function project(lat, lon) {
  const c = Math.round((lon - MAP.minLon) / (MAP.maxLon - MAP.minLon) * (MAP.WIDTH - 1));
  const r = Math.round((MAP.maxLat - lat) / (MAP.maxLat - MAP.minLat) * (MAP.HEIGHT - 1));
  return { r, c };
}

// ─── HTTP helpers ─────────────────────────────────────────────────────────────
function apiGet(port, path) {
  return new Promise((resolve, reject) => {
    http.get({ host: '127.0.0.1', port, path }, res => {
      let buf = '';
      res.on('data', c => { buf += c; });
      res.on('end', () => { try { resolve(JSON.parse(buf)); } catch(e) { reject(e); } });
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
      res.on('end', () => { try { resolve({ status: res.statusCode, body: JSON.parse(buf) }); } catch(e) { reject(e); } });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// ─── Terminal map ─────────────────────────────────────────────────────────────
function drawMap() {
  const W = MAP.WIDTH, H = MAP.HEIGHT;

  // Empty grid
  const grid = Array.from({ length: H }, () => Array(W).fill(' '));

  // Place rough continent outlines (simplified dot markers)
  // Just leave ocean as space — cities will be the only markers.
  // Add lat/lon grid lines every ~15°
  for (let lat = MAP.minLat; lat <= MAP.maxLat; lat += 15) {
    const { r } = project(lat, MAP.minLon);
    if (r >= 0 && r < H) {
      for (let c = 0; c < W; c++) {
        if (grid[r][c] === ' ') grid[r][c] = '·';
      }
    }
  }
  for (let lon = MAP.minLon; lon <= MAP.maxLon; lon += 15) {
    const { c } = project(MAP.minLat, lon);
    if (c >= 0 && c < W) {
      for (let r = 0; r < H; r++) {
        if (grid[r][c] === ' ') grid[r][c] = '·';
      }
    }
  }

  // Track which cell each city gets (for collisions, prefer higher priority)
  const cellMap = {}; // "r,c" → {code, priority}

  for (const [code, geo] of Object.entries(GEO)) {
    const { r, c } = project(geo.lat, geo.lon);
    if (r < 0 || r >= H || c < 0 || c >= W) continue;
    const key = `${r},${c}`;
    const existing = cellMap[key];
    const priority = (code.length === 3 ? 2 : 1); // prefer 3-letter codes
    if (!existing || priority > existing.priority) {
      cellMap[key] = { code, priority };
    }
  }

  // Write cities to grid using first 3 chars, centred if possible
  for (const [key, { code }] of Object.entries(cellMap)) {
    const [r, c] = key.split(',').map(Number);
    const ch = code.slice(0, 3);
    // Write first char at c (overwrite grid marker)
    for (let i = 0; i < ch.length; i++) {
      if (c + i < W) grid[r][c + i] = ch[i];
    }
  }

  // ── Print ──────────────────────────────────────────────────────────────────
  const lonMarkers = [];
  for (let lon = MAP.minLon; lon <= MAP.maxLon; lon += 15) {
    const { c } = project(MAP.minLat, lon);
    lonMarkers.push({ c, lon });
  }

  // Header: longitude markers
  const hdr = Array(W + 4).fill(' ');
  hdr[0] = 'N'; hdr[1] = '\\'; hdr[2] = 'W';
  for (const { c, lon } of lonMarkers) {
    const tag = (lon < 0 ? `${-lon}W` : `${lon}E`).padStart(4);
    for (let i = 0; i < tag.length && c + i + 2 < hdr.length; i++) hdr[c + i + 2] = tag[i];
  }
  console.log(hdr.join(''));
  console.log('   ╔' + '═'.repeat(W) + '╗');

  for (let r = 0; r < H; r++) {
    const lat = MAP.maxLat - r * (MAP.maxLat - MAP.minLat) / (H - 1);
    const latTag = (lat >= 0 ? ` ${Math.round(lat)}N` : `${Math.abs(Math.round(lat))}S`).padStart(3);
    const rowStr = grid[r].join('');
    // Latitude markers on right side every 10°
    const showLat = Math.round(lat) % 10 === 0;
    console.log(`${latTag}║${rowStr}║${showLat ? ' ' + latTag.trim() : ''}`);
  }

  console.log('   ╚' + '═'.repeat(W) + '╝');

  // Footer: longitude markers (same as header)
  const ftr = Array(W + 4).fill(' ');
  ftr[0] = 'S'; ftr[1] = '/'; ftr[2] = 'E';
  for (const { c, lon } of lonMarkers) {
    const tag = (lon < 0 ? `${-lon}W` : `${lon}E`).padStart(4);
    for (let i = 0; i < tag.length && c + i + 2 < ftr.length; i++) ftr[c + i + 2] = tag[i];
  }
  console.log(ftr.join(''));
  console.log();
}

// ─── City list ────────────────────────────────────────────────────────────────
function printList(showLatLon) {
  // Sort: west→east within region groups (by lon then lat desc)
  const rows = Object.entries(GEO).map(([code, geo]) => ({
    code,
    lat: geo.lat,
    lon: geo.lon,
    label: geo.label,
    region: geo.region,
  }));

  // Group by rough east-west zone (every 15° lon)
  rows.sort((a, b) => a.lon - b.lon || b.lat - a.lat);

  const colW = showLatLon ? 104 : 70;
  console.log('─'.repeat(colW));
  const hdr = showLatLon
    ? `${'CODE'.padEnd(6)} ${'LABEL'.padEnd(26)} ${'REGION'.padEnd(22)} ${'LAT'.padStart(6)} ${'LON'.padStart(7)}  E/W of whom`
    : `${'CODE'.padEnd(6)} ${'LABEL'.padEnd(28)} ${'REGION'.padEnd(24)} E/W of whom`;
  console.log(hdr);
  console.log('─'.repeat(colW));

  let prevZone = null;
  for (const { code, lat, lon, label, region } of rows) {
    const zone = Math.floor(lon / 15) * 15;
    if (zone !== prevZone) {
      const zoneLabel = zone < 0 ? `${-zone}°W` : `${zone}°E`;
      console.log(`  ── ${zoneLabel} zone ${'─'.repeat(colW - 12)}`);
      prevZone = zone;
    }
    const latStr = (lat >= 0 ? `${lat.toFixed(1)}°N` : `${Math.abs(lat).toFixed(1)}°S`).padStart(6);
    const lonStr = (lon >= 0 ? `${lon.toFixed(1)}°E` : `${Math.abs(lon).toFixed(1)}°W`).padStart(7);
    // Find nearest city to the west and east
    const west = rows
      .filter(r => r.code !== code && r.lon < lon && Math.abs(r.lat - lat) < 10)
      .sort((a,b) => b.lon - a.lon)[0];
    const east = rows
      .filter(r => r.code !== code && r.lon > lon && Math.abs(r.lat - lat) < 10)
      .sort((a,b) => a.lon - b.lon)[0];
    const eastWest = [
      west ? `← ${west.code}` : '',
      east ? `→ ${east.code}` : '',
    ].filter(Boolean).join('  ');

    if (showLatLon) {
      console.log(`${code.padEnd(6)} ${label.slice(0,26).padEnd(26)} ${region.slice(0,22).padEnd(22)} ${latStr} ${lonStr}  ${eastWest}`);
    } else {
      console.log(`${code.padEnd(6)} ${label.slice(0,28).padEnd(28)} ${region.slice(0,24).padEnd(24)} ${eastWest}`);
    }
  }
  console.log('─'.repeat(colW));
  console.log(`${Object.keys(GEO).length} cities with geographic reference data`);
}

// ─── Geo seeding ──────────────────────────────────────────────────────────────
// Map lat/lon to game grid coordinates (0-512 × 0-512).
// North is small row, South is large row.
// West is small col, East is large col.
const GRID_MIN = 8, GRID_MAX = 500;

function geoToGrid(lat, lon) {
  const r = Math.round(GRID_MIN + (MAP.maxLat - lat) / (MAP.maxLat - MAP.minLat) * (GRID_MAX - GRID_MIN));
  const c = Math.round(GRID_MIN + (lon - MAP.minLon) / (MAP.maxLon - MAP.minLon) * (GRID_MAX - GRID_MIN));
  return {
    r: Math.max(GRID_MIN, Math.min(GRID_MAX, r)),
    c: Math.max(GRID_MIN, Math.min(GRID_MAX, c)),
  };
}

async function seedCoords(port, dryRun) {
  const log = s => process.stderr.write(`[worldmap] ${s}\n`);

  // Fetch current node_map to know all node codes
  let nodeMapData;
  try {
    const res = await apiGet(port, '/api/export/node_map?format=json');
    nodeMapData = res.data || {};
  } catch(e) {
    log(`Failed to fetch node_map: ${e.message}`);
    process.exit(1);
  }

  // Build geo-seeded coords for known cities
  const coords = {};
  const occupied = new Set();

  for (const [code, geo] of Object.entries(GEO)) {
    if (!nodeMapData[code]) { log(`SKIP ${code} — not in node_map`); continue; }
    let { r, c } = geoToGrid(geo.lat, geo.lon);
    // Nudge if occupied
    for (let tries = 0; occupied.has(`${r},${c}`) && tries < 20; tries++) {
      c += 1;
    }
    coords[code] = { r, c };
    occupied.add(`${r},${c}`);
  }

  const lines = [];
  lines.push(`${'CODE'.padEnd(6)}  ${'LABEL'.padEnd(28)} ${'REGION'.padEnd(22)} ${'r'.padStart(4)} ${'c'.padStart(4)}   ${'LAT'.padStart(6)} ${'LON'.padStart(7)}`);
  lines.push('─'.repeat(90));
  for (const [code, { r, c }] of Object.entries(coords).sort(([,a],[,b]) => a.r - b.r || a.c - b.c)) {
    const geo = GEO[code];
    const latStr = (geo.lat >= 0 ? `${geo.lat.toFixed(1)}°N` : `${Math.abs(geo.lat).toFixed(1)}°S`).padStart(6);
    const lonStr = (geo.lon >= 0 ? `${geo.lon.toFixed(1)}°E` : `${Math.abs(geo.lon).toFixed(1)}°W`).padStart(7);
    lines.push(`${code.padEnd(6)}  ${geo.label.slice(0,28).padEnd(28)} ${geo.region.slice(0,22).padEnd(22)} ${String(r).padStart(4)} ${String(c).padStart(4)}   ${latStr} ${lonStr}`);
  }
  lines.push('─'.repeat(90));
  lines.push(`${Object.keys(coords).length} cities geo-seeded to game grid (${GRID_MIN}–${GRID_MAX})`);
  console.log(lines.join('\n'));

  if (dryRun) {
    log('Dry run — no changes written. Re-run without --dry-run to apply.');
    return;
  }

  log(`Applying ${Object.keys(coords).length} geo-seeded coords via /api/layout/apply ...`);
  try {
    const res = await apiPost(port, '/api/layout/apply', { coords });
    log(`HTTP ${res.status} — ${res.body?.ok ? `OK (${res.body.updated} updated)` : JSON.stringify(res.body).slice(0,100)}`);
  } catch(e) {
    log(`Apply failed: ${e.message}`);
  }

  log('Done. Run `node layout-solve.js --apply` to propagate remaining nodes from these seeds.');
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const argv  = process.argv.slice(2);
  const port  = (() => { const i = argv.indexOf('--port'); return i >= 0 ? +argv[i+1] : 1367; })();
  const showLL = argv.includes('--latlon') || argv.includes('-l');
  const seed   = argv.includes('--seed');
  const dryRun = argv.includes('--dry-run');

  drawMap();
  printList(showLL);

  if (seed) {
    console.log();
    await seedCoords(port, dryRun);
  } else {
    console.log();
    console.log('Options:');
    console.log('  --latlon      Add lat/lon column to the city list');
    console.log('  --seed        Apply geo-seeded coords to WBAPI (anchors cities to real geography)');
    console.log('  --seed --dry-run  Preview seed coords without writing');
    console.log();
    console.log('Workflow:');
    console.log('  node worldmap.js --seed          # anchor cities to real-world positions');
    console.log('  node layout-solve.js --apply     # propagate all other nodes from geo anchors');
    console.log('  node layout-solve.js --apply --insert-elbows  # fix structural conflicts');
  }
}

main().catch(e => {
  process.stderr.write(`[worldmap] Fatal: ${e.message}\n`);
  process.exit(1);
});
