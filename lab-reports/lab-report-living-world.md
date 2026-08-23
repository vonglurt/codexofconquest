<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com -->

# Lab Report — The Living World: Off-Screen Life, World Progression, and Map Memory

*roll2hit.com / Codex of Conquest — Layer 44 design lock, re-verified against the live engine*

| | |
|---|---|
| **Original** | Layer 44 design document, dated **2026-05-22** (report footer) |
| **First commit** | `32c10c5` 2026-05-24 17:34:49 — the repository's **initial commit**; the whole feature set is already present in it |
| **Ship build** | `32c10c5:roll2hit-v3.html` — **14,377 lines / 859,773 bytes** |
| **HEAD build** | 2026-08-23 — **38,712 lines / 5,513,223 bytes**, a **6.4×** file |
| **Verified** | §DOC-02cy, 2026-08-23 — source census + exhaustive route sweep + Chromium (`tests/integration/living-world-l44.spec.js`, 9 measurement specs, all green) |
| **Status** | **HISTORY doc.** Legacy 26×16 node codes (`CI`, `IN`, `TV`, `BA`, `CY`, `SQ`, `E*`) are left as written — annotate, don't rewrite (§DX-02c / §AUDIT-03n) |

> **⚠️ KEY-DRIFT NOTE (2026-07-31, §AUDIT-03n).** The design-time tables below key their per-NPC entries to the profiles' **surnames** — `couperin` / `weckmann` / `bruhns`. The favor ledger never writes those, so every one of those entries was unreachable in live play until §AUDIT-03n renamed them. Read them as **`quill`** (Bard Tomas Couperin, MHQ) · **`crov`** (Pit Master Weckmann, HKG) · **`auros`** (Cmdr Seraphine Bruhns, HKG). The six canonical keys are `yael` · `brynn` · `quill` · `pachelbel` · `crov` · `auros`, fenced by `check:npcregs` (`check:walk` gate #14). *Re-confirmed 2026-08-23: every authored string in this report is **byte-identical** from `32c10c5` to HEAD — only the keys moved.* The design intent was never wrong, only the spelling.

---

## Abstract

