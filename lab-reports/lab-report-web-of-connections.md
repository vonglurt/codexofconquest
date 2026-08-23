<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com -->

# Lab Report — The Web of Connections: Froberger's Traces, NPC Cross-Relationships, and Hidden Histories

*roll2hit.com / Codex of Conquest — Layer 45 design lock, re-verified against the live engine*

| | |
|---|---|
| **Original** | Layer 45 design document, dated **2026-05-22** (report footer) |
| **First commit** | `32c10c5` 2026-05-24 17:34:49 — the repository's **initial commit**; the whole feature set is already present in it |
| **Ship build** | `32c10c5:roll2hit-v3.html` — **14,377 lines / 859,773 bytes** |
| **HEAD build** | 2026-08-23 — **38,712 lines / 5,513,223 bytes**, a **6.4×** file |
| **Verified** | §DOC-02cz, 2026-08-23 — source census + exhaustive favor-write enumeration + Chromium (`tests/integration/web-of-connections-l45.spec.js`, 11 measurement specs, all green) |
| **Status** | **HISTORY doc.** Legacy 26×16 node codes (`CI`, `IN`, `TV`, `BA`, `CY`, `SW`, `SL`) are left as written — annotate, don't rewrite (§DX-02c / §AUDIT-03n) |
| **Sibling** | Layer 44 — `lab-report-living-world.md`, verified §DOC-02cy. The two layers share the `npcFavorability` ledger and one defect |

> **⚠️ KEY-DRIFT NOTE (2026-07-31, §AUDIT-03n).** The design-time tables below key their per-NPC entries to the profiles' **surnames** — `couperin` / `weckmann` / `bruhns`. The favor ledger never writes those, so every one of those entries was unreachable in live play until §AUDIT-03n renamed them. Read them as **`quill`** (Bard Tomas Couperin, MHQ) · **`crov`** (Pit Master Weckmann, HKG) · **`auros`** (Cmdr Seraphine Bruhns, HKG). The six canonical keys are `yael` · `brynn` · `quill` · `pachelbel` · `crov` · `auros`, fenced by `check:npcregs` (`check:walk` gate #14). *Re-confirmed 2026-08-23: every authored string in this report — all 6 traces, all 17 cross-references, all 5 patrol lines, the full training log — is **byte-identical** from `32c10c5` to HEAD. Only keys and node codes moved.*

---

## Abstract

Layer 45 specifies eight subsystems that give Birka a past: six one-time NPC memories of Froberger, seventeen cross-reference lines in which the NPCs describe each other, a guard who has said one word for eleven years, a patrol schedule that moves Yael off her home node, a readable training log spanning twelve years, an empty inn room with a note in it, three cross-item connections, and the composite portrait all of that assembles. This re-verification finds the layer **shipped almost completely and transcribed perfectly** — every authored string is byte-identical to the lock across 90 days and a 6.4× file, all 17 cross-references and all 6 traces are present, and §VI, §VII and §VIII shipped as written. The value is in seven deltas, and the largest is not in this layer at all but in the ledger it depends on. **The favor scale has a ceiling the content does not know about.** Every favor write in the file funnels through `_setNpcFavor`, whose auto-upgrade path is hardcoded to **2**; only `yael` has a write to 3 anywhere in the game. `crov`'s maximum reachable favor is therefore **2**, and his Froberger trace asks for **3** — so *one of the six traces the report is built around cannot be delivered*, and the same ceiling silently kills a Layer 44 world event that §DOC-02cy passed as live. `brynn` reaches 3 only on one of two quest orderings, which makes §VII's Room 6 — a whole section — **conditionally reachable at all**. Five further deltas: Yael's patrol loop is first-match-wins with its loosest condition declared first, so four of her five field lines are **even-game-day-only**; the cross-references are a consumed sequence rather than the "naturally cycling pool" specified; two of the connection map's eight declared relationships have no lines in either direction, one of them being the *"everyone mentions Gigault"* edge that §DOC-02cy independently found broken from the other side; a delivered trace never rejoins the pool as specified; and Weckmann's log renders an authoring stage direction to the player as though it were handwriting.

---

## I. Introduction — what the feature is for

The player arrives in Birka having never been there. But Froberger was there before them, and the NPCs did not start existing when the player walked in. They have histories with each other — debts and warmth and twelve-year-old arguments that were never fully resolved.

