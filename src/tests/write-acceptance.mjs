// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §DX-02gy — the mandated write path's acceptance test: what it REFUSES, and where a
// routed field actually lands.
//
// `resume.md` §2.5 makes `./bin/api` the only way world data may be written, and §2.4
// makes a round trip the only evidence a write worked. Neither says anything about a
// write that succeeds and lands where nothing reads it, which is what `put monster
// desert_wanderer dropName=… dropIcon=… dropSell=16` did: three keys appended to the
// MONSTER_POOL row, `ok:true`, and `verified: [{dropName, ok:true}, …]` — because
// `verified` only ever asked whether the text was PRESENT.
//
// Boots a THROWAWAY wbapi-server against a COPY of play.html (WRITE_HARNESS_PORT, default
// 13672 — never the dev server on 1367), writes to it, and reads the copy back off disk.
// Pure HTTP, no Playwright: `npm test` does not complete on a musl host (§DX-02ir), and a
// write-path assertion is exactly the kind that must run in CI.
//
// The regression this guards in the other direction is the row's own prescription: it said
// "reject any key absent from the type's field schema", and SCHEMAS declares 23 quest
// fields where QUEST_DB carries 31 — so that whitelist would have refused `id` on all
// 2,853 quests and `desc` on 2,806. Check 5 fails if the vocabulary ever narrows to it.
//
// Run: `npm run test:write` (or `--selftest`, which needs no server and drives the same
// check functions through a stub probe).
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const PORT = parseInt(process.env.WRITE_HARNESS_PORT || '13672');
const BASE = `http://127.0.0.1:${PORT}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const KEY = 'zz_write_acceptance_probe';
// A second probe, so the §DX-02gz persist checks POST a drop that does not exist yet —
// the §DX-02gy routing check above has already given KEY one.
const KEY2 = 'zz_write_persist_probe';
const NEW_MONSTER = { key: KEY, name: 'Acceptance Probe', ac: 10, hp: 10, atk: 1,
  dmgDie: 4, dmgCount: 1, dmgFlat: 0, tier: 'trivial' };

// The three names from the row's own reproduction. None is a field of anything.
const TYPOS = { dropName: 'Junk Trophy', dropIcon: '🧪', dropSell: 16 };

// Present on live monsters, absent from SCHEMAS.monster.fields — the union half of the
// vocabulary is the only reason a write of this is allowed at all.
const CORPUS_ONLY = 'voidTainted';

// Declared in SCHEMAS.quest.fields by neither name; carried by nearly every quest.
const SCHEMA_BLIND_SPOTS = ['id', 'desc', 'retryable', 'vignetteText', 'itemChain', 'rumor'];

// ── the checks, as pure functions of a probe ─────────────────────────────────
// Each returns a finding string or null. `poolRow` reads the entity's literal back out of
// the scratch file, so "where it landed" is answered from disk and not from the response.
export async function runChecks({ probe, poolRow, dropRow, onDisk }) {
  const out = [];
  const add = (f) => { if (f) out.push(f); };

  const typo = await probe('PUT', `/api/monster/${KEY}`, TYPOS);
  add(typo.status === 400 ? null
    : `[accepted] PUT with ${Object.keys(TYPOS).join('/')} answered ${typo.status}, not 400 — the write path still has no field vocabulary`);
  const named = (typo.json?.unknownFields || []);
  add(Object.keys(TYPOS).every((k) => named.includes(k)) ? null
    : `[silent] the refusal does not name every unknown field: said ${JSON.stringify(named)}, sent ${JSON.stringify(Object.keys(TYPOS))}`);
  const accepted = typo.json?.accepted || [];
  add(accepted.includes('hp') && accepted.includes('tier') ? null
    : `[unhelpful] the refusal does not list the accepted names: ${JSON.stringify(accepted.slice(0, 12))}`);
  const afterTypo = await poolRow();
  add(!/dropName|dropIcon|dropSell/.test(afterTypo) ? null
    : `[written] the refused fields reached MONSTER_POOL on disk anyway: ${afterTypo.trim().slice(0, 160)}`);

  const routed = await probe('PUT', `/api/monster/${KEY}`, { drop: { icon: '🏆', name: 'Probe Tooth', sell: 9 } });
  add(routed.status === 200 ? null
    : `[red] PUT with a section-declared field answered ${routed.status}: ${JSON.stringify(routed.json).slice(0, 200)}`);
  add((routed.json?.routed || []).some((r) => r.field === 'drop' && r.section === 'MONSTER_DROPS') ? null
    : `[unreported] the response does not say "drop" was routed: ${JSON.stringify(routed.json?.routed)}`);
  add(/Probe Tooth/.test(await dropRow()) ? null
    : '[misrouted] "drop" did not reach MONSTER_DROPS on disk');
  add(!/drop\s*:/.test(await poolRow()) ? null
    : `[misrouted] "drop" was appended to the MONSTER_POOL row instead: ${(await poolRow()).trim().slice(0, 160)}`);

  const corpus = await probe('PUT', `/api/monster/${KEY}`, { [CORPUS_ONLY]: 'true' });
  add(corpus.status === 200 ? null
    : `[over-strict] "${CORPUS_ONLY}" is carried by live monsters and was refused with ${corpus.status} — the vocabulary has narrowed to SCHEMAS alone`);
  add(new RegExp(CORPUS_ONLY).test(await poolRow()) ? null
    : `[lost] "${CORPUS_ONLY}" reported ok and is not on the row on disk`);

  const plain = await probe('PUT', `/api/monster/${KEY}`, { hp: 12 });
  add(plain.status === 200 && /hp:\s*12/.test(await poolRow()) ? null
    : `[regression] an ordinary declared field no longer round-trips: status ${plain.status}, row ${(await poolRow()).trim().slice(0, 120)}`);

  const q = await probe('PUT', '/api/quest/quest_wis_01', { nosuchfield: 'x' });
  const qa = q.json?.accepted || [];
  const missing = SCHEMA_BLIND_SPOTS.filter((k) => !qa.includes(k));
  add(q.status === 400 ? null : `[accepted] an unknown quest field answered ${q.status}, not 400`);
  // Only meaningful once the refusal exists — a 200 carries no `accepted` set to have lost
  // anything from, and reporting one there would name the wrong defect.
  add(q.status !== 400 || missing.length === 0 ? null
    : `[over-strict] the quest vocabulary has lost ${missing.join(', ')} — a schema-only whitelist refuses \`id\` on all 2,853 quests`);

  // §DX-02gz — a write that reports success and is not on disk. Twelve routes returned
  // `note:'POST /api/save to persist.'` while every other write autosaved, and the CLI help
  // says "You do NOT need to run save after a put/post/del." Both shipped; one was wrong.
  // The CLI hid four of them by issuing POST /api/save itself, so only a client calling the
  // route directly lost the write.
  for (const w of PERSIST_ROUTES) {
    const r = await probe(w.method, w.path, w.body);
    if (r.status >= 400) { add(`[red] ${w.method} ${w.path} answered ${r.status}: ${JSON.stringify(r.json).slice(0, 160)}`); continue; }
    add(!/POST \/api\/save to persist/.test(r.json?.note || '') ? null
      : `[manual-save] ${w.method} ${w.path} still tells the caller to save by hand: ${JSON.stringify(r.json.note)}`);
    add(r.json?.autoSaved === true ? null
      : `[unsaved] ${w.method} ${w.path} reported ok without autoSaved — every other write route saves`);
    add(await onDisk(w.marker) ? null
      : `[lost] ${w.method} ${w.path} reported ok and "${w.marker}" is not in the file on disk`);
  }

  return out;
}

