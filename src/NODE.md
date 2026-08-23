<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->
# The node project lives here — `src/`

`package.json`, `package-lock.json` and `node_modules/` are in **this
directory**, not the repo root. Run every npm command from here.

```
cd src
npm install                 # restore node_modules/
npm start                   # the WBAPI server  → http://localhost:1367
npm test                    # the Playwright integration suite
npm run check:walk          # the full gate chain
```

From the repo root, the same things without changing directory:

```
make install       # npm install --prefix src
make wbapi         # the API server, announcing where node runs
make test
make check
make purge         # remove node_modules/ and build output
```

## Why it is `src/` and not `src/something/`

Node resolves a bare `require('@playwright/test')` by walking **up** from the
file that asked for it until it finds a `node_modules/`. The code that needs
external packages is spread across `src/`:

| Requires | From |
|---|---|
| `@playwright/test` | `src/tests/**` — 81 call sites |
| `@anthropic-ai/sdk` | `src/js/`, `src/api/` — the NPC-speak endpoint |

Putting `node_modules/` in a deeper folder such as `src/server/` would mean
`src/tests/integration/*.test.js` walks up through `src/tests` → `src` → repo
root and never finds it, so every test fails to load. Keeping the manifest at
`src/` is the deepest placement where all of `src/tests`, `src/js`, `src/api`
and `src/scripts` still resolve — and it keeps the repo root clean, which was
the point.

## Where node actually runs

`src/server/start-wbapi.sh` prints the node binary, the working directory, the
entry file, the `node_modules` location and the port **before** it execs node,
so a mis-launch is visible immediately rather than as a confusing module error.
