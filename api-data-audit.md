# api-data-audit.md — Quest Text Backfill Loop

**Self-referential procedure.** Read this file to know what to do next.
One book per "continue." Mark status as work completes.

---

## Required Reading — Load at Session Start

Before beginning any loop iteration, read these three files in order:

1. **`api-data-audit.md`** (this file) — procedure, queue status, say protocol, source index
2. **`1367-sources/index.md`** — canonical node/city registry; use to confirm `activateNode` codes and city names used in `desc`/`hint`
3. **`1367-sources/{CODE}-*.md`** — the specific source file for the current book being patched

The index and source file must be loaded before patching any quest. Node codes in `desc` must match codes in `1367-sources/index.md`. City names used in scene descriptions must match the city referenced in the source `.md` plan.

```bash
# Quick reference — confirm a node exists before using it
curl -s http://localhost:1367/api/list/node | python3 -c "
import sys,json; nodes=json.load(sys.stdin)
for n in nodes: print(n.get('id'), n.get('name'))" | grep -i {city}

# Check the source index for a book code
grep -i "{CODE}" 1367-sources/index.md | head -20
```

---

## The Loop

Every iteration follows this exact sequence:

**Step 1 — Find the first missing field**
```bash
curl 'http://localhost:1367/api/next-error?severity=warning'
```
Note the quest `id` in `.finding.key`. Stop if `found: false` — all warnings cleared.

> The first warning returned may be from MONSTER_POOL or WORLD_DB, not QUEST_DB.
> The `section` field tells you which. Keep calling with `?skip=N` until `section == "QUEST_DB"`,
> or filter the export directly (see Quick Reference).

**Step 2 — Identify the quest source**

Check the quest ID prefix:

| Prefix pattern         | Source                               | Action                                   |
|------------------------|--------------------------------------|------------------------------------------|
| `bgw_`, `cai_`, `lbc_` etc. | Imported book → `1367-sources/`  | Go to Step 3 (verbatim extraction)       |
| `mq_`, `sq_`           | Original main/side quest             | Go to §Original-Game path below          |
| `quest_ef_`, `quest_eh_` etc. | Epic battleground quest         | Go to §Original-Game path below          |
| `quest_wis_`, `quest_ng_` etc. | Legacy game quest              | Go to §Original-Game path below          |

Rule for book code: first 2–4 letters before `_`, uppercase → match in Source File Index.

**Step 3 — Read the source markdown (book imports only)**

Open `1367-sources/{CODE}-*.md`. Before patching any act, **read the relevant section** of the source file — not just the Quest API Stub JSON, but the full vignette prose above it. Each cycle has a `## §{CODE}-{N}` heading with:
- A **premise paragraph** naming the NPCs, objects, and mission context
- **Act-by-act prose** with scene descriptions, dialogue, and skill check outcomes
- A **Quest API Stub** JSON block that codifies the above

Read at minimum the prose section for the current cycle before writing `desc` and `hint`. The stub JSON gives structure; the prose gives the quotes, the sensory details, and the character voices that make the text match the source. Use `grep -n "§{CODE}-{N}\|{cycle_title}"` to locate the right line range, then Read the block.

The heading format is usually `## §{CODE}-{N} — Vignette Cycle {N}: "{Title}"` or `**Quest API Stub — {CODE}-{N}:**`.

```bash
# Locate the cycle section quickly
grep -n "§{CODE}-0{N}\|{Cycle Title}" 1367-sources/{CODE}-*.md | head -5
# Then Read from that line number for ~120 lines
```

**Step 4 — Extract verbatim text**

| Source field      | Target field   |
|-------------------|----------------|
| `scene:`          | `desc`         |
| `missionAccept:`  | `desc` (alt)   |
| `successText:`    | `passText`     |
| `failText:`       | `failText`     |

Copy **verbatim** from the Quest API Stub. Do not paraphrase.

**Step 5 — Write the fix**
```bash
curl -X PUT http://localhost:1367/api/quest/{id} \
  -H 'Content-Type: application/json' \
  -d '{"desc":"...","passText":"...","failText":"..."}'
```
The PUT response includes a `verified` array confirming each field was read back from disk correctly.
No server restart — the server reloads in-memory from the saved file and keeps the connection alive.
A `422` with `error: "field mismatch after reload"` means the write was corrupted; investigate before continuing.

**Step 6 — Verify**
```bash
curl 'http://localhost:1367/api/next-error?severity=warning'
```
The fixed quest should not reappear. Repeat from Step 1.