// §DX-02gz — one mutating route per family that used to answer with the persist note.
// `marker` is looked for in the scratch file, so "did it persist" is read off disk.
const PERSIST_ROUTES = [
  { method:'POST', path:`/api/monster/${KEY2}/drop`, body:{ name:'Persist Tooth', icon:'🦷', sell:5 }, marker:'Persist Tooth' },
  { method:'POST', path:'/api/fish', body:{ key:'zz_probe_fish', name:'Probe Fish', rank:99 }, marker:'zz_probe_fish' },
];

// ── selftest — the check functions against a stub probe ─────────────────────
if (process.argv.includes('--selftest')) {
  let pass = 0, fail = 0;
  const ok = (c, m) => { if (c) pass++; else { fail++; console.log('  ✗ FAIL:', m); } };

  const goodRow = `${KEY}: { key:"${KEY}", name:"Acceptance Probe", hp:12, tier:"trivial", ${CORPUS_ONLY}:"true" },`;
  const healthy = {
    probe: async (method, p, body) => {
      if (p.startsWith('/api/quest/')) return { status: 400, json: { accepted: [...SCHEMA_BLIND_SPOTS, 'title'], unknownFields: ['nosuchfield'] } };
      if (body.drop) return { status: 200, json: { ok: true, routed: [{ field: 'drop', section: 'MONSTER_DROPS' }] } };
      if (Object.keys(body).some((k) => k in TYPOS)) return { status: 400, json: { unknownFields: Object.keys(TYPOS), accepted: ['hp', 'tier'] } };
      return { status: 200, json: { ok: true, autoSaved: true } };
    },
    poolRow: async () => goodRow,
    dropRow: async () => `${KEY}: { icon:"🏆", name:"Probe Tooth", sell:9 },`,
    onDisk: async () => true,
  };
  ok((await runChecks(healthy)).length === 0, 'a healthy write path produces no findings');

  const bend = (over) => ({ ...healthy, ...over });
  const first = async (h) => ((await runChecks(h))[0] || '');

  ok((await first(bend({ probe: async (m, p, b) => p.startsWith('/api/quest/')
      ? { status: 400, json: { accepted: SCHEMA_BLIND_SPOTS } }
      : { status: 200, json: { ok: true, routed: [{ field: 'drop', section: 'MONSTER_DROPS' }] } } })))
    .startsWith('[accepted]'), 'the row\'s own reproduction going green again is caught as [accepted]');

  ok((await runChecks(bend({ poolRow: async () => goodRow.replace('tier', 'dropName:"Junk Trophy", tier') })))
    .some((f) => f.startsWith('[written]')), 'a refused field that reaches the pool row anyway is caught as [written]');

  ok((await runChecks(bend({ dropRow: async () => '' })))
    .some((f) => f.startsWith('[misrouted]')), 'a drop that never reaches MONSTER_DROPS is caught as [misrouted]');

  ok((await runChecks(bend({ poolRow: async () => goodRow.replace('tier:"trivial"', 'drop:{name:"x"}, tier:"trivial"') })))
    .some((f) => f.startsWith('[misrouted]')), 'a drop appended to the pool row is caught as [misrouted]');

  // The regression the row's own prescription would have caused.
  ok((await runChecks(bend({ probe: async (m, p, b) => {
      if (p.startsWith('/api/quest/')) return { status: 400, json: { accepted: ['title', 'type'] } };
      if (b.drop) return { status: 200, json: { ok: true, routed: [{ field: 'drop', section: 'MONSTER_DROPS' }] } };
      if (Object.keys(b).some((k) => k in TYPOS)) return { status: 400, json: { unknownFields: Object.keys(TYPOS), accepted: ['hp', 'tier'] } };
      if (CORPUS_ONLY in b) return { status: 400, json: { error: 'unknown' } };
      return { status: 200, json: { ok: true, autoSaved: true } };
    } }))).filter((f) => f.startsWith('[over-strict]')).length === 2,
    'a whitelist narrowed to SCHEMAS alone is caught twice — once per type');

  ok((await runChecks(bend({ probe: async (m, p, b) => {
      if (p.startsWith('/api/quest/')) return { status: 400, json: { accepted: [...SCHEMA_BLIND_SPOTS, 'title'] } };
      if (b.drop) return { status: 200, json: { ok: true } };
      if (Object.keys(b).some((k) => k in TYPOS)) return { status: 400, json: { unknownFields: Object.keys(TYPOS), accepted: ['hp', 'tier'] } };
      return { status: 200, json: { ok: true, autoSaved: true } };
    } }))).some((f) => f.startsWith('[unreported]')),
    'a routed write that does not say so is caught as [unreported]');

  // §DX-02gz — the three shapes a write that does not persist takes.
  ok((await runChecks(bend({ probe: async (m, p, b) => p.startsWith('/api/quest/')
      ? { status: 400, json: { accepted: [...SCHEMA_BLIND_SPOTS, 'title'] } }
      : b && b.drop && !b.name ? { status: 200, json: { ok: true, routed: [{ field: 'drop', section: 'MONSTER_DROPS' }], autoSaved: true } }
      : Object.keys(b || {}).some((k) => k in TYPOS) ? { status: 400, json: { unknownFields: Object.keys(TYPOS), accepted: ['hp', 'tier'] } }
      : { status: 200, json: { ok: true, autoSaved: true, note: 'POST /api/save to persist.' } } })))
    .some((f) => f.startsWith('[manual-save]')), 'a route still telling the caller to save by hand is caught as [manual-save]');

  ok((await runChecks(bend({ probe: async (m, p, b) => p.startsWith('/api/quest/')
      ? { status: 400, json: { accepted: [...SCHEMA_BLIND_SPOTS, 'title'] } }
      : b && b.drop && !b.name ? { status: 200, json: { ok: true, routed: [{ field: 'drop', section: 'MONSTER_DROPS' }], autoSaved: true } }
      : Object.keys(b || {}).some((k) => k in TYPOS) ? { status: 400, json: { unknownFields: Object.keys(TYPOS), accepted: ['hp', 'tier'] } }
      : { status: 200, json: { ok: true } } })))
    .some((f) => f.startsWith('[unsaved]')), 'a write that reports ok without autoSaved is caught as [unsaved]');

  ok((await runChecks(bend({ onDisk: async () => false })))
    .filter((f) => f.startsWith('[lost]')).length === PERSIST_ROUTES.length,
    'a write that reports ok and is not on disk is caught as [lost], once per route');

  if (fail) { console.log(`\n✗ write-acceptance selftest: ${fail} FAILED, ${pass} passed`); process.exit(1); }
  console.log(`✓ write-acceptance selftest: all ${pass} checks pass`);
  process.exit(0);
}