The web of connections is what the player discovers by staying. Not in a quest, not in a journal entry: in Yael mentioning Weckmann offhand, in Brynn knowing Froberger's room number without being asked, in Quill and Pachelbel having a complicated history the player never gets the whole of.

> *The world is not assembled for the player's benefit. It predates them. They're discovering what's already there.*

**Why this matters for playability.** Layer 44 (its sibling) makes the world move without the player; Layer 45 makes it *have a past*. Mechanically it is the payoff arm of the `npcFavorability` ledger — the reason to raise favor at all when favor grants no stats. Concretely it adds, at HEAD: **6 Froberger traces** (one per NPC, one-time, favor- and visit-gated), **17 cross-reference lines** distributed across all six NPCs, **5 Yael patrol field lines** unavailable at her home node, a **50-line readable training log** that updates with the player's own record, a **4-paragraph empty room** with a found note reading *"— still here."*, and **3 cross-item connections** that make one character react to something they learned somewhere else. None of it grants XP, gold, or a stat. None of it gates a road. It is the layer that converts *favor* from a number into a **relationship with a history attached**.

The eight subsystems: **(II)** Froberger's traces · **(III)** NPC cross-references · **(IV)** Nivers, the eleven-year guard · **(V)** Yael's patrol · **(VI)** Weckmann's training log · **(VII)** Room 6 · **(VIII)** cross-item connections · **(IX)** the composite truth.

---

## II. Method

1. **Symbol census** — every construct the report names, grepped at HEAD and at the report's own build (`git show 32c10c5:roll2hit-v3.html`).
2. **Byte-diff against the ship build** — each authored block compared line for line across 90 days.
3. **Exhaustive favor-write enumeration** — *every* write to `npcFavorability` in the file located (4 sites), every `kind:'favor'` bit in `QUEST_DB` extracted per NPC, and the reachable ceiling derived per NPC rather than assumed.
4. **Gate-vs-tier audit** — each gate's numeric threshold compared against the tier *name* the lock uses for it.
5. **Chromium proof** — eleven measurement specs through the repo's own Playwright harness, asserting through the engine's own functions (`_setNpcFavor`, `_checkFrobergerTrace`, `_getYaelLocation`, `_buildWeckmannLog`, `_nodeHookBirkaRoom6`), including one **cross-layer** case that re-tests a §DOC-02cy claim.

---

## III. Result — spec → shipped delta

**All eight subsystems shipped.** Every authored string is byte-identical; the only design-time symbol that never existed is `MAREN_DIALOGUE`, which shipped as `NIVERS_DIALOGUE` in the initial commit — the lock's own draft name for the character, never used.

| § | Subsystem | Shipped? | Delta |
|---|---|---|---|
| II | Froberger's traces | ⚠️ 5 of 6 deliverable | 6/6 present, byte-identical, tiers exact. **`crov`'s asks for favor 3 and crov's ceiling is 2** (**F1**). **NOT SHIPPED:** *"added to the NPC's permanent pool so it can resurface"* — delivered once, then never again (**F6**) |
| III | Cross-references | ✅ 17/17 | Distributed over all six NPCs, byte-identical. Delivered as a **consumed sequence** every 3rd visit, not the specified cycling pool (**F4**). Two declared relationships have **no lines** (**F3**) |
| IV | Nivers | ✅ | `const NIVERS_DIALOGUE = "Evening."` live and rendered. Sits **at `LHR`**, not the specified intersection between CI and IN. Yael's follow-up gated at fav ≥ 2, not the specified Dear Friend. Her journal note hits the §DX-02et breadcrumb bug (**F7**) |
| V | Yael's patrol | ⚠️ 4 of 5 usable | 5 entries (4 from the lock + 1 from Layer 74). **First-match-wins over non-exclusive conditions, loosest first** → four lines are even-day-only (**F2**). The lock's `ER`/Redwater row never shipped. Yael is **not removed** from her home node while "on patrol" |
| VI | Training log | ✅ | Full log, Bruna's entries, the two-year gap, player entries keyed to `pitTrainingWins`, plus a Layer 64 championship entry. **Renders an authoring stage direction as player text** (**F5**) |
| VII | Room 6 | ✅ · conditionally reachable | Room, sigil, two pillows, the note, and Brynn's payoff line all ship at `_npcFavor('brynn') >= 3` — a level reachable on **one of two quest orderings** (**F1b**) |
| VIII | Cross-item connections | ✅ 3/3 | All three live. Two gated one tier below the lock's own words (**F8**). The Fighter's Token is removed from inventory but never *"sits on Weckmann's counter"* |
| IX | The composite truth | ⚠️ | Arithmetically incomplete: the portrait is missing Crov's panel, and Brynn's depends on quest order |

