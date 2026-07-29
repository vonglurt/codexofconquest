#!/usr/bin/env node
// SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com
//
// scripts/node-index.js — the LIVE node reference for roll2hit-v3.html  (§AUDIT-03l)
//
// Why this exists: `maps.md`'s hand-maintained "LEGEND — Two-Letter Code Reference"
// was the doc an author consulted to write an `activateNode` — and 81 of its 92 rows
// named codes that no longer exist, in a 26×16 coordinate space the world left behind
// (live coords run r 2–73 / c 154–249). That table is how `activateNode:"SF"` got
// written onto eight quests in `710bb75`, and how the repair commit then sent two of
// them to the wrong city for two months (§AUDIT-03c).
//
// A hand-maintained index of generated/authored data rots silently. This one is
// generated from the same `wbapi-core` parse the :1367 server and every
// `scripts/check-*.js` read, exactly like `npm run stats` (§DX-01g) does for counts —
// so the doc cannot drift from the file it describes.
//
// Usage:  npm run nodes                  → write docs/maps/node-index.md
//         npm run nodes -- --stdout      → print the markdown instead of writing
//         npm run nodes -- --json        → machine-readable {nodes, legacy}
//         npm run nodes -- --check       → exit 1 if the written file is out of date
//
// The LEGACY CODE MAP it emits is the Rosetta stone for older docs, lab reports and
// commit messages that still speak the 26×16 names: each legacy row is matched to a
// live node by `num`, then CORROBORATED by terrain or label — `num` alone is not
// sufficient (num 77 is held by two nodes, and several terrain keys were renamed).

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const HTML = path.join(ROOT, 'roll2hit-v3.html');
const MAPS = path.join(ROOT, 'maps.md');
const OUT  = path.join(ROOT, 'docs', 'maps', 'node-index.md');
const WBAPI = require(path.join(ROOT, 'js', 'wbapi-core.js'));

WBAPI.load(HTML);

// ── the live table ────────────────────────────────────────────────────────────
const nodes = Object.entries(WBAPI.nodeMap).map(([code, n]) => ({
  code,
  num: Number.isFinite(n.num) ? n.num : null,
  terrain: n.name || '',
  label: n.label || '',
  act: Number.isFinite(n.act) ? n.act : null,
  r: (WBAPI.nodeCoords[code] || {}).r ?? null,
  c: (WBAPI.nodeCoords[code] || {}).c ?? null,
  sleep: !!n.sleep,
  npc: n.npc || '',
})).sort((a, b) => a.code.localeCompare(b.code));

// ── the legacy → live map, recovered from maps.md's historical legend ─────────
// A legacy row is matched by `num`, then corroborated. Anything that fails
// corroboration is reported as UNRESOLVED rather than guessed — guessing is the
// mistake `710bb75` made.
const byNum = {};
for (const n of nodes) if (n.num !== null) (byNum[n.num] ||= []).push(n);

const norm = s => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');
const esc0 = s => String(s).replace(/\|/g, '\\|');
const legacy = [];
if (fs.existsSync(MAPS)) {
  const seen = new Set();
  for (const line of fs.readFileSync(MAPS, 'utf8').split('\n')) {
    // Two historical shapes carry `code | Node # | …`: the LEGEND table (col 3 = terrain
    // key) and the COORDINATE INDEX (col 3 = R##). Read both — the coordinate index holds
    // legacy codes the legend never listed, and it is the other table an author might read.
    const m = line.match(/^\|\s*([A-Z][A-Z0-9]{1,3})\s*\|\s*(\d{1,3})\s*\|\s*([^|]*)\|\s*([^|]*)\|\s*([^|]*)\|\s*([^|]*)\|/);
    if (!m) continue;
    const [, code, numS, col3, , , desc] = m;
    // The legend's col 3 is a terrain key, sometimes annotated (`bar (Visby)`); the
    // coordinate index's col 3 is `R##`. Take the bare terrain token when there is one.
    const terrain = (col3.trim().match(/^[a-z_]+/) || [''])[0];
    if (seen.has(code)) continue;
    seen.add(code);
    const cands = byNum[+numS] || [];
    // corroborate: same terrain key, or the description opens with the node's label
    const d = norm(desc);
    let pick = cands.find(n => n.terrain === terrain)
            || cands.find(n => n.label && d.startsWith(norm(n.label)))
            || (cands.length === 1 ? cands[0] : null);
    const notes = [];
    if (pick && pick.terrain !== terrain) notes.push(`terrain renamed → \`${pick.terrain}\``);
    // The worst trap: the legacy code ALSO exists as a live key, but for a different
    // node. A naive "does this code resolve?" check passes while the row is still wrong.
    // (`CI` = Birka's streets historically, but the Chancery Court live; `BK` = the
    // Broken Tooth Tavern historically, Birka Shore live.)
    const collision = WBAPI.nodeMap[code];
    if (collision && (!pick || pick.code !== code)) notes.push(`⚠️ \`${code}\` is ALSO a live key — a **different** node (${esc0(collision.label)})`);
    legacy.push({ legacy: code, num: +numS, terrain, live: pick ? pick.code : null,
                  label: pick ? pick.label : '', note: notes.join(' · ') });
  }
}
const resolved = legacy.filter(l => l.live);
const unresolved = legacy.filter(l => !l.live);