Layer 44 specifies eleven subsystems whose shared thesis is that the world should have momentum the player did not supply: an off-screen character who is named but never interactable, six world-progression events that fire on milestones rather than on quests, a minimap tinted by who you befriended, corridor farewells, an Act III tonal weight, unrewarded inn maintenance with a readable ledger, quiet return receipts in place of quest fanfare, a public moral code posted on a wall, a Void foreshadow, and a final map that shows the run back to you. This re-verification finds the layer **shipped broadly and honored its text exactly** — **25 of 29** named symbols resolve at HEAD, every authored string block is byte-identical to the spec across 90 days and a 6.4× file, and the §XI ending-map timings (3 s fade, 5 s hold, fade to black) are matched to the millisecond. The value is in nine deltas, and three are load-bearing. **§II's premise did not ship**: Gigault is "named by two people" in the design and by *nobody* in the engine — the two quotes that make her real are absent, and her bread stall renders inside a bar. **§III's rendering did not ship**: all six world-progression notes are written into `S_story.log`, which is the movement breadcrumb array, and no code path reads text out of it — the accompanying `.journal-entry.world` CSS matches zero elements, forever. **§XI's closing image is not full-screen**: a later layer's caption sets `overlay.style.position = 'relative'` over a stylesheet `position: fixed`, and the final map drops into normal flow below the UI chrome. Six further deltas follow, including two authored blocks (Auros's farewells, five Birka receipts) that no lookup can reach, a ledger whose printed lines have never summed to the balance beneath them, and one Epic Battleground return that has always been met with silence.

---

## I. Introduction — what the feature is for

Most RPG worlds wait. The city pauses when you leave. The NPCs freeze in their last position. The debt doesn't grow, the structural report doesn't get filed, and nothing happens until the player triggers it.

The Codex of Conquest world doesn't wait — and the design's honesty about *how* is the reason it works. This is not a simulation. Auros does not file her report on a timer; Quill's debt does not accrue in real seconds. But the **impression** of momentum is purchasable with a small number of carefully placed state transitions keyed to milestones (act numbers, node visits, the day counter) rather than to player intent. The target feeling, in the design's own words:

> *You came back to Birka and it was still running without you. Brynn's inn is open. Yael is on patrol. Quill's debt is worse than you left it, if you left it. The city doesn't need you. It just happens to be glad you came back.*

**Why this matters for playability.** Everything else in the game measures the player: XP, gold, shards, battles won, a 49-day clock. Layer 44 is the layer that measures back in the other direction — it is the only system in the file whose output is *the world's opinion of your absence*. Concretely it adds, at HEAD: **3 ambient stall strings** that cycle without you, **6 milestone events** that fire without you, **16 reachable corridor farewells**, **6 Act III dialogue injections**, **3 unrewarded maintenance tasks** with a **readable balance sheet**, **24 authored return receipts**, a **4-rule moral code** posted before you ever speak to its author, and a **129-cell ending map** tinted by who you were kind to. None of it grants XP. None of it gates a road (invariant #1 is untouched — nothing here ever refuses a step). Every line of it is the antidote to the Curse of Knowledge the design names in its first section: **the world is not a problem waiting for you to solve it.**

The eleven subsystems: **(II)** the off-screen character · **(III)** world progression events · **(IV)** map warmth gradient · **(V)** corridor farewells · **(VI)** the Third Act weight · **(VII)** Brynn's maintenance + ledger · **(VIII)** quiet return receipts · **(IX)** Pachelbel's posted code · **(X)** the Void's First Sign · **(XI)** the final map render.

---

## II. Method

1. **Symbol census** — every construct the report names, grepped at HEAD and at the report's own build (`git show 32c10c5:roll2hit-v3.html`).
2. **Byte-diff against the ship build** — each design-time text block compared line for line across 90 days and a 6.4× file.
3. **Reader/writer trace** — for every state field the spec introduces, write sites and read sites counted *separately*. A field with writers and no readers is the finding; so is a field with two writers that disagree about what it means.
4. **Exhaustive route sweep** — `_getFarewell(from, to)` evaluated over every ordered pair in `NODE_MAP` at maximum favor, and the reachable string set compared against the authored set.
5. **Chromium proof** — nine measurement specs through the repo's own Playwright harness (`seedAndLoad` + `dismissContinue`), asserting *through the engine's own functions* rather than a re-implementation, plus a rendered screenshot of the ending map.

---

## III. Result — spec → shipped delta

**25 of 29 named symbols resolve at HEAD.** Only §X's four (`VOID_SIGN_ROW`, `VOID_SIGN_COL`, `void-flicker`, `_renderMinimapCell`) are absent, and they are absent together.

| § | Subsystem | Shipped? | Delta |
|---|---|---|---|
| II | Gigault, off-screen | ⚠️ half | 3 stall strings byte-identical and cycling. **NOT SHIPPED: the two NPC lines that name her** (**F1**). Renders at `LLA` — *The Rough Bar*, not a market |
| III | World progression | ⚠️ half | All 6 events live and correctly gated. **NOT SHIPPED: the rendering** — notes go to the breadcrumb array (**F2**); flag polarity collides with Layer 69 (**F8**); fires on sleep, not visit (**F9**) |
| IV | Map warmth | ✅ | All five tiers exact (`#222`/`#555`/`#5a4a3a`/`#6a5a3a`/`#8a6a3a`/`#3a7a5a`). Spec's dead `warmth = fav * 20` line correctly dropped (**F10**). EB green is ending-map-only in practice |
| V | Corridor farewells | ✅ 16/18 | Route lookup the spec punted on was **finished** by the implementer (**F10**). Threshold is `fav >= 1`, not the spec's `>= 2` (**F7**). Auros's 2 lines unreachable (**F4**) |
| VI | Third Act weight | ✅ byte-identical | 6/6 lines; `body.act-three .npc-card-chip { filter: saturate(0.85); }` shipped exactly as written, chip class applied at `card.className@23722` |
| VII | Brynn's maintenance | ✅ byte-identical | 3 tasks, narration + `brynn_after` exact, ledger panel, zero-balance line. Ledger arithmetic never balanced (**F6**); surplus reachable by 1 copper (**F6**); gate one tier low (**F7**) |
| VIII | Quiet receipts | ✅ 19/24 reachable | 5 Birka keys have no lookup path; `INV` has no receipt (**F5**) |
| IX | Pachelbel's code | ✅ byte-identical | 4 rules exact, ungated and public **exactly as the spec asked** — the `→ doc:` comment claiming a Dear Friend gate is the thing that's wrong (**F11**) |
| X | The Void's First Sign | ❌ | Not shipped, in any form (**F3b**) |
| XI | Final map | ✅ + ⚠️ | 129 cells, timings matched to the millisecond. **Overlay is not full-screen** (**F3**); §XI's "no text on the map" superseded by Layer 66b's caption |

Anchors at HEAD: `const PETRA_STALL_STATES = [@27398` · `const WORLD_PROGRESSION_EVENTS = [@27404` · `const NODE_NPC_KEYS = {@27413` · `const NPC_FAREWELLS = {@27427` · `const NPC_ACT_THREE_LINES = {@27469` · `const BRYNN_MAINTENANCE_TASKS = [@27498` · `const QUIET_RETURN_RECEIPTS = {@27519` · `const DEACON_CODE_TEXT =@27546` · `function _getGigaultState()@27558` · `function _getNodeMapColor(nodeSlug)@27562` · `function _getFarewell(fromCode, toCode)@27575` · `function _checkWorldProgressionEvents()@27584` · `function _applyActThreeWeight()@27598` · `function _renderFinalMap()@27605` · `function _storyEbReturnBeat(ebCode)@30358` · `function _nodeHookBirkaGigaultStall(node,@32117` · `function _nodeHookBirkaDeaconCode(node,@32126` · `function _nodeHookBirkaBrynnMaintenance(node,@32154`.

---

## IV. Findings

### F1 — Gigault is named by nobody ⚠️ *the headline*

§II's argument rests on exactly one mechanism, and states it plainly: *"She is named by two people. She affects the world. She exists."* The two namings are quoted verbatim in the spec — Yael's (*"She goes home an hour early when there's going to be trouble. I use her schedule to calibrate mine."*) and Brynn's (*"Gigault's the one who notices when the city is wrong before anyone else does."*).

Neither line is in the engine. `grep -c "Gigault" roll2hit-v3.html` returns **9**, and all nine are the feature's own plumbing: three stall strings, the state function, the hook, its registration, and two comments. Strip those and no character in the game has ever said her name.

What shipped is the *set dressing* without the *evidence*. The stall cycles correctly — `PETRA_STALL_STATES[(S_story.gameDay || 0) % 3]`, three days, verified in Chromium — so a player sees a blocked counter, then warm loaves and *"Back at ninth bell,"* then *"Tomorrow."* But the section's own test ("*Gigault is the test*") cannot be administered: the player has no reason to try to interact with a stall belonging to a woman nobody mentioned, and therefore never experiences the frustration-or-delight the design was measuring.

Two smaller drifts ride along. The constant is named for **Petra**, a character who no longer exists anywhere in the file — a rename artifact preserved in a symbol name. And the hook registers `nodes:['LLA']`, which is **The Rough Bar**, while the `→ doc:` comment says `CI` (= `LHR`, City Streets). The spec says *"the player can visit the market node and see her stall."* A bread stall currently operates inside a bar.

**Cost to fix: two dialogue lines.** They are already written, in this document, in quotation marks.

### F2 — six world-progression notes are written into the movement breadcrumb array ⚠️

`S_story.log` has exactly eight consumers in the file. Six treat it as an array of node-code **strings** — the trail: `S_story.log.push(S_story.currentCode)@28359`, capped at twenty by the next line, and read back as `new Set((S_story.log || []).slice(-20))` in three separate minimap renders.

The other two are Layer 44 and its descendant, and they `unshift` an **object**:

```js
// function _checkWorldProgressionEvents()@27584
S_story.log.unshift({ type:'world', text: ev.journalNote, day: S_story.day || 1 });
```

Nothing anywhere reads `.text` or `.type` off that array. The `#journal-card` UI is Froberger's Journal — a different system keyed on `entry.entryNum`. And §III's own styling is stranded with it: `.journal-entry.world@2116` is a five-line rule for a class the render path never applies; `document.querySelectorAll('.journal-entry')` returns **0** at every point in a run.

So the five authored journal notes — *"Structural assessment submitted — Auros's name on the cover page"*, the courier at BA, Brynn's letter from Heartwood, the not-anonymous internal affairs submission, Weckmann's Thursday class — plus one ambient note added later (*"The guard on the corner — Nivers. Eleven years."*@32249) are **six strings no player has ever seen.** Measured in Chromium: after `_checkWorldProgressionEvents()` fires on a trail of two node codes, `S_story.log` holds one object and two strings, and `.journal-entry.world` matches zero elements.

The section closes: *"The player may miss these entirely if they don't check the journal. They will miss them."* It was righter than it knew. There is no journal to check, and the note also quietly occupies one of the twenty breadcrumb slots on its way to being ignored.

### F3 — the game's closing image is not full-screen ⚠️

`#final-map-overlay@2131` is declared `position: fixed; inset: 0; z-index: 470` — a full-bleed black canvas, exactly as §XI describes. Then, 3,474 lines later, Layer 66b appends its caption and writes:

```js
// function _renderFinalMap()@27605
overlay.style.position = 'relative';   // ← beats the stylesheet
overlay.appendChild(captionEl);
```

The intent was to give the absolutely-positioned caption a containing block. But `position: fixed` **already** establishes one; the line was never needed, and an inline style outranks the rule it overrides. Measured in Chromium: computed `position` is `fixed` before `_renderFinalMap()` and `relative` after, with the overlay's bounding box starting **262 px down the page**. The last image of every ending variant renders in normal flow, *below* the header, the act strip, the compass, three map panels, the exits column and the combat log — and overflows the bottom of the viewport.

Rendered proof (`test-results/l44-final-map.png`): the grid is correct — 129 cells, two warm amber for a Dear Friend and a Friendly, one `#3a7a5a` green for a returned Epic Battleground, the rest dark — and the caption fades in on cue. It is simply drawn in the wrong place, with the UI chrome sitting on top of the run's final statement.

**Cost to fix: delete one line.**

### F3b — §X, the Void's First Sign, did not ship

`VOID_SIGN_ROW`, `VOID_SIGN_COL`, `void-flicker`, `_renderMinimapCell`: **zero occurrences each**. The three-act arc — a barely-off-color pixel in Act I, gone by Act III, a one-tile traversable space in Act V reading *"You saw this before. It was waiting for you to be ready."* — is absent in every part. It is the only whole section of this report with no implementation at all, and it is the section that most depended on being built once and never touched.

### F4 — Auros has farewells and no doorway

`NPC_FAREWELLS.auros` holds two authored lines. `_getFarewell` sources its owner key from one place:

```js
// function _getFarewell(fromCode, toCode)@27575
const npcKey = NODE_NPC_KEYS[fromCode];
```

and `NODE_NPC_KEYS` at HEAD is five rows — `LHR:'yael', TLL:'brynn', MHQ:'quill', LLA:'pachelbel', HKG:'crov'`. There is no `auros` row. Auros and Crov share `HKG`, and the map gives the doorway to Crov.

The spec anticipated this collision exactly, and the anticipation is the part that didn't ship:

```js
CY: 'crov', // also 'auros' — use max of both
```

Measured exhaustively: `_getFarewell` swept over all ordered pairs of `NODE_MAP` codes at maximum favor for all six NPCs yields **16 reachable strings** (11 routes + 5 defaults). Auros's *"The Ironshell node has subsidence in the northwest corner. Don't stand there."* and *"Document what you see."* are not among them, and never have been. The same shortfall hides the map-warmth tint from her node, since `_getNodeMapColor` reads the identical table.

### F5 — five receipts with no lookup, and one return met with silence

`QUIET_RETURN_RECEIPTS` holds **24** keys. Its only consumer is `const receipt = QUIET_RETURN_RECEIPTS[ebCode];` inside `function _storyEbReturnBeat(ebCode)@30358`, where `ebCode` is always an Epic Battleground node code. Nineteen keys are EB codes. The other five — `yael_ghetto`, `quill_debt`, `deacon_redd`, `crov_pit`, `auros_depths` — are the Birka arc returns the spec listed alongside them, and no call site can ever produce those strings as an argument. *"[Pachelbel holds the receipt for a long time. Then puts it in his coat.]"* has never been held by anyone. (`deacon_redd` also preserves the retired `deacon` prefix in a line that names Pachelbel — harmless, since it is unreachable.)

Separately, the file defines **20** EB return quests. Exactly one has no receipt: **`INV`** (`quest_eh_return` — *Return: Shepherd Rona*). This is not remap damage — the ship build authored 19 legacy keys too, so Rona has been returning to silence since the initial commit while her nineteen colleagues each get a sentence.

### F6 — the ledger does not balance, and never has

§VII's balance sheet is the section's centerpiece and its arithmetic does not close. The printed lines, as authored and as shipped:

```
Room nights   235 · Meals served    84
Kitchen staff -45 · Supplies      -112 · Repairs -24
BALANCE: -8 copper
```

`235 + 84 − 45 − 112 − 24 = +138`. Fixing the third step moves Repairs to −20 and the printed sum to **+142**. The `BALANCE` line is not computed from the lines above it at all — it renders `S_story.brynLedgerBalance`, a separate field initialised to `-8@23096`. The spec had the same gap; the implementation reproduced it faithfully, which is arguably the correct call for a design lock and is certainly the funnier one. Brynn's inn is, on its own printed evidence, comfortably profitable and being told otherwise.

The second miss is smaller and more precise. §VII promises: *"The deficit can be brought to zero but not into surplus — Brynn keeps prices fair."* The three tasks add `+4`, `+2`, `+3` to a `−8` start. Measured through the tasks' own `action()` closures: `−4 → −2 → **+1**`. The engine even has a dedicated branch for the state the design forbids —

```js
const balStr = bal < 0 ? bal + ' copper' : bal === 0 ? '0 copper (balanced)' : '+' + bal + ' copper';
```

— which renders that one copper in green. The design's line is off by exactly one, in a report already keeping company with §DOC-02cx's ending that missed by exactly one point.

### F7 — two gates open one favor tier below spec

§V: *"only Friendly+ NPCs send farewells"*, spec `if (fav < 2) continue;`. Shipped: `if (!npcKey || _npcFavor(npcKey) < 1) return null;`. §VII: *"after becoming Friendly with Brynn"*. Shipped: `if (_npcFavor('brynn') >= 1)`. Both fire at **Quest-Active**, one tier below **Friendly**. Measured: `_getFarewell('LHR','TLL')` returns `null` at favor 0 and the authored *"Brynn's fine. Don't fuss at her."* at favor 1.

This is arguably a better game — the farewell is the reward that *teaches* the player favor exists — but it is not what the lock says, and the two systems' warmth thresholds now disagree with `_getNodeMapColor`'s, which does treat `fav >= 2` as its Friendly rung. Recorded as drift; no change recommended without a design call.

### F8 — one boolean carrying two opposite meanings

`couperiDebtDegraded` has two writers that disagree about what it records.

- **Layer 44** (`WORLD_PROGRESSION_EVENTS`, id `quill_debt`) sets it when `actNumber >= 4 && !S_story.quillQuestComplete` — *the quest was never taken and the debt got worse.* Correctly silent: `journalNote: null`, exactly as §III specifies.
- **Layer 69** (§XXXIV Beat 3, `@35292`) sets it at `MHQ` when `quillQuestComplete && !couperiDebtDegraded` — *the quest was finished and the debt was released*, announced with *"── The Couperin debt has done its work. ──"*.

The two epilogue readers (`@28098`, `@28101`) are both gated on `quillQuestComplete`, so they only ever see Layer 69's meaning and stay coherent. The dialogue reader does not:

```js
// @23584
if (npcKey === 'quill' && S_story.couperiDebtDegraded) { /* injects the release lesson */ }
```

A player who reaches Act IV having **never started** Quill's quest triggers Layer 44's writer, and Quill then philosophises at them about how *"a debt that has done its work becomes just a number. That's when you can release it"* — about a debt they left untouched. The spec's own intended line for this state was quieter and correct: *"The number is a number now. I don't look at it anymore."*

### F9 — §III's table and §III's code disagreed, and a third thing shipped

The event table says *"Act V reached + Quill quest never started."* The code block four paragraphs later says `const actThreshold = 4; // Act IV`. Shipped: `actNumber >= 4`. The implementer followed the code, which is the right instinct, but the lock contradicted itself in the same section — the exact failure mode a design lock exists to prevent. (The other five rows match their table entries exactly, including `weckmann_class`'s `actNumber >= 6 && _npcFavor('crov') >= 3`.)

Relatedly, §III opens *"these are state transitions that trigger at game milestones **regardless of player action**"*, and the constant's `→ doc:` comment says *"run per node visit."* Both are wrong: `_checkWorldProgressionEvents()` has exactly one call site, inside `function storyConfirmSleep()@36244`. A player who never sleeps never advances the world. Given F2, they would not have noticed.

### F10 — credit where it is due: the implementer finished the spec's homework

Two places where the shipped code is *better* than the lock:

- §V's `_getFarewell` ends in the spec with `// ... route lookup logic` and `return farewells.default; // simplified`. Shipped composes the real key — `const routeKey = fromCode + '_to_' + toCode;` — and falls back to `default` only on a miss, which is what made all 11 route-specific lines reachable instead of none.
- §IV's `_getNodeMapColor` carries a dead line in the spec (`const warmth = fav * 20;`, computed and never used). It is absent from the shipped function, whose tier ladder is otherwise byte-identical.

Worth stating plainly, since this program mostly records the other direction: **every authored string in Layer 44 survived 90 days and a 6.4× file unchanged.** Only keys moved, and only under §AUDIT-03j/n.

### F11 — five `→ doc:` pointers, four of them wrong

| Constant | Pointer | Reality |
|---|---|---|
| `PETRA_STALL_STATES` | `world.md §Act III Optional Detour` | Heading exists — and is about **Yugurt Lake** (`BOO`/`SSJ`). Wrong subject; the comment also says *"Petra's CI bread stall"* (wrong name, wrong node) |
| `WORLD_PROGRESSION_EVENTS` | `world.md §World Progression` | **0 occurrences** in `world.md` |
| `NODE_NPC_KEYS` | `world.md §NPC Locations` | **0 occurrences** in `world.md` |
| `NPC_FAREWELLS` | `story.md §Act VIII NPC Farewell Beats` | Lives in **`world.md:1258`** — right heading, wrong file |
| `DEACON_CODE_TEXT` | `world.md §Deacon's Code (… Pachelbel Dear Friend)` | Heading resolves, but there is **no favor gate** on the button — correctly so; §IX's whole point is *"The code is public. He posted it on the wall."* The pointer invents a gate the spec forbids |

`check:anchors` is green (4,507 `symbol@line` anchors across 109 docs, 117 stale hints, zero dead) because it audits *symbol* anchors only — it does not resolve `→ doc: <file> §<Section>` pointers at all. This is the same unfenced class §DOC-02cx filed as §DX-02er(b); five more instances here argue the gate should grow rather than the rows accumulate.

---

## V. Playability assessment

**What the layer adds, and it is substantial.** Layer 44 is the reason returning to Birka feels different from arriving at Birka. Concretely, at HEAD, a player who befriends people gets: a farewell line every time they leave a friend's node (16 authored variants, route-aware), a one-time Act III acknowledgment from each of six NPCs plus a real if subtle desaturation of every NPC card, three unrewarded chores at the inn whose only payoff is Brynn saying *"Oh. That's the first time in three years."* — beat — *"Thank you."*, a four-rule moral code readable before its author speaks a word, nineteen quiet return receipts that replace *Quest Complete!* with a forester marking a map, and a minimap that warms where they were kind. None of it grants XP. That restraint is the feature.

**What the player actually experiences, measured.** Of the eleven sections, **six land whole** (IV, VI, VII-minus-arithmetic, VIII-minus-five, IX, XI-minus-position), **three land partially** (II without its premise, III without its rendering, V without Auros), and **one is absent** (X). The most valuable single hour of work here is not a new system — it is F1's two dialogue lines, which cost nothing and switch on the section the whole design opens with.

**The three highest-value fixes are all trivially small.** Deleting one line (`overlay.style.position = 'relative'`) restores the game's closing image to full screen. Adding two NPC lines makes Gigault exist. Giving `S_story.log`'s world entries an actual reader — or routing them to the existing message stream — makes six authored strings visible for the first time. None of them touches the road, the mover, the VM, or the save format.

**What should not be "fixed".** §IX's ungated public code and F7's one-tier-early farewells both read as improvements on the lock. F6's unbalanced ledger is a charming lie told by a fictional innkeeper's bookkeeping, and the report recommends leaving the numbers alone while correcting only the impossible-surplus claim — or the surplus, whichever the author prefers.

---

## VI. Doc corrections applied in this increment

1. Report restructured to the program's IEEE-style form (Abstract / Introduction / Method / Result / Findings / Playability / Corrections / Rows / Conclusion); **431 → 268 lines**, with all speculative implementation sketches replaced by the shipped anchors and every design-intent passage preserved.
2. Status header added: **HISTORY doc**, legacy codes annotated rather than rewritten, with the ship build and both file sizes pinned.
3. §II annotated: `PETRA_STALL_STATES` renders at `LLA` (The Rough Bar), not a market; the constant preserves a retired character name.
4. §III's Act V / Act IV self-contradiction recorded, with the shipped value (Act IV) marked authoritative.
5. §IV/§V tables annotated with the §AUDIT-03j remap (`CI`→`LHR`, `IN`→`TLL`, `TV`→`MHQ`, `BA`→`LLA`, `CY`→`HKG`, legacy `E*`→ live EB codes) and the loss of the spec's `// also 'auros' — use max of both`.
6. §XI's *"No text on the map itself. No legend."* marked **superseded** by Layer 66b's S55 caption, which is intentional and shipped.
7. KEY-DRIFT note extended with the 2026-08-23 byte-identity re-confirmation.

---

## VII. Rows filed

| Row | Premise | Size |
|---|---|---|
| **§DX-02es** | Gigault is named by nobody — add the two NPC lines the spec quotes; decide whether the stall belongs at `LLA` or `LHR` | 🟡 two strings + one node call |
| **§DX-02et** | Six world-progression notes are written into the movement breadcrumb array and never rendered; `.journal-entry.world` is dead CSS | 🟡 one reader, one design call |
| **§DX-02eu** | `overlay.style.position = 'relative'` drops the ending map out of full-screen — delete one line | 🟢 one line, no design call |
| **§DX-02ev** | Auros's two farewells and the five Birka quiet receipts are unreachable; `INV` has no receipt at all | 🟡 implement-or-retire |
| **§DX-02ew** | Brynn's ledger prints `+138` under a `−8` balance, and reaches `+1` against a spec that forbids surplus | 🟡 one design call |
| **§DX-02ex** | `couperiDebtDegraded` carries two opposite meanings; the dialogue reader speaks absolution over neglect | 🟡 one flag split |
| **§DX-02ey** | Five `→ doc:` pointers wrong across Layer 44; `check:anchors` does not resolve section pointers at all | 🟢 four comments + a gate |
| **§DX-02ez** | §X (the Void's First Sign) never shipped — implement or retire the section | 🟡 implement-or-retire |

---

## VIII. Test coverage

Before this increment, **no test touched any Layer 44 symbol.** `tests/integration/living-world-l44.spec.js` now pins nine behaviours — the breadcrumb-array write and the dead CSS rule, the unreachable Auros farewells (via an exhaustive `NODE_MAP²` sweep), the favor threshold, the ledger arithmetic and its `+1` ceiling, the receipt coverage set, the five warmth tiers and the three-day stall cycle, the 129-cell ending map with its caption timing, the overlay's lost `position: fixed`, and the Act III body class. All nine assert through the engine's own functions, so a future edit breaks the test rather than silently invalidating this report. **9/9 green** in Chromium.

---

## IX. Conclusion

Layer 44 is the most faithfully-transcribed design lock this program has scored: every authored string in it is byte-identical from the repository's first commit to a file six times its size, the ending map's timings match the spec to the millisecond, and in two places the implementer finished work the lock had left as a comment. Its failures are not failures of care but of *last mile* — three of them are a missing dialogue line, a missing reader, and one surplus line of CSS.

That pattern is worth naming, because it is the specific hazard of a layer like this one. Every subsystem here is designed to be **unobtrusive**: no XP, no banner, no gate, nothing that stops the player. A quest that doesn't fire gets reported within an hour. A farewell that doesn't fire, a journal note nobody reads, a woman nobody mentions, an ending map drawn under the UI — these fail exactly the way they were designed to succeed, which is *quietly*. This report's real finding is that **a system built to be missed needs a test more than a loud one does**, and until today Layer 44 had none.

The design's own closing line still holds, and now holds literally:

> *The map doesn't judge. It just shows.*

It shows 129 cells, warm where you were kind. It just needs to be told to cover the screen.

---

*lab-report-living-world.md — Layer 44 design lock · original 2026-05-22 · verified §DOC-02cy 2026-08-23*

---
*© 2026 Paul Richeson — MIT License. See [LICENSE](LICENSE) for full text.*
