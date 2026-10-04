// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §DX-02ap — the Wizard's review step shows each write as a ./bin/api line, never raw curl,
// and a line run through a real shell reaches the CLI's own k=v parser with every value intact.
const { test, expect } = require('@playwright/test');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..', '..');

function cliParseKV() {
  const src = fs.readFileSync(path.join(ROOT, 'src', 'api', 'wb.js'), 'utf8');
  const at = src.indexOf('function parseKV(args)');
  const end = src.indexOf('\n}\n', at) + 2;
  return new Function(`${src.slice(at, end)}; return parseKV;`)();
}

test('the review block emits ./bin/api post lines that survive a shell', async ({ page }) => {
  await page.goto('/edit.html');
  const title = `Ord's "Ledger" — 50% $HOME \`x\``;
  const block = await page.evaluate((title) => {
    document.getElementById('wiz-quest-id').value = 'zz_ap_probe';
    document.getElementById('wiz-quest-title').value = title;
    document.getElementById('wiz-quest-pass').value = "It's done; don't look back.";
    window.wizStep(6);
    return { text: document.getElementById('wiz-curl-block').textContent,
      retryable: document.getElementById('wiz-retryable').checked };
  }, title);
  expect(block.text).not.toContain('curl');
  const line = (block.text.match(/\.\/bin\/api post quest [^\n]*/) || [])[0];
  expect(line, block.text).toBeTruthy();

  const argv = JSON.parse(execFileSync('sh', ['-c',
    line.replace('./bin/api post quest', `node -e 'console.log(JSON.stringify(process.argv.slice(1)))' --`)]).toString());
  const body = cliParseKV()(argv);
  expect(body.id).toBe('zz_ap_probe');
  expect(body.title).toBe(title);
  expect(body.passText).toBe("It's done; don't look back.");
  expect(body.retryable).toBe(block.retryable);
});