Anchors at HEAD: `function _checkFrobergerTrace(npcKey)@27648` · `function _getYaelLocation()@27660` · `function _buildWeckmannLog()@27667` · `const FROBERGER_TRACES = {@27685` · `const NPC_CROSS_REFS = {@27694` · `const NIVERS_DIALOGUE = "Evening.";@27726` · `const YAEL_PATROL_NODES = [@27728` · `const WECKMANN_TRAINING_LOG =@27736` · `function _npcFavor(key)@23460` · `function _setNpcFavor(key, level)@23462` · `function _checkDearFriendUpgrade(key)@23488` · `function _nodeHookBirkaNiversPasses(node,@32227` · `function _nodeHookBirkaYaelPatrolLine(node,@32518` · `function _nodeHookBirkaRoom6(node,@32778`.

---

## IV. Findings

### F1 — the favor ceiling is 2, and the content was written for 3 ⚠️ *the headline*

Every write to `npcFavorability` in the file resolves to four sites: `_setNpcFavor`'s own assignment, two hardcoded auto-upgrade lines, and one unrelated NPC. The two auto-upgrade sites — inside `function _setNpcFavor(key, level)@23462` and `function _checkDearFriendUpgrade(key)@23488` — are identical and both write the literal **2**:

```js
const check = dearFriendBits[key];
if (check && check()) { S_story.npcFavorability[key] = 2; /* "says your name when you walk in" */ }
```

`_setNpcFavor` is also monotonic (`if (level <= prev) return;`), so the only way past 2 is a bit or call that names 3 outright. Enumerating every `kind:'favor'` bit in `QUEST_DB` and every direct call gives the reachable ceiling per NPC:

| NPC | Declarative writes | Direct writes | **Ceiling** | Content asking for 3 |
|---|---|---|---|---|
| `yael` | `set:1`, `add:1` (cap 3) | `_setNpcFavor('yael', 3)@21429` (Ceremonia, CHA DC 15) | **3** | patrol entry 4 ✅ |
| `brynn` | `set:1`, `add:1` (cap 3) | — | **3**, order-dependent | Froberger trace ⚠️ · Room 6 ⚠️ |
| `quill` | `set:1` | — | **2** | — |
| `pachelbel` | `set:1` | — | **2** | — |
| `crov` | `set:1` | `_setNpcFavor('crov',1)@25400` | **2** | Froberger trace ❌ · Layer 44 `weckmann_class` ❌ |
| `auros` | `set:2` | — | **2** | — |

