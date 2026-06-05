// SPDX-License-Identifier: MIT — Copyright (c) 2026 PaulRicheson@Roll2Hit.com
'use strict';
// wbapi-core.js — Roll2Hit World Builder data layer for Node.js
// Mirrors the parsing logic in worldbuilder.html.
// Usage: const WBAPI = require('./wbapi-core'); WBAPI.load('./roll2hit-v3.html');

const fs   = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════════════════════════════════
// Parsing helpers
// ═══════════════════════════════════════════════════════════════════════════

function extrSection(src, name) {
  const S = `// ◆◆◆ WORLDBUILDER:${name}:START ◆◆◆`;
  const E = `// ◆◆◆ WORLDBUILDER:${name}:END ◆◆◆`;
  const a = src.indexOf(S), b = src.indexOf(E);
  return (a > -1 && b > a) ? src.slice(a + S.length, b).trim() : null;
}

function extractObj(block, name) {
  if (!block) return null;
  const re = new RegExp(`(?:const|let|var)\\s+${name}\\s*=\\s*`);
  const pos = block.search(re);
  if (pos === -1) return null;
  const braceOffset = block.slice(pos).search(/\{/);
  if (braceOffset === -1) return null;
  let i = pos + braceOffset, depth = 0, inStr = null, j = i;
  while (j < block.length) {
    const c = block[j];
    if (inStr) {
      if (c === '\\' && inStr !== '`') { j += 2; continue; }
      if (c === inStr) inStr = null;
    } else if (c === '/' && block[j+1] === '/') {
      while (j < block.length && block[j] !== '\n') j++;
      continue;
    } else if (c === '/' && block[j+1] === '*') {
      j += 2; while (j < block.length && !(block[j] === '*' && block[j+1] === '/')) j++;
      j += 2; continue;
    } else {
      if (c === '"' || c === "'" || c === '`') inStr = c;
      else if (c === '{') depth++;
      else if (c === '}') { depth--; if (depth === 0) return block.slice(i, j+1); }
    }
    j++;
  }
  return null;
}

function removeFns(src) {
  let out = '', i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === '"' || c === "'" || c === '`') {
      out += c; i++;
      while (i < src.length) {
        if (src[i] === '\\' && c !== '`') { out += src[i++]; out += src[i++]; continue; }
        if (src[i] === c) { out += src[i++]; break; }
        out += src[i++];
      }
      continue;
    }
    if (c === ':') {
      let j = i + 1;
      while (j < src.length && /[ \t\n\r]/.test(src[j])) j++;
      const rest = src.slice(j);
      const isArrow = rest.match(/^(\([^)]*\)\s*=>|[a-zA-Z_$]\w*\s*=>)/);
      const isFunc  = rest.match(/^(function\s*\*?\s*\w*\s*\()/);
      if (isArrow || isFunc) {
        const matchLen = (isArrow || isFunc)[0].length;
        let k = j + matchLen;
        while (k < src.length && /[ \t]/.test(src[k])) k++;
        if (src[k] === '{') {
          let depth = 0;
          while (k < src.length) {
            const cc = src[k];
            if (cc === '"' || cc === "'" || cc === '`') {
              const q = cc; k++;
              while (k < src.length) { if (src[k] === '\\') { k += 2; continue; } if (src[k++] === q) break; }
            } else if (cc === '{') { depth++; k++; }
            else if (cc === '}') { depth--; k++; if (depth === 0) break; }
            else k++;
          }
        } else {
          let depth = 0;
          while (k < src.length) {
            const cc = src[k];
            if (cc === '"' || cc === "'" || cc === '`') {
              const q = cc; k++;
              while (k < src.length) { if (src[k] === '\\') { k += 2; continue; } if (src[k++] === q) break; }
            } else if ('([{'.includes(cc)) { depth++; k++; }
            else if (')]}'.includes(cc)) { if (depth === 0) break; depth--; k++; }
            else if (cc === ',' && depth === 0) break;
            else k++;
          }
        }
        out += ': null'; i = k; continue;
      }
    }
    out += c; i++;
  }
  return out;
}

function extractArr(block, name) {
  if (!block) return null;
  const re = new RegExp(`(?:const|let|var)\\s+${name}\\s*=\\s*\\[`);
  const pos = block.search(re);
  if (pos === -1) return null;
  const bracketOffset = block.slice(pos).indexOf('[');
  if (bracketOffset === -1) return null;
  let i = pos + bracketOffset, depth = 0, inStr = null, j = i;
  while (j < block.length) {
    const c = block[j];
    if (inStr) {
      if (c === '\\' && inStr !== '`') { j += 2; continue; }
      if (c === inStr) inStr = null;
    } else if (c === '/' && block[j+1] === '/') {
      while (j < block.length && block[j] !== '\n') j++;
      continue;
    } else if (c === '/' && block[j+1] === '*') {
      j += 2; while (j < block.length && !(block[j] === '*' && block[j+1] === '/')) j++;
      j += 2; continue;
    } else if (c === '"' || c === "'" || c === '`') {
      inStr = c;
    } else if (c === '[') {
      depth++;
    } else if (c === ']') {
      depth--;
      if (depth === 0) return block.slice(i, j + 1);
    }
    j++;
  }
  return null;
}