// ── the live run ─────────────────────────────────────────────────────────────
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'coc-write-'));
const scratch = path.join(dir, 'play.html');
fs.copyFileSync(path.join(ROOT, 'play.html'), scratch);
const proc = spawn('node', [path.join(ROOT, 'src', 'js', 'wbapi-server.js')], {
  cwd: ROOT,
  env: { ...process.env, PORT: String(PORT), CODEXOFCONQUEST_FILE: scratch, PEERS_CACHE_FILE: path.join(dir, 'peers.json') },
  stdio: ['ignore', 'ignore', 'pipe'],
});
let stderr = '';
proc.stderr.on('data', (d) => { stderr += d; });
const done = (code) => { try { proc.kill('SIGTERM'); } catch {} fs.rmSync(dir, { recursive: true, force: true }); process.exit(code); };

let up = false;
for (let i = 0; i < 100 && proc.exitCode === null; i++) {
  try { if ((await fetch(`${BASE}/api/ping`)).ok) { up = true; break; } } catch {}
  await sleep(150);
}
if (!up) { console.error(`✗ write-acceptance: the throwaway wbapi-server did not answer on :${PORT} — set WRITE_HARNESS_PORT to a free port.\n${stderr}`); done(1); }

const probe = async (method, p, body) => {
  const r = await fetch(BASE + p, method === 'GET' ? {} : {
    method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  let json = null;
  try { json = await r.json(); } catch {}
  return { status: r.status, json };
};
// Read the entity's literal back out of the copy on disk — never out of the response.
const lineFrom = async (marker) => {
  const src = fs.readFileSync(scratch, 'utf8');
  const at = src.indexOf(marker);
  if (at === -1) return '';
  const start = src.lastIndexOf('\n', at) + 1;
  const close = src.indexOf('},', at);
  return src.slice(start, close === -1 ? at + 200 : close + 2);
};

for (const key of [KEY, KEY2]) {
  const created = await probe('POST', '/api/monster', { ...NEW_MONSTER, key });
  if (created.status !== 201 && created.status !== 200) {
    console.error(`✗ write-acceptance: could not create probe monster "${key}" (${created.status}): ${JSON.stringify(created.json).slice(0, 300)}`);
    done(1);
  }
}

const poolRow = () => lineFrom(`  ${KEY}: { key:`);
const dropRow = async () => {
  const src = fs.readFileSync(scratch, 'utf8');
  const at = src.indexOf('WORLDBUILDER:MONSTER_DROPS:START');
  const end = src.indexOf('WORLDBUILDER:MONSTER_DROPS:END');
  const sec = at === -1 ? '' : src.slice(at, end === -1 ? at + 200000 : end);
  const m = new RegExp(`^\\s*${KEY}:.*$`, 'm').exec(sec);
  return m ? m[0] : '';
};

const onDisk = async (marker) => fs.readFileSync(scratch, 'utf8').includes(marker);

const findings = await runChecks({ probe, poolRow, dropRow, onDisk });
console.log(`  probe monster written to a throwaway copy · pool row read from disk: ${(await poolRow()).trim().slice(0, 100)}`);
if (findings.length) {
  findings.forEach((f) => console.log('  ✗ ' + f));
  console.log(`\n✗ write-acceptance: ${findings.length} finding(s)`);
  console.log('  A write that reports success and lands where nothing reads it is the defect the');
  console.log('  API-first rule exists to prevent (§DX-02gy). Fix the write path, not this test.');
  done(1);
}
console.log(`✓ §DX-02gy/§DX-02gz write acceptance: an unknown field is refused 400 naming itself and the accepted set, a section-declared field is routed to MONSTER_DROPS and reported as routed, a corpus-only field a schema-read whitelist would have rejected still round-trips, and ${PERSIST_ROUTES.length} routes that used to answer 'POST /api/save to persist.' autosave and are read back off disk.`);
done(0);
