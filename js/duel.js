// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
'use strict';
// duel.js — §MESH-01j unified duel-resolution kernel: the single source of
// "who won this duel" shared by the SP client (inlined into index.html)
// and the WBAPI server (require('./duel')). PURE: no DOM, no network, no
// Math.random — every d20 comes from a mulberry32 stream seeded by the
// commit-reveal duelSeed, so client, server, and any third-party replayer
// always produce a byte-identical transcript from the same inputs. A cheater
// is therefore "a machine that disagrees with a pure function of committed
// inputs" (lab-report-mesh-multiuser.md §6.3).
//
// The region between the DUEL:CORE sentinels is inlined BYTE-IDENTICALLY into
// index.html; scripts/check-duel-parity.js asserts the two copies match.
// Do not edit one copy without the other.
//
// statBlock (each party's committed combat state — bounds-checked at reveal):
//   { pid, level, hp, ac, atkBonus, dmgDie, dmgFlat,
//     abilityScores: {str,dex,con,int,wis,cha} }
// DUEL.run(statA, statB, duelSeedHex) → {
//   transcript: [ {round, attacker, d20, total, hit, crit, dmg, hpA, hpB} … ],
//   winner, loser,            // pids (statX.pid, falling back to 'A'/'B')
//   rounds, first, initA, initB }

// ◆◆◆ DUEL:CORE:START ◆◆◆
// SHA-256 (synchronous, pure JS) — used for statHash + commit verification on
// BOTH sides and for the duelSeed derivation, so no environment-specific
// crypto API can ever disagree. Verified against node:crypto in the harness.
function __duelSha256(msg) {
  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];
  const rr = (x, n) => (x >>> n) | (x << (32 - n));
  // UTF-8 encode
  const bytes = [];
  for (let i = 0; i < msg.length; i++) {
    let cp = msg.codePointAt(i);
    if (cp > 0xffff) i++;
    if (cp < 0x80) bytes.push(cp);
    else if (cp < 0x800) bytes.push(0xc0 | (cp >> 6), 0x80 | (cp & 63));
    else if (cp < 0x10000) bytes.push(0xe0 | (cp >> 12), 0x80 | ((cp >> 6) & 63), 0x80 | (cp & 63));
    else bytes.push(0xf0 | (cp >> 18), 0x80 | ((cp >> 12) & 63), 0x80 | ((cp >> 6) & 63), 0x80 | (cp & 63));
  }
  const bitLen = bytes.length * 8;
  bytes.push(0x80);
  while (bytes.length % 64 !== 56) bytes.push(0);
  for (let s = 56; s >= 0; s -= 8) bytes.push(s >= 32 ? Math.floor(bitLen / 4294967296) >>> (s - 32) & 0xff : (bitLen >>> s) & 0xff);
  let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a,
      h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;
  const w = new Array(64);
  for (let off = 0; off < bytes.length; off += 64) {
    for (let i = 0; i < 16; i++)
      w[i] = (bytes[off + 4 * i] << 24) | (bytes[off + 4 * i + 1] << 16) | (bytes[off + 4 * i + 2] << 8) | bytes[off + 4 * i + 3];
    for (let i = 16; i < 64; i++) {
      const s0 = rr(w[i - 15], 7) ^ rr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rr(w[i - 2], 17) ^ rr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
    }
    let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
    for (let i = 0; i < 64; i++) {
      const S1 = rr(e, 6) ^ rr(e, 11) ^ rr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const t1 = (h + S1 + ch + K[i] + w[i]) | 0;
      const S0 = rr(a, 2) ^ rr(a, 13) ^ rr(a, 22);
      const mj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + mj) | 0;
      h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
    }
    h0 = (h0 + a) | 0; h1 = (h1 + b) | 0; h2 = (h2 + c) | 0; h3 = (h3 + d) | 0;
    h4 = (h4 + e) | 0; h5 = (h5 + f) | 0; h6 = (h6 + g) | 0; h7 = (h7 + h) | 0;
  }
  return [h0, h1, h2, h3, h4, h5, h6, h7].map((x) => (x >>> 0).toString(16).padStart(8, '0')).join('');
}

// Canonical JSON (recursive stable key order) — statHash must be identical on
// every machine; the same discipline as the ledger's canonical form.
function __duelCanonical(v) {
  if (v === null || typeof v !== 'object') return JSON.stringify(v);
  if (Array.isArray(v)) return '[' + v.map(__duelCanonical).join(',') + ']';
  return '{' + Object.keys(v).sort().map((k) => JSON.stringify(k) + ':' + __duelCanonical(v[k])).join(',') + '}';
}

