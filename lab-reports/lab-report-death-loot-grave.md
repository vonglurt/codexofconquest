<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com -->
# Lab Report — §DEATH-01: Death, Loot & the Grave

**Design lock:** 2026-07-12 · **Shipped:** `a52f9cd`, same day, Inc A/B/C in one commit.
**Verified against `roll2hit-v3.html` @ HEAD (38,712 lines):** 2026-08-18 (§DOC-02cc), 37 days after ship.
**Parent build for all pre-edit citations:** `a52f9cd^` (37,166 lines). The report has exactly one
commit and it *is* the ship commit, so `git show a52f9cd^:roll2hit-v3.html` was pinned before any
line number was scored (instrument 108); `git diff a52f9cd HEAD -- <report>` is empty — never amended.

---

## Abstract

§DEATH-01 is face **F** of the §PLAY-01 *"Honest Floor"* review. It addresses a single class of
defect — **the engine knew things about the player's death that it refused to transmit** — across
three surfaces: the respawn message (which stated a falsehood), the whereabouts of the corpse (which
had no persistent signal), and New Game+ (which deleted an unrecovered corpse silently). Three
increments shipped; a fourth (Inc D, gold-loss tuning) was deleted by the design calls before build.

All three increments are present and functionally intact at HEAD. The acceptance suite is **4/4
green**, and every deferral the author declared is still honestly deferred. Re-verification produced
**three corrections and two new defects**: the ground-truth section is a **mixed-build citation set**
(most citations resolve at the parent build, three resolve at the *post-edit* build, same paragraph);
the atomicity argument for finding #5 names the **wrong mechanism** while reaching the **right
conclusion** — which this pass upgrades from an assertion to a proof; the light/dark CSS labels are
**inverted**; the ship commit's claim to have *"wired the long-dead `.corpse-chip` CSS"* is **false**
(→ §DX-02dc); and the Local-grid grave marker has **two undocumented blind spots and zero test
coverage**, despite the verification plan naming it (→ §DX-02dd).

---

## I. Intent, inspiration, and what it buys the player

The §PLAY-01 thesis is one sentence: ***"the floor will be honest."*** A roguelike death is a
contract, and the player can only agree to a contract they can read. This report is that contract
written down.

**The inspiration is a lie the game was telling.** On a failed death save the engine printed:

> *"A rusted dagger is all you carry. Find your body."*

It was not true. The three equipped slots — `equippedMainWeapon` / `equippedWeapon` /
`equippedShield` — are **top-level `S_story` fields, not inventory entries**, and the death routine
never touches them. **The engine was frightening the player with a loss it was not going to
inflict** — the worst kind of dishonest floor, because it taxes play without taking anything and the
tax is invisible in every metric.

**Three playability gains, in order of size.**

1. **Risk becomes legible, so the player can price it.** Death costs *loose bag items and 100% of
   carried gold*, both recoverable from the body; equipped gear and Codex Shards are never at risk.
   Stated, the player makes the real decision — *"can I afford to walk back?"* — instead of the
   imaginary one, *"will I lose my sword?"* Difficulty the player can reason about reads as
   **tension**; the same difficulty unstated reads as **arbitrariness**.
2. **A death becomes an errand instead of a hole in the map.** All gold going to the corpse is a
   large stake, playable only if the corpse can be found. Before Inc B both signals were
   *arrival-gated* — the node card's 🦴 **Remains** section renders only while you stand on the
   grave, the journal's ☠ **Fallen Hero** list only while the journal is open. Neither helps you
   *decide to go*. The chip **names the place from anywhere** and turns a loss into a corpse-run.
3. **The one irreversible moment gets a door instead of a trapdoor.** NG+ resets `corpsesQuests` and
   clears the autosave; a player who begins it with a body still out there loses it permanently and
   is never told. Inc C is the file's only guard against a *silent* loss of persisted player
   property.

**What it deliberately does not buy.** The chip opens a *view*, never a route. §CELL-13 —
**no jump travel, ever** — is not negotiable, so the honest move is to make the map cost information
rather than distance: the chip carries the place-name in its own text precisely *because* the map
cannot centre on it.

---

## II. Method

