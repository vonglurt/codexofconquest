// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §DX-02at — the authoring tools' bit vocabulary equals the kernel's. wbapi-core derives
// its copy from src/js/quest.js; edit.html is a browser page with no module loader, so
// its copy is typed and held equal here.
//
// Pure-node (no browser): the editor's literals are data, read out of the file text.

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const { BIT_CONTRACTS } = require(path.join(ROOT, 'src', 'js', 'quest.js'));
const WBAPI = require(path.join(ROOT, 'src', 'js', 'wbapi-core.js'));

const NOT_AUTHORABLE = ['_legacy_fn'];
const NOT_CARD_AUTHORABLE = ['choice'];

function editorLiteral(name) {
  const src = fs.readFileSync(path.join(ROOT, 'edit.html'), 'utf8');
  const start = src.indexOf(`const ${name} = {`);
  expect(start, `${name} in edit.html`).toBeGreaterThan(-1);
  const open = src.indexOf('{', start);
  const end = src.indexOf('\n};', open);
  return new Function(`return ${src.slice(open, end + 2)};`)();
}

function expected() {
  return Object.fromEntries(Object.entries(BIT_CONTRACTS)
    .filter(([k]) => !NOT_AUTHORABLE.includes(k))
    .map(([k, c]) => [k, { required: c.required, optional: c.optional }]));
}
const shape = table => Object.fromEntries(Object.entries(table)
  .map(([k, c]) => [k, { required: c.required, optional: c.optional }]));

test.describe('§DX-02at — the operand vocabulary has one source', () => {
  test('edit.html OPERAND_CONTRACTS equals BIT_CONTRACTS minus the non-authorable kinds', () => {
    const ed = editorLiteral('OPERAND_CONTRACTS');
    expect(Object.keys(ed).sort()).toEqual(Object.keys(expected()).sort());
    expect(shape(ed)).toEqual(expected());
    for (const [k, c] of Object.entries(ed)) {
      expect(typeof c.gate === 'string' && typeof c.complete === 'string', k).toBe(true);
    }
  });

  test('wbapi-core operands are the kernel contracts, each with its prose', () => {
    const kinds = WBAPI.operands.list();
    expect(kinds.sort()).toEqual(Object.keys(expected()).sort());
    for (const k of kinds) {
      const c = WBAPI.operands.contract(k);
      expect({ required: c.required, optional: c.optional }, k).toEqual(expected()[k]);
      expect(c.complete, k).not.toContain('no description');
    }
    expect(WBAPI.operands.validate({ kind: 'cost', gold: 5 }).ok).toBe(true);
  });

  test('every editor bit card authors only contract fields, and every card-authorable kind has one', () => {
    const cards = editorLiteral('UQF_BIT_FIELDS');
    const exp = expected();
    for (const [kind, fields] of Object.entries(cards)) {
      expect(exp[kind], `card for unknown kind ${kind}`).toBeTruthy();
      const allowed = [...exp[kind].required, ...exp[kind].optional];
      for (const [f] of fields) expect(allowed, `${kind}.${f}`).toContain(f);
    }
    const missing = Object.keys(exp).filter(k => !cards[k] && !NOT_CARD_AUTHORABLE.includes(k));
    expect(missing).toEqual([]);
  });
});
