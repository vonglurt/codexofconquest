// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §DX-02mg — the editor's flag index covers engine code as well as QUEST_DB: a flag written
// by a node hook names that function, and the dead-end audit counts engine readers.
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { openEditor } = require('./helpers');

const ROOT = path.resolve(__dirname, '..', '..', '..');

function enclosingFunctionOf(needle) {
  const lines = fs.readFileSync(path.join(ROOT, 'play.html'), 'utf8').split('\n');
  const at = lines.findIndex((l) => l.includes(needle));
  for (let i = at; i >= 0; i--) {
    const m = lines[i].match(/function\s+([A-Za-z_$][\w$]*)\s*\(/);
    if (m) return m[1];
  }
  return null;
}

test('engine writers and readers of a flag are indexed, shown and counted', async ({ page }) => {
  const writer = enclosingFunctionOf('S_story.wisHookReceived = true');
  expect(writer).toBeTruthy();
  await openEditor(page);
  const r = await page.evaluate(async () => {
    loadFile(await (await fetch('/play.html')).text());
    selectQuest('quest_wis_02');
    const pills = [...document.querySelectorAll('#quest-detail-area .flag-pill')].map((p) => p.textContent);
    const a = WBAPI.audit();
    const deadFlags = a.suggestions.filter((s) => /dead-end branch/.test(s.msg)).map((s) => s.field.slice(5));
    return { index: WBAPI._flagToEngine.wisHookReceived, pills,
      deadButEngineRead: deadFlags.filter((f) => (WBAPI._flagToEngine[f] || { reads: [] }).reads.length) };
  });
  expect(r.index.writes).toContain(writer);
  expect(r.pills).toContain(`ƒ ${writer}`);
  expect(r.deadButEngineRead).toEqual([]);
});