`stat`-ordered §DOC-02 pass. (1) Pin the parent build and diff the report against HEAD. (2) Score
every ground-truth line citation at the parent build *and* the ship build. (3) Brace-depth walk each
named function at both builds rather than trusting a regex. (4) `git log -S "<symbol>" --all` with no
pathspec on every symbol the census marks dead, to separate RETIRED from NEVER SHIPPED. (5) Run the
report's own acceptance test. (6) Re-run the specified surfaces **in a real browser** — a throwaway
Playwright probe driving `_renderMapGrid()` against three planted corpse geometries — because a read
of the source cannot tell a painted marker from an unreached branch.

---

## III. Ground-truth citation audit (scored at `a52f9cd^`)

| Ground-truth claim | Cited | Actual @ parent | Verdict |
|---|---|---|---|
| `_storyDeathSaveFall()` | L25221 | 25221 | ✅ exact |
| `"…rusted dagger is all you carry"` | L25287 | 25287 | ✅ exact |
| equipped-slot defaults | L22426/22439/22440 | 22426 `equippedShield` · 22439 `equippedWeapon` · 22440 `equippedMainWeapon` | ✅ set exact; **order inverted** vs the names as written |
| `storyNewGamePlus()` | L23302 | 23302 | ✅ exact |
| `#story-location-hd-card` | L4237–4253 | 4237–4254 | ✅ (end −1) |
| `_renderObjectiveChip()` call in `storyUpdateStatus()` | L34899 | 34899 (call site; decl 34905) | ✅ exact |
| `storyMapToggle()` | L35388 | 35388 | ✅ exact |
| `_renderMapGrid()` | L35401 | 35401 | ✅ exact |
| `.corpse-chip` CSS pair | L1317 **light** / L2891 **dark** | 1317 / 2891 | ⚠ lines exact, **labels swapped** — L2874 heads the block as *"Info Chips (light theme)"* |
| node-card 🦴 Remains | L33250 | 33250 (`if` guard) / 33251 (`_mkSection`) | ✅ |
| journal ☠ Fallen Hero | L29853 | **29956** | ✗ points 103 lines high, into `storyRenderQuests()`'s head — right subsystem, wrong line |
| victory-close → NG+ | L36776 | 36775 listener / 36777 call | ⚠ off by one either way |
| `storyRender` decl | L30491 | **30445** | ✗ at parent (see below) |
| `storyRender` span end | ~L34852 | **34805** | ✗ at parent (see below) |
| terminal `storyAutoSave()` | L34843 | **34797** | ✗ at parent (see below) |
| no `window.confirm` in the file | 0 | 0 | ✅ exact |

**Correction #1 — the ground truth is a mixed-build citation set.** The last three rows do not
resolve at the parent build. They resolve at the **ship** build: `storyRender` spans **30492–34852**
at `a52f9cd` and its `storyAutoSave()` sits at **34844** — the span *end* is byte-exact and the other
two are off by one, against a tree the other thirteen citations predate by 78 lines. So the author
re-measured this trio **after** editing and left the rest at the pre-edit tree, in the same paragraph,
under one heading marked *"verified 2026-07-12."*

*This refines instrument 108.* A shared offset across several citations is a build boundary — but the
boundary can fall **inside a single paragraph**, and the tell is not that the offsets are large; it is
that they are **inconsistent in sign** with the rest of the block. Two citations off by −103 and −46
are two errors. Three citations off by +46, +47, +46 are one *build*.

---

## IV. As-built inventory @ HEAD

**Death path (Inc A).** `` `function _storyDeathSaveFall()@25950` `` — protects
`` `const critTypes = new Set(['shard', 'key']);@25965` ``, bags the remainder plus
`` `goldDropped: S_story.gold@25974` `` into a corpse record and
`` `S_story.corpsesQuests.push(corpseQuest);@25976` ``, writes the death tattoo with its
`corpseQuestId` back-link, zeroes gold, reduces inventory to `critItems + STARTER_DAGGER`, respawns
at `checkpointNode || 'LHR'` at 1 HP, and renders the honest message at
`` `storyRender(NODE_MAP[S_story.currentCode],@26023` ``. The equipped slots
(`` `equippedMainWeapon: null,@23049` `` and siblings) appear in the routine exactly once — inside the
sentence `` `stayed with you@26022` `` that tells the player they survived.

