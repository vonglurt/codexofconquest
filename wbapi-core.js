// SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com
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
  const keyRe = new RegExp(`^([ \\t]*)${entryKey}\\s*:\\s*\\{`, 'gm');
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

// §WBAPI-01 ph3: serialize a JSON-safe value to codebase-style JS-literal text.
// Strings → single-quoted + escaped; numbers/booleans → as-is; null → 'null';
// arrays → [a,b,…]; flat objects → {key:val,…} (identifier keys unquoted, else quoted).
// Rejects functions/undefined/non-finite numbers (returns null) — those are out of scope
// (function-valued fields are §DATA-01 territory).
function serializeJsLiteral(v) {
  if (v === null) return 'null';
  const t = typeof v;
  if (t === 'string') return "'" + v.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r') + "'";
  if (t === 'number') return Number.isFinite(v) ? String(v) : null;
  if (t === 'boolean') return String(v);
  if (Array.isArray(v)) {
    const parts = [];
    for (const el of v) { const s = serializeJsLiteral(el); if (s === null) return null; parts.push(s); }
    return '[' + parts.join(',') + ']';
  }
  if (t === 'object') {
    const parts = [];
    for (const k of Object.keys(v)) {
      const s = serializeJsLiteral(v[k]); if (s === null) return null;
      const key = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(k) ? k : "'" + k.replace(/'/g, "\\'") + "'";
      parts.push(key + ':' + s);
    }
    return '{' + parts.join(',') + '}';
  }
  return null; // function, undefined, symbol, bigint
}

// §WBAPI-01 ph3: find the end index (exclusive) of a value starting at body[i],
// skipping balanced []/{}/() and strings/comments. For primitives (number/bool/
// null/identifier) scans the run of value chars. String/comment-aware.
function _valueEnd(body, i) {
  const c = body[i];
  if (c === '"' || c === "'" || c === '`') {
    const q = c; i++;
    while (i < body.length) {
      if (body[i] === '\\' && q !== '`') { i += 2; continue; }
      if (body[i] === q) return i + 1;
      i++;
    }
    return i;
  }
  if (c === '[' || c === '{' || c === '(') {
    const open = c, close = open === '[' ? ']' : open === '{' ? '}' : ')';
    let depth = 1; i++;
    while (i < body.length && depth > 0) {
      const ch = body[i];
      if (ch === '"' || ch === "'" || ch === '`') { i = _valueEnd(body, i); continue; }
      if (ch === '/' && body[i+1] === '/') { while (i < body.length && body[i] !== '\n') i++; continue; }
      if (ch === '[' || ch === '{' || ch === '(') depth++;
      else if (ch === ']' || ch === '}' || ch === ')') depth--;
      i++;
    }
    return i;
  }
  // primitive: number / true / false / null / identifier
  while (i < body.length && /[A-Za-z0-9_.+\-]/.test(body[i])) i++;
  return i;
}

// §WBAPI-01 ph3: replace an entire field value (array/object/primitive) in an entry
// body with a pre-serialized literal. Comment/string/bracket-aware so it never matches
// the field name inside prose or nested blocks. Returns patched sectionSrc, or null if
// the entry or a top-level `field:` key is not found.
function patchLiteralField(sectionSrc, entryKey, field, literal) {
  const b = findEntryBounds(sectionSrc, entryKey);
  if (!b) return null;
  const { openEnd, bodyEnd } = b;
  const body = sectionSrc.slice(openEnd, bodyEnd);
  // Token-walk the body top level (skip nested blocks/strings/comments) to find `field:`.
  let i = 0;
  while (i < body.length) {
    const c = body[i];
    if (c === '"' || c === "'" || c === '`') { i = _valueEnd(body, i); continue; }
    if (c === '/' && body[i+1] === '/') { while (i < body.length && body[i] !== '\n') i++; continue; }
    if (c === '{' || c === '[' || c === '(') { i = _valueEnd(body, i); continue; }
    if (/[A-Za-z_$]/.test(c)) {
      let j = i; while (j < body.length && /[A-Za-z0-9_$]/.test(body[j])) j++;
      const name = body.slice(i, j);
      let k = j; while (k < body.length && /[ \t]/.test(body[k])) k++;
      if (body[k] === ':' && name === field) {
        let v = k + 1; while (v < body.length && /[ \t\n\r]/.test(body[v])) v++;
        const ve = _valueEnd(body, v);
        const newBody = body.slice(0, v) + literal + body.slice(ve);
        return sectionSrc.slice(0, openEnd) + newBody + sectionSrc.slice(bodyEnd);
      }
      i = j; continue;
    }
    i++;
  }
  return null; // field not present at top level
}

// §CELL-14: strip a set of top-level fields from a single NODE_MAP entry body.
// String- and comment-aware so prose like text:"go N:..." is never matched.
// Skips into nested {}/[]/() blocks (so battle:{key:'N'} is safe).
// Handles values of form: null | "..." | '...' | `...` | identifiers | numbers.
// Removes the leading whitespace + a trailing comma (or, if only on its own line,
// the whole line including trailing newline).
// Returns { body, removed, perField:{name:count} }.
function _stripFieldsFromEntryBody(body, fieldSet) {
  const perField = {};
  const removals = []; // [{start, end, name}]

  function skipString(i) {
    const q = body[i]; i++;
    while (i < body.length) {
      if (body[i] === '\\' && q !== '`') { i += 2; continue; }
      if (body[i] === q) { i++; break; }
      i++;
    }
    return i;
  }
  function skipBalanced(i) {
    const open = body[i], close = open === '{' ? '}' : open === '[' ? ']' : ')';
    let depth = 1; i++;
    while (i < body.length && depth > 0) {
      const c = body[i];
      if (c === '"' || c === "'" || c === '`') { i = skipString(i); continue; }
      if (c === '/' && body[i+1] === '/') { while (i < body.length && body[i] !== '\n') i++; continue; }
      if (c === '/' && body[i+1] === '*') { i += 2; while (i < body.length && !(body[i] === '*' && body[i+1] === '/')) i++; i += 2; continue; }
      if (c === open) depth++;
      else if (c === close) depth--;
      i++;
    }
    return i;
  }

  let i = 0;
  while (i < body.length) {
    const c = body[i];
    if (c === '"' || c === "'" || c === '`') { i = skipString(i); continue; }
    if (c === '/' && body[i+1] === '/') { while (i < body.length && body[i] !== '\n') i++; continue; }
    if (c === '/' && body[i+1] === '*') { i += 2; while (i < body.length && !(body[i] === '*' && body[i+1] === '/')) i++; i += 2; continue; }
    if (c === '{' || c === '[' || c === '(') { i = skipBalanced(i); continue; }

    if (/[A-Za-z_$]/.test(c)) {
      let j = i;
      while (j < body.length && /[A-Za-z0-9_$]/.test(body[j])) j++;
      const name = body.slice(i, j);
      let k = j;
      while (k < body.length && /[ \t]/.test(body[k])) k++;
      if (body[k] === ':' && fieldSet.has(name)) {
        let v = k + 1;
        while (v < body.length && /[ \t]/.test(body[v])) v++;
        let valueEnd;
        if (body[v] === '"' || body[v] === "'" || body[v] === '`') {
          valueEnd = skipString(v);
        } else if (body[v] === '{' || body[v] === '[' || body[v] === '(') {
          // shouldn't happen for N/S/E/W/portal/spire but kept for safety
          valueEnd = skipBalanced(v);
        } else {
          valueEnd = v;
          while (valueEnd < body.length && /[A-Za-z0-9_.]/.test(body[valueEnd])) valueEnd++;
        }

        let removeStart = i;
        let removeEnd = valueEnd;
        while (removeEnd < body.length && /[ \t]/.test(body[removeEnd])) removeEnd++;
        if (body[removeEnd] === ',') {
          removeEnd++;
          while (removeEnd < body.length && /[ \t]/.test(body[removeEnd])) removeEnd++;
        }
        // If the field sits alone on its own line, swallow the line break too.
        let lineStart = removeStart;
        while (lineStart > 0 && /[ \t]/.test(body[lineStart - 1])) lineStart--;
        const atLineStart = lineStart === 0 || body[lineStart - 1] === '\n';
        const atLineEnd = removeEnd === body.length || body[removeEnd] === '\n';
        if (atLineStart && atLineEnd) {
          removeStart = lineStart;
          if (body[removeEnd] === '\n') removeEnd++;
        }
        removals.push({ start: removeStart, end: removeEnd, name });
        perField[name] = (perField[name] || 0) + 1;
        i = removeEnd;
        continue;
      }
      i = j;
      continue;
    }
    i++;
  }

  if (!removals.length) return { body, removed: 0, perField };
  let out = body;
  for (let r = removals.length - 1; r >= 0; r--)
    out = out.slice(0, removals[r].start) + out.slice(removals[r].end);
  return { body: out, removed: removals.length, perField };
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
// §ARCH-02: Operand Registry — 12 atomic quest bit contracts
// ═══════════════════════════════════════════════════════════════════════════
const OPERAND_CONTRACTS = {
  talk_at:      { required:['node'],
                  optional:['npcKey','objectKey','requiresItem','dialogue'],
                  gate:'S.currentNode === node', complete:'talked flag set' },
  skill_check:  { required:['ability','dc','label','passText','failText'],
                  optional:['retryable','retryGateDays','passFlag'],
                  gate:'player at activateNode', complete:'rolled, result recorded' },
  navigate:     { required:['fromNode','toNode'], optional:['hint'],
                  gate:'S.currentNode === fromNode', complete:'S.currentNode === toNode' },
  kill_at:      { required:['node','monsterKey'], optional:['count','targetLabel','killFlag'],
                  gate:'at node with battle field', complete:'kill flag set' },
  escort:       { required:['npcKey','fromNode','toNode'],
                  optional:['partySlot','combatRisk','failFlag'],
                  gate:'at fromNode, party slot empty', complete:'at toNode with NPC in party' },
  talk_party:   { required:['npcKey'],
                  optional:['partySlot','trigger','dialogue','talkFlag'],
                  gate:'NPC in party slot', complete:'talkFlag set' },
  deliver:      { required:['item','toNode'],
                  optional:['fromNode','recipient','consumeOnDeliver'],
                  gate:'item in inventory', complete:'at toNode' },
  collect_item: { required:['item'], optional:['icon','sell','unique'],
                  gate:'previous operand complete', complete:'item in inventory' },
  consume_item: { required:['item'], optional:['failText'],
                  gate:'item in inventory', complete:'item removed' },
  investigate:  { required:['node','target'],
                  optional:['skillCheck','reveals','narrativeText','investigateFlag'],
                  gate:'S.currentNode === node', complete:'investigateFlag set' },
  flag_gate:    { required:[], optional:['requires','requiresAny','blocks'],
                  gate:'evaluated against S_story', complete:'gate passes (not an action)' },
  choice:       { required:['prompt','options'], optional:[],
                  gate:'previous operand complete', complete:'one option chosen and resolved' },
};

// ── §WORLDBUILDER-02 Phase 2: operational-class classifier ──────────────────
// Maps a quest object → one of 11 operational classes (§WORLDBUILDER-02-B).
// Classification is deterministic from existing QUEST_DB fields.
// `survival` is not auto-detectable from current fields and is excluded.
function _classifyQuest(q) {
  const t = q.type || 'side';
  if (t === 'main')        return 'main';
  if (t === 'epic')        return 'epic';
  if (t === 'skill_check') return 'skill_check';
  if (t === 'combat')      return 'hunt';
  if (t === 'delivery')    return 'collect';
  if (t === 'escort')      return 'escort';
  if (t === 'dialogue')    return 'talk_chain';
  if (t === 'hybrid')      return 'investigation';
  // side: infer from secondary signals
  const hasItems   = !!(q.completeItems && q.completeItems.length > 0);
  const hasWaypoint = !!(q.waypointNode && q.waypointNode !== q.activateNode);
  if (t === 'side') {
    if (hasItems && hasWaypoint) return 'collect';
    if (hasItems)                return 'lore_collect';
    if (hasWaypoint)             return 'gate_pass';
    return 'talk_chain';
  }
  return 'talk_chain';
}

// ═══════════════════════════════════════════════════════════════════════════
// WBAPI
// ═══════════════════════════════════════════════════════════════════════════
const WBAPI = {
  nodeMap: {}, nodeCoords: {}, questDb: {}, monsterPool: {},
  monsterDrops: {}, worldDb: {}, birkaNpcs: {},
  fishPool: [], nightFishPool: [], lakeMagicDb: {}, itemDb: {}, npcDialogues: {}, d100Table: [],
  _terrainToMonsters: {}, _monsterToTerrains: {},
  _questsByNode: {}, _questsByNpc: {}, _questsByWaypoint: {},
  _questFlags: {}, _flagToQuests: {}, _questArcs: {},
  _rawQuestSrc: '',
  _rawSrc: null,
  _srcPath: null,
  loaded: false,
  _pendingPatches: null, // null = inactive; Map<code, Map<field, value|null>> when active

  load(filePathOrText) {
    let src;
    if (filePathOrText.includes('\n') || !filePathOrText.endsWith('.html')) {
      src = filePathOrText;
    } else {
      this._srcPath = path.resolve(filePathOrText);
      src = fs.readFileSync(this._srcPath, 'utf8');
    }
    this._rawSrc = src;
    // Clear pending patches on reload — the new source is the ground truth.
    // Keep the queue active (don't null it) so subsequent edits still queue.
    if (this._pendingPatches !== null) this._pendingPatches = new Map();

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
    this._questsByNode = {}; this._questsByNpc = {}; this._questsByWaypoint = {};
    for (const [id, q] of Object.entries(this.questDb)) {
      for (const field of ['activateNode','waypointNode'])
        if (q[field]) {
          if (!this._questsByNode[q[field]]) this._questsByNode[q[field]] = [];
          this._questsByNode[q[field]].push(id);
        }
      if (q.waypointNode) {
        if (!this._questsByWaypoint[q.waypointNode]) this._questsByWaypoint[q.waypointNode] = [];
        this._questsByWaypoint[q.waypointNode].push(id);
      }
      if (q.npc) {
        if (!this._questsByNpc[q.npc]) this._questsByNpc[q.npc] = [];
        this._questsByNpc[q.npc].push(id);
      }
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
        quests: WBAPI._questsByNpc[key] || [],
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
    classify(id){ const q=WBAPI.questDb[id]; return q ? _classifyQuest(q) : null; },
    byClass(cls){ return WBAPI.quests.all().filter(q=>_classifyQuest(q)===cls); },
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

    // §ARCH-02 Phase 1 — field-level validity check
    validate(id) {
      const q = WBAPI.questDb[id]; if (!q) return {ok:false,errors:[`quest "${id}" not found`]};
      const errors = [];
      const VALID_TYPES = ['side','skill_check','main','epic','combat','hybrid','escort','dialogue','delivery'];
      if (!q.title) errors.push('missing title');
      if (!VALID_TYPES.includes(q.type)) errors.push(`invalid type "${q.type}" — expected: ${VALID_TYPES.join(', ')}`);
      if (!q.activateNode) errors.push('missing activateNode');
      if (q.type === 'skill_check') {
        const VA = ['wis','int','str','dex','con','cha'];
        if (!q.checkAbility) errors.push('skill_check missing checkAbility');
        else if (!VA.includes(q.checkAbility)) errors.push(`invalid checkAbility "${q.checkAbility}"`);
        if (q.checkDC == null) errors.push('skill_check missing checkDC');
        else if (typeof q.checkDC !== 'number') errors.push('checkDC must be a number');
      }
      if (q.xpAward != null && typeof q.xpAward !== 'number') errors.push('xpAward must be a number');
      return {ok: errors.length === 0, errors};
    },

    // §ARCH-02 Phase 1 — world-logic cross-reference advisory
    advise(id) {
      const q = WBAPI.questDb[id]; if (!q) return {ok:false,warnings:[`quest "${id}" not found`]};
      const warnings = [];
      if (q.activateNode && !WBAPI.nodeMap[q.activateNode]) warnings.push(`activateNode "${q.activateNode}" not in NODE_MAP`);
      if (q.waypointNode && !WBAPI.nodeMap[q.waypointNode]) warnings.push(`waypointNode "${q.waypointNode}" not in NODE_MAP`);
      const npcKey = q.npc || q.npcKey;
      if (npcKey) {
        const inBirka = !!WBAPI.birkaNpcs[npcKey];
        const inMap   = Object.values(WBAPI.nodeMap).some(n => n.npc && n.npc.toLowerCase().replace(/\s/g,'_') === npcKey);
        if (!inBirka && !inMap) warnings.push(`npc "${npcKey}" not found in BIRKA_NPC or NODE_MAP`);
      }
      const chain = WBAPI.quests.chain(id);
      return {ok: warnings.length === 0, warnings, chain};
    },

    // §ARCH-02 Phase 1 — heuristic mapping of quest fields → operand bit sequence
    toOperands(id) {
      const q = WBAPI.questDb[id]; if (!q) return null;
      const bits = [];
      const flags = WBAPI._questFlags[id];
      if (flags && flags.reads.size > 0)
        bits.push({kind:'flag_gate', requires:[...flags.reads], _note:'inferred from flag reads'});
      if (q.activateNode && q.waypointNode && q.activateNode !== q.waypointNode)
        bits.push({kind:'navigate', fromNode:q.activateNode, toNode:q.waypointNode, hint:q.hint||undefined});
      if (q.type === 'skill_check' && q.checkAbility && q.checkDC != null)
        bits.push({kind:'skill_check', ability:q.checkAbility, dc:q.checkDC, label:q.checkLabel||'', passText:q.passText||'', failText:q.failText||'', retryable:q.retryable||false});
      if (bits.filter(b=>b.kind!=='flag_gate'&&b.kind!=='navigate').length === 0 && q.activateNode)
        bits.push({kind:'talk_at', node:q.waypointNode||q.activateNode, npcKey:q.npc||q.npcKey||undefined});
      return {id, type:q.type, bits};
    },
  },

  // ── §ARCH-02 Phase 1: Operand namespace ──
  operands: {
    list()        { return Object.keys(OPERAND_CONTRACTS); },
    contract(kind){ return OPERAND_CONTRACTS[kind] || null; },
    validate(bit) {
      if (!bit || !bit.kind) return {ok:false,errors:['missing kind']};
      const c = OPERAND_CONTRACTS[bit.kind];
      if (!c) return {ok:false,errors:[`unknown kind "${bit.kind}"`]};
      const errors = c.required
        .filter(f => bit[f] === undefined || bit[f] === null || bit[f] === '')
        .map(f => `missing required field "${f}"`);
      return {ok: errors.length === 0, errors};
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
    profile(codeOrName) {
      const base = WBAPI.location.get(codeOrName);
      if (!base) return null;
      const code = base.node.id;
      const questIds = WBAPI._questsByNode[code] || [];
      const quests = questIds.map(id => {
        const q = WBAPI.questDb[id] || {};
        return { ...q, id, operationalClass: _classifyQuest(q) };
      });
      const activateSet = new Set(questIds);
      const waypointIds = (WBAPI._questsByWaypoint[code] || []).filter(id => !activateSet.has(id));
      const waypointQuests = waypointIds.map(id => {
        const q = WBAPI.questDb[id] || {};
        return { id, title:q.title||null, type:q.type||null, operationalClass:_classifyQuest(q), activateNode:q.activateNode||null };
      });
      const npcs = base.npcs.map(n => ({
        ...n, questCount: (WBAPI._questsByNpc[n.key] || []).length,
      }));
      const inlineKey = base.node.npc;
      if (inlineKey && !npcs.find(n => n.key === inlineKey))
        npcs.push({ key:inlineKey, name:inlineKey, questCount:(WBAPI._questsByNpc[inlineKey]||[]).length, inline:true });
      const flagReadsSet = new Set(), flagWritesSet = new Set();
      for (const id of [...questIds, ...waypointIds]) {
        const fl = WBAPI._questFlags[id];
        if (fl) { for (const f of fl.reads) flagReadsSet.add(f); for (const f of fl.writes) flagWritesSet.add(f); }
      }
      return { ...base, quests, waypointQuests, npcs, flagReads:[...flagReadsSet], flagWrites:[...flagWritesSet] };
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

    // ── patch queue: defer source write, update in-memory immediately ────────
    // Only queue node edits — quest/npc/monster sections are small and infrequent.
    if (this._pendingPatches !== null && type === 'node') {
      if (!this._pendingPatches.has(key)) this._pendingPatches.set(key, new Map());
      this._pendingPatches.get(key).set(field, value ?? null);
      if (value === null || value === undefined) delete col[key][field];
      else col[key][field] = value;
      return { ok:true, key, field, value, deferred:true };
    }

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

  // §WBAPI-01 ph3: edit a structured (array/object/number/boolean) field at SOURCE level,
  // so it persists through save() (which writes the patched _rawSrc, not a re-serialization).
  // Mirrors editField but serializes the value to a JS literal and replaces the whole value.
  // Falls back to inserting the field if absent. Strings/null still belong to editField.
  editStructuredField(type, idOrTitle, field, value) {
    if (!this._rawSrc) return { ok:false, error:'no source loaded' };
    const sectionMap = { quest:'QUEST_DB', node:'NODE_MAP', npc:'BIRKA_NPC', monster:'MONSTER_POOL' };
    const section = sectionMap[type]; if (!section) return { ok:false, error:'unknown type' };
    const col = { quest:this.questDb, node:this.nodeMap, npc:this.birkaNpcs, monster:this.monsterPool }[type];
    const key = this._findKey(col, idOrTitle); if (!key) return { ok:false, error:'not found' };

    const literal = serializeJsLiteral(value);
    if (literal === null) return { ok:false, error:`value for "${field}" is not JSON-serializable (functions/undefined not supported)` };

    const sectionSrc = extrSection(this._rawSrc, section);
    let patched = patchLiteralField(sectionSrc, key, field, literal);
    const isNew = !patched;
    if (isNew) {
      // Insert a new field with a raw (unquoted) literal before the entry's closing brace.
      const bnd = findEntryBounds(sectionSrc, key);
      if (!bnd) return { ok:false, error:`entry "${key}" not found in ${section}` };
      const { openEnd, bodyEnd, baseIndent } = bnd;
      const body = sectionSrc.slice(openEnd, bodyEnd);
      let newBody = body.trimEnd();
      if (newBody && !newBody.endsWith(',')) newBody += ',';
      newBody += `\n${baseIndent}  ${field}:${literal},\n${baseIndent}`;
      patched = sectionSrc.slice(0, openEnd) + newBody + sectionSrc.slice(bodyEnd);
    }
    this._rawSrc = respliceSection(this._rawSrc, section, patched);
    col[key][field] = value;
    return { ok:true, key, field, value, inserted: isNew, strategy:'editStructuredField' };
  },

  // beginPatchQueue: activate deferred writes for node editField calls.
  // Call once at the start of a long operation (e.g. reweave-all).
  // editField will update nodeMap immediately but defer _rawSrc writes.
  // Call flushPatches() (or batchSave) to materialize all queued writes at once.
  beginPatchQueue() {
    this._pendingPatches = new Map();
  },

  // flushPatches: materialize all queued node edits into _rawSrc in one pass.
  // Returns {applied, failed, cleared} and resets the queue (leaves it active).
  flushPatches() {
    if (!this._pendingPatches || this._pendingPatches.size === 0)
      return { applied:0, failed:0, cleared:0 };
    const edits = [];
    for (const [code, fieldMap] of this._pendingPatches)
      for (const [field, value] of fieldMap)
        edits.push({ code, field, value });
    const cleared = this._pendingPatches.size;
    this._pendingPatches = new Map(); // reset but keep queue active
    if (!edits.length) return { applied:0, failed:0, cleared };
    const r = this.batchEditNode(edits);
    return { applied: r.applied, failed: r.failed, cleared };
  },

  // stopPatchQueue: flush all pending patches and deactivate the queue.
  stopPatchQueue() {
    const r = this.flushPatches();
    this._pendingPatches = null;
    return r;
  },

  // batchEditNode: apply many {code, field, value} node edits in ONE respliceSection call.
  // O(M) memory: groups edits by node, applies all fields to each node's small body string,
  // then rebuilds sectionSrc with one array-join (no intermediate full-section string copies).
  // edits: [{code, field, value}, ...] — value=null removes the field.
  batchEditNode(edits) {
    if (!this._rawSrc || !edits.length) return { ok:true, applied:0, failed:0 };
    const sectionSrc = extrSection(this._rawSrc, 'NODE_MAP');
    if (!sectionSrc) return { ok:true, applied:0, failed:0 };
    let applied = 0, failed = 0;

    // Group edits by code so each node entry is found and modified exactly once.
    const byCode = new Map();
    for (const {code, field, value} of edits) {
      if (!byCode.has(code)) byCode.set(code, []);
      byCode.get(code).push({field, value});
    }

    // Collect (start, end, newBody) replacements using original sectionSrc offsets.
    const replacements = [];
    for (const [code, fields] of byCode) {
      const key = this._findKey(this.nodeMap, code);
      if (!key) { failed += fields.length; continue; }
      const b = findEntryBounds(sectionSrc, key);
      if (!b) { failed += fields.length; continue; }
      const { openEnd, bodyEnd, baseIndent } = b;
      // body is only this node's content between { and } — typically a few hundred bytes.
      let body = sectionSrc.slice(openEnd, bodyEnd);
      for (const {field, value} of fields) {
        if (value === null || value === undefined) {
          const prev = body;
          body = body
            .replace(new RegExp(`,\\s*${field}\\s*:\\s*(['"\`])[^\\1]*?\\1`), '')
            .replace(new RegExp(`${field}\\s*:\\s*(['"\`])[^\\1]*?\\1,?\\s*`), '');
          if (body !== prev) { if (this.nodeMap[key]) delete this.nodeMap[key][field]; applied++; }
          else { body = prev; failed++; }
        } else {
          const escaped = String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
          const fieldRe = new RegExp(`(\\b${field}\\s*:\\s*)(["\`'])(.*?)\\2`, 'm');
          if (fieldRe.test(body)) {
            body = body.replace(fieldRe, (_, pre) => `${pre}"${escaped}"`);
            applied++;
          } else {
            const trimmed = body.trimEnd();
            const fieldIndent = baseIndent + '  ';
            body = (trimmed && !trimmed.endsWith(',') ? trimmed + ',' : trimmed) +
                   `\n${fieldIndent}${field}:"${escaped}",\n${baseIndent}`;
            applied++;
          }
          if (this.nodeMap[key]) this.nodeMap[key][field] = value;
        }
      }
      replacements.push({ start: openEnd, end: bodyEnd, body });
    }

    if (!replacements.length) return { ok:true, applied, failed };

    // Sort by position and build new sectionSrc in one forward pass — O(M) allocation.
    replacements.sort((a, b) => a.start - b.start);
    const parts = [];
    let pos = 0;
    for (const {start, end, body} of replacements) {
      if (start > pos) parts.push(sectionSrc.slice(pos, start));
      parts.push(body);
      pos = end;
    }
    if (pos < sectionSrc.length) parts.push(sectionSrc.slice(pos));

    this._rawSrc = respliceSection(this._rawSrc, 'NODE_MAP', parts.join(''));
    return { ok:true, applied, failed };
  },

  // ─────────────────────────────────────────────────────────────────────────
  // §CELL-14 migration: strip dead exit fields from every NODE_MAP entry.
  // Operates on the raw source — handles both `N:null` and `N:"CODE"` forms,
  // and is string/comment-aware so prose containing "N:" inside text fields
  // is never matched. Updates in-memory nodeMap to mirror the source.
  //
  //   fields      — array of field names to strip, e.g. ['N','S','E','W','portal','spire']
  //   opts.dryRun — if true, returns the plan without mutating _rawSrc or nodeMap
  // Returns { ok, nodesTouched, totalRemoved, perField, sampleNode }.
  stripExitFields(fields, opts = {}) {
    if (!this._rawSrc) return { ok:false, error:'no source loaded' };
    if (!Array.isArray(fields) || fields.length === 0)
      return { ok:false, error:'fields array required' };
    const FIELD_SET = new Set(fields);
    const dryRun = !!opts.dryRun;

    const sectionSrc = extrSection(this._rawSrc, 'NODE_MAP');
    if (!sectionSrc) return { ok:false, error:'NODE_MAP section markers not found' };

    const perField = Object.fromEntries(fields.map(f => [f, 0]));
    const replacements = [];
    let nodesTouched = 0;
    let totalRemoved = 0;
    let sampleNode = null;

    for (const code of Object.keys(this.nodeMap)) {
      const b = findEntryBounds(sectionSrc, code);
      if (!b) continue;
      const { openEnd, bodyEnd } = b;
      const body = sectionSrc.slice(openEnd, bodyEnd);
      const r = _stripFieldsFromEntryBody(body, FIELD_SET);
      if (r.removed === 0) continue;
      nodesTouched++;
      totalRemoved += r.removed;
      for (const [f, n] of Object.entries(r.perField)) perField[f] += n;
      if (!sampleNode) sampleNode = { code, before: body.slice(0, 200), after: r.body.slice(0, 200) };
      replacements.push({ start: openEnd, end: bodyEnd, body: r.body });
      if (!dryRun) {
        for (const f of fields) if (f in this.nodeMap[code]) delete this.nodeMap[code][f];
      }
    }

    if (dryRun || replacements.length === 0)
      return { ok:true, nodesTouched, totalRemoved, perField, sampleNode, dryRun };

    replacements.sort((a, b) => a.start - b.start);
    const parts = [];
    let pos = 0;
    for (const { start, end, body } of replacements) {
      if (start > pos) parts.push(sectionSrc.slice(pos, start));
      parts.push(body);
      pos = end;
    }
    if (pos < sectionSrc.length) parts.push(sectionSrc.slice(pos));
    this._rawSrc = respliceSection(this._rawSrc, 'NODE_MAP', parts.join(''));
    return { ok:true, nodesTouched, totalRemoved, perField, sampleNode, dryRun:false };
  },

  // Remove a node entry from NODE_MAP source using brace-depth tracking.
  // Handles both single-line and multi-line entries (insertStringField makes entries multi-line
  // after direction fields are added). Returns true if removed, false if not found.
  deleteNodeSource(code) {
    if (!this._rawSrc) return false;
    const S = '// ◆◆◆ WORLDBUILDER:NODE_MAP:START ◆◆◆';
    const E = '// ◆◆◆ WORLDBUILDER:NODE_MAP:END ◆◆◆';
    const am = this._rawSrc.indexOf(S) + S.length;
    const em = this._rawSrc.indexOf(E);
    if (am < S.length || em < 0) return false;
    const sec = this._rawSrc.slice(am, em);
    const keyRe = new RegExp(`^([ \\t]*)${code}\\s*:\\s*\\{`, 'gm');
    const km = keyRe.exec(sec);
    if (!km) return false;
    const lineStart = km.index;
    const openEnd = km.index + km[0].length;
    let depth = 1, i = openEnd, inStr = null;
    while (i < sec.length) {
      const c = sec[i];
      if (inStr) {
        if (c === '\\' && inStr !== '`') { i += 2; continue; }
        if (c === inStr) inStr = null;
      } else if (c === '/' && sec[i+1] === '/') {
        while (i < sec.length && sec[i] !== '\n') i++;
        continue;
      } else {
        if (c === '"' || c === "'" || c === '`') inStr = c;
        else if (c === '{') depth++;
        else if (c === '}') { depth--; if (depth === 0) break; }
      }
      i++;
    }
    if (depth !== 0) return false;
    let end = i + 1;
    while (end < sec.length && sec[end] !== '\n') end++;
    if (end < sec.length) end++;
    this._rawSrc = this._rawSrc.slice(0, am) + sec.slice(0, lineStart) + sec.slice(end) + this._rawSrc.slice(em);
    return true;
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
    // Strip any cascaded timestamps to prevent runaway filename growth
    base = base.replace(/(-\d{8}-\d{6})+$/, '');
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

WBAPI._classifyQuest = _classifyQuest; // expose for server routes and direct use
module.exports = WBAPI;