// ── render ────────────────────────────────────────────────────────────────────
const esc = s => String(s).replace(/\|/g, '\\|');
const lines = [];
lines.push('<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com -->');
lines.push('<!-- GENERATED FILE — do not hand-edit. Regenerate with: npm run nodes  (scripts/node-index.js, §AUDIT-03l) -->');
lines.push('# NODE INDEX — the live `NODE_MAP`');
lines.push('');
lines.push('> **Generated from `roll2hit-v3.html` by `npm run nodes`.** This is the authoritative answer to');
lines.push('> *"what is this node\'s code?"* — it is parsed from the same `wbapi-core` extractor the `:1367`');
lines.push('> server and every `scripts/check-*.js` use, so it cannot drift from the game. **Never take a node');
lines.push('> code from a hand-maintained table** (that is how `710bb75` put `activateNode:"SF"` on eight');
lines.push('> quests — §AUDIT-03c). `./api.sh get node <CODE>` is the other live answer.');
lines.push('');
lines.push(`**${nodes.length} nodes** · coordinates are live `+
           `\`NODE_COORDS\` cells on the §CELL-02 grid (r ${Math.min(...nodes.filter(n=>n.r!==null).map(n=>n.r))}–${Math.max(...nodes.filter(n=>n.r!==null).map(n=>n.r))}, `+
           `c ${Math.min(...nodes.filter(n=>n.c!==null).map(n=>n.c))}–${Math.max(...nodes.filter(n=>n.c!==null).map(n=>n.c))}), not the retired 26×16 projection.`);
lines.push('');
lines.push('| Code | Node # | Terrain | Act | Cell (r,c) | 🛏 | Label | Inline NPC |');
lines.push('|------|--------|---------|-----|-----------|----|-------|------------|');
for (const n of nodes) {
  lines.push(`| \`${n.code}\` | ${n.num ?? '—'} | \`${n.terrain}\` | ${n.act ?? '—'} | ${n.r === null ? '—' : `${n.r},${n.c}`} | ${n.sleep ? '🛏' : ''} | ${esc(n.label)} | ${esc(n.npc)} |`);
}
lines.push('');
lines.push('---');
lines.push('');
lines.push('## LEGACY CODE MAP — reading the pre-airport-code docs');
lines.push('');
lines.push('> Older docs, lab reports and commit messages use the **26×16-era two-letter codes**');
lines.push('> (`SF`, `CQ`, `CI`, …). None of them is a `NODE_MAP` key. Each row below was matched by');
lines.push('> `Node #` and then **corroborated** by terrain key or label — `num` alone is not enough');
lines.push('> (num 77 is held by two nodes, and several terrain keys were renamed since). Rows that');
lines.push('> could not be corroborated are listed as **unresolved** rather than guessed.');
lines.push('');
lines.push(`**${resolved.length} recovered · ${unresolved.length} unresolved** (source: the historical legend in \`maps.md\`).`);
lines.push('');
lines.push('| Legacy | Node # | Live code | Label | Note |');
lines.push('|--------|--------|-----------|-------|------|');
for (const l of resolved) lines.push(`| \`${l.legacy}\` | ${l.num} | **\`${l.live}\`** | ${esc(l.label)} | ${l.note} |`);
if (unresolved.length) {
  lines.push('');
  lines.push('**Unresolved — no live node carries that `Node #`.** These are the §WALK junction/waypoint');
  lines.push('stubs and other entries the world removed; they are dead references, not renames.');
  lines.push('');
  lines.push('| Legacy | Node # | Legacy terrain |');
  lines.push('|--------|--------|----------------|');
  for (const l of unresolved) lines.push(`| \`${l.legacy}\` | ${l.num} | \`${l.terrain}\` |`);
}
lines.push('');
const md = lines.join('\n') + '\n';

const args = process.argv.slice(2);
if (args.includes('--json')) {
  console.log(JSON.stringify({ nodes, legacy: { resolved, unresolved } }, null, 2));
} else if (args.includes('--stdout')) {
  process.stdout.write(md);
} else if (args.includes('--check')) {
  const cur = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
  if (cur !== md) { console.error(`node-index: ${path.relative(ROOT, OUT)} is STALE — run \`npm run nodes\``); process.exit(1); }
  console.log(`node-index OK — ${path.relative(ROOT, OUT)} matches the live NODE_MAP (${nodes.length} nodes).`);
} else {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, md);
  console.log(`node-index → ${path.relative(ROOT, OUT)}  (${nodes.length} nodes · ${resolved.length} legacy codes recovered · ${unresolved.length} unresolved)`);
}