**Step 7 — Commit and announce**
When all quests for a book are clean:
```bash
git add -A && git commit -m "BOOK IMPORTED — BookName: N quests patched"
say "Book done: commit sent. Continuing loop." &
```
Then update its status below: `QUEUED` → `DONE {date}`.

---

## activateNode Validation

If next-error returns an **error** (not warning) on `activateNode`:

- `"QUEST"`, `"TBD"`, `"TODO"`, `"UNKNOWN"`, `"NONE"`, `"XXX"`, `"PLACEHOLDER"` → rejected by API with 422
- Open `1367-sources/{CODE}-*.md` → find the act → locate the city/location where it fires
- Verify code: `curl 'http://localhost:1367/api/list/node'`
- Fix: `curl -X PUT http://localhost:1367/api/quest/{id} -d '{"activateNode":"<real-code>"}'`

Errors sort before warnings. Run `?severity=error` first if any errors exist.

---

## §Original-Game Path — No Source File

When the quest ID does not map to a `1367-sources/` book (prefix `mq_`, `sq_`, `quest_ef_`,
`quest_wis_`, etc.), there is no Quest API Stub to extract from. Follow this search chain:

**Search order:**
1. `grep -rn "{quest_id}\|{title}" *.md lab-report-*.md` — look for text in story arc docs
2. Check `mechanics.md` and `mechanics-economy.md` — sidequests and game systems
3. Check `story-arc-*.md` files — main narrative arcs
4. Check the HTML game file directly:
   ```bash
   grep -n "{quest_id}" roll2hit-v3.html
   ```
   Read the entry. The `desc` and `hint` fields give you the full narrative context.
5. Check `lab-report-*.md` files that cover the arc (epic battlegrounds, crown hags, etc.)

**If no passText/failText is found anywhere:**
Write from context. Use the quest's `desc`, `hint`, `completeItems`, and NPC name.