**Signal (Inc B).** `` `<div id="corpse-chip" style="display:none" onclick="storyMapToggle()">@4268` ``
in the location card, styled by `` `#corpse-chip {@1759` ``; rendered by
`` `function _renderCorpseChip()@36158` ``, called from `storyUpdateStatus` at
`` `_renderCorpseChip();      // §DEATH-01 Inc B@36151` ``. Text escapes through
`` `+ ' at ' + _mpEsc(where);@36166` ``; the `` `el.title = 'Your remains lie out in the world@36167` ``
tooltip itemises each grave. Local-grid marker at
`` `const _graveHere = (S_story.corpsesQuests || []).filter@36724` `` →
`` `cell.classList.add('mc-grave');@36727` `` inside `` `function _renderMapGrid()@36672` ``.

**NG+ guard (Inc C).** `` `function storyNewGamePlus()@24001` `` opens with
`` `const bodies = S_story.corpsesQuests;@24006` `` and `` `const ok = window.confirm(@24010` `` —
still the only `window.confirm` in 38,712 lines — placed before the NG-title overlay so a decline is
a clean no-op.

**The four "where is my body" surfaces at HEAD**, two pre-existing and two added here: journal
`` `hd.textContent = '☠ Fallen Hero — Corpse Retrieval';@30819` `` · node card
`` `_mkSection(null, '🦴', 'Remains')@35732` `` · the chip · the grid marker. Recovery runs through
`` `function _storyRetrieveCorpse(questId)@26035` ``, which calls `storyUpdateStatus()` and therefore
re-renders the chip — **the signal cannot outlive the body it points at.**

---

## V. Spec → shipped delta

| Spec item | Shipped | Delta |
|---|---|---|
| **Inc A** honest adaptive message | ✅ verbatim to the specified shape | Adds an unspecified zero-loot branch — *"Your body lies there, though it carried nothing of value"* — which is what *"never prints 0 item(s)"* actually requires |
| **Inc A** finding #5, no code change | ✅ comment only | Comment repeats the report's wrong mechanism (§VI) |
| **Inc B** chip in `#story-location-hd-card` after `#objective-chip` | ✅ | — |
| **Inc B** chip hidden at 0, `"N bodies at <place>"`, `"N places"` for >1 | ✅ | — |
| **Inc B** `title` itemises each grave | ✅ | — |
| **Inc B** `onclick = storyMapToggle` | ✅ inline attribute | Escapes visible text through `_mpEsc` — a hardening the spec did not ask for |
| **Inc B** `.mc-grave` + 🦴 overlay + hover text | ✅ hover string verbatim | **Two blind spots** (§VI) |
| **Inc B** CSS *"light + dark theme rules"* | ⚠ **one palette only** | `#corpse-chip` ships a single dark palette — but so does its `#objective-chip` sibling, so the chip matches its neighbour. Cosmetic; no row |
| **Inc B** *"wires the long-dead `.corpse-chip` CSS"* (ship commit) | ❌ **NOT SHIPPED** | Inc B built an **ID**-based chip beside the dead **class** rules (§VI) |
| **Inc C** `window.confirm` guard, decline aborts | ✅ byte-for-byte as drafted | — |
| **Inc D** gold-% / equipped-drop | ✅ correctly dropped | — |
| Docs synced to `mechanics.md` + `docs/mechanics/mechanics-combat.md` | ✅ both carry §Corpse-Run | `mechanics.md:595` repeats the *"ends in `storyAutoSave()`"* phrasing |
| Test `tests/integration/death-loot-grave.test.js` | ✅ 4/4 green | **No `mc-grave` assertion**, though the plan names one |
| Regression `effort-xp` 3/3 · `enemy-ai` 4/4 · `courier-map` 1/1 | ✅ **3 / 4 / 1 exact** at ship *and* at HEAD | — |

---

## VI. Findings

### Correction #2 — finding #5 was right for the wrong reason, and is now proved

The report argues the death is persisted atomically because *"`storyRender` … ends in
`storyAutoSave()`."* **It does not end in it.** At HEAD `storyRender` spans 34567–36056 and
`` `storyCheckJournal(node);@36047` `` is followed by the save, then by **seven more calls** —
`` `storyCheckVictory(node);@36049` ``, `_renderMiniMap`, `_renderWorldMiniMap`, `_renderGlobeMap`,
`_updateExitLinks`, `_updateWaypointBtn`, `_updateHuntBtn`. The same loose phrasing was copied into
the shipped code comment and into `mechanics.md`.