// mulberry32 — the same RNG discipline as the session seededNext stream.
function __duelRng(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// Fold every 8-hex-char chunk of the seed into one u32 (uses the WHOLE hash).
function __duelSeedU32(hex) {
  let s = 0;
  for (let i = 0; i + 8 <= hex.length; i += 8) s = (s ^ parseInt(hex.slice(i, i + 8), 16)) >>> 0;
  return s >>> 0;
}
const __duelMod = (score) => Math.floor(((+score || 10) - 10) / 2);

const DUEL = {
  sha256: __duelSha256,
  canonical: __duelCanonical,
  statHash: (statBlock) => __duelSha256(__duelCanonical(statBlock)),
  commitOf: (nonce, statBlock) => __duelSha256(String(nonce) + __duelSha256(__duelCanonical(statBlock))),
  seedOf: (nonceA, nonceB, duelId) => __duelSha256(String(nonceA) + String(nonceB) + String(duelId)),

  // Bounds derivable from the shared world data (worldHash equality is a
  // precondition, so both servers provably hold the same level/XP tables) —
  // an impossible statBlock is rejected at reveal (§IX.B: impossible stats
  // are the tractable half of anti-cheat). Returns null or a reason string.
  checkBounds(sb) {
    if (!sb || typeof sb !== 'object') return 'not-an-object';
    const lvl = sb.level;
    if (!Number.isInteger(lvl) || lvl < 1 || lvl > 20) return 'level out of range 1–20';
    if (!Number.isInteger(sb.hp) || sb.hp < 1 || sb.hp > 30 + lvl * 20) return `hp out of range 1–${30 + lvl * 20} for level ${lvl}`;
    if (!Number.isInteger(sb.ac) || sb.ac < 8 || sb.ac > 30) return 'ac out of range 8–30';
    if (!Number.isInteger(sb.atkBonus) || sb.atkBonus < 0 || sb.atkBonus > 8 + lvl) return `atkBonus out of range 0–${8 + lvl} for level ${lvl}`;
    if (![3, 4, 6, 8, 10, 12].includes(sb.dmgDie)) return 'dmgDie must be one of d3/d4/d6/d8/d10/d12';
    if (!Number.isInteger(sb.dmgFlat) || sb.dmgFlat < 0 || sb.dmgFlat > 20) return 'dmgFlat out of range 0–20';
    const ab = sb.abilityScores;
    if (!ab || typeof ab !== 'object') return 'abilityScores required';
    for (const k of ['str', 'dex', 'con', 'int', 'wis', 'cha'])
      if (!Number.isInteger(ab[k]) || ab[k] < 1 || ab[k] > 20) return `${k} out of range 1–20`;
    return null;
  },

  // The pure resolver. Same (statA, statB, duelSeed) → byte-identical result
  // everywhere. One transcript row per attack; initiative decides who swings
  // first (tie → A, the challenger). Nat 20 = crit (extra damage die), nat 1
  // = auto-miss. Hard cap 200 attacks, then higher remaining-hp FRACTION wins
  // (tie → whoever had initiative) — no duel runs forever.
  run(statA, statB, duelSeedHex) {
    const rng = __duelRng(__duelSeedU32(String(duelSeedHex)));
    const d = (n) => 1 + Math.floor(rng() * n);
    const pidA = statA.pid || 'A', pidB = statB.pid || 'B';
    const initA = d(20) + __duelMod((statA.abilityScores || {}).dex);
    const initB = d(20) + __duelMod((statB.abilityScores || {}).dex);
    const first = initA >= initB ? 'A' : 'B';
    let hpA = statA.hp, hpB = statB.hp;
    const transcript = [];
    let att = first, round = 0;
    while (hpA > 0 && hpB > 0 && round < 200) {
      round++;
      const me = att === 'A' ? statA : statB;
      const them = att === 'A' ? statB : statA;
      const d20 = d(20);
      const total = d20 + (me.atkBonus || 0);
      const crit = d20 === 20;
      const hit = crit || (d20 !== 1 && total >= them.ac);
      let dmg = 0;
      if (hit) dmg = Math.max(1, d(me.dmgDie) + (crit ? d(me.dmgDie) : 0) + (me.dmgFlat || 0));
      if (att === 'A') hpB = Math.max(0, hpB - dmg); else hpA = Math.max(0, hpA - dmg);
      transcript.push({ round, attacker: att === 'A' ? pidA : pidB, d20, total, hit, crit, dmg, hpA, hpB });
      att = att === 'A' ? 'B' : 'A';
    }
    let winA;
    if (hpB <= 0) winA = true;
    else if (hpA <= 0) winA = false;
    else {
      const fracA = hpA / statA.hp, fracB = hpB / statB.hp;
      winA = fracA !== fracB ? fracA > fracB : first === 'A';
    }
    return {
      transcript, rounds: round, first: first === 'A' ? pidA : pidB, initA, initB,
      winner: winA ? pidA : pidB, loser: winA ? pidB : pidA,
    };
  },
};
// ◆◆◆ DUEL:CORE:END ◆◆◆

if (typeof module === 'object' && module.exports) {
  module.exports = DUEL;
}