function parseSimple(block, name) {
  const obj = extractObj(block, name); if (!obj) return {};
  try { return new Function('return (' + obj + ')')(); } catch(e) { return {}; }
}
function parseArr(block, name) {
  const arr = extractArr(block, name); if (!arr) return [];
  try { return new Function('return ' + arr)(); } catch(e) { return []; }
}
function parseWithP(block, name, P) {
  const obj = extractObj(block, name); if (!obj) return {};
  const Pp = new Proxy(P, { get: (t, k) => t[k] || { key: String(k) } });
  try { return new Function('P', 'return (' + obj + ')')(Pp); } catch(e) { return {}; }
}
function parseSanitized(block, name) {
  const obj = extractObj(block, name); if (!obj) return {};
  try { return new Function('return (' + removeFns(obj) + ')')(); } catch(e) { return {}; }
}

// ═══════════════════════════════════════════════════════════════════════════
// Targeted field patcher — edits a string field in raw JS source in-place.
// Avoids full re-serialization so function bodies are preserved.
// ═══════════════════════════════════════════════════════════════════════════
function patchStringField(sectionSrc, entryKey, field, newValue) {
  const escaped = newValue.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  // Use brace-depth tracking to find the true entry boundary (handles nested {} in completeFn).
  const b = findEntryBounds(sectionSrc, entryKey);
  if (!b) return null;
  const { openEnd, bodyEnd } = b;
  const body = sectionSrc.slice(openEnd, bodyEnd);
  const fieldRe = new RegExp(`(\\b${field}\\s*:\\s*)(["\`'])(.*?)\\2`, 'm');
  if (!fieldRe.test(body)) return null;
  const patchedBody = body.replace(fieldRe, (_, pre, q) => `${pre}"${escaped}"`);
  return sectionSrc.slice(0, openEnd) + patchedBody + sectionSrc.slice(bodyEnd);
}

// Find the true entry bounds using brace-depth tracking (handles nested {} in completeFn etc.).
// Returns { openEnd, bodyEnd, baseIndent } or null.
function findEntryBounds(sectionSrc, entryKey) {
  const keyRe = new RegExp(`([ \\t]*)${entryKey}\\s*:\\s*\\{`, 'g');
  const km = keyRe.exec(sectionSrc);
  if (!km) return null;
  const baseIndent = km[1];
  const openEnd = km.index + km[0].length;
  let depth = 1, i = openEnd, inStr = null;
  while (i < sectionSrc.length) {
    const c = sectionSrc[i];
    if (inStr) {
      if (c === '\\' && inStr !== '`') { i += 2; continue; }
      if (c === inStr) inStr = null;
    } else if (c === '/' && sectionSrc[i+1] === '/') {
      while (i < sectionSrc.length && sectionSrc[i] !== '\n') i++;
      continue;
    } else {
      if (c === '"' || c === "'" || c === '`') inStr = c;
      else if (c === '{') depth++;
      else if (c === '}') { depth--; if (depth === 0) break; }
    }
    i++;
  }
  return depth === 0 ? { openEnd, bodyEnd: i, baseIndent } : null;
}

// Insert a new string field into an existing entry's body (appended before the true closing }).
// Uses brace-depth tracking so nested {} inside completeFn or other functions are never confused
// for the entry boundary.
function insertStringField(sectionSrc, entryKey, field, newValue) {
  const escaped = newValue.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  const b = findEntryBounds(sectionSrc, entryKey);
  if (!b) return null;
  const { openEnd, bodyEnd, baseIndent } = b;
  const fieldIndent = baseIndent + '  ';
  const body = sectionSrc.slice(openEnd, bodyEnd);
  const trimmed = body.trimEnd();
  let newBody = trimmed;
  if (newBody && !newBody.endsWith(',')) newBody += ',';
  newBody += `\n${fieldIndent}${field}:"${escaped}",\n${baseIndent}`;
  return sectionSrc.slice(0, openEnd) + newBody + sectionSrc.slice(bodyEnd);
}