Measured in Chromium: with `pitTrainingWins = 5` (crov's own Dear-Friend condition) and his single `set:1` bit applied, `_npcFavor('crov')` is **2**, and a second `_setNpcFavor('crov', 2)` is a no-op. With visit counts amply satisfied, `_checkFrobergerTrace('crov')` returns **`null`**. Force the ledger to 3 and it returns the authored line — *"You still grieve it, don't you. That's why you run it clean."* — which is, by some distance, the best of the six.

So **§II's central claim is arithmetically false**: *"The player who talks to every NPC enough times will reconstruct Froberger from the outside."* Five sixths of him. The missing panel is precisely the one §II's own Composite Picture lists as *"He could see grief from the outside (Weckmann)"* — the trace in which Froberger reads a man's twelve-year-old bereavement off the way he watches fighters. It has never been read by anyone.

**The same ceiling reaches back a layer.** §DOC-02cy scored `WORLD_PROGRESSION_EVENTS` as *"all 6 events live and correctly gated."* One is not: `weckmann_class` requires `S_story.actNumber >= 6 && _npcFavor('crov') >= 3`. Measured at act 8 with crov at his ceiling, the condition is **`false`**; forced to 3 it is `true`. That report has been corrected, and the cross-layer case is pinned in this increment's suite. *A ceiling in a shared ledger is invisible from inside any single layer that reads it — which is exactly why it survived two verification passes.*

### F1b — Room 6 exists, and whether you can open it depends on quest order

`brynn` is the one non-yael NPC with an `add` bit — `quest_brynn_firewood`'s `{ kind:'favor', npc:'brynn', add:1 }`, capped at 3 — so she can stack the auto-upgrade. Whether she does depends entirely on sequence. Measured:

| Order | Result |
|---|---|
| ledger (`set:1`) → journal entry 7 read (auto-upgrade → **2**) → firewood (`add:1` → **3**) | **3** — Room 6 opens |
| ledger (`set:1`) → firewood (`add:1` → **2**) → journal entry 7 read | **2** — Room 6 never opens |

The second ordering loses because `_checkDearFriendUpgrade` opens with `if (_npcFavor(key) !== 1) return;` — at 2 it declines to act, and the `add` bit has already been spent. Confirmed by rendering the hook: `_nodeHookBirkaRoom6` emits nothing at favor 2 and the full panel at 3.

A player who does everything Brynn's arc offers, in the wrong order, is locked out of §VII — the room, the sigil, the second pillow, the scrap of paper reading *"— still here."*, and Brynn's payoff line, which is the best sentence in the layer:

> *"He didn't say goodbye. I used to think that was the hard part. Now I think the hard part was that he thought he was coming back."*

No message tells them. Nothing looks broken. The button is simply not there.

### F2 — four of Yael's five patrol lines are even-game-day-only

```js
// function _getYaelLocation()@27660
for (const p of YAEL_PATROL_NODES) { if (p.condition()) return p; }
```

First match wins, and `const YAEL_PATROL_NODES = [@27728` declares its **loosest** condition first: `(S_story.gameDay || 0) % 2 === 1`, true half the time and dependent on nothing else. Measured with *every* other patrol condition simultaneously satisfied — slums cleanup complete, escort used, named report delivered, yael at favor 3, act 5 — `_getYaelLocation()` on an odd game day returns `MSY` / *"Eastern check. You're traveling late."* Only on even days does it fall through to `BMA` / *"Showing my face."*

So the Ghetto line, the escort line, the *"Checking on Quill. Don't tell him."* line and Layer 74's second-report line are reachable **only on even game days**, and only one at a time, in declaration order. The four conditions were written as *independent facts about Yael's week*; the loop reads them as a priority list.

The section's premise takes a second hit: `_nodeHookBirkaYaelPatrolLine` runs `if (node.code !== 'LHR')` and only **adds** a field line elsewhere — it never removes Yael from her home node. §V's setup — *"The player who visits CI and doesn't find Yael: she's somewhere else"* — does not occur. She is always at `LHR`, and sometimes also in the field. The spatial puzzle has no puzzle in it. (The lock's sixth table row, Yael near `ER` with the Redwater line, never shipped: **0** occurrences of "Redwater" in the file.)

### F3 — two declared relationships with no lines in either direction

§III's connection map declares eight edges. Six are honored by `NPC_CROSS_REFS` — Yael↔Brynn, Yael↔Weckmann, Brynn↔Quill, Quill↔Pachelbel, Weckmann↔Auros, and All→Froberger (all six traces). Two are not:

- **`Yael — Pachelbel` (*"professional awareness; Yael knows what Pachelbel does; doesn't move on it"*)** — measured: **0** lines from Yael mentioning Pachelbel, **0** from Pachelbel mentioning Yael. The most interesting relationship on the map, dramatically speaking — a guard captain who knows a fence's business and has decided not to act — is described in the design and never spoken in the game.
- **`All → Gigault` (*"everyone mentions Gigault; Gigault mentions no one"*)** — measured: **0** mentions of Gigault across all 17 cross-references.

That second one is the same defect §DOC-02cy found from the other side. Layer 44's §II says Gigault is real *because two people name her*; Layer 45's §III says *everyone* names her. Two design locks, written the same day, each treating the other as the place the naming happens — and neither shipped it. **Between them the game has one bread stall, three ambient strings, and a woman nobody has ever mentioned.**

### F4 — the cross-references are a consumed sequence, not a cycling pool

§III specifies: *"These surface in the Friendly/Dear Friend pools as naturally cycling dialogue. Not triggered — just there, waiting."* Shipped:

```js
const idx = S_story['crossRefIdx_' + npcKey] || 0;
if (count > 0 && count % 3 === 0 && idx < eligible.length) { S_story[...] = idx + 1; return eligible[idx].text; }
```

Every third visit, strictly in declaration order, each line once. Measured for Brynn at favor 2 (4 eligible lines): they arrive on visits **3, 6, 9, 12**, and from visit 13 onward the cross-reference pool is silent forever. This is a different feature from the one specified — a **collection** rather than an ambience — and it is arguably the better one for a player who wants to see all 17. It is worth recording because the lock's phrasing (*"just there, waiting"*) would lead a future editor to expect re-cycling and to "fix" a bug that isn't one.

Note also that all 17 lines are gated at `fav: 1` or `fav: 2` — never 3 — which is why §III alone escaped F1 unharmed.

### F5 — the training log renders a stage direction as handwriting

The lock writes `[twelve years of entries — fighters' names, brief notes, outcomes]` as an authoring instruction, in the same bracket convention it uses for `[gap of two years]`. The first is a note to whoever fills the log in; the second is prose. `const WECKMANN_TRAINING_LOG =@27736` shipped **both** verbatim, and `_buildWeckmannLog()` substitutes only `{PLAYER_ENTRIES}` and `{CHAMP_ENTRY}`. Measured: the rendered log contains the literal string `[years of entries — fighters' names, brief notes, outcomes]`.

So a player who opens Weckmann's battered notebook — a genuinely lovely object, with Cabanilles who said he'd be back and wasn't, and Bruna pushed too far, and the two-year silence, and *"Back. Running legal fights only."* — reads, in the middle of it, an editorial placeholder describing what should have been written there. Everything else in §VI shipped exactly: Bruna's entries, the gap, the player's own five progressive notes keyed to `pitTrainingWins`, and Layer 64's championship addendum. **Cost to fix: replace one bracketed line with three or four invented fighters.**

### F6 — the trace is delivered once and does not come back

§II specifies: *"After delivery, the trace text is added to the NPC's permanent Friendly/Dear Friend pool so it can resurface naturally."* `_checkFrobergerTrace` sets `frobergerTrace_<key>_delivered` and returns the text; the selector returns it as that visit's quote. **Nothing adds it to any pool.** Measured: first call returns the line, second and third return `null` forever.

This is a small loss and a real one. The traces are the layer's best writing, and the design's argument for re-cycling them is sound — a memory of a dead man that surfaces again months later, unprompted, is a different experience from a memory you were shown once during a checklist of visits.

### F7 — Nivers ships, at the wrong address, with the breadcrumb bug attached

§IV shipped nearly whole, and its centerpiece is intact: `const NIVERS_DIALOGUE = "Evening.";` rendered on every pass, the pass counter, Yael's eleven-years speech, and the "🛡 Who is the guard on the corner?" button that gives the player her name for no reward. Three deltas:

- The lock places her *"at a minor intersection node between CI and IN — a patrol point that is traversable but not a full node."* Shipped: `if (node.code === 'LHR')` — she is at CI itself. The traversable-but-not-a-node concept does not exist in the engine, then or now.
- Yael's follow-up is gated `_npcFavor('yael') >= 2` where §IV says *"If the player has Yael at **Dear Friend**"* — one tier low (see **F8**).
- The name-learned journal note is written as `S_story.log.unshift({ type:'world', text: … })`, which is **§DX-02et's breadcrumb-array defect**, filed from §DOC-02cy. This is its second site and Layer 45's own. *"The guard on the corner — Nivers. Eleven years."* — a name, given, and filed into an array of node codes.

### F8 — the tier names and the tier numbers disagree, in four places

The lock names its gates by tier: *Friendly*, *Dear Friend*. The engine numbers them, and the file carries **two incompatible scales** in its own comments — `@22305` says *"cap (default 3 = Dear Friend)"* while `@23088` says *"Friendly (fav 1)"* and `@23507` says *"Dear Friend (fav 2)"*. Layer 45's constructs are split across both:

| Construct | Lock says | Shipped gate | Verdict |
|---|---|---|---|
| `FROBERGER_TRACES` | *"Friendly or Dear Friend"* | `minFav` 2 and 3 | ✅ 0–3 scale |
| Room 6 | *"Brynn reaches Dear Friend"* | `>= 3` | ✅ 0–3 scale |
| `NPC_CROSS_REFS` | *"Friendly / Dear Friend"* | `fav` 1 and 2 | ⚠️ 0–2 scale |
| Nivers → Yael line | *"Yael at Dear Friend"* | `>= 2` | ⚠️ 0–2 scale |
| Froberger note × Auros | *"visits Auros at Dear Friend"* | `>= 2` | ⚠️ 0–2 scale |
| Rough Whiskey × Brynn | *"Friendly or higher"* | `>= 1` | ⚠️ 0–2 scale |

Layer 44 adds two more on the 0–2 side (farewells, Brynn's maintenance) and two on the 0–3 side (`_getNodeMapColor`, `weckmann_class`). **This is the same root cause as F1 seen from the other end:** content written against the 0–3 scale either fires a tier early or, where the ceiling bites, never fires at all. The scales need to be reconciled once, centrally, not gate by gate.

### F9 — credit: this is the most complete layer the program has scored

Worth stating plainly. All eight subsystems shipped. All 17 cross-references, all 6 traces, all 5 patrol lines and the entire 50-line training log are **byte-identical from the repository's first commit to HEAD**. §VI, §VII and §VIII shipped as written, including details a shortcut would have dropped: the second pillow Brynn added and cannot explain, the sigil at eye level, the token that Weckmann keeps rather than hands back, and Brynn noticing Pachelbel's stock changed without knowing why. The implementer also finished a thing the lock left implicit — the training log's player entries advance on `pitTrainingWins` exactly as the five sample lines imply, and Layer 64 later extended the same mechanism for the championship rather than bolting on a new one.

---

## V. Playability assessment

**What the layer adds, and it is the reason favor exists.** Favor grants no stats in this game. Layer 45 is most of what it buys: 6 memories of a dead researcher told by the people who met him, 17 lines in which the cast describes each other, a guard who says *"Evening,"* a log with a two-year hole in it, and a room with a note that reads *"— still here."* A player who raises every NPC as far as the game allows gets, measured at HEAD, **5 of 6 traces**, **17 of 17 cross-references** (over ~39 node visits), **4 of 5 patrol lines** and only on even days, **1 of 1 training logs**, **3 of 3 cross-item connections**, and **Room 6 if and only if they read journal entry 7 before stacking Brynn's firewood.**

**What the player experiences vs. what was designed.** Six subsystems land whole. Two are diminished by the shared ledger rather than by their own code — which is the finding worth carrying forward: **§II and §VII are not broken, they are out of range.** Every line of them is correct, present, and byte-identical to a design document written the same week the repository was created. They simply ask the favor system for a number it stopped being able to produce.

**The fixes, in order of value per character changed.** One line — give `crov` an `add:1` bit on any existing quest — restores the sixth Froberger trace *and* revives Layer 44's `weckmann_class` event. One reorder — move the parity entry to the end of `YAEL_PATROL_NODES` — makes four patrol lines reachable every day instead of half of them. One decision — reconcile the two favor scales — retires an entire class of off-by-one gate. One string replaces the training log's stage direction. Two strings give Gigault the mentions that two separate design locks both promised. None of them touches the road, the mover, the VM, or the save format.

**What should not be "fixed."** F4's consumed sequence is better than the specified cycling pool for a collection this good; record the divergence and keep the behavior. Nivers at `LHR` rather than a sub-node intersection is a sensible adaptation to an engine that has no sub-node intersections.

---

## VI. Doc corrections applied in this increment

1. Report restructured to the program's IEEE-style form; **402 → 258 lines**, all design-intent prose preserved, speculative code blocks replaced with shipped anchors.
2. Status header added: **HISTORY doc**, ship build and both file sizes pinned, sibling-layer cross-link to `lab-report-living-world.md`.
3. §II annotated: the `crov` trace is **out of range**, not missing; `MAREN_DIALOGUE` shipped as `NIVERS_DIALOGUE` from the first commit.
4. §III's connection map annotated: 6 of 8 edges honored; `Yael — Pachelbel` and `All → Gigault` marked **NOT SHIPPED** rather than deleted.
5. §V annotated with the §AUDIT-03j node remap (`SW`→`MSY`, `SL`→`BMA`, `IN`→`TLL`, `TV`→`MHQ`) and the Layer 74 fifth entry; the `ER`/Redwater row marked **NOT SHIPPED**.
6. **`lab-report-living-world.md` corrected** — its Result table said *"All 6 events live and correctly gated"*; `weckmann_class` cannot fire. Both the table row and finding F2's prose now carry the correction and a pointer here.

---

## VII. Rows filed

| Row | Premise | Size |
|---|---|---|
| **§DX-02fb** | `crov`'s favor ceiling is 2; his Froberger trace and Layer 44's `weckmann_class` both need 3 — one `add:1` bit fixes both | 🟢 one bit, no design call |
| **§DX-02fc** | Room 6 is reachable only if journal entry 7 is read before the firewood quest — silent, order-dependent lockout of a whole section | 🟡 one design call |
| **§DX-02fd** | `_getYaelLocation()` is first-match-wins with its loosest condition first; four patrol lines are even-day-only and Yael is never actually away from home | 🟡 reorder + one design call |
| **§DX-02fe** | Two favor scales (0–2 and 0–3) in circulation, with the engine's own comments asserting both; ~8 gates split between them | 🟡 reconcile centrally |
| **§DX-02ff** | The connection map's `Yael — Pachelbel` and `All → Gigault` edges have no lines; the Gigault half is the other side of §DX-02es | 🟡 four strings |
| **§DX-02fg** | Weckmann's training log renders `[years of entries — …]`, an authoring stage direction, as player-facing handwriting | 🟢 one string |
| **§DX-02fh** | A delivered Froberger trace never rejoins the NPC's pool, as §II specifies it should | 🟢 implement-or-retire |
| **§DX-02fa** | The new Code Comments directive (CC-1..CC-6) conflicts with the repo's §AUDIT-03n *"annotate, don't rewrite"* convention — needs a user call | 🟡 policy |

---

## VIII. Test coverage

Before this increment, **no test touched any Layer 45 symbol.** `tests/integration/web-of-connections-l45.spec.js` now pins eleven behaviours through the engine's own functions: the per-NPC favor ceilings derived from `QUEST_DB` plus the auto-upgrade path, `crov`'s trace returning `null` at his ceiling, Brynn's two orderings, Room 6's render at 2 vs 3, the patrol short-circuit with every rival condition satisfied, the 17-line cross-reference census with the Gigault and Yael–Pachelbel gaps, the every-third-visit sequence and its exhaustion at visit 12, the training log's stage direction, the six traces' tier pairs, one-time trace delivery, and — **cross-layer** — Layer 44's `weckmann_class` event proven unfireable. **11/11 green** in Chromium.

The cross-layer case is the one worth keeping. It exists because a claim this program published yesterday was wrong, and the only reason it was caught is that the next report happened to measure the ledger underneath it.

---

## IX. Conclusion

Layer 45 is the most completely-shipped design lock the verification program has scored: eight subsystems, every authored string byte-identical from the repository's first commit to a file six times its size, and three whole sections — the training log, Room 6, the cross-item connections — delivered with the small human details that are the first thing a hurried implementation drops.

Its two real losses were not caused by anything in it. They were caused by a **ceiling in a shared ledger that no single layer can see.** `_setNpcFavor`'s auto-upgrade writes a hardcoded `2`; the content above it was written for a scale that goes to 3; and so the best of the six Froberger traces has never been read, an entire section opens only on one quest ordering, and a Layer 44 event that a report published yesterday passed as live cannot fire. Nothing looks broken. No error is thrown. The gate is simply above the ceiling, and the ceiling is 300 lines and forty subsystems away from the gate.

That is this report's contribution to the method, and it is a general one: **a threshold and the value that feeds it must be verified together, or neither is verified.** §DOC-02cx found an ending unreachable by one point. §DOC-02cy found a promise off by one copper. This one found a relationship tier off by one, in a ledger two layers deep. Three increments, three off-by-ones, none of which any test in the repository could have caught, because none of them is a bug in the ordinary sense — every line involved does exactly what it says.

The lock's own closing still holds, and now describes its own verification as well as its subject:

> *The Curse of Knowledge says: once you know how to fix things, you stop seeing the things that don't need fixing. You stop seeing things that just need witnessing.*
>
> *The web of connections is the witness.*

Five sixths of it, at present. The sixth needs one bit.

---

*lab-report-web-of-connections.md — Layer 45 design lock · original 2026-05-22 · verified §DOC-02cz 2026-08-23*

---
*© 2026 Paul Richeson — MIT License. See [LICENSE](LICENSE) for full text.*
