// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §DX-02lb — six Jacobite nodes had a blank `text` and their prose in `desc`, which the game
// never reads. The prose is their `text` now, `desc` is gone from every node and from the
// node schema, and the worldbuilder's node surfaces write `text`.

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..', '..');

test('§DX-02lb — the six arrive with prose, and no node carries desc', () => {
  const W = require(path.join(ROOT, 'src', 'js', 'wbapi-core.js'));
  W.load(path.join(ROOT, 'play.html'));
  for (const code of ['OBH', 'GLA', 'ABF', 'GLN', 'LLM', 'EDI']) expect(W.nodeMap[code].text.trim().length, code).toBeGreaterThan(100);
  expect(Object.keys(W.nodeMap).filter(k => 'desc' in W.nodeMap[k])).toEqual([]);
});

test('§DX-02lb — the worldbuilder previews and writes text, not desc', () => {
  const html = fs.readFileSync(path.join(ROOT, 'edit.html'), 'utf8');
  expect(html).toContain("const FIELDS = ['label','name','act','npc','battle','text'];");
  expect(html).toContain("if (node.text && node.text.trim()) text = node.text;");
  expect(html).not.toMatch(/terrain:ter,\s*desc\b/);
});