// Remove a string field from an existing entry's body.
// Handles both leading-comma and trailing-comma forms.
function removeStringField(sectionSrc, entryKey, field) {
  const b = findEntryBounds(sectionSrc, entryKey);
  if (!b) return null;
  const { openEnd, bodyEnd } = b;
  const body = sectionSrc.slice(openEnd, bodyEnd);
  // Match field with any quoted value: ,\s*field\s*:\s*'...' or field\s*:\s*'...'\s*,
  let patchedBody = body
    .replace(new RegExp(`,\\s*${field}\\s*:\\s*(['"\`])[^\\1]*?\\1`), '')
    .replace(new RegExp(`${field}\\s*:\\s*(['"\`])[^\\1]*?\\1,?\\s*`), '');
  if (patchedBody === body) return null;
  return sectionSrc.slice(0, openEnd) + patchedBody + sectionSrc.slice(bodyEnd);
}

// Replace an entire entry block in a section (for add/delete)
function respliceSection(rawSrc, sectionName, newContent) {
  const S = `// ◆◆◆ WORLDBUILDER:${sectionName}:START ◆◆◆`;
  const E = `// ◆◆◆ WORLDBUILDER:${sectionName}:END ◆◆◆`;
  const a = rawSrc.indexOf(S) + S.length;
  const b = rawSrc.indexOf(E);
  if (a < S.length || b === -1 || b < a) return rawSrc;
  return rawSrc.slice(0, a) + '\n' + newContent + '\n' + rawSrc.slice(b);
}