**Writing style** (match the game's voice):
- Spare, literary, one or two sentences
- Show the outcome through a specific detail — do not say "Quest complete"
- Present tense or close third person
- Name the NPC, the object, the place — make it concrete
- passText: the moment the thing resolves; what the NPC does or says
- failText: what is still true; what hasn't changed yet; often ends open ("still waiting", "not yet")

**Examples written in this session (2026-06-04):**
```
mq_4 passText: "The shaman has been told all his life that the shard is power.
                It is not power. He learns this when you take it."
mq_4 failText: "The warrens drove you out. Mordus does not say anything.
                He is still looking at you."

mq_7 passText: "The Convergence begins. Sweelinck steps back. This part is yours."
mq_7 failText: "The sky over Birka is wrong. The seventh new moon is coming.
                Return before it does."

sq_2 passText: "The kelpie does not leave the loch. It sinks. The water road is clear.
                Elder Fionn says thank you by not saying anything at all."
sq_battling failText: "Three drops. You need three. The fence is still waiting."
```

---

## Quest Type Reference

Valid types as of 2026-06-04 (schema updated to match live data):

| Type         | Count | Description                                              |
|--------------|-------|----------------------------------------------------------|
| `skill_check`| 733   | D20+mod vs DC roll; most imported book quests            |
| `side`       | 109   | Optional side quests; no story gate                      |
| `epic`       | 40    | Dungeon boss chains; primary + return quest pair         |
| `combat`     | 36    | Direct battle objective                                  |
| `escort`     | 22    | Move NPC between nodes                                   |
| `main`       | 7     | Main quest arc; gated by story flags                     |
| `dialogue`   | 7     | NPC conversation quest                                   |
| `hybrid`     | 6     | Mixed mechanic                                           |
| `mission_bit`| —     | Token-gated mission bit quest                            |

`side quest` (with a space) is not a type — the correct value is `side`.

---

## Loop Until Clean

The loop runs until `next-error` returns `found: false` for both errors and warnings. The loop is:

1. Check errors first: `curl '.../api/next-error?severity=error'`
2. Then warnings: `curl '.../api/next-error?severity=warning'`
3. Fix, PUT, verify (the PUT response confirms disk write)
4. When a book's last warning clears → git commit + `say` announcement + mark DONE
5. Repeat from 1

**Source fidelity rule:** When a book's source file exists in `1367-sources/`, copy text **verbatim** from the Quest API Stub. The city name used in the quest `desc` and `hint` must match the city referenced in the `1367-sources/{CODE}-*.md` plan and the node name in the game. The source markdown uses the city as a landmark — that geographic anchor must be preserved.

**macOS say protocol — full enriched form:**

Run all `say` calls in the background (`&`) so they never block the loop.

```bash
# 1. BEFORE patching a cycle — announce intent
say "Starting {BOOK} {cycle}: {N} acts. {short theme}." &

# 2. DURING — after each PUT success — announce field name + verbatim quote
say "{BOOK} {cycle} act {N}: {field} fixed. {verbatim quote from patched text}." &
#    Example:
#    say "HTY 01 act 5: desc fixed. The argument works — but only if the reader believes Yama was bound by his own word. In our tradition, Death is not." &

# 3. AFTER completing the cycle — announce completion before commit
say "{BOOK} {cycle} complete. All acts patched. Committing." &

# 4. ON COMMIT — after git commit
git commit -m "{BOOK} — {BookName}: {N} quests patched ({BOOK}-01 through {BOOK}-0N, all acts desc+hint)"
say "{BOOK} committed. {N} quests across {M} cycles." &

# 5. NEXT — after commit, call api/next-error and announce what's up next
curl -s 'http://localhost:1367/api/next-error?severity=warning&skip=50' | python3 -c "
import sys,json; d=json.load(sys.stdin)
if d.get('found'):
    e=d['finding']; print(e['key'], e['field'])
else:
    print('found: false — all warnings cleared')
"
say "Next: {BOOK} {next_cycle} — {quest title}." &
# Or: say "All warnings cleared. Loop complete." &
```

**Say content rules:**
- The field name (e.g., "desc fixed", "hint fixed") must always appear
- Include a verbatim quote — short, one sentence maximum — lifted directly from the text just patched
- Book abbreviation + cycle number (e.g., "HTY 01") are mandatory so oral log is self-annotating
- After a commit, name the next key from api/next-error so the speaker always signals what is coming

---

## Per-Book Queue

| Code | Book                          | Missing desc | Missing passText | Missing failText | Status              |
|------|-------------------------------|-------------|-----------------|-----------------|---------------------|
| HTY  | Mahabharata                   | ~25         | 0               | 0               | IN PROGRESS 2026-06-04 (HTY-01 done) |
| CLJ  | Dracula (Stoker)              | ~45         | 0               | 0               | QUEUED              |
| CRL  | Froissart (Boy's)             | ~40         | 0               | 0               | QUEUED              |
| LBC  | Nibelungenlied                | ~35         | 0               | 0               | QUEUED              |
| FRO  | Völsunga Saga                 | ~35         | 0               | 0               | QUEUED              |
| MSE  | Canterbury Tales              | ~35         | 0               | 0               | QUEUED              |
| KIR  | Mabinogion                    | ~35         | 0               | 0               | QUEUED              |
| IST  | The Alexiad (Anna Komnene)    | ~35         | 0               | 0               | QUEUED              |
| MAN  | Ivanhoe (Scott)               | ~32         | 0               | 0               | QUEUED              |
| SEN  | Treasure Island (Stevenson)   | ~30         | 0               | 0               | QUEUED              |
| STN  | Robin Hood                    | ~30         | 0               | 0               | QUEUED              |
| CPH  | Gesta Danorum (Saxo)          | ~10         | 0               | 0               | QUEUED              |
| MOL  | Laxdaela Saga                 | ~10         | 0               | 0               | QUEUED              |
| LHR  | Beowulf (Gummere)             | 0           | 0               | 0               | DONE 2026-06-05 — 35 acts imported with full text |
| LCY  | The White Company (Doyle)     | 0           | 0               | 0               | DONE 2026-06-05 — 35 acts imported with full text |
| LGW  | Le Morte d'Arthur (Malory)    | 0           | 0               | 0               | DONE 2026-06-05 — 35 acts imported with full text |
| GCI  | Toilers of the Sea (Hugo)     | 0           | 0               | 0               | DONE 2026-06-05 — 35 acts imported with full text; STP/GHL nodes created |
| INV  | Ossian (MacPherson)           | 0           | 0               | 0               | DONE 2026-06-05 — 35 acts imported with full text; CNA/HLD nodes created; INV collision→CNA |
| BHD  | Cuchulain of Muirthemne (Gregory) | 0       | 0               | 0               | DONE 2026-06-05 — 35 acts imported with full text; EMR/PSU/ULC nodes created; BHD collision→EMR |
| SDQ  | Rob Roy (Scott)               | 0           | 0               | 0               | DONE 2026-06-05 — 35 acts imported; OBH/GLA/ABF/GLN/LLM/EDI nodes created; SDQ collision→OBH; node name fix (terrain key patch) |
| PLW  | Piers Plowman (Langland)      | 0           | 0               | 0               | DONE 2026-06-05 — 35 acts imported; MGF node created; FCO collision (Aeneid)→PLW quest prefix; RME→ROM |
| GDN  | Njal's Saga (Anon, 13th c.)   | 0           | 0               | 0               | DONE 2026-06-05 — 35 acts imported; IGH/SWF/ISL nodes created; GDN collision (Danzig)→quest prefix only |
| BOO  | Prose Edda (Snorri, c.1220)   | 0           | 0               | 0               | DONE 2026-06-05 — 35 acts imported; ASG/THK/HNJ nodes created; BOO collision (Yugurt Lake)→quest prefix only |
| ALF  | Kalevala (Lönnrot, 1849)      | 0           | 0               | 0               | DONE 2026-06-05 — 35 acts imported; TUO/KVF/KVM nodes created; ALF collision (North Shore Path)→quest prefix only |
| KSU  | Heimskringla (Snorri, c.1230) | 0           | 0               | 0               | DONE 2026-06-05 — 35 acts imported; NID/ECF nodes created; KSU collision (Lake Harbor)→NID hub for cycles 3–7 |
| CDG  | Three Musketeers (Dumas, 1844) | 0          | 0               | 0               | DONE 2026-06-05 — 35 acts imported; BTH/REL/DAR nodes created; CDG collision (Cat Quarter)→LON hub for cycles 3–7; RME→ROM |
| GAME | Legacy game quests (quest_*, trap_*) | ~346 | ~170           | ~140            | SEPARATE — see §GAME |
| BGW  | Arabian Nights (Burton tr.)   | 0           | 0               | 0               | DONE 2026-06-03     |
| CAI  | Arabian Nights (Lang)         | 0           | 0               | 0               | DONE 2026-06-03     |
| BLQ  | Decameron (Boccaccio)         | 0           | 0               | 0               | DONE 2026-06-03     |
| FCO  | Aeneid (Virgil)               | 0           | 0               | 0               | DONE 2026-06-03     |
| NWI  | Anabasis (Xenophon)           | 0           | 0               | 0               | DONE 2026-06-03     |
| MLA  | Plutarch's Lives              | 0           | 0               | 0               | DONE 2026-06-03     |
| WAW  | Quo Vadis (Sienkiewicz)       | 0           | 0               | 0               | DONE 2026-06-03     |
| HAV  | Buccaneers of America         | 0           | 0               | 0               | DONE 2026-06-04     |
| AMS  | Tale of Genji                 | 0           | 0               | 0               | DONE 2026-06-04     |
| MQ   | Main quest chain (mq_1–7)     | 0           | 0               | 0               | DONE 2026-06-04     |
| SQ   | Side quests (sq_1/2/battling/leveling) | 0  | 0               | 0               | DONE 2026-06-04     |
| EPIC | Epic battleground (quest_e*_primary/return) | 0 | 0          | 0               | DONE 2026-06-04     |

---

## §GAME — Legacy Game Quests

Original game quests (prefixes: `quest_wis_`, `quest_ng_`, `quest_ef_`, `quest_eh_`, `trap_`, etc.)
have no `1367-sources/` markdown. They are the lowest-priority backfill pass.

**What was fixed 2026-06-04:**
- `mq_1`–`mq_7` and `sq_1`, `sq_2`, `sq_battling`, `sq_leveling` — written from narrative context
- All 40 epic battleground quests (`quest_e*_primary` and `quest_e*_return`) — written from in-game context

**What remains:** ~346 quests missing `desc`, ~170 missing `passText`, ~140 missing `failText`.
These are `quest_wis_*`, `quest_ng_*`, `trap_*`, and other legacy prefixes.

To isolate only GAME quests in next-error:
```bash
# Skip until you hit a non-book prefix
curl 'http://localhost:1367/api/next-error?severity=warning' | jq '.finding.key'
# If it starts with a known book code (bgw_, cai_, etc.) skip forward:
curl 'http://localhost:1367/api/next-error?severity=warning&skip=N'
```

Process GAME quests as a dedicated pass after all book imports are clean.

---

## Source File Index

| Code | Source file (1367-sources/)             |
|------|-----------------------------------------|
| BGW  | BGW-arabian-nights-burton.md            |
| CAI  | CAI-arabian-nights-lang.md              |
| LBC  | LBC-nibelungenlied.md                   |
| FRO  | FRO-volsunga-saga.md                    |
| MSE  | MSE-canterbury-tales.md                 |
| KIR  | KIR-mabinogion.md                       |
| IST  | IST-alexiad.md                          |
| MAN  | MAN-ivanhoe.md                          |
| SEN  | SEN-treasure-island.md                  |
| STN  | STN-robin-hood.md                       |
| MLA  | MLA-plutarchs-lives.md                  |
| NWI  | NWI-anabasis.md                         |
| WAW  | WAW-quo-vadis.md                        |
| CRL  | CRL-froissart-boys.md                   |
| AMS  | AMS-tale-of-genji.md                    |
| HTY  | HTY-mahabharata.md                      |
| CLJ  | CLJ-dracula.md                          |
| HAV  | HAV-buccaneers-of-america.md            |
| CPH  | CPH-gesta-danorum.md                    |
| MOL  | MOL-laxdaela-saga.md                    |
| FCO  | FCO-aeneid.md                           |
| BLQ  | BLQ-decameron.md                        |

If a file is not listed: `ls 1367-sources/ | grep -i {code}`

---

## Iteration Log

| Date       | Group   | Quests Fixed | Method        | Notes |
|------------|---------|-------------|---------------|-------|
| 2026-06-04 | MQ (mq_1–7)            | 7  | Written from context | No source file. Used desc+hint+completeItems+story-arc-*.md. Schema updated. |
| 2026-06-04 | SQ (sq_1/2/battling/leveling) | 4 | Written from context | No source file. sq_battling/sq_leveling: mechanics.md flavor. |
| 2026-06-04 | EPIC (quest_e*_primary + _return) | 40 | Written from context | NPC name + boss + city anchor pattern. Bulk-patched via saveAndVerify (no restart). |

---

## Completed Example — What Was Done 2026-06-04

This documents the full decision chain from this session as a reference for future iterations.

**1. Ran next-error:**
```bash
curl 'http://localhost:1367/api/next-error?severity=warning'
```
Returned `section: "MONSTER_POOL"` — not a quest. Continued scanning.

**2. Found first QUEST_DB warning:**
The first quest warnings were for `mq_*` and `sq_*` — original game quests, not book imports.

**3. Identified that list/quest is a summary endpoint:**
`GET /api/list/quest` does not return `desc`, `passText`, or `failText`.
To check actual missing fields, use individual quest endpoints:
```bash
curl http://localhost:1367/api/quest/{id} | jq '{desc,passText,failText}'
```
All 11 MQ/SQ quests had `desc` already but were missing `passText` and `failText`.

**4. Searched for existing text:**
Search order used:
- `grep -rn "mq_\|sq_\|{title}" *.md lab-report-*.md` — found quest listed in mechanics.md flavor text but no passText/failText
- Checked `story-arc-coastal.md`, `story-arc-investigation.md`, `story-arc-ngplus.md` — epigraphs and arc notes only; no passText/failText existed
- Read HTML directly: `grep -n "mq_1\|sq_1" roll2hit-v3.html` — found desc and hint for all, confirmed no passText/failText had ever been written

**5. Validated quest types:**
`GET /api/list/quest` + type analysis showed `epic` (40), `combat` (36), `escort` (22), `dialogue` (7), `hybrid` (6) in live data but not in schema. Updated schema in `wbapi-server.js` to include all real types.

**6. Wrote passText/failText from context:**
For each quest: read `desc` + `hint` + `completeItems` + NPC name → wrote outcome text in the game's literary style. No paraphrase of existing text — these were net-new sentences.

**7. Verified:**
All 11 confirmed via individual `GET /api/quest/{id}` calls. passText and failText present on all.

---

## Quick Reference

```bash
# First failing warning
curl 'http://localhost:1367/api/next-error?severity=warning'

# First failing error (check before warnings)
curl 'http://localhost:1367/api/next-error?severity=error'

# Skip N items
curl 'http://localhost:1367/api/next-error?severity=warning&skip=N'

# Full quest record (includes all text fields)
curl http://localhost:1367/api/quest/{id} | jq '.entity | {id,type,desc,passText,failText}'

# Fix one or more fields
curl -X PUT http://localhost:1367/api/quest/{id} \
  -H 'Content-Type: application/json' \
  -d '{"desc":"...","passText":"...","failText":"..."}'

# Check quest type distribution
curl http://localhost:1367/api/list/quest | python3 -c "
import json,sys; qs=json.load(sys.stdin)
from collections import Counter; print(Counter(q.get('type') for q in qs).most_common())"

# Find all quests by book prefix missing a field
curl http://localhost:1367/api/list/quest | python3 -c "
import json,sys,re; qs=json.load(sys.stdin)
for q in qs:
  if re.match(r'^bgw_', q.get('id','')): print(q['id'], q.get('title',''))"
# then: curl http://localhost:1367/api/quest/{id} | jq '.entity.desc'

# Node list (for fixing activateNode errors)
curl http://localhost:1367/api/list/node
```

---
*© 2026 Paul Richeson — MIT License. See [LICENSE](LICENSE) for full text.*
