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

// §DX-01c — locate a section's OWN closing `};` in the raw source.
//
// A WORLDBUILDER section's object closes BEFORE any nested section begins, and
// MONSTER_POOL is the one live nest: its END anchor sits *after* MONSTER_DROPS:END
// in roll2hit-v3.html, so the obvious "last `};` before our END anchor" finds the
// TROPHY-DROPS map's brace. That is exactly where every `post monster` entry landed
// for as long as the route existed (WBAPI Hazard #2) — the entry was written to a
// real section, just the wrong one, which is why it never threw. Stop the search at
// the first nested START anchor instead.
//
// Returns the index of the '\n' beginning the section's own `};`, or -1.
function sectionCloseIdx(src, name) {
  const S = `// ◆◆◆ WORLDBUILDER:${name}:START ◆◆◆`;
  const E = `// ◆◆◆ WORLDBUILDER:${name}:END ◆◆◆`;
  const a = src.indexOf(S), b = src.indexOf(E);
  if (a === -1 || b <= a) return -1;
  let limit = b;
  const nestedRe = /\/\/ ◆◆◆ WORLDBUILDER:[A-Z0-9_]+:START ◆◆◆/g;
  nestedRe.lastIndex = a + S.length;
  const nested = nestedRe.exec(src);
  if (nested && nested.index < b) limit = nested.index;
  const idx = src.lastIndexOf('\n};', limit);
  return idx > a ? idx : -1;
}

// §DX-01d/i — comment/string-safe token scan over an object-literal body.
//
// Moved here from scripts/check-dupkeys.js so the duplicate-key gate and the
// source-level deleters share ONE scanner. Two scanners drift, and a scanner
// that disagrees with the parser is exactly the §AUDIT-03f silent-drop class
// (a section comment holding an arrow-fn example ate two whole quests).
//
// Yields, in source order:
//   {open:'{'|'[' , index}   {close:'}'|']' , index}   {key, index}
// for every `key:` / `'key':` in KEY POSITION (first token after `{` or `,`).
// Handles // and /* */ comments and ' " ` strings (escapes honored, template
// interiors opaque). Ternary `cond ? a : b` colons never sit in key position,
// so they are ignored by construction.
function* scanTokens(body) {
  let i = 0, expectKey = false;
  const n = body.length;
  while (i < n) {
    const ch = body[i];
    if (ch === '/' && body[i + 1] === '/') { i = body.indexOf('\n', i); if (i < 0) return; continue; }
    if (ch === '/' && body[i + 1] === '*') { i = body.indexOf('*/', i); if (i < 0) return; i += 2; continue; }
    if (ch === "'" || ch === '"' || ch === '`') {
      const q = ch; const strStart = i; i++;
      while (i < n && body[i] !== q) { if (body[i] === '\\') i++; i++; }
      // a quoted string in key position is a quoted property name
      if (expectKey) {
        let j = i + 1; while (j < n && /\s/.test(body[j])) j++;
        if (body[j] === ':') yield { key: body.slice(strStart + 1, i), index: strStart };
        expectKey = false;
      }
      i++; continue;
    }
    if (ch === '{' || ch === '[') { yield { open: ch, index: i }; expectKey = ch === '{'; i++; continue; }
    if (ch === '}' || ch === ']') { yield { close: ch, index: i }; expectKey = false; i++; continue; }
    if (ch === ',') { expectKey = true; i++; continue; }
    if (expectKey && /[A-Za-z_$]/.test(ch)) {
      let j = i; while (j < n && /[A-Za-z0-9_$]/.test(body[j])) j++;
      let k = j; while (k < n && /\s/.test(body[k])) k++;
      if (body[k] === ':' && body[k + 1] !== ':') yield { key: body.slice(i, j), index: i };
      expectKey = false; i = j; continue;
    }
    if (!/\s/.test(ch)) expectKey = false;
    i++;
  }
}

