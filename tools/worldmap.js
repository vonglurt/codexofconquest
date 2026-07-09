#!/usr/bin/env node
// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Paul Richeson <paul@roll2hit.com> — Roll2Hit.com
// worldmap.js — terminal world map of major cities + geographic coordinate seeding
//
// Draws an ASCII map of the game world oriented by real-world lat/long,
// then optionally seeds NODE_COORDS so layout-solve starts from geography.
//
// Usage:
//   ./api.sh worldmap                  — print terminal map
//   ./api.sh worldmap --latlon         — add lat/lon column to list
//   ./api.sh worldmap --seed           — apply geo-seeded coords via WBAPI
//   ./api.sh worldmap --seed --dry-run — preview seed coords without applying
//   ./api.sh worldmap --port 1367

'use strict';
const http = require('http');

// ─── Geographic reference data ────────────────────────────────────────────────
// lat/lon are real-world approximate positions for each game city.
// Groups are listed roughly west→east, north→south.
const GEO = {
  // Iceland / Far North
  HHL: { lat: 65.0, lon:-22.0, label: 'Herdholt',        region: 'Iceland' },
  ISL: { lat: 64.1, lon:-21.9, label: 'Althing Ground',  region: 'Iceland' },

  // Scandinavia
  NID: { lat: 63.4, lon: 10.4, label: 'Nidaros',         region: 'Norway' },
  LYG: { lat: 62.0, lon:  9.0, label: 'Lyngvi Hall',     region: 'Norway' },
  ODD: { lat: 60.0, lon: 11.0, label: "Oddrun's Estate", region: 'Norway' },
  VS:  { lat: 57.6, lon: 18.3, label: 'Visby Underground', region: 'Sweden' },
  SIG: { lat: 59.5, lon: 11.5, label: "Siggeir's Hall",  region: 'Scandinavia' },
  LHR: { lat: 59.3, lon: 17.6, label: 'Birka',           region: 'Sweden' },
  HEO: { lat: 55.6, lon: 11.9, label: 'Lejre',           region: 'Denmark' },

  // British Isles
  GLA: { lat: 55.9, lon: -4.3, label: 'Glasgow',         region: 'Scotland' },
  EDI: { lat: 55.9, lon: -3.2, label: 'Edinburgh',       region: 'Scotland' },
  YRK: { lat: 53.9, lon: -1.1, label: 'York',            region: 'England' },
  GWN: { lat: 53.2, lon: -4.0, label: 'Gwynedd',         region: 'Wales' },
  MGL: { lat: 53.1, lon: -3.8, label: 'Deganwy',         region: 'Wales' },
  TWY: { lat: 51.6, lon: -3.5, label: 'Tidal River',     region: 'Wales' },
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

  // ── Extended city set (added 2026-06-16) ────────────────────────────────────
  // British Isles
  BEL: { lat: 54.6, lon:  -5.9, label: 'Belfast',              region: 'Ireland' },
  GCI: { lat: 49.4, lon:  -2.6, label: 'Guernsey',             region: 'Channel Islands' },
  GIB: { lat: 36.2, lon:  -5.4, label: 'Gibraltar',            region: 'Gibraltar' },
  INV: { lat: 57.5, lon:  -4.1, label: 'Inverness',            region: 'Scotland' },
  KIR: { lat: 52.2, lon:  -9.5, label: 'Kerry',                region: 'Ireland' },
  LCY: { lat: 51.5, lon:   0.1, label: 'Tilbury Harbor',       region: 'England' },
  LGW: { lat: 51.2, lon:  -0.2, label: 'London Gatwick',       region: 'England' },
  MAN: { lat: 53.4, lon:  -2.3, label: 'Manchester',           region: 'England' },
  MME: { lat: 54.5, lon:  -1.4, label: 'Durham',               region: 'England' },
  NWI: { lat: 52.7, lon:   1.3, label: 'Norwich',              region: 'England' },
  SEN: { lat: 51.6, lon:   0.7, label: 'Southend',             region: 'England' },
  STN: { lat: 51.9, lon:   0.2, label: 'The Map Shop',         region: 'England' },

  // Scandinavia / Nordic extended
  BMA: { lat: 59.4, lon:  18.0, label: 'Stockholm Bromma',     region: 'Sweden' },
  BOO: { lat: 67.3, lon:  14.4, label: 'Bodø',                 region: 'Norway' },
  FRO: { lat: 61.6, lon:   5.0, label: 'Florø',               region: 'Norway' },
  GOT: { lat: 57.7, lon:  12.3, label: 'Gothenburg',           region: 'Sweden' },
  KRN: { lat: 67.8, lon:  20.3, label: 'Kiruna',               region: 'Sweden' },
  KSU: { lat: 63.1, lon:   7.8, label: 'Kristiansund',         region: 'Norway' },
  LLA: { lat: 65.5, lon:  22.1, label: 'Luleå',               region: 'Sweden' },
  MHQ: { lat: 60.1, lon:  19.9, label: 'Mariehamn',            region: 'Åland' },
  MJF: { lat: 65.8, lon:  13.2, label: 'Mosjøen',             region: 'Norway' },
  MOL: { lat: 62.7, lon:   7.3, label: 'Molde',                region: 'Norway' },
  RKV: { lat: 64.1, lon: -22.0, label: 'Reykjavik',            region: 'Iceland' },
  SFT: { lat: 64.6, lon:  21.1, label: 'Skellefteå',          region: 'Sweden' },
  SSJ: { lat: 66.0, lon:  12.5, label: 'Sandnessjøen',        region: 'Norway' },
  TRD: { lat: 63.5, lon:  10.9, label: 'Trondheim',            region: 'Norway' },
  TRF: { lat: 59.2, lon:  10.3, label: 'Sandefjord',           region: 'Norway' },
  VBY: { lat: 57.7, lon:  18.4, label: 'Visby',                region: 'Sweden' },

  // Western & Central Europe
  AMS: { lat: 52.4, lon:   4.9, label: "Fishmonger's Row",     region: 'Netherlands' },
  CDG: { lat: 49.0, lon:   2.5, label: 'The Cat Quarter',      region: 'France' },
  DUS: { lat: 51.3, lon:   6.8, label: 'Düsseldorf',          region: 'Germany' },
  ERF: { lat: 51.0, lon:  11.0, label: 'Erfurt',               region: 'Germany' },
  FCO: { lat: 41.8, lon:  12.2, label: 'Rome Fiumicino',       region: 'Italy' },
  FLR: { lat: 43.8, lon:  11.2, label: 'Florence',             region: 'Italy' },
  GVA: { lat: 46.2, lon:   6.1, label: 'Mountain Pass',        region: 'Switzerland' },
  HAJ: { lat: 52.5, lon:   9.7, label: 'Hannover',             region: 'Germany' },
  INN: { lat: 47.3, lon:  11.3, label: 'Innsbruck',            region: 'Austria' },
  MAD: { lat: 40.5, lon:  -3.6, label: 'Madrid',               region: 'Spain' },
  MUC: { lat: 48.4, lon:  11.8, label: 'Munich',               region: 'Germany' },
  NUE: { lat: 49.5, lon:  11.1, label: "Scholar's Quarter",    region: 'Germany' },
  PMO: { lat: 38.2, lon:  13.1, label: 'Palermo',              region: 'Sicily' },
  SDR: { lat: 43.4, lon:  -3.8, label: 'Santander',            region: 'Spain' },
  SZG: { lat: 47.8, lon:  13.0, label: 'Salzburg',             region: 'Austria' },
  TLS: { lat: 43.6, lon:   1.4, label: 'Toulouse',             region: 'France' },
  VIE: { lat: 48.1, lon:  16.6, label: 'Vienna',               region: 'Austria' },
  WRO: { lat: 51.1, lon:  17.0, label: 'Wrocław',             region: 'Poland' },
  ZRH: { lat: 47.5, lon:   8.6, label: 'Zurich',               region: 'Switzerland' },

  // Eastern Europe & Balkans
  ATH: { lat: 37.9, lon:  23.7, label: 'Athens',               region: 'Greece' },
  BEG: { lat: 44.8, lon:  20.5, label: 'Belgrade',             region: 'Serbia' },
  BNX: { lat: 44.9, lon:  17.3, label: 'Banja Luka',           region: 'Bosnia' },
  CLJ: { lat: 46.8, lon:  23.7, label: 'Cluj-Napoca',          region: 'Romania' },
  KUN: { lat: 55.0, lon:  24.1, label: 'Kaunas',               region: 'Lithuania' },
  KVA: { lat: 40.9, lon:  24.6, label: 'Kavala',               region: 'Greece' },
  MLA: { lat: 35.9, lon:  14.5, label: 'Malta',                region: 'Malta' },
  OTP: { lat: 44.6, lon:  26.1, label: 'Bucharest',            region: 'Romania' },
  PRN: { lat: 42.6, lon:  21.0, label: 'Pristina',             region: 'Kosovo' },
  SOF: { lat: 42.7, lon:  23.4, label: 'Sofia',                region: 'Bulgaria' },
  TLL: { lat: 59.4, lon:  24.8, label: 'Tallinn',              region: 'Estonia' },
  WAW: { lat: 52.2, lon:  21.0, label: 'Warsaw',               region: 'Poland' },
  ZTH: { lat: 37.8, lon:  20.9, label: 'Zakynthos',            region: 'Greece' },

  // Caucasus & Russia
  LCA: { lat: 34.9, lon:  33.6, label: 'Larnaca',              region: 'Cyprus' },
  SVO: { lat: 56.0, lon:  37.4, label: 'Moscow',               region: 'Russia' },
  TBS: { lat: 41.7, lon:  44.9, label: 'Tbilisi',              region: 'Georgia' },

  // Middle East & North Africa
  ADA: { lat: 37.0, lon:  35.3, label: 'Adana',                region: 'Turkey' },
  CAI: { lat: 30.1, lon:  31.4, label: 'Cairo',                region: 'Egypt' },
  DAM: { lat: 33.4, lon:  36.5, label: 'Damascus',             region: 'Syria' },
  DOH: { lat: 25.3, lon:  51.6, label: 'Doha',                 region: 'Qatar' },
  FEZ: { lat: 34.0, lon:  -5.0, label: 'Fez',                  region: 'Morocco' },
  JRS: { lat: 31.9, lon:  35.2, label: 'Jerusalem',            region: 'Palestine' },
  KYA: { lat: 38.0, lon:  32.6, label: 'Konya',                region: 'Turkey' },
  MCT: { lat: 23.6, lon:  58.3, label: 'Muscat',               region: 'Oman' },
  RUH: { lat: 25.0, lon:  46.7, label: 'Riyadh',               region: 'Arabia' },

  // Atlantic islands
  ACE: { lat: 29.0, lon: -13.6, label: 'Isle of the Wyrm Crown', region: 'Canaries' },
  PDL: { lat: 37.7, lon: -25.7, label: 'Ponta Delgada',        region: 'Azores' },
  RAI: { lat: 14.9, lon: -23.5, label: 'Praia',                region: 'Cape Verde' },
  SID: { lat: 16.7, lon: -23.0, label: 'Sal',                  region: 'Cape Verde' },
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

// ─── Region grid ──────────────────────────────────────────────────────────────
// Divides the world into an R×C grid.  Default 6×6.
// Row letters A–F go north→south.  Column numbers 1–6 go west→east.
// e.g. A1 = top-left (Iceland/Atlantic), C4 = Turkey/Levant area.

function regionBounds(row, col, nRows, nCols) {
  const latStep = (MAP.maxLat - MAP.minLat) / nRows;
  const lonStep = (MAP.maxLon - MAP.minLon) / nCols;
  return {
    minLat: MAP.maxLat - (row + 1) * latStep,   // south edge
    maxLat: MAP.maxLat - row * latStep,           // north edge
    minLon: MAP.minLon + col * lonStep,           // west edge
    maxLon: MAP.minLon + (col + 1) * lonStep,    // east edge
  };
}

function regionCode(row, col) {
  return String.fromCharCode(65 + row) + (col + 1);
}

function parseRegionCode(code) {
  const m = code.match(/^([A-Za-z])(\d+)$/);
  if (!m) return null;
  return { row: m[1].toUpperCase().charCodeAt(0) - 65, col: parseInt(m[2], 10) - 1 };
}

function citiesInRegion(row, col, nRows, nCols) {
  const b = regionBounds(row, col, nRows, nCols);
  return Object.entries(GEO).filter(([, g]) =>
    g.lat >= b.minLat && g.lat < b.maxLat &&
    g.lon >= b.minLon && g.lon < b.maxLon
  );
}

// Primary label for a region: pick the most westward city label (first city as entered w→e)
function regionLabel(cities) {
  if (!cities.length) return '';
  const sorted = cities.slice().sort(([,a],[,b]) => a.lon - b.lon || b.lat - a.lat);
  // Abbreviate to first word or recognizable place
  const lbl = sorted[0][1].label.split(/[\s—]/)[0];
  return lbl.length > 10 ? lbl.slice(0, 10) : lbl;
}

// ─── Overview grid ────────────────────────────────────────────────────────────
function drawRegionOverview(nRows, nCols) {
  const latStep = (MAP.maxLat - MAP.minLat) / nRows;
  const lonStep = (MAP.maxLon - MAP.minLon) / nCols;

  // Column header: lon ranges
  const colW = 14;
  const hdr = '     ' + Array.from({ length: nCols }, (_, c) => {
    const w = MAP.minLon + c * lonStep, e = w + lonStep;
    const wLbl = w < 0 ? `${-w|0}W` : `${w|0}E`;
    const eLbl = e < 0 ? `${-e|0}W` : `${e|0}E`;
    return (`${wLbl}–${eLbl}`).padEnd(colW);
  }).join('');
  console.log(hdr);
  console.log('     ' + ('─'.repeat(colW) + '+').repeat(nCols));

  for (let row = 0; row < nRows; row++) {
    const maxLat = MAP.maxLat - row * latStep;
    const minLat = maxLat - latStep;
    const rowLbl = (String.fromCharCode(65 + row) + ' ' +
      `${minLat|0}–${maxLat|0}°N`).padEnd(5);

    // Line 1: region code + city count
    const line1 = rowLbl + Array.from({ length: nCols }, (_, col) => {
      const cities = citiesInRegion(row, col, nRows, nCols);
      const code   = regionCode(row, col);
      if (!cities.length) return `  ·  (empty)   `.padEnd(colW);
      return ` ${code} [${cities.length} city]`.padEnd(colW);
    }).join('');

    // Line 2: primary city names
    const line2 = '     ' + Array.from({ length: nCols }, (_, col) => {
      const cities = citiesInRegion(row, col, nRows, nCols);
      if (!cities.length) return ' '.repeat(colW);
      const labels = cities.slice(0, 3).map(([c]) => c).join(' ');
      return ` ${labels}`.padEnd(colW);
    }).join('');

    console.log(line1);
    console.log(line2);
    console.log('     ' + ('─'.repeat(colW) + '+').repeat(nCols));
  }
  console.log();
  console.log(`${nRows}×${nCols} region grid`);
  console.log();
  console.log('Navigate:');
  console.log('  Zoom out → world:        ./api.sh worldmap');
  console.log('  Zoom into a region:      ./api.sh worldmap --region B2');
  console.log('  Zoom into a city:        ./api.sh worldmap --city LON');
  console.log('  Show lat/lon list:       ./api.sh worldmap --latlon');
}

// ─── Region zoom ─────────────────────────────────────────────────────────────
function drawRegionZoom(regionArg, nRows, nCols) {
  const parsed = parseRegionCode(regionArg);
  if (!parsed) { console.error(`Invalid region code "${regionArg}". Format: A1 through ${String.fromCharCode(65+nRows-1)}${nCols}`); process.exit(1); }
  const { row, col } = parsed;
  if (row < 0 || row >= nRows || col < 0 || col >= nCols) {
    console.error(`Region "${regionArg}" out of range for ${nRows}×${nCols} grid.`); process.exit(1);
  }

  const b    = regionBounds(row, col, nRows, nCols);
  const W    = 88, H = 28;
  const grid = Array.from({ length: H }, () => Array(W).fill(' '));

  function proj(lat, lon) {
    return {
      r: Math.round((b.maxLat - lat) / (b.maxLat - b.minLat) * (H - 1)),
      c: Math.round((lon - b.minLon) / (b.maxLon - b.minLon) * (W - 1)),
    };
  }

  // Graticule every 5°
  for (let lat = Math.ceil(b.minLat / 5) * 5; lat <= b.maxLat; lat += 5) {
    const { r } = proj(lat, b.minLon);
    if (r >= 0 && r < H) for (let c = 0; c < W; c++) if (grid[r][c] === ' ') grid[r][c] = '·';
  }
  for (let lon = Math.ceil(b.minLon / 5) * 5; lon <= b.maxLon; lon += 5) {
    const { c } = proj(b.maxLat, lon);
    if (c >= 0 && c < W) for (let r = 0; r < H; r++) if (grid[r][c] === ' ') grid[r][c] = '·';
  }

  // Place cities — CODE·Label, nudge row if two cities collide
  const inRegion = citiesInRegion(row, col, nRows, nCols);
  const usedRows = new Set(); // track rows that already have text to nudge colliders
  // Sort west→east so labels open leftward when possible
  const sorted = inRegion.slice().sort(([,a],[,b]) => a.lon - b.lon);
  for (const [code, geo] of sorted) {
    let { r, c } = proj(geo.lat, geo.lon);
    if (r < 0 || r >= H || c < 0 || c >= W) continue;
    // Nudge row ±1 if this exact row is already occupied near this column
    const rKey = `${r},${Math.floor(c / 20)}`;
    if (usedRows.has(rKey)) {
      if (r + 1 < H) r += 1; else if (r - 1 >= 0) r -= 1;
    }
    usedRows.add(`${r},${Math.floor(c / 20)}`);
    // Label: CODE·ShortName (fit within 18 chars max)
    const shortName = geo.label.split(/[—–]/)[0].trim().slice(0, 13);
    const tag = `${code}·${shortName}`;
    // Place left-to-right, but if near right edge, shift left
    let startC = c;
    if (startC + tag.length > W) startC = Math.max(0, W - tag.length);
    for (let i = 0; i < tag.length && startC + i < W; i++) {
      grid[r][startC + i] = tag[i];
    }
  }

  // Print — suppress duplicate lat labels (only show when integer degree changes)
  const fmtLat = lat => lat >= 0 ? `${Math.round(lat)}N` : `${Math.abs(Math.round(lat))}S`;
  const rLabel  = regionCode(row, col);
  const latRange = `${b.minLat >= 0 ? b.minLat.toFixed(0)+'°N' : Math.abs(b.minLat).toFixed(0)+'°S'}–${b.maxLat.toFixed(0)}°N`;
  const lonFmt  = v => v < 0 ? `${Math.abs(v).toFixed(0)}°W` : `${v.toFixed(0)}°E`;
  const lonRange = `${lonFmt(b.minLon)}–${lonFmt(b.maxLon)}`;
  console.log(`Region ${rLabel}  ${latRange}  ${lonRange}  (${inRegion.length} cities)`);
  console.log('╔' + '═'.repeat(W) + '╗');
  let lastLatLbl = '';
  for (let r = 0; r < H; r++) {
    const lat = b.maxLat - r * (b.maxLat - b.minLat) / (H - 1);
    const lbl = fmtLat(lat);
    const showLbl = lbl !== lastLatLbl ? lbl : '   ';
    if (lbl !== lastLatLbl) lastLatLbl = lbl;
    console.log(`${showLbl.padStart(3)}║${grid[r].join('')}║`);
  }
  console.log('   ╚' + '═'.repeat(W) + '╝');

  // Lon axis below
  const lonAxis = Array(W + 4).fill(' ');
  for (let lon = Math.ceil(b.minLon / 5) * 5; lon <= b.maxLon; lon += 5) {
    if (lon % 10 !== 0) continue;
    const { c } = proj(b.maxLat, lon);
    const tag = (lon < 0 ? `${-lon}W` : `${lon}E`).padStart(3);
    for (let i = 0; i < tag.length && c + i + 3 < lonAxis.length; i++) lonAxis[c + i + 3] = tag[i];
  }
  console.log(lonAxis.join(''));
  console.log();

  // City list + zoom-in hints
  if (inRegion.length) {
    console.log(`Cities in ${rLabel}  (type --city CODE to zoom into any city):`);
    console.log(`  ${'CODE'.padEnd(5)} ${'LABEL'.padEnd(32)} ${'REGION'.padEnd(20)} ${'LAT'.padStart(7)}  ${'LON'.padStart(7)}  ZOOM`);
    console.log('  ' + '─'.repeat(80));
    for (const [code, geo] of inRegion.sort(([,a],[,b]) => b.lat - a.lat || a.lon - b.lon)) {
      const latS = (geo.lat >= 0 ? `${geo.lat.toFixed(1)}°N` : `${Math.abs(geo.lat).toFixed(1)}°S`).padStart(7);
      const lonS = (geo.lon >= 0 ? `${geo.lon.toFixed(1)}°E` : `${Math.abs(geo.lon).toFixed(1)}°W`).padStart(7);
      console.log(`  ${code.padEnd(5)} ${geo.label.padEnd(32)} ${geo.region.padEnd(20)} ${latS}  ${lonS}  --city ${code}`);
    }
  } else {
    console.log(`No geo-referenced cities in region ${rLabel} (ocean / uninhabited).`);
  }
  console.log();
  console.log('Navigate:');
  const adjRegions = [
    row > 0        ? `N: --region ${regionCode(row-1, col)}` : null,
    row < nRows-1  ? `S: --region ${regionCode(row+1, col)}` : null,
    col > 0        ? `W: --region ${regionCode(row, col-1)}` : null,
    col < nCols-1  ? `E: --region ${regionCode(row, col+1)}` : null,
  ].filter(Boolean);
  console.log(`  Zoom out → world:   ./api.sh worldmap`);
  console.log(`  Region overview:    ./api.sh worldmap --regions`);
  if (adjRegions.length) console.log(`  Adjacent regions:   ${adjRegions.map(s => `./api.sh worldmap ${s.slice(3)}`).join('  ')}`);
}

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
  console.log('Navigate:');
  console.log('  Region overview:    ./api.sh worldmap --regions');
  console.log('  Zoom into region:   ./api.sh worldmap --region A1  (A1–F6)');
  console.log('  Zoom into city:     ./api.sh worldmap --city LON');
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

// ─── City map ─────────────────────────────────────────────────────────────────
// Shows a city's immediate N/E/S/W connections using game coordinates.
// Fetches live node_map + nodeCoords from WBAPI.
async function drawCityMap(code, port) {
  let nodeMap, coords;
  try {
    const [nm, cd] = await Promise.all([
      apiGet(port, '/api/export/node_map?format=json'),
      apiGet(port, '/api/coords'),
    ]);
    nodeMap = nm.data || {};
    coords  = cd.coords || {};
  } catch(e) {
    console.error(`Cannot reach WBAPI on port ${port}: ${e.message}`);
    process.exit(1);
  }

  const node = nodeMap[code.toUpperCase()];
  if (!node) { console.error(`Node "${code}" not found in node_map.`); process.exit(1); }
  const center = coords[code.toUpperCase()];

  // §CELL-06: derive connections from cell-grid adjacency (coordinates), not N/S/E/W fields
  const DIRS = ['N','S','E','W'];
  const CELL_DELTAS = { N:[-1,0], S:[1,0], E:[0,1], W:[0,-1] };
  // Build cell grid: "r,c" → code (only nodeMap codes)
  const cellGrid = {};
  for (const [c2, p] of Object.entries(coords)) {
    if (nodeMap[c2]) cellGrid[`${p.r},${p.c}`] = c2;
  }
  const neighbours = {};
  if (center) {
    for (const dir of DIRS) {
      const [dr, dc] = CELL_DELTAS[dir];
      const tgtCode  = cellGrid[`${center.r+dr},${center.c+dc}`];
      if (tgtCode && nodeMap[tgtCode]) {
        neighbours[dir] = { code: tgtCode, node: nodeMap[tgtCode], coords: coords[tgtCode] };
      }
    }
  }

  const W = 72, H = 22;
  const grid = Array.from({ length: H }, () => Array(W).fill(' '));
  const allPts = center ? [center] : [];
  for (const nb of Object.values(neighbours)) if (nb.coords) allPts.push(nb.coords);

  if (!center) {
    // No coords: just show text box
    console.log(`City: ${code.toUpperCase()} — ${node.label || '(no label)'}`);
    console.log(`Terrain: ${node.name || '?'}   Act: ${node.act ?? '?'}`);
    console.log(`Connections: (no coordinates — cannot derive cell neighbors)`);
    return;
  }

  // Compute bounding box with padding
  const pad  = 3;
  let minR = center.r - pad*3, maxR = center.r + pad*3;
  let minC = center.c - pad*5, maxC = center.c + pad*5;
  // Expand to include all neighbours
  for (const p of allPts) {
    minR = Math.min(minR, p.r - 2); maxR = Math.max(maxR, p.r + 2);
    minC = Math.min(minC, p.c - 3); maxC = Math.max(maxC, p.c + 3);
  }

  function proj(r, c) {
    return {
      pr: Math.round((r - minR) / (maxR - minR) * (H - 1)),
      pc: Math.round((c - minC) / (maxC - minC) * (W - 1)),
    };
  }

  // Draw graticule (coord grid lines every 4 units)
  const rStep = Math.max(1, Math.round((maxR - minR) / 6));
  const cStep = Math.max(1, Math.round((maxC - minC) / 8));
  for (let r = Math.ceil(minR / rStep) * rStep; r <= maxR; r += rStep) {
    const { pr } = proj(r, minC); if (pr < 0 || pr >= H) continue;
    for (let c = 0; c < W; c++) if (grid[pr][c] === ' ') grid[pr][c] = '·';
  }
  for (let c = Math.ceil(minC / cStep) * cStep; c <= maxC; c += cStep) {
    const { pc } = proj(minR, c); if (pc < 0 || pc >= W) continue;
    for (let r = 0; r < H; r++) if (grid[r][pc] === ' ') grid[r][pc] = '·';
  }

  // Draw connection lines between center and each neighbour
  const { pr: cr, pc: cc } = proj(center.r, center.c);
  const ARROW = { N:'↑', S:'↓', E:'→', W:'←' };
  for (const [dir, nb] of Object.entries(neighbours)) {
    const { pr: nr, pc: nc } = proj(nb.coords.r, nb.coords.c);
    // Draw a simple L-shaped path: horizontal then vertical
    const midC = nc;
    // Horizontal segment from cc to midC at row cr
    const r = cr;
    for (let c = Math.min(cc, midC); c <= Math.max(cc, midC); c++) {
      if (c !== cc && grid[r][c] === ' ' || grid[r][c] === '·') grid[r][c] = '─';
    }
    // Vertical segment from cr to nr at col midC
    for (let rv = Math.min(cr, nr); rv <= Math.max(cr, nr); rv++) {
      if (rv !== cr && (grid[rv][midC] === ' ' || grid[rv][midC] === '·')) grid[rv][midC] = '│';
    }
    // Arrow at midpoint of each leg
    const arrowR = dir === 'N' ? Math.min(cr, nr) + 1 : dir === 'S' ? Math.max(cr, nr) - 1 : cr;
    const arrowC = dir === 'E' ? Math.min(cc, nc) + 1 : dir === 'W' ? Math.max(cc, nc) - 1 : midC;
    if (arrowR >= 0 && arrowR < H && arrowC >= 0 && arrowC < W) grid[arrowR][arrowC] = ARROW[dir];
  }

  // Place centre node
  const centerTag = `[${code.toUpperCase()}]`;
  const startCC = Math.max(0, cc - Math.floor(centerTag.length / 2));
  for (let i = 0; i < centerTag.length && startCC + i < W; i++) grid[cr][startCC + i] = centerTag[i];

  // Place neighbour labels
  for (const [dir, nb] of Object.entries(neighbours)) {
    const { pr: nr, pc: nc } = proj(nb.coords.r, nb.coords.c);
    const terrain = nb.node?.name || '?';
    const lbl = `${nb.code}(${terrain})`;
    const startC = Math.max(0, Math.min(nc - 1, W - lbl.length));
    const startR = nr < 0 ? 0 : nr >= H ? H - 1 : nr;
    for (let i = 0; i < lbl.length && startC + i < W; i++) grid[startR][startC + i] = lbl[i];
  }

  // Header
  const geo = GEO[code.toUpperCase()];
  const geoTag = geo ? ` (${geo.lat >= 0 ? geo.lat.toFixed(1)+'°N' : Math.abs(geo.lat).toFixed(1)+'°S'} ${geo.lon >= 0 ? geo.lon.toFixed(1)+'°E' : Math.abs(geo.lon).toFixed(1)+'°W'})` : '';
  console.log(`City: ${code.toUpperCase()} — ${(node.label || '').slice(0, 50)}${geoTag}`);
  console.log(`Terrain: ${(node.name || '?').padEnd(12)}  Act: ${node.act ?? '?'}  Game coords: r=${center.r} c=${center.c}`);
  console.log('╔' + '═'.repeat(W) + '╗');
  for (let r = 0; r < H; r++) {
    const gameR = Math.round(minR + r * (maxR - minR) / (H - 1));
    const lbl   = String(gameR).padStart(3);
    console.log(`${lbl}║${grid[r].join('')}║`);
  }
  console.log('   ╚' + '═'.repeat(W) + '╝');

  // Footer: game col axis
  const colAxis = Array(W + 4).fill(' ');
  for (let c = Math.ceil(minC / cStep) * cStep; c <= maxC; c += cStep) {
    const { pc } = proj(minR, c);
    const tag = String(c);
    for (let i = 0; i < tag.length && pc + i + 3 < colAxis.length; i++) colAxis[pc + i + 3] = tag[i];
  }
  console.log(colAxis.join(''));

  // Connection table — §CELL-06: connections from cell-grid adjacency
  console.log();
  console.log(`Connections from ${code.toUpperCase()}:`);
  for (const dir of DIRS) {
    const nb = neighbours[dir];
    if (!nb) { console.log(`  ${dir}: (none)`); continue; }
    const tc      = nb.coords;
    const terrain = nb.node?.name || '?';
    console.log(`  ${dir}: ${nb.code.padEnd(6)} ${(nb.node?.label || '').slice(0, 28).padEnd(28)} terrain=${terrain.padEnd(10)} r=${tc.r} c=${tc.c}`);
  }

  // Navigation hints
  const regionForCity = () => {
    if (!geo) return null;
    for (let r = 0; r < 6; r++) for (let c = 0; c < 6; c++) {
      const b = regionBounds(r, c, 6, 6);
      if (geo.lat >= b.minLat && geo.lat < b.maxLat && geo.lon >= b.minLon && geo.lon < b.maxLon)
        return regionCode(r, c);
    }
    return null;
  };
  const reg = regionForCity();
  console.log();
  console.log('Navigate:');
  if (reg) console.log(`  Zoom out → region:  ./api.sh worldmap --region ${reg}`);
  console.log(`  Zoom out → world:   ./api.sh worldmap`);
  for (const dir of DIRS) {
    if (neighbours[dir]) console.log(`  Go ${dir}:             ./api.sh worldmap --city ${neighbours[dir].code}`);
  }
}

// ─── Search & monster-hunt maps ───────────────────────────────────────────────
// Search nodes by label/terrain/monster and render on world + region maps.
// Matching nodes are double-highlighted: ★ prefix on map, listed below.

async function drawSearchMap(query, port) {
  // Fetch everything needed
  let nodeMap, coords;
  try {
    const [nm, cd] = await Promise.all([
      apiGet(port, '/api/export/node_map?format=json'),
      apiGet(port, '/api/coords'),
    ]);
    nodeMap = nm.data || {};
    coords  = cd.coords || {};
  } catch(e) {
    console.error(`Cannot reach WBAPI: ${e.message}`); process.exit(1);
  }

  const q = query.toLowerCase();

  // Match nodes by: label, terrain (name), battle.key, battle.label, text, npc
  const hits = [];
  for (const [code, node] of Object.entries(nodeMap)) {
    const fields = [
      node.label || '',
      node.name  || '',
      node.text  || '',
      node.npc   || '',
      node.battle?.key   || '',
      node.battle?.label || '',
    ].map(s => s.toLowerCase());

    if (fields.some(f => f.includes(q))) {
      hits.push({ code, node, coord: coords[code] || null });
    }
  }

  if (!hits.length) {
    console.log(`No nodes matching "${query}".`);
    return;
  }

  // Determine which geo cities are near the hits (within same region cell)
  // and which regions have hits
  const hitCodes = new Set(hits.map(h => h.code));

  // Build world map with hit markers
  const W = MAP.WIDTH, H = MAP.HEIGHT;
  const grid = Array.from({ length: H }, () => Array(W).fill(' '));

  // Graticule
  for (let lat = MAP.minLat; lat <= MAP.maxLat; lat += 15) {
    const { r } = project(lat, 0); if (r >= 0 && r < H) for (let c=0;c<W;c++) if(grid[r][c]===' ') grid[r][c]='·';
  }
  for (let lon = MAP.minLon; lon <= MAP.maxLon; lon += 15) {
    const { c } = project(0, lon); if (c >= 0 && c < W) for (let r=0;r<H;r++) if(grid[r][c]===' ') grid[r][c]='·';
  }

  // Place all geo cities dimly
  for (const [code, geo] of Object.entries(GEO)) {
    const { r, c } = project(geo.lat, geo.lon);
    if (r < 0 || r >= H || c < 0 || c >= W) continue;
    const ch = code.slice(0, 3);
    for (let i = 0; i < ch.length && c + i < W; i++) grid[r][c + i] = ch[i];
  }

  // Count hits per region (for summary)
  const hitsByRegion = {};
  const nG = 6;
  for (const hit of hits) {
    if (!hit.coord) continue;
    // Find the geo city nearest to this hit's game coordinates to locate it on the world map
    // (since most nodes don't have lat/lon, we approximate via nearest geo-referenced city)
    // For now skip non-geo nodes on the world map — show them in region breakdown
    const geoCode = Object.keys(GEO).find(gc => gc === hit.code);
    if (geoCode) {
      const { r, c } = project(GEO[geoCode].lat, GEO[geoCode].lon);
      if (r >= 0 && r < H && c >= 0 && c < W) {
        grid[r][c] = '★'; // double-highlight: replace first char with star
      }
    }

    // Record hit in its region (based on game coord position on grid)
    for (let row = 0; row < nG; row++) {
      for (let col = 0; col < nG; col++) {
        const b = regionBounds(row, col, nG, nG);
        // Approximate lat/lon from game coord
        const approxLat = MAP.maxLat - (hit.coord.r - 8) / 492 * (MAP.maxLat - MAP.minLat);
        const approxLon = MAP.minLon + (hit.coord.c - 8) / 492 * (MAP.maxLon - MAP.minLon);
        if (approxLat >= b.minLat && approxLat < b.maxLat && approxLon >= b.minLon && approxLon < b.maxLon) {
          const rk = regionCode(row, col);
          hitsByRegion[rk] = (hitsByRegion[rk] || []);
          hitsByRegion[rk].push(hit);
        }
      }
    }
  }

  // Print world map
  const typeTag = hits.some(h => h.node.battle) ? 'monster-hunt' : 'location';
  console.log(`Search: "${query}"  —  ${hits.length} matching nodes  [${typeTag}]`);
  console.log(`★ = search hit on map`);
  const lonHdr = Array(W+4).fill(' ');
  for (let lon=MAP.minLon; lon<=MAP.maxLon; lon+=15) { const {c}=project(0,lon); const t=(lon<0?`${-lon}W`:`${lon}E`).padStart(4); for(let i=0;i<t.length&&c+i+3<lonHdr.length;i++) lonHdr[c+i+3]=t[i]; }
  console.log('   '+lonHdr.join(''));
  console.log('   ╔'+'═'.repeat(W)+'╗');
  let lastL = '';
  for (let r=0; r<H; r++) {
    const lat = MAP.maxLat - r*(MAP.maxLat-MAP.minLat)/(H-1);
    const lbl = (lat>=0?`${Math.round(lat)}N`:`${Math.abs(Math.round(lat))}S`).padStart(3);
    const show = lbl !== lastL ? lbl : '   '; lastL = lbl;
    console.log(`${show}║${grid[r].join('')}║`);
  }
  console.log('   ╚'+'═'.repeat(W)+'╝');
  console.log();

  // Group hits by region for compact multi-region display
  const regionKeys = Object.keys(hitsByRegion).sort();
  if (regionKeys.length > 1) {
    console.log(`Results span ${regionKeys.length} regions: ${regionKeys.join(', ')}`);
    console.log(`Use --region <code> to zoom into any region. Consolidating nearby regions:\n`);
  }

  // Show results grouped by region
  for (const rk of regionKeys) {
    const regionHits = hitsByRegion[rk];
    console.log(`── Region ${rk} (${regionHits.length} hits) ─────────────────────`);
    const isMonster = regionHits.some(h => h.node.battle?.key?.includes(q) || h.node.battle?.label?.toLowerCase().includes(q));
    for (const h of regionHits.sort((a, b) => (a.node.label || '').localeCompare(b.node.label || ''))) {
      const terrain  = (h.node.name || '?').padEnd(14);
      const battle   = h.node.battle ? `  ★BATTLE: ${h.node.battle.label || h.node.battle.key}` : '';
      const rc       = h.coord ? `r=${h.coord.r} c=${h.coord.c}` : 'no-coords';
      const label    = (h.node.label || h.code).slice(0, 38);
      console.log(`  ${h.code.padEnd(6)} ${label.padEnd(38)} ${terrain} ${rc}${battle}`);
    }
    console.log(`  → ./api.sh worldmap --region ${rk}`);
    console.log();
  }

  // Hits without any region (no coords or out of geo bounds)
  const unlocated = hits.filter(h => !h.coord);
  if (unlocated.length) {
    console.log(`── ${unlocated.length} nodes without coordinates (no map position) ────`);
    for (const h of unlocated) console.log(`  ${h.code.padEnd(6)} ${(h.node.label||'').slice(0,40)}`);
    console.log(`  Fix: node layout-solve.js --apply`);
    console.log();
  }

  // Footer navigation
  const isMonsterSearch = hits.some(h => h.node.battle);
  console.log('Navigate:');
  if (isMonsterSearch) {
    const monsterCodes = [...new Set(hits.filter(h=>h.node.battle).map(h=>h.node.battle.key))].slice(0, 4);
    console.log(`  Monster hunt: ${monsterCodes.map(m=>`./api.sh worldmap --monster ${m}`).join('  ')}`);
  }
  console.log(`  Zoom into city:   ./api.sh worldmap --city <CODE>`);
  console.log(`  Zoom into region: ./api.sh worldmap --region <A1..F6>`);
  console.log(`  New search:       ./api.sh worldmap --search "<query>"`);
}

// ─── Route map: A → B navigation ────────────────────────────────────────────
async function drawRouteMap(fromCode, toCode, port) {
  let nodeMap, coords;
  try {
    const [nm, cd] = await Promise.all([
      apiGet(port, '/api/export/node_map?format=json'),
      apiGet(port, '/api/coords'),
    ]);
    nodeMap = nm.data || {};
    coords  = cd.coords || {};
  } catch(e) {
    console.error(`Cannot reach WBAPI: ${e.message}`); process.exit(1);
  }

  const src = fromCode.toUpperCase(), dst = toCode.toUpperCase();
  if (!nodeMap[src]) { console.error(`Node "${src}" not found.`); process.exit(1); }
  if (!nodeMap[dst]) { console.error(`Node "${dst}" not found.`); process.exit(1); }

  // BFS through N/E/S/W connections to find shortest path
  const visited = new Map(); // code → {from, dir}
  const queue   = [src];
  visited.set(src, null);
  let found = false;

  while (queue.length) {
    const cur = queue.shift();
    if (cur === dst) { found = true; break; }
    const n = nodeMap[cur]; if (!n) continue;
    for (const dir of ['N','E','S','W']) {
      const tgt = n[dir]; if (!tgt || !nodeMap[tgt] || visited.has(tgt)) continue;
      visited.set(tgt, { from: cur, dir });
      queue.push(tgt);
    }
  }

  if (!found) {
    console.log(`Route: ${src} → ${dst}`);
    console.log(`✗ No path found — nodes are not connected in the current graph.`);
    console.log(`  Check disconnected components: node layout-solve.js | jq .stats`);
    console.log(`  Check connections: ./api.sh get node ${src}  and  ./api.sh get node ${dst}`);
    return;
  }

  // Reconstruct path
  const path = [];
  let cur = dst;
  while (cur) {
    const entry = visited.get(cur);
    path.unshift({ code: cur, dir: entry?.dir || null });
    cur = entry?.from || null;
  }

  const OPP = { N:'S', S:'N', E:'W', W:'E' };
  const ARROW = { N:'↑', S:'↓', E:'→', W:'←' };

  console.log(`Route: ${src} → ${dst}  (${path.length} hops)`);
  console.log('═'.repeat(72));

  // Step-by-step log (Google Maps style)
  console.log(`\nDIRECTIONS\n`);
  for (let i = 0; i < path.length; i++) {
    const { code, dir } = path[i];
    const node    = nodeMap[code];
    const rc      = coords[code];
    const terrain = node?.name || '?';
    const label   = (node?.label || code).slice(0, 42);
    const rcStr   = rc ? `(r=${rc.r},c=${rc.c})` : '(no coords)';
    const battle  = node?.battle ? `  ⚔ ${node.battle.label}` : '';
    const sleep   = node?.sleep  ? '  🛏 Rest available' : '';

    if (i === 0) {
      console.log(`  START  ${code.padEnd(6)}  ${label.padEnd(42)}  [${terrain}] ${rcStr}`);
    } else if (i === path.length - 1) {
      console.log(`  ${ARROW[dir] || ' '} ${dir.padEnd(4)} ${code.padEnd(6)}  ${label.padEnd(42)}  [${terrain}] ${rcStr}${battle}${sleep}`);
      console.log(`  ARRIVE`);
    } else {
      console.log(`  ${ARROW[dir] || ' '} ${dir.padEnd(4)} ${code.padEnd(6)}  ${label.padEnd(42)}  [${terrain}]${battle}${sleep}`);
    }
  }

  console.log(`\n${'─'.repeat(72)}`);

  // Terrain summary
  const terrainCounts = {};
  for (const { code } of path) {
    const t = nodeMap[code]?.name || '?';
    terrainCounts[t] = (terrainCounts[t] || 0) + 1;
  }
  console.log(`Terrain along route:`);
  for (const [t, n] of Object.entries(terrainCounts).sort(([,a],[,b]) => b - a)) {
    console.log(`  ${t.padEnd(16)} ${n} node${n>1?'s':''}`);
  }

  // Battles along the way
  const battles = path.filter(({ code }) => nodeMap[code]?.battle);
  if (battles.length) {
    console.log(`\nBattles on this route (${battles.length}):`);
    for (const { code } of battles) {
      const b = nodeMap[code].battle;
      console.log(`  ${code.padEnd(6)} ${(nodeMap[code].label||'').slice(0,35).padEnd(35)} ⚔ ${b.label || b.key}`);
    }
  }

  // Mini map of route nodes with coords
  const routeCoords = path.map(({ code }) => ({ code, rc: coords[code] || null })).filter(x => x.rc);
  if (routeCoords.length >= 2) {
    console.log(`\nROUTE MAP  (${routeCoords.length}/${path.length} nodes have coordinates)\n`);

    const minR = Math.min(...routeCoords.map(x => x.rc.r));
    const maxR = Math.max(...routeCoords.map(x => x.rc.r));
    const minC = Math.min(...routeCoords.map(x => x.rc.c));
    const maxC = Math.max(...routeCoords.map(x => x.rc.c));
    const pad  = 3;
    const W = 70, H = 20;
    const bMinR = minR - pad, bMaxR = maxR + pad, bMinC = minC - pad, bMaxC = maxC + pad;

    function proj(r, c) {
      return {
        pr: Math.round((r - bMinR) / Math.max(1, bMaxR - bMinR) * (H - 1)),
        pc: Math.round((c - bMinC) / Math.max(1, bMaxC - bMinC) * (W - 1)),
      };
    }

    const grid = Array.from({ length: H }, () => Array(W).fill(' '));

    // Draw path lines
    for (let i = 1; i < routeCoords.length; i++) {
      const { pr: r1, pc: c1 } = proj(routeCoords[i-1].rc.r, routeCoords[i-1].rc.c);
      const { pr: r2, pc: c2 } = proj(routeCoords[i].rc.r,   routeCoords[i].rc.c);
      // Horizontal segment
      for (let c = Math.min(c1, c2); c <= Math.max(c1, c2); c++) {
        if (grid[r1]?.[c] === ' ') grid[r1][c] = '─';
      }
      // Vertical segment
      for (let r = Math.min(r1, r2); r <= Math.max(r1, r2); r++) {
        if (grid[r]?.[c2] === ' ') grid[r][c2] = '│';
      }
    }

    // Place node markers
    const routeSet = new Set(path.map(x => x.code));
    for (const { code, rc } of routeCoords) {
      const { pr, pc } = proj(rc.r, rc.c);
      if (pr < 0 || pr >= H || pc < 0 || pc >= W) continue;
      const marker = code === src ? `[${code}]START` : code === dst ? `[${code}]END` : `·${code}`;
      for (let i = 0; i < marker.length && pc + i < W; i++) grid[pr][pc + i] = marker[i];
    }

    console.log('╔' + '═'.repeat(W) + '╗');
    for (let r = 0; r < H; r++) {
      const gameR = Math.round(bMinR + r * (bMaxR - bMinR) / (H - 1));
      console.log(`${String(gameR).padStart(3)}║${grid[r].join('')}║`);
    }
    console.log('   ╚' + '═'.repeat(W) + '╝');
  }

  // Navigation
  const srcGeo = GEO[src], dstGeo = GEO[dst];
  const srcReg = srcGeo ? (() => { for(let r=0;r<6;r++) for(let c=0;c<6;c++) { const b=regionBounds(r,c,6,6); if(srcGeo.lat>=b.minLat&&srcGeo.lat<b.maxLat&&srcGeo.lon>=b.minLon&&srcGeo.lon<b.maxLon) return regionCode(r,c); } return null; })() : null;
  const dstReg = dstGeo ? (() => { for(let r=0;r<6;r++) for(let c=0;c<6;c++) { const b=regionBounds(r,c,6,6); if(dstGeo.lat>=b.minLat&&dstGeo.lat<b.maxLat&&dstGeo.lon>=b.minLon&&dstGeo.lon<b.maxLon) return regionCode(r,c); } return null; })() : null;
  console.log(`\nNavigate:`);
  if (srcReg)  console.log(`  Start region:  ./api.sh worldmap --region ${srcReg}`);
  if (dstReg && dstReg !== srcReg) console.log(`  End region:    ./api.sh worldmap --region ${dstReg}`);
  console.log(`  Start city:    ./api.sh worldmap --city ${src}`);
  console.log(`  End city:      ./api.sh worldmap --city ${dst}`);
  console.log(`  World map:     ./api.sh worldmap`);
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
  const getArg = flag => { const i = argv.indexOf(flag); return i >= 0 ? argv[i + 1] : null; };
  const port     = getArg('--port') ? +getArg('--port') : 1367;
  const showLL   = argv.includes('--latlon') || argv.includes('-l');
  const seed     = argv.includes('--seed');
  const dryRun   = argv.includes('--dry-run');
  const regions    = argv.includes('--regions');
  const _nGridRaw  = getArg('--regions');
  const nGrid      = (_nGridRaw && !isNaN(+_nGridRaw)) ? +_nGridRaw : (getArg('--grid') && !isNaN(+getArg('--grid')) ? +getArg('--grid') : 6);
  const regionZoom = getArg('--region');
  const cityZoom   = getArg('--city');
  const searchQ    = getArg('--search') || getArg('--monster') || getArg('-s');
  const routeFrom  = getArg('--route') || getArg('--from');
  const routeTo    = getArg('--to');

  if (cityZoom) {
    await drawCityMap(cityZoom, port);
    return;
  }

  if (routeFrom && routeTo) {
    await drawRouteMap(routeFrom, routeTo, port);
    return;
  }

  if (searchQ) {
    await drawSearchMap(searchQ, port);
    return;
  }

  if (regionZoom) {
    drawRegionZoom(regionZoom.toUpperCase(), nGrid, nGrid);
    return;
  }

  if (regions) {
    console.log(`World Region Grid  ${nGrid}×${nGrid}  (lat ${MAP.minLat}°–${MAP.maxLat}°  lon ${MAP.minLon}°–${MAP.maxLon}°)\n`);
    drawRegionOverview(nGrid, nGrid);
    return;
  }

  // Default: full world map
  drawMap();
  if (showLL) { console.log(); printList(true); }

  if (seed) {
    console.log();
    await seedCoords(port, dryRun);
  }
}

main().catch(e => {
  process.stderr.write(`[worldmap] Fatal: ${e.message}\n`);
  process.exit(1);
});