// ═══════════════════════════════════════════════════════════════════════════
// WBAPI
// ═══════════════════════════════════════════════════════════════════════════
const WBAPI = {
  nodeMap: {}, nodeCoords: {}, questDb: {}, monsterPool: {},
  monsterDrops: {}, worldDb: {}, birkaNpcs: {},
  fishPool: [], nightFishPool: [], lakeMagicDb: {}, itemDb: {}, npcDialogues: {}, d100Table: [],
  _terrainToMonsters: {}, _monsterToTerrains: {},
  _questsByNode: {}, _questFlags: {}, _flagToQuests: {}, _questArcs: {},
  _rawQuestSrc: '',
  _rawSrc: null,
  _srcPath: null,
  loaded: false,

  load(filePathOrText) {
    let src;
    if (filePathOrText.includes('\n') || !filePathOrText.endsWith('.html')) {
      src = filePathOrText;
    } else {
      this._srcPath = path.resolve(filePathOrText);
      src = fs.readFileSync(this._srcPath, 'utf8');
    }
    this._rawSrc = src;

    const A = '◆◆◆ WORLDBUILDER:';
    const e = (s, en) => extrSection(src, s);

    this.monsterPool  = parseSimple(extrSection(src,'MONSTER_POOL').split('◆◆◆ WORLDBUILDER:MONSTER_DROPS')[0], 'MONSTER_POOL');
    this.monsterDrops = parseSimple(extrSection(src,'MONSTER_DROPS'), 'MONSTER_DROPS');
    const Pp = new Proxy(this.monsterPool, { get: (t,k) => t[k]||{key:String(k)} });
    this.worldDb    = parseWithP(extrSection(src,'WORLD_DB'), 'WORLD_DB', Pp);
    this.nodeMap    = parseSimple(extrSection(src,'NODE_MAP'), 'NODE_MAP');
    this.nodeCoords = parseSimple(extrSection(src,'NODE_COORDS'), 'NODE_COORDS');
    this.birkaNpcs  = parseSanitized(extrSection(src,'BIRKA_NPC'), 'BIRKA_NPC_PROFILES');
    const fishSrc   = extrSection(src,'FISH_DB') || '';
    this.fishPool      = parseArr(fishSrc, 'FISH_POOL');
    this.nightFishPool = parseArr(fishSrc, 'NIGHT_FISH_POOL');
    this.lakeMagicDb   = parseSimple(extrSection(src,'LAKE_MAGIC'), 'LAKE_MAGIC_DB');
    this.itemDb        = parseSimple(extrSection(src,'ITEM_DB'), 'ITEM_DB') || {};
    this.npcDialogues  = parseSanitized(extrSection(src,'NPC_DIALOGUES'), 'NPC_DIALOGUES') || {};
    this.d100Table     = parseArr(extrSection(src,'D100_TABLE'), '_D100_TABLE') || [];
    const qSrc = extrSection(src,'QUEST_DB');
    this._rawQuestSrc = qSrc || '';
    this.questDb = parseSanitized(qSrc, 'QUEST_DB');

    this._buildIndexes();
    this.loaded = true;
    return this;
  },

  _buildIndexes() {
    this._terrainToMonsters = {}; this._monsterToTerrains = {};
    for (const [tk, terrain] of Object.entries(this.worldDb)) {
      if (!terrain.monsters) continue;
      const keys = terrain.monsters.map(m => typeof m === 'string' ? m : (m && m.key));
      this._terrainToMonsters[tk] = keys.filter(Boolean);
      for (const mk of keys.filter(Boolean)) {
        if (!this._monsterToTerrains[mk]) this._monsterToTerrains[mk] = [];
        this._monsterToTerrains[mk].push(tk);
      }
    }
    this._questsByNode = {};
    for (const [id, q] of Object.entries(this.questDb))
      for (const field of ['activateNode','waypointNode'])
        if (q[field]) {
          if (!this._questsByNode[q[field]]) this._questsByNode[q[field]] = [];
          this._questsByNode[q[field]].push(id);
        }
    this._questFlags = {}; this._flagToQuests = {};
    if (this._rawQuestSrc) {
      for (const { id, src } of this._splitQuestBlocks(this._rawQuestSrc)) {
        const reads = new Set(), writes = new Set();
        for (const m of src.matchAll(/S_story\.(\w+)\s*[^=!<>]/g)) if (m[1]!=='active') reads.add(m[1]);
        for (const m of src.matchAll(/S_story\.(\w+)\s*=/g)) writes.add(m[1]);
        this._questFlags[id] = { reads, writes };
        for (const f of reads) { if (!this._flagToQuests[f]) this._flagToQuests[f]={reads:[],writes:[]}; this._flagToQuests[f].reads.push(id); }
        for (const f of writes) { if (!this._flagToQuests[f]) this._flagToQuests[f]={reads:[],writes:[]}; this._flagToQuests[f].writes.push(id); }
      }
    }
    this._questArcs = {};
    for (const id of Object.keys(this.questDb)) {
      const arc = id.replace(/_\d+$/, '').replace(/_[a-z]{2}$/, '');
      if (!this._questArcs[arc]) this._questArcs[arc] = [];
      this._questArcs[arc].push(id);
    }
  },

  _splitQuestBlocks(src) {
    const blocks = [], re = /^\s{2}([a-z][a-z0-9_]+)\s*:/mg;
    let m, prev = null, prevId = null;
    while ((m = re.exec(src)) !== null) {
      if (prev !== null) blocks.push({ id: prevId, src: src.slice(prev, m.index) });
      prev = m.index; prevId = m[1];
    }
    if (prev !== null) blocks.push({ id: prevId, src: src.slice(prev) });
    return blocks;
  },

  // ── Helpers ──
  _findKey(col, idOrTitle) {
    if (col[idOrTitle] !== undefined) return idOrTitle;
    const needle = String(idOrTitle).toLowerCase();
    for (const [k, v] of Object.entries(col))
      if ([v?.label, v?.name, v?.title].some(s => s && String(s).toLowerCase() === needle)) return k;
    return null;
  },

  _deps: {
    node(key) {
      return {
        quests: WBAPI.quests.byNode(key).map(q => q.id),
        npcs:   WBAPI.npcs.byNode(key).map(n => n.key),
      };
    },
    quest(id) { return { downstream: WBAPI.quests.chain(id).downstream }; },
    monster(key) {
      return { terrains: Object.entries(WBAPI.worldDb)
        .filter(([,t]) => (t.monsters||[]).some(m=>(typeof m==='string'?m:m?.key)===key))
        .map(([k])=>k) };
    },
    npc(key) {
      return {
        nodes: WBAPI.birkaNpcs[key]?.node ? [WBAPI.birkaNpcs[key].node] : [],
        quests: WBAPI._rawQuestSrc
          ? Object.keys(WBAPI.questDb).filter(()=>WBAPI._rawQuestSrc.includes(key))
          : [],
      };
    },
  },

  // ── Monsters ──
  monsters: {
    all()        { return Object.entries(WBAPI.monsterPool).map(([k,v])=>({...v,key:k,drop:WBAPI.monsterDrops[k]||null,terrains:WBAPI._monsterToTerrains[k]||[]})); },
    byTerrain(t) { return (WBAPI._terrainToMonsters[t]||[]).map(k=>({...WBAPI.monsterPool[k],key:k,drop:WBAPI.monsterDrops[k]||null})); },
    byTier(t)    { return WBAPI.monsters.all().filter(m=>m.tier===t); },
    get(idOrName){ const k=WBAPI._findKey(WBAPI.monsterPool,idOrName); return k?{...WBAPI.monsterPool[k],key:k,drop:WBAPI.monsterDrops[k]||null,terrains:WBAPI._monsterToTerrains[k]||[]}:null; },
    put(id,data) { WBAPI.monsterPool[id]={...(WBAPI.monsterPool[id]||{}),...data}; return {ok:true,key:id}; },
    delete(idOrName) {
      const k=WBAPI._findKey(WBAPI.monsterPool,idOrName); if(!k) return {ok:false,error:'not found'};
      const d=WBAPI._deps.monster(k); if(d.terrains.length) return {ok:false,blockedBy:d};
      delete WBAPI.monsterPool[k]; return {ok:true,key:k};
    },
    // Rename display name globally across all terrains.
    rename(idOrName, newDisplayName) {
      const k = WBAPI._findKey(WBAPI.monsterPool, idOrName);
      if (!k) return { ok:false, error:`"${idOrName}" not found` };
      const old = WBAPI.monsterPool[k].name;
      const r = WBAPI.editField('monster', k, 'name', newDisplayName);
      if (!r.ok) return r;
      return { ok:true, key:k, from:old, to:newDisplayName, terrains:WBAPI._monsterToTerrains[k]||[] };
    },
    // Create a new monster by copying an existing one, applying overrides.
    // Does NOT place it in any terrain — use worlds.swapMonster() for that.
    fork(sourceIdOrName, newKey, overrides) {
      const src = WBAPI.monsters.get(sourceIdOrName);
      if (!src) return { ok:false, error:`source "${sourceIdOrName}" not found` };
      if (WBAPI.monsterPool[newKey]) return { ok:false, error:`key "${newKey}" already exists` };
      const { key:_, drop:__, terrains:___, ...srcFields } = src;
      WBAPI.monsterPool[newKey] = { ...srcFields, ...(overrides||{}) };
      if (src.drop) WBAPI.monsterDrops[newKey] = { ...src.drop, ...(overrides?.drop||{}) };
      WBAPI._buildIndexes();
      return { ok:true, key:newKey, from:src.key, entry: WBAPI.monsterPool[newKey] };
    },
  },

  // ── Worlds (terrain-level operations) ──
  worlds: {
    all()        { return Object.entries(WBAPI.worldDb).map(([k,v])=>({...v,key:k})); },
    get(key)     { return WBAPI.worldDb[key] ? {...WBAPI.worldDb[key], key} : null; },
    monsterList(terrainKey) {
      return (WBAPI.worldDb[terrainKey]?.monsters||[]).map(m=>typeof m==='string'?m:m?.key||m?.name).filter(Boolean);
    },
    // Replace one monster key with another in a specific terrain's list.
    // Both keys must exist in MONSTER_POOL. Source key is not deleted globally.
    swapMonster(terrainKey, oldKey, newKey) {
      if (!WBAPI.worldDb[terrainKey]) return { ok:false, error:`terrain "${terrainKey}" not found` };
      if (!WBAPI.monsterPool[oldKey]) return { ok:false, error:`monster "${oldKey}" not in MONSTER_POOL` };
      if (!WBAPI.monsterPool[newKey]) return { ok:false, error:`monster "${newKey}" not in MONSTER_POOL — fork it first` };
      const list = WBAPI.worldDb[terrainKey].monsters;
      let swapped = false;
      WBAPI.worldDb[terrainKey].monsters = list.map(m => {
        const k = typeof m === 'string' ? m : m?.key;
        if (k === oldKey) { swapped = true; return newKey; }
        return m;
      });
      if (!swapped) return { ok:false, error:`"${oldKey}" not found in ${terrainKey} monster list` };
      WBAPI._buildIndexes();
      return { ok:true, terrain:terrainKey, replaced:oldKey, with:newKey };
    },
  },

  // ── NPCs ──
  npcs: {
    all() {
      const out=[];
      for(const [k,v] of Object.entries(WBAPI.birkaNpcs)) out.push({...v,key:k,nodeData:WBAPI.nodeMap[v.node]||null});
      for(const [code,node] of Object.entries(WBAPI.nodeMap))
        if(node.npc && !WBAPI.birkaNpcs[node.npc?.toLowerCase()?.replace(/\s/g,'_')])
          out.push({key:`_inline_${code}`,name:node.npc,occupation:'',node:code,nodeData:node,_inline:true});
      return out;
    },
    byNode(code) { return WBAPI.npcs.all().filter(n=>n.node===code); },
    get(idOrName){ const k=WBAPI._findKey(WBAPI.birkaNpcs,idOrName); return k?{...WBAPI.birkaNpcs[k],key:k,nodeData:WBAPI.nodeMap[WBAPI.birkaNpcs[k].node]||null}:null; },
    put(idOrName,data) {
      const k=WBAPI._findKey(WBAPI.birkaNpcs,idOrName)||idOrName;
      WBAPI.birkaNpcs[k]={...(WBAPI.birkaNpcs[k]||{}),...data}; return {ok:true,key:k};
    },
    delete(idOrName) {
      const k=WBAPI._findKey(WBAPI.birkaNpcs,idOrName); if(!k) return {ok:false,error:'not found'};
      const d=WBAPI._deps.npc(k); if(d.quests.length) return {ok:false,blockedBy:d};
      delete WBAPI.birkaNpcs[k]; return {ok:true,key:k};
    },
  },

  // ── Quests ──
  quests: {
    all()       { return Object.entries(WBAPI.questDb).map(([id,q])=>({...q,id})); },
    byNode(code){ return (WBAPI._questsByNode[code]||[]).map(id=>({...WBAPI.questDb[id],id})); },
    byType(t)   { return WBAPI.quests.all().filter(q=>q.type===t); },
    flags(id)   { return WBAPI._questFlags[id]||{reads:new Set(),writes:new Set()}; },
    chain(id) {
      const flags=WBAPI._questFlags[id]; if(!flags) return {upstream:[],downstream:[]};
      const up=new Set(), dn=new Set();
      for(const f of flags.reads) for(const qid of (WBAPI._flagToQuests[f]||{}).writes||[]) up.add(qid);
      for(const f of flags.writes) for(const qid of (WBAPI._flagToQuests[f]||{}).reads||[]) dn.add(qid);
      up.delete(id); dn.delete(id); return {upstream:[...up],downstream:[...dn]};
    },
    arcs() { return Object.keys(WBAPI._questArcs); },
    get(idOrTitle) {
      const k=WBAPI._findKey(WBAPI.questDb,idOrTitle); return k?{...WBAPI.questDb[k],id:k,chain:WBAPI.quests.chain(k)}:null;
    },
    put(idOrTitle,data) {
      const k=WBAPI._findKey(WBAPI.questDb,idOrTitle)||idOrTitle;
      WBAPI.questDb[k]={...(WBAPI.questDb[k]||{}),...data}; return {ok:true,key:k};
    },
    delete(idOrTitle) {
      const k=WBAPI._findKey(WBAPI.questDb,idOrTitle); if(!k) return {ok:false,error:'not found'};
      const d=WBAPI._deps.quest(k); if(d.downstream.length) return {ok:false,blockedBy:d};
      delete WBAPI.questDb[k]; return {ok:true,key:k};
    },
  },

  // ── Nodes ──
  nodes: {
    all()        { return Object.entries(WBAPI.nodeMap).map(([id,n])=>({...n,id})); },
    byAct(n)     { return Object.values(WBAPI.nodeMap).filter(nd=>nd.act===n); },
    withBattle() { return Object.values(WBAPI.nodeMap).filter(nd=>nd.battle); },
    withNPC()    { return Object.values(WBAPI.nodeMap).filter(nd=>nd.npc); },
    get(codeOrName) {
      const k=WBAPI._findKey(WBAPI.nodeMap,codeOrName); return k?{...WBAPI.nodeMap[k],id:k}:null;
    },
    put(codeOrName,data) {
      const k=WBAPI._findKey(WBAPI.nodeMap,codeOrName)||codeOrName;
      WBAPI.nodeMap[k]={...(WBAPI.nodeMap[k]||{}),...data}; return {ok:true,key:k};
    },
    delete(codeOrName) {
      const k=WBAPI._findKey(WBAPI.nodeMap,codeOrName); if(!k) return {ok:false,error:'not found'};
      const d=WBAPI._deps.node(k); if(d.quests.length||d.npcs.length) return {ok:false,blockedBy:d};
      delete WBAPI.nodeMap[k]; return {ok:true,key:k};
    },
  },

  // ── Location composite view ──
  location: {
    get(codeOrName) {
      const k=WBAPI._findKey(WBAPI.nodeMap,codeOrName); if(!k) return null;
      const node=WBAPI.nodes.get(k), terrainKey=node.name, terrain=WBAPI.worldDb[terrainKey]||null;
      return { node, terrainKey, terrain, monsters:terrain?WBAPI.monsters.byTerrain(terrainKey):[], quests:WBAPI.quests.byNode(k), npcs:WBAPI.npcs.byNode(k) };
    },
  },

  // ═══════════════════════════════════════════════════════════════════════
  // Write-back helpers
  // ═══════════════════════════════════════════════════════════════════════
  editField(type, idOrTitle, field, value) {
    if (!this._rawSrc) return { ok:false, error:'no source loaded' };
    const sectionMap = { quest:'QUEST_DB', node:'NODE_MAP', npc:'BIRKA_NPC', monster:'MONSTER_POOL' };
    const section = sectionMap[type]; if (!section) return { ok:false, error:'unknown type' };
    const col = { quest:this.questDb, node:this.nodeMap, npc:this.birkaNpcs, monster:this.monsterPool }[type];
    const key = this._findKey(col, idOrTitle); if (!key) return { ok:false, error:'not found' };

    const sectionSrc = extrSection(this._rawSrc, section);

    // null value → remove the field entirely
    if (value === null || value === undefined) {
      const patched = removeStringField(sectionSrc, key, field);
      if (!patched) return { ok:false, error:`field "${field}" not found on "${key}" or strip failed` };
      this._rawSrc = respliceSection(this._rawSrc, section, patched);
      delete col[key][field];
      return { ok:true, key, field, value:null, removed:true };
    }

    let patched = patchStringField(sectionSrc, key, field, String(value));
    const isNew = !patched;
    if (isNew) {
      patched = insertStringField(sectionSrc, key, field, String(value));
      if (!patched) return { ok:false, error:`entry "${key}" not found in ${section}` };
    }
    this._rawSrc = respliceSection(this._rawSrc, section, patched);
    col[key][field] = value;
    return { ok:true, key, field, value, inserted: isNew };
  },

  renameNodeKey(oldCode, newCode) {
    if (!this._rawSrc) return { ok:false, error:'no source loaded' };
    const sections = ['NODE_MAP', 'NODE_COORDS', 'BIRKA_NPC'];
    let totalChanges = 0;
    for (const sec of sections) {
      const S = `// ◆◆◆ WORLDBUILDER:${sec}:START ◆◆◆`;
      const E = `// ◆◆◆ WORLDBUILDER:${sec}:END ◆◆◆`;
      const aIdx = this._rawSrc.indexOf(S);
      const bIdx = this._rawSrc.indexOf(E);
      if (aIdx === -1 || bIdx === -1 || bIdx < aIdx) continue;
      const a = aIdx + S.length;
      const secSrc = this._rawSrc.slice(a, bIdx);
      // Match oldCode as an entry key: preceded by whitespace/comma/{, followed by optional whitespace + colon
      const re = new RegExp(`(?<=[,\\s{])${oldCode}(?=\\s*:)`, 'g');
      const patched = secSrc.replace(re, newCode);
      if (patched !== secSrc) {
        this._rawSrc = this._rawSrc.slice(0, a) + patched + this._rawSrc.slice(bIdx);
        totalChanges++;
      }
    }
    // Update inline code: field (e.g. code:'BK' → code:'VBY')
    const codeRe = new RegExp(`(\\bcode:\\s*['"\`])${oldCode}(['"\`])`, 'g');
    const srcBefore = this._rawSrc;
    this._rawSrc = this._rawSrc.replace(codeRe, `$1${newCode}$2`);
    if (this._rawSrc !== srcBefore) totalChanges++;
    return { ok:true, sections: totalChanges };
  },

  getStampedName(base) {
    base = base || path.basename(this._srcPath||'roll2hit-v3.html', '.html');
    const d = new Date();
    const ds = d.toISOString().slice(0,10).replace(/-/g,'');
    const ts = d.toISOString().slice(11,19).replace(/:/g,'');
    return `${base}-${ds}-${ts}.html`;
  },

  save(outputPath) {
    if (!this._rawSrc) return { ok:false, error:'no source loaded' };

    // Guard: coerced objects
    if (this._rawSrc.includes('[object Object]'))
      return { ok:false, error:'save aborted: source contains "[object Object]" — a non-string value was coerced during serialization' };

    // Guard: bare-identifier activateCond (undefined variable at runtime)
    const questSrc = extrSection(this._rawSrc, 'QUEST_DB') || '';
    const badConds = [];
    for (const m of questSrc.matchAll(/activateCond:\s*([^\s(,}][^,}]*)/g)) {
      const val = m[1].trim();
      if (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(val))
        badConds.push(val);
    }
    if (badConds.length)
      return { ok:false, error:`save aborted: ${badConds.length} activateCond value(s) are bare identifiers (not arrow functions) — will throw ReferenceError at runtime: ${badConds.slice(0,5).join(', ')}${badConds.length>5?' …':''}`};

    const dest = outputPath || this.getStampedName();
    fs.writeFileSync(dest, this._rawSrc, 'utf8');
    return { ok:true, path: path.resolve(dest) };
  },

  // ── Export world/ folder structure ──
  exportWorld(dir) {
    dir = path.resolve(dir);
    const slug = s => String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');

    for (const [code, node] of Object.entries(this.nodeMap)) {
      const nodeDir = path.join(dir, 'world', code);
      fs.mkdirSync(nodeDir, { recursive: true });
      const { npc, ...meta } = node;
      fs.writeFileSync(path.join(nodeDir,'node.json'), JSON.stringify({...meta,id:code},null,2));
    }

    for (const [key, npc] of Object.entries(this.birkaNpcs)) {
      const nodeCode = npc.node || 'BIRKA';
      const npcDir = path.join(dir,'world',nodeCode,'npcs',slug(npc.name||key));
      fs.mkdirSync(npcDir,{recursive:true});
      fs.writeFileSync(path.join(npcDir,'npc.json'),JSON.stringify({...npc,key},null,2));

      const npcQuests = this.quests.all().filter(q=>q.npc===key||(npc.name&&q.npc===npc.name));
      for (const q of npcQuests) this._writeQuestFiles(path.join(npcDir,'quests',q.id), q);
    }

    for (const q of this.quests.all()) {
      if (q.npc) continue;
      const nodeCode = q.activateNode || q.waypointNode || 'GLOBAL';
      this._writeQuestFiles(path.join(dir,'world',nodeCode,'quests',q.id), q);
    }

    for (const [key, m] of Object.entries(this.monsterPool)) {
      const mDir = path.join(dir,'monsters');
      fs.mkdirSync(mDir,{recursive:true});
      fs.writeFileSync(path.join(mDir,`${key}.json`),JSON.stringify({...m,key,drop:this.monsterDrops[key]||null},null,2));
    }
    return { ok:true, dir };
  },

  _writeQuestFiles(qDir, q) {
    fs.mkdirSync(qDir,{recursive:true});
    const textFields = ['title','hook','passText','failText','rewardText'];
    const meta = {}; const text = {};
    for (const [k,v] of Object.entries(q)) {
      if (textFields.includes(k)) text[k]=v;
      else meta[k]=v;
    }
    fs.writeFileSync(path.join(qDir,'meta.json'),JSON.stringify(meta,null,2));
    for (const [k,v] of Object.entries(text))
      fs.writeFileSync(path.join(qDir,`${k}.txt`),v||'');
  },

  // ── Sync world/ folder structure → in-memory + rawSrc ──
  syncWorld(dir) {
    dir = path.resolve(dir);
    const results = { edited:[], errors:[] };

    const walkQuests = (questsDir, context) => {
      if (!fs.existsSync(questsDir)) return;
      for (const qId of fs.readdirSync(questsDir)) {
        const qDir = path.join(questsDir, qId);
        if (!fs.statSync(qDir).isDirectory()) continue;
        const metaPath = path.join(qDir,'meta.json');
        if (fs.existsSync(metaPath)) {
          const meta = JSON.parse(fs.readFileSync(metaPath,'utf8'));
          const r = this.quests.put(qId,meta);
          if (r.ok) results.edited.push(`quest:${qId} meta`);
        }
        for (const f of ['title','hook','passText','failText','rewardText']) {
          const fp = path.join(qDir,`${f}.txt`);
          if (!fs.existsSync(fp)) continue;
          const val = fs.readFileSync(fp,'utf8').trim();
          const r = this.editField('quest', qId, f, val);
          if (r.ok) results.edited.push(`quest:${qId}.${f}`);
          else results.errors.push(`quest:${qId}.${f} — ${r.error}`);
        }
      }
    };

    const worldDir = path.join(dir,'world');
    if (fs.existsSync(worldDir)) {
      for (const code of fs.readdirSync(worldDir)) {
        const nodeDir = path.join(worldDir, code);
        if (!fs.statSync(nodeDir).isDirectory()) continue;
        const nodeMeta = path.join(nodeDir,'node.json');
        if (fs.existsSync(nodeMeta)) {
          const data = JSON.parse(fs.readFileSync(nodeMeta,'utf8'));
          this.nodes.put(code, data);
          results.edited.push(`node:${code}`);
        }
        const npcsDir = path.join(nodeDir,'npcs');
        if (fs.existsSync(npcsDir)) {
          for (const npcSlug of fs.readdirSync(npcsDir)) {
            const npcDir = path.join(npcsDir,npcSlug);
            const npcMeta = path.join(npcDir,'npc.json');
            if (fs.existsSync(npcMeta)) {
              const data = JSON.parse(fs.readFileSync(npcMeta,'utf8'));
              const key = data.key || npcSlug;
              this.npcs.put(key,data); results.edited.push(`npc:${key}`);
            }
            walkQuests(path.join(npcDir,'quests'), npcSlug);
          }
        }
        walkQuests(path.join(nodeDir,'quests'), code);
      }
    }

    const monstersDir = path.join(dir,'monsters');
    if (fs.existsSync(monstersDir)) {
      for (const f of fs.readdirSync(monstersDir).filter(f=>f.endsWith('.json'))) {
        const data = JSON.parse(fs.readFileSync(path.join(monstersDir,f),'utf8'));
        const key = data.key || f.replace('.json','');
        this.monsters.put(key,data); results.edited.push(`monster:${key}`);
      }
    }
    return results;
  },
};

module.exports = WBAPI;
