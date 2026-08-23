<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson and Claude -->
# say.sh — Queue-Based Text-to-Speech

Enqueues text for speech and returns immediately. A daemon (`sayd.sh`) picks it up and speaks serially, one message at a time.

## Usage

```bash
# Inline text
./say.sh "Connie walks into La Riva and the bartender looks up."

# Pipe
echo "Five acts complete. Node ARF committed." | ./say.sh

# Background (non-blocking from a script)
./say.sh "Import finished. Thirty-five acts, three new nodes." &
```

## How it works

1. `say.sh` writes the text to `milepoints/say.queue.d/<timestamp>-<seq>.txt` and exits.
2. If `sayd.sh` isn't running, `say.sh` starts it as a detached daemon.
3. `sayd.sh` processes queue files in order, holding a `fcntl` lock so it never overlaps with the monitor's voice.
4. After ~10 s of idle queue, the daemon exits cleanly.

## Directive — be verbose

When narrating work via `say.sh`, speak in full sentences. State:
- **what** was just done (e.g., "Imported act three of The Three Musketeers")
- **what changed** (nodes added, quests written, properties set)
- **what's next** (next act, next node, next chain step)

Avoid bare status codes, file names, or silent completions. If you ran say.sh in a loop, say something at the start and end of each meaningful unit, not just once at the very end.

## Voice config

Rate is 190 wpm. A random natural-sounding English voice is chosen for each message:

```
Samantha (en_US)  Daniel (en_GB)   Karen (en_AU)   Moira (en_IE)
Tessa (en_ZA)     Rishi (en_IN)    Fred (en_US)
Eddy · Flo · Reed · Rocko · Sandy · Shelley  (en_US/en_GB variants)
```

To add or remove voices, edit the `VOICES` array in `sayd.sh` and `_VOICES` in `monitor-snapshots.py`.