// The depth-1 key list (entry names, in source order, duplicates preserved) of a
// section body. Duplicates matter: the multiset is what proves a delete removed
// exactly one entry and nothing else.
function sectionTopKeys(body) {
  const keys = [], stack = [];
  for (const t of scanTokens(body)) {
    if (t.open)  { stack.push(t.open); continue; }
    if (t.close) { stack.pop(); continue; }
    if (stack.length === 1) keys.push(t.key);
  }
  return keys;
}

// Character span [start,end) of ONE depth-1 entry inside a section body —
// including its leading indentation, its trailing comma, any same-line trailing
// comment, and the newline that ends it. Returns null when the key is absent.
function entrySpan(body, key) {
  const stack = [];
  let start = -1, depthAtStart = -1, end = -1;
  for (const t of scanTokens(body)) {
    if (t.open) { stack.push(t.open); continue; }
    if (t.close) {
      const before = stack.length;
      stack.pop();
      if (start === -1) continue;
      if (before === depthAtStart + 1) { end = t.index + 1; break; }  // the entry's own value closed
      if (before === depthAtStart)     { end = t.index; break; }      // section closed first (primitive tail)
      continue;
    }
    if (start === -1) {
      if (stack.length === 1 && t.key === key) { start = t.index; depthAtStart = stack.length; }
      continue;
    }
    // a sibling key while still at the entry's own depth → the value was a primitive
    if (stack.length === depthAtStart) { end = t.index; break; }
  }
  if (start === -1) return null;
  if (end === -1) end = body.length;

  // Take the whole line when only indentation precedes the key.
  const lineStart = body.lastIndexOf('\n', start) + 1;
  const cutStart = body.slice(lineStart, start).trim() === '' ? lineStart : start;

  // Absorb the trailing comma, then the rest of the line if it is blank or a comment.
  let e = end;
  while (e < body.length && (body[e] === ' ' || body[e] === '\t')) e++;
  if (body[e] === ',') e++;
  let eol = e;
  while (eol < body.length && body[eol] !== '\n') eol++;
  const tail = body.slice(e, eol).trim();
  if (tail === '' || tail.startsWith('//')) e = eol < body.length ? eol + 1 : eol;

  return { start: cutStart, end: e };
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
    // Comments copy through verbatim — a `foo:()=>…` example inside a section
    // comment must never trigger the fn-stripper (§AUDIT-03f: it swallowed the
    // whole next entry up to the first depth-0 comma, silently dropping
    // quest_sea_01/quest_sb_01 from every WBAPI parse).
    if (c === '/' && src[i+1] === '/') {
      while (i < src.length && src[i] !== '\n') out += src[i++];
      continue;
    }
    if (c === '/' && src[i+1] === '*') {
      out += src[i++]; out += src[i++];
      while (i < src.length && !(src[i] === '*' && src[i+1] === '/')) out += src[i++];
      if (i < src.length) { out += src[i++]; out += src[i++]; }
      continue;
    }
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
            } else if (cc === '/' && src[k+1] === '/') { while (k < src.length && src[k] !== '\n') k++; }
            else if (cc === '/' && src[k+1] === '*') { k += 2; while (k < src.length && !(src[k] === '*' && src[k+1] === '/')) k++; k += 2; }
            else if (cc === '{') { depth++; k++; }
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
            } else if (cc === '/' && src[k+1] === '/') { while (k < src.length && src[k] !== '\n') k++; }
            else if (cc === '/' && src[k+1] === '*') { k += 2; while (k < src.length && !(src[k] === '*' && src[k+1] === '/')) k++; k += 2; }
            else if ('([{'.includes(cc)) { depth++; k++; }
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
// §AUDIT-03b — return the first regex match that sits at brace/bracket depth 0 of `body`,
// skipping string literals and comments (the comment-awareness hazard class, §AUDIT-03f).
// `re` must carry the /g flag. Returns the RegExp match object, or null if none qualifies.
function firstTopLevelMatch(body, re) {
  // Precompute the depth at every index once, so N candidate matches cost one scan.
  // depth[i] === 0 means "index i is real code at the entry's own top level".
  // Anything inside a string, a comment, or a nested {}/[]/() gets a non-zero marker,
  // so a candidate match there can never be chosen.
  const IN = -1;                       // sentinel for string/comment interiors
  const depth = new Int32Array(body.length + 1).fill(IN);
  let d = 0, i = 0;
  while (i < body.length) {
    const c = body[i], n = body[i + 1];
    if (c === '/' && n === '/') {                       // line comment
      while (i < body.length && body[i] !== '\n') i++;
      continue;
    }
    if (c === '/' && n === '*') {                       // block comment
      i += 2;
      while (i < body.length && !(body[i] === '*' && body[i + 1] === '/')) i++;
      i += 2;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') {          // string literal
      const q = c; i++;
      while (i < body.length) {
        if (body[i] === '\\' && q !== '`') { i += 2; continue; }
        if (body[i] === q) { i++; break; }
        i++;
      }
      continue;
    }
    depth[i] = d;                                       // real code at this depth
    if (c === '{' || c === '[' || c === '(') d++;
    else if (c === '}' || c === ']' || c === ')') d--;
    i++;
  }
  re.lastIndex = 0;
  let m;
  while ((m = re.exec(body)) !== null) if (depth[m.index] === 0) return m;
  return null;
}

