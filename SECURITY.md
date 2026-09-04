<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->
# Security Policy

## Reporting a vulnerability

Use [GitHub's private vulnerability reporting](https://github.com/vonglurt/codexofconquest/security/advisories/new).
Please do not open a public issue for anything exploitable. Expect an acknowledgement within
about a week; this is a personal project, not a staffed one.

## What is actually exposed

Most of this project has no attack surface worth the name — `play.html` runs
locally in your browser, stores saves in `localStorage`, and talks to nothing.
The parts that *do* have one:

| Surface | Notes |
|---|---|
| `src/js/wbapi-server.js` | The world-builder API. **Binds localhost and is not hardened for public exposure.** Do not put it on a public interface. It reads and writes `play.html` on disk. |
| Mesh / multiplayer | Peer discovery, chat, presence and duels. Peers are semi-trusted; the ACL in `src/config/mesh-acl.json` is the only gate. Treat any joined world as untrusted input. |
| NPC-speak endpoint | Forwards prompts to the Anthropic API using `ANTHROPIC_API_KEY` from your environment. **Never commit that key.** `.env` is gitignored. |
| `edit.html` | Sends authoring writes to the API server. Same trust boundary as the server. |

## Scope

In scope: anything letting a remote peer write to your world data, read files
outside the repo, execute code, or exfiltrate an API key.

Out of scope: the API server being unauthenticated on localhost by design;
save-file editing (it is your own browser); and cheating in single player.