The conclusion holds, and this pass replaces the assertion with a measurement: a brace-walk of all
seven post-save callees finds **zero writes to `S_story` in any of them**. The strip and the corpse
push precede `storyRender`, the save is synchronous with no `await` on the path, and nothing after it
mutates persisted state. **Finding #5 is STALE, and the reason is stronger than the one given** — not
*"the save is last"* (it isn't) but *"everything after the save is read-only"* (it is). Unenforced:
no gate pins it, so a future render layer writing `S_story` after line 36048 re-opens it silently.

### Defect A — the dead affordance the ship notice claims to have revived (→ §DX-02dc 🟢)

The report correctly identified `.info-chip.corpse-chip` as *"a dead affordance"*: four CSS rules —
`` `.info-chip.corpse-chip { border-color: #a07840;@1317` `` and its `:hover`, plus
`` `.info-chip.corpse-chip { border-left: 3px solid var(--border);@2906` `` and its `:hover` in the
light-theme block — with no JS to apply them. The ship commit then announced that Inc B *"wires the
long-dead `.corpse-chip` CSS."*

It did not. `_renderCorpseChip` resolves `document.getElementById('corpse-chip')` — an **ID**. The
class form `info-chip corpse-chip` has **0 commits in the entire repository history, all branches,
all paths.** The rules were born dead in `213d14b` (2026-05-26) and are dead today, now with an
ID-based look-alike in the same stylesheet. Building a new chip was right — the location card is not
an info-chip row — but the tombstone was left standing. This is §AUDIT-03aa's *"comment asserting the
removal of a symbol that still resolves"* run in reverse: **a commit asserting the revival of a
selector nothing applies.**

### Defect B — the grave marker's two blind spots, and the assertion that was planned and never written (→ §DX-02dd 🟢)

Proved in a real browser, not inferred. `_renderMapGrid()` was driven three times against planted
corpse geometries:

| Grave position | `.mc-grave` cells painted |
|---|---|
| Visited node, in the ±7×±10 window, not the player's cell | **1** (with its `.mc-grave-mark` 🦴) ✅ |
| **The cell the player is standing on** | **0** |
| In-window node that is **unvisited and not on the recent trail** | **0** |

Both zeroes are structural. The marker lives inside `_renderMapGrid`'s `else if (code)` →
`if (isVis || isTrail)` branch, so the `isCurrent` arm — which paints `◉` and returns — wins on the
player's own cell, and an unvisited cell falls to a third arm the marker never reaches. Neither is a
loss: standing on the grave, the node card's 🦴 **Remains** section carries the signal *and* the
retrieve action; unvisited, the chip still names the place. But the map is **silently inconsistent
with the chip beside it**, and the otherwise-exhaustive honesty ledger mentions neither case.

The verification plan states the Inc-B test will assert *"Local-grid marker present on the grave cell
when in view."* **The shipped test contains no `mc-grave` assertion, and no other spec in the repo
references the class.** The one Inc-B surface touching the map renderer is the one surface with no
coverage — which is how both blind spots survived 37 days.

---

## VII. Invariants scored @ HEAD

| Invariant | Verdict |
|---|---|
| **§CELL-13 — no jump travel, ever** | ✅ the chip's only action is `storyMapToggle()`; `checkpointNode` respawn remains the sole warp. `` `function storyMapToggle()@36659` `` opens a tab and moves nothing |
| **DUEL:CORE untouched** | ✅ every edit is single-player `S_story` |
| **Free-Movement — no gate or mover reads corpse state** | ✅ all 14 `corpsesQuests` sites are defaults, death, retrieval, or render |
| **Shards + gate keys protected** | ✅ `critTypes` unchanged — but see §DX-02ax: the set filters on `type`, so two items carrying the ornamental `drop:false` and no `type` are **not** protected |
| **`S_story.xp` monotonic** | ✅ untouched |
| **Corpse chip cannot outlive its body** | ✅ *(not stated by the report; verified here)* — `_storyRetrieveCorpse` calls `storyUpdateStatus()` |

---

## VIII. Honesty ledger — re-measured at HEAD, 37 days on

All three deferrals the author declared are **still honestly deferred**; none was quietly closed and
none was quietly built.

- **Map region-centering on the grave — still NOT built.** `mapViewR` / `mapViewC` have **0
  occurrences in any product file**; `mapViewR` appears in exactly two places in the repo, both
  prose (`plan-archive.md`'s §NAV-01-FU item 4 and this report). The proposed name never became code,
  which is the correct outcome for a deferral.
- **Grave markers on the World / Full / GLOBE canvases — still NOT built.** `_paintFullWorld`,
  `_renderWorldMiniMap` and `_renderGlobeMap` contain **0** `corpsesQuests` references; only
  `_renderMapGrid` has one. Local grid only, exactly as declared.
- **The corpse array is still unbounded.** The only `splice` on `corpsesQuests` is the *recovery*
  path at 26038 — there is no cap anywhere. Fifty deaths still means fifty records persisted to
  `localStorage`, fifty journal rows, and fifty `nodeName`s in one `title` attribute. Still minor,
  still not a loss — but *"noted for a future soft-cap"* has been noted for 37 days and filed
  nowhere, which is the shape instrument 112 exists to catch. Now filed as §DX-02dd (b).

**Added to the ledger by this pass:** the Local grave marker does not paint on the player's own cell
or on an unvisited cell (§VI B), and `#corpse-chip` ships one palette rather than the two the spec
named (§V).

---

## IX. Acceptance

`npx playwright test tests/integration/death-loot-grave.test.js` — **4 passed (3.5 s)** at HEAD:

- Inc A — equipped slots unchanged post-death; message contains *"stayed with you"* / *"Your body
  lies there"* / *"You wake at"* and never the old lie; corpse holds 2 items + 100 gp; the shard
  stays in inventory; gold zeroed; `r2h_autosave` written.
- Inc A — zero-loot death reads *"nothing of value"* and never *"0 item(s)"*.
- Inc B — chip hidden at 0, names one place at 1, *"2 places"* at 2, click calls `storyMapToggle`.
- Inc C — decline: one `confirm` call, corpse kept, sentinel field intact, nothing wiped; accept:
  corpses wiped; no corpse: **0** `confirm` calls.

Regression baselines re-counted at both the ship commit and HEAD: `effort-xp` **3** · `enemy-ai`
**4** · `courier-map` **1** — the report's figures are exact at both trees (instrument 106 clean).

---

## X. Defects filed

- **§DX-02dc 🟢** — `.info-chip.corpse-chip`: four CSS rules, zero class applications in the
  repository's entire history; the ship commit claims to have wired them. Retirement-sweep member;
  argues for extending the dead-symbol census to CSS class selectors.
- **§DX-02dd 🟢** — (a) the Local grave marker does not paint on the player's own cell or on an
  unvisited in-window cell, and has **no test**, though the verification plan named one; (b) the
  corpse array is unbounded — the author's own deferral, unfiled for 37 days.

Pre-existing rows that touch this surface and are **not** re-filed: **§DX-02ax** (`drop:false` is
read by nobody; `_storyDeathSaveFall` filters on `type`, so Glut's Gift goes to the corpse) and
**§DX-02bt** (the journal's `🦴 Your body at` row interpolates a save-file `nodeName` through
`innerHTML`). The chip added here escapes through `_mpEsc` and is not a member.

---

## XI. Verdict

**A design lock that shipped whole, with the most honest honesty-ledger in the corpus.** Every
increment works 37 days on, the acceptance suite is green, both regression figures are exact, and all
three declared deferrals are still genuinely deferred — a combination this program has not previously
found in one report. The author also drew the right conclusion about finding #5 from the wrong
evidence, which is rarer and more interesting than being wrong.

The failures are all of one kind: **claims about what the pass did to its own surroundings.** The
ground truth was re-measured mid-edit and half of it silently moved to a different build; the ship
notice announced a revival that never occurred; the verification plan promised an assertion never
written. Only the last cost anything — and it cost exactly what such omissions always cost, since the
untested surface is the one carrying both defects found here.

The corpse-run itself is intact, and it is the good kind of mechanic: it turns a death into a place
you have to walk back to, and the game now tells you where that place is from anywhere on the map —
without ever offering to take you there.