function patchStringField(sectionSrc, entryKey, field, newValue) {
  // Escape for a double-quoted JS literal: backslashes, quotes, and — critically —
  // real newlines/CRs become \n/\r escapes so multi-paragraph values never inject a
  // raw line break into the source (which would break the object literal).
  const escaped = newValue
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');
  // Use brace-depth tracking to find the true entry boundary (handles nested {} in completeFn).
  const b = findEntryBounds(sectionSrc, entryKey);
  if (!b) return null;
  const { openEnd, bodyEnd } = b;
  const body = sectionSrc.slice(openEnd, bodyEnd);
  // Locate `field:` and its opening quote, then scan to the matching close quote while
  // respecting backslash escapes — so an embedded \" inside the old value (e.g. a quoted
  // line of dialogue) is not mistaken for the terminator, which would leave a corrupt tail.
  // §AUDIT-03b — the match must be the entry's OWN field, at brace depth 0 of the body.
  // Before this, the first textual match won, so `put quest <id> npc=…` on a quest whose
  // bits contain `{ kind:'favor', npc:'…' }` silently patched the NESTED favor npc and
  // left the top-level field untouched (6 quests in the §AUDIT-03b re-anchor hit this).
  const startRe = new RegExp(`(\\b${field}\\s*:\\s*)(["\`'])`, 'gm');
  const m = firstTopLevelMatch(body, startRe);
  if (!m) return null;
  const q = m[2];
  const valStart = m.index + m[0].length;   // first char after the opening quote
  let i = valStart;
  while (i < body.length) {
    const c = body[i];
    if (c === '\\' && q !== '`') { i += 2; continue; }
    if (c === q) break;
    i++;
  }
  if (i >= body.length) return null;         // unterminated value — refuse rather than corrupt
  const patchedBody = body.slice(0, m.index) + m[1] + `"${escaped}"` + body.slice(i + 1);
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
// §ARCH-02 / §EDITOR-03 (UQF W8b): Operand Registry — the LIVE runtime bit
// vocabulary, mirroring the game's BIT_CONTRACTS (QuestRuntime registry). The
// pre-Phase-1 design vocabulary (talk_at / navigate / kill_at / …) is retired —
// those kinds never had runtime handlers.
// ═══════════════════════════════════════════════════════════════════════════
const OPERAND_CONTRACTS = {
  skill_check: { required:['stat','dc'],       optional:['skill','adv','onPass','onFail'],
                 gate:'resolved via the quest roll card', complete:'pass → status done + onPass bits; fail → onFail bits' },
  flag_write:  { required:[],                  optional:['set','clear'],
                 gate:'—', complete:'sets/clears the listed S_story flags' },
  reward:      { required:[],                  optional:['xp','gold','items','knowledge'],
                 gate:'—', complete:'grants xp / gold / items / knowledge' },
  narrative:   { required:[],                  optional:['msg','template'],
                 gate:'—', complete:'prints msg into the story stream' },
  mission_bit: { required:['flag'],            optional:['label'],
                 gate:'—', complete:'sets flag + grants a mission-bit inventory token' },
  item_remove: { required:['name'],            optional:[],
                 gate:'—', complete:'removes the first exact-name inventory item' },
  item_check:  { required:['name'],            optional:['count'],
                 gate:'—', complete:'records exact-name inventory count ≥ count in ctx' },
  favor:       { required:['npc'],             optional:['set','add','cap'],
                 gate:'—', complete:'sets or increments NPC favorability (cap default 3)' },
  unlock:      { required:[],                  optional:['quests','npcs'],
                 gate:'—', complete:'activates the listed quest ids' },
  combat:      { required:['key','label'],     optional:['count','nodeCode'],
                 gate:'—', complete:'launches storyPreBattle with this battle spec' },
  choice:      { required:['prompt','options'],optional:[],
                 gate:'—', complete:'one option chosen; its bits execute' },
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
  fishPool: [], nightFishPool: [], lakeMagicDb: {}, itemDb: {}, npcDialogues: {}, ebNpcDialogue: {}, d100Table: [],
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
    // §AUDIT-03b — the Epic-Battleground quest-givers. Keyed by battleground node code,
    // each entry names a real, rendered quest-giver (EB_NPC_DIALOGUE lives OUTSIDE the
    // WORLDBUILDER markers, so it is read straight off the raw source).
    this.ebNpcDialogue = parseSanitized(src, 'EB_NPC_DIALOGUE') || {};
    this._npcVocab     = null;   // invalidate the cached npcKeyVocab() union
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
  // §DX-01c — shared with wbapi-server's insertBeforeSectionClose so both writers
  // agree on where a section actually ends (see sectionCloseIdx above).
  _sectionCloseIdx: sectionCloseIdx,

  // §DX-01d/i — the ONE comment/string-safe source scanner. `check:dupkeys`
  // (scripts/check-dupkeys.js) reads its section keys through these, so the audit
  // gate and the source-level deleters can never disagree about what an entry is.
  _scanTokens: scanTokens,
  _sectionTopKeys: sectionTopKeys,
  _entrySpan: entrySpan,

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
    // §DX-01c — the live MONSTER_POOL contract, measured (391/391 entries carry
    // exactly these, plus `voidTainted` on 2). `tier` is a STRING: the old server
    // serializer ran it through Number() and wrote `tier:NaN`.
    TIERS: ['trivial','easy','medium','hard','deadly'],
    STATS: ['ac','hp','atk','dmgDie','dmgCount','dmgFlat'],

    // The exact MONSTER_POOL line shape. `key` comes first and is always emitted —
    // the bestiary picker and every terrain roster read `m.key`, and a keyless
    // entry is the §AUDIT-03e shared-undefined-slot class all over again.
    serialize(key, body) {
      const p = [`key:${JSON.stringify(key)}`, `name:${JSON.stringify(String(body.name))}`];
      for (const f of WBAPI.monsters.STATS) p.push(`${f}:${Number(body[f])}`);
      p.push(`tier:${JSON.stringify(body.tier)}`);
      if (body.voidTainted) p.push('voidTainted:true');
      return `  ${key}: { ${p.join(', ')} },\n`;
    },

    // Validate a create body against the live contract. Returns [] when clean.
    validate(key, body = {}) {
      const errors = [];
      if (!key || !/^[a-z_][a-z0-9_]*$/.test(key))
        errors.push(`key "${key}" must be snake_case (a-z, 0-9, underscore, no leading digit)`);
      if (!body.name) errors.push('name is required — the display name shown in combat and the bestiary');
      for (const f of WBAPI.monsters.STATS) {
        if (body[f] === undefined) { errors.push(`${f} is required`); continue; }
        if (!Number.isFinite(Number(body[f]))) errors.push(`${f} must be a number — got ${JSON.stringify(body[f])}`);
      }
      if (!WBAPI.monsters.TIERS.includes(body.tier))
        errors.push(`tier must be one of ${WBAPI.monsters.TIERS.join(' | ')} (a string, not a number) — got ${JSON.stringify(body.tier)}`);
      // Fields the OLD broken serializer accepted and the game has never read.
      // Silently dropping them is how `dmg:6` became a monster with no damage.
      if (body.dmg !== undefined) errors.push('"dmg" is not a MONSTER_POOL field — damage is dmgDie + dmgCount + dmgFlat (dmgCount·d(dmgDie) + dmgFlat)');
      if (body.xp  !== undefined) errors.push('"xp" is not a MONSTER_POOL field — battle XP is computed from AC·maxHP, never stored');
      return errors;
    },

    // Create a monster AT SOURCE LEVEL, inside MONSTER_POOL, so it survives save().
    // Replaces the server's old serializeMonsterLiteral + insertBeforeSectionClose
    // pair, which wrote a `{name,ac,hp,atk,dmg,xp,tier:NaN}` line into MONSTER_DROPS.
    create(key, body = {}) {
      if (!WBAPI._rawSrc) return { ok:false, error:'no source loaded' };
      if (WBAPI.monsterPool[key]) return { ok:false, error:`monster "${key}" already exists` };
      const errors = WBAPI.monsters.validate(key, body);
      if (errors.length) return { ok:false, error:'monster data invalid — nothing written', errors };

      const closeIdx = sectionCloseIdx(WBAPI._rawSrc, 'MONSTER_POOL');
      if (closeIdx === -1) return { ok:false, error:'MONSTER_POOL closing }; not found' };
      const entry = WBAPI.monsters.serialize(key, body);
      WBAPI._rawSrc = WBAPI._rawSrc.slice(0, closeIdx + 1) + entry + WBAPI._rawSrc.slice(closeIdx + 1);

      const rec = { key, name: String(body.name) };
      for (const f of WBAPI.monsters.STATS) rec[f] = Number(body[f]);
      rec.tier = body.tier;
      if (body.voidTainted) rec.voidTainted = true;
      WBAPI.monsterPool[key] = rec;
      WBAPI._buildIndexes();
      return { ok:true, key, entry: rec, line: entry.trim() };
    },

    all()        { return Object.entries(WBAPI.monsterPool).map(([k,v])=>({...v,key:k,drop:WBAPI.monsterDrops[k]||null,terrains:WBAPI._monsterToTerrains[k]||[]})); },
    byTerrain(t) { return (WBAPI._terrainToMonsters[t]||[]).map(k=>({...WBAPI.monsterPool[k],key:k,drop:WBAPI.monsterDrops[k]||null})); },
    byTier(t)    { return WBAPI.monsters.all().filter(m=>m.tier===t); },
    get(idOrName){ const k=WBAPI._findKey(WBAPI.monsterPool,idOrName); return k?{...WBAPI.monsterPool[k],key:k,drop:WBAPI.monsterDrops[k]||null,terrains:WBAPI._monsterToTerrains[k]||[]}:null; },
    put(id,data) { WBAPI.monsterPool[id]={...(WBAPI.monsterPool[id]||{}),...data}; return {ok:true,key:id}; },
    // §DX-01i — deletes at SOURCE level (see WBAPI.deleteEntrySource). The trophy
    // drop is cascaded: leaving it behind creates the orphan-drop error `./api.sh
    // audit` already reports.
    delete(idOrName) {
      const k=WBAPI._findKey(WBAPI.monsterPool,idOrName); if(!k) return {ok:false,error:'not found'};
      const d=WBAPI._deps.monster(k); if(d.terrains.length) return {ok:false,blockedBy:d};
      const src=WBAPI.deleteEntrySource('MONSTER_POOL',k); if(!src.ok) return src;
      const drop = WBAPI.monsterDrops[k] ? WBAPI.deleteEntrySource('MONSTER_DROPS',k) : null;
      if (drop && drop.ok) delete WBAPI.monsterDrops[k];
      delete WBAPI.monsterPool[k]; WBAPI._buildIndexes();
      return {ok:true,key:k,line:src.line,...(drop&&drop.ok?{dropRemoved:drop.line}:{})};
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
    // §DX-01i — deletes at SOURCE level (see WBAPI.deleteEntrySource).
    delete(idOrName) {
      const k=WBAPI._findKey(WBAPI.birkaNpcs,idOrName); if(!k) return {ok:false,error:'not found'};
      const d=WBAPI._deps.npc(k); if(d.quests.length) return {ok:false,blockedBy:d};
      const src=WBAPI.deleteEntrySource('BIRKA_NPC',k); if(!src.ok) return src;
      delete WBAPI.birkaNpcs[k]; WBAPI._buildIndexes();
      return {ok:true,key:k,line:src.line};
    },
  },

  // ── Quests ──
  // §AUDIT-03b — the single source of truth for "is this a real NPC key?".
  // Four registries hold real, rendered speakers, and a quest may legitimately be
  // anchored to any of them:
  //   1. BIRKA_NPC profiles          (the card-bearing NPC corpus)
  //   2. NODE_MAP inline `npc`       (normalized: lowercased, spaces → underscores)
  //   3. NPC_DIALOGUES keys          (arc speakers — jimmy/solvak/benedikt_rasp/…)
  //   4. EB_NPC_DIALOGUE givers      (the 20 Epic-Battleground quest-givers, by name)
  // Before this, only (1)+(2) were accepted, so every (3)/(4) speaker advise-warned.
  npcKeyVocab() {
    if (this._npcVocab) return this._npcVocab;
    const norm = s => String(s).toLowerCase().replace(/\s/g,'_');
    const v = new Set(Object.keys(WBAPI.birkaNpcs || {}));
    for (const n of Object.values(WBAPI.nodeMap || {})) if (n && n.npc) v.add(norm(n.npc));
    for (const k of Object.keys(WBAPI.npcDialogues || {})) v.add(k);
    for (const e of Object.values(WBAPI.ebNpcDialogue || {})) if (e && e.npc) v.add(norm(e.npc));
    return (this._npcVocab = v);
  },
  npcKeyOk(key) { return !key || WBAPI.npcKeyVocab().has(key); },

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
    // §DX-01i — deletes at SOURCE level (see WBAPI.deleteEntrySource).
    delete(idOrTitle) {
      const k=WBAPI._findKey(WBAPI.questDb,idOrTitle); if(!k) return {ok:false,error:'not found'};
      const d=WBAPI._deps.quest(k); if(d.downstream.length) return {ok:false,blockedBy:d};
      const src=WBAPI.deleteEntrySource('QUEST_DB',k); if(!src.ok) return src;
      delete WBAPI.questDb[k]; WBAPI._buildIndexes();
      return {ok:true,key:k,line:src.line};
    },

    // §ARCH-02 Phase 1 — field-level validity check (§EDITOR-03 W8b: UQF-aware —
    // a skill_check quest's stat/dc live in its skill_check BIT, not at root)
    validate(id) {
      const q = WBAPI.questDb[id]; if (!q) return {ok:false,errors:[`quest "${id}" not found`]};
      const errors = [];
      const VALID_TYPES = ['side','skill_check','main','epic','combat','hybrid','escort','dialogue','delivery'];
      if (!q.title) errors.push('missing title');
      if (!VALID_TYPES.includes(q.type)) errors.push(`invalid type "${q.type}" — expected: ${VALID_TYPES.join(', ')}`);
      if (!q.activateNode && q.type !== 'epic') errors.push('missing activateNode');
      if (q.type === 'skill_check') {
        const VA = ['wis','int','str','dex','con','cha'];
        const sc = (q.bits || []).find(b => b.kind === 'skill_check');
        if (!sc) errors.push('type skill_check but no skill_check bit — dead quest post-W7d');
        else {
          if (!sc.stat || !VA.includes(String(sc.stat).toLowerCase())) errors.push(`invalid skill_check bit stat "${sc.stat}"`);
          if (typeof sc.dc !== 'number') errors.push('skill_check bit dc missing or not a number');
        }
      }
      if (q.xpAward != null && typeof q.xpAward !== 'number') errors.push('xpAward must be a number');
      if (q.xpAward != null && q.type !== 'side') errors.push('xpAward is live only on side quests — award XP via a reward bit');
      return {ok: errors.length === 0, errors};
    },


    // §ARCH-02 Phase 1 — world-logic cross-reference advisory
    advise(id) {
      const q = WBAPI.questDb[id]; if (!q) return {ok:false,warnings:[`quest "${id}" not found`]};
      const warnings = [];
      if (q.activateNode && !WBAPI.nodeMap[q.activateNode]) warnings.push(`activateNode "${q.activateNode}" not in NODE_MAP`);
      if (q.waypointNode && !WBAPI.nodeMap[q.waypointNode]) warnings.push(`waypointNode "${q.waypointNode}" not in NODE_MAP`);
      const npcKey = q.npc || q.npcKey;
      if (npcKey && !WBAPI.npcKeyOk(npcKey))
        warnings.push(`npc "${npcKey}" not found in BIRKA_NPC, NODE_MAP, NPC_DIALOGUES or EB_NPC_DIALOGUE`);
      // §EDITOR-03 W8b — UQF shape advisories (legacy authoring is dead post-W7d)
      if (q.schema !== 'UQF-1.0') warnings.push('not schema UQF-1.0 — legacy quests have no completion path post-W7d');
      if (q.type === 'skill_check' && !(q.bits || []).some(b => b.kind === 'skill_check'))
        warnings.push('type skill_check but no skill_check bit — the roll card cannot render');
      if (q.completeFn || (q.completeItems || []).length)
        warnings.push('completeFn/completeItems are RETIRED (W7d) — use completion:{items/flags/…}');
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
      // §EDITOR-03 W8b: roll spec lives in the skill_check BIT (root check* swept in W8a)
      const scBit = (q.bits || []).find(b => b.kind === 'skill_check');
      const _ab = (scBit && scBit.stat ? String(scBit.stat).toLowerCase() : null) || q.checkAbility;
      const _dc = scBit ? scBit.dc : q.checkDC;
      if (q.type === 'skill_check' && _ab && _dc != null)
        bits.push({kind:'skill_check', ability:_ab, dc:_dc, label:(scBit && scBit.skill)||q.checkLabel||'', passText:q.passText||'', failText:q.failText||'', retryable:q.retryable||false});
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
    // §DX-01d — deletes at SOURCE level (see WBAPI.deleteEntrySource), NODE_MAP and
    // NODE_COORDS together. This is the model/file desync Hazard #4 described for
    // `./api.sh del node J##`: it was never junction-specific, every node delete
    // reported success and changed nothing on disk. The coord entry is cascaded
    // because a NODE_COORDS row for a node that no longer exists is an orphan
    // `./api.sh audit`/`check:roads` then has to reason about.
    delete(codeOrName) {
      const k=WBAPI._findKey(WBAPI.nodeMap,codeOrName); if(!k) return {ok:false,error:'not found'};
      const d=WBAPI._deps.node(k); if(d.quests.length||d.npcs.length) return {ok:false,blockedBy:d};
      const src=WBAPI.deleteEntrySource('NODE_MAP',k); if(!src.ok) return src;
      const co = WBAPI.nodeCoords[k] ? WBAPI.deleteEntrySource('NODE_COORDS',k) : null;
      if (co && co.ok) delete WBAPI.nodeCoords[k];
      delete WBAPI.nodeMap[k]; WBAPI._buildIndexes();
      return {ok:true,key:k,line:src.line,...(co&&co.ok?{coordsRemoved:co.line}:{}),
              ...(co&&!co.ok?{coordsWarning:co.error}:{})};
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

  // §DX-01d/i — remove ONE entry from a WORLDBUILDER section AT SOURCE LEVEL.
  //
  // Every `*.delete()` below used to do `delete WBAPI.<collection>[k]` and nothing
  // else. `save()` writes `_rawSrc`, so the entry came straight back on the next
  // parse while the operator had already been told `✓ deleted`. That is the exact
  // mirror of the §DX-01c create bug — **a write path that reports success without
  // persisting** — and the standing lesson holds either way: the failure is silent
  // because nothing ever throws.
  //
  // Verify-or-revert: after the splice, the section's depth-1 key MULTISET must
  // differ from before by exactly one instance of `key`. If a nested brace, a
  // string, or a comment fooled the scanner and a neighbour went with it, the
  // splice is rolled back and the delete fails loudly instead of corrupting the
  // section. Returns { ok, key, line, error }.
  deleteEntrySource(section, key) {
    if (!this._rawSrc) return { ok:false, error:'no source loaded' };
    const S = `// ◆◆◆ WORLDBUILDER:${section}:START ◆◆◆`;
    const E = `// ◆◆◆ WORLDBUILDER:${section}:END ◆◆◆`;
    const a = this._rawSrc.indexOf(S), b = this._rawSrc.indexOf(E);
    if (a === -1 || b <= a) return { ok:false, error:`${section} section markers not found in source` };
    const from = a + S.length;

    // MONSTER_POOL is the one section that NESTS another (MONSTER_DROPS sits inside
    // its anchors). Clamp to the section's OWN body so a pool delete can never reach
    // into the trophy-drops map — §DX-01c's "real-but-wrong object", in mirror image.
    let to = b;
    const nestedRe = /\/\/ ◆◆◆ WORLDBUILDER:[A-Z0-9_]+:START ◆◆◆/g;
    nestedRe.lastIndex = from;
    const nested = nestedRe.exec(this._rawSrc);
    if (nested && nested.index < b) to = nested.index;

    const body = this._rawSrc.slice(from, to);
    const span = entrySpan(body, key);
    if (!span) return { ok:false, error:`entry "${key}" not found in ${section} source text` };

    const line = body.slice(span.start, span.end);
    const patched = body.slice(0, span.start) + body.slice(span.end);

    const count = (keys) => keys.reduce((m, k) => (m[k] = (m[k] || 0) + 1, m), {});
    const bC = count(sectionTopKeys(body)), aC = count(sectionTopKeys(patched));
    const diff = [];
    for (const k of new Set([...Object.keys(bC), ...Object.keys(aC)])) {
      const d = (bC[k] || 0) - (aC[k] || 0);
      if (d !== 0) diff.push(`${k}×${d}`);
    }
    if (diff.length !== 1 || diff[0] !== `${key}×1`)
      return { ok:false, error:`refused: excising "${key}" from ${section} would change ${diff.length} entr${diff.length===1?'y':'ies'} (${diff.join(', ')}) — source NOT modified` };

    this._rawSrc = this._rawSrc.slice(0, from) + patched + this._rawSrc.slice(to);
    return { ok:true, key, line: line.trim() };
  },

  // Remove a node entry from NODE_MAP source. Returns true if removed.
  // §DX-01d — was a second, private brace-walker that nothing ever called (its own
  // scanner missed /* */ comments and it left the NODE_COORDS row orphaned). It now
  // delegates to deleteEntrySource so there is ONE source-level deleter with one
  // verify-or-revert guard. NODE_MAP only — `WBAPI.nodes.delete()` is the full path.
  deleteNodeSource(code) {
    return this.deleteEntrySource('NODE_MAP', code).ok;
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
// §MESH-01-FU 9: low-level parse pipeline, exposed for scripts/world-diff.js —
// the deep diff must parse ARBITRARY world files (not this singleton's loaded
// one), so it needs the helpers, not the loaded state.
WBAPI._parse = { extrSection, extractObj, extractArr, removeFns, parseSimple, parseArr, parseWithP, parseSanitized };
module.exports = WBAPI;
