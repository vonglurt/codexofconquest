<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->

# Lab Report — Layers 75 + 77: Kenickie's Black Market · The Chronicle System

**IEEE-format post-mortem · re-verified against live `play.html`**
**Written:** 2026-05-25 · **Re-measured:** 2026-08-12 (§DOC-02q) · **Layers:** 75 (§XL) + 77 (§XLII)
**Status:** both systems SHIPPED and reachable; five spec claims wrong when written, one live defect filed

---

## Abstract

Two reward-surface systems, written up the day they were built. **§XL — Kenickie's Black Market** turns the completion of a Cat-Quarter quest into a persistent discount shop, so an arc's payoff is an ongoing economic relationship rather than a one-time loot line. **§XLII — The Chronicle** is a dual-ledger statistics recorder (`runStats` per life, `careerStats` across lives) surfaced on the game-over screen and the character sheet, so that dying produces a *reading* of the run instead of only a verdict. Neither branches story; both convert work the player already did into something they can see.

Re-measurement finds **§XL implemented almost exactly as specified and fully reachable**, and **§XLII implemented under different names than the report gives it**, with one born-broken defect that voids the ledger's stated purpose. The report's own recommendations section is its least reliable passage: two of its four requests had already shipped in the very commits it documents.

---

## I. Method

Seventeen-instrument §DOC-02 pass. Every named identifier batched through one `grep -c` before any prose was read; every dead symbol put through `git log -S "<symbol>" -- play.html` to separate RETIRED from NEVER SHIPPED; every node code checked against the archive build before being called wrong; cell-primacy checked so a "shipped" surface is not reported as reachable when it is not; `NODE_MAP=416` cross-checked against `check:dupkeys` before any census figure was trusted.

Both systems **postdate** the earliest surviving build (`32c10c5`, 2026-05-24), so the archive cannot adjudicate them. Their birth commits do, and all four fall on the report's own date:

| Commit | Time (2026-05-25) | What it built |
|---|---|---|
| `4090c82` | — | Layer 44: the Ally Cat Arc (`CQ`, `quest_cat_01`–`06`) |
| `cab8865` | 10:16 | Chronicle v1 — **5** stat fields, character-sheet two-column display |
| `e1c91e8` | 10:20 | Game-over Chronicle wiring — **4** rows |
| `aef1650` | 10:35 | Chronicle v2 — **10** fields, `_STAT_ZERO`, the **Hit rate** row |
| `194a810` | — | `kenickieMarketUsed`, the market block |

The report describes the 10-field shape, so it was written after `aef1650` — i.e. **after every commit it recommends changes to.**

---

## II. §XL — Kenickie's Black Market

### A. Design intent, and what it adds to play

`quest_cat_05` — *"Sandy: Fat Cats Don't Tip"* — ends with Don Fluffissimo dead and 900gp plus a trophy ring in hand. That is the normal shape of a quest payout in this game, and its problem is that it is **over the moment it lands**. The Cat Quarter's fiction is a neighbourhood economy that runs on standing rather than on coin, so the arc wanted a payoff shaped like standing.

Kenickie Clawnickie Mancuso is the fence — the quarter's quiet commerce, not its diplomacy (Jimmy) or its politics (Sandy). §XL makes his stock buyable **only** after `quest_cat_05`, at 10% under the vendor rate, and never as a purchasable privilege: a player holding 10,000gp who skipped the arc cannot buy a sardine, and a player holding 200gp who killed the Don can.

**Playability contribution.** Three concrete things. (1) It converts a terminal quest reward into a **standing supply line** — healing at 45/135gp instead of 50/150gp is a small edge that keeps paying for the rest of the run, which is what makes the Cat Arc worth finishing rather than abandoning at `cat_02`. (2) It is the **fishing sub-game's only discounted bait source**, tying two otherwise unrelated systems together through a character. (3) It gives the quarter a **third voice with a different register** — a shop that opens is a cheaper, more legible signal of "you are inside now" than any amount of dialogue, and the NPC card appearing beside Jimmy's and Sandy's states the same thing spatially.

### B. As-built

- **Profile.** `kenickie: { meta: { name:"Kenickie Clawnickie Mancuso"@10406` in `NPC_DIALOGUES`. All **seven** dialogue lines byte-identical to `194a810` across 79 days.
- **Unlock.** `if (qs['quest_cat_05'] === 'complete')@32987`, inside `function _nodeHookCdgKenickieMarket@32984`, registered as `{ id:'cdg-kenickie-market', nodes:['CDG'], fn:_nodeHookCdgKenickieMarket }@34178`.
- **Announcement.** `quest_cat_05: { id:'quest_cat_05'@13744`'s `onComplete` narrative: *"💰 +900gp + The Don's Signet Ring. Kenickie's Black Market is open."* The ring is really granted — `itemChain:[{action:'grant',name:"The Don's Signet Ring"@13746`, `silent:true`, `sell:35`.
- **Shop.** `shopDiv.id = 'kenickie-shop-div';@33008`, mounted by `cqDiv.insertAdjacentElement('afterend', shopDiv);@33053` — an in-place expansion, not a modal, exactly as specified.
- **Stock, verbatim.** Sardine Pack ×3 · 18gp · `catchBonus:2` · *"Freshish. Don't ask about the smell."* — Live Shallows Minnow · 28gp · `catchBonus:3`, `sizeUp:true` · *"From the Don's private pond. He doesn't need it anymore."* — Minor Healing Potion · 45gp · heals 10 — Healing Potion · 135gp · heals 25.
- **Discount, still exact.** `const POTION_TIERS = {@24307` prices the same two potions at 50 and 150. 45 and 135 are 10% under both, unchanged after 79 days.
- **Bait stacking.** Matches on `name` **and** `type === 'bait'`, increments `count`, no duplicate rows.
- **Sheet-swapper.** `_cqNpcs.push('kenickie')@35112`.
- **Reachability.** `CDG:{ num:77@8798` is declared before `LIM`, `FRK` and `FRS`, its three cell-mates at `21,182`, so it is `list[0]` and can become `currentCode`. **The market is reachable** — not a §AUDIT-03x casualty.

### C. Node code — right when written

`CQ` was a real `NODE_MAP` key at `4090c82`: `CQ:{ num:77, code:'CQ', name:'cat_quarter', label:'The Cat Quarter', act:1, … npc:'Jimmy Two-Tails', battle:{…key:'beefy_tom', count:3}, loot:'Tiny Fedora', sleep:false }`. §WALK/§NAV-01 renamed it to `CDG` preserving `num`, terrain key, label, npc, battle and loot; the row is already translated in `docs/maps/node-index.md`. **Fifth consecutive increment in which the archive converts a dead code list into a rename list.**

---

## III. §XLII — The Chronicle System

### A. Design intent, and what it adds to play

Before §XLII the game-over screen said gold, level, and *try again*. A player who reached Act IV over fourteen nights and two hundred battles was told only that they were dead. The Chronicle answers *what did that cost* with a run ledger, and *who am I now* with a career ledger that outlives death — the distinction exists because the game has permadeath-with-respawn and NG+, so "this life" and "all lives" are genuinely different quantities.

**Playability contribution.** (1) It makes death **legible** — a run ends in a paragraph of numbers rather than a wall, which converts a loss into a comparison and is the whole reason a player starts again. (2) `careerStats` is the game's only **cross-life progress signal**; nothing else in the save survives a death and says so out loud. (3) The `Hit rate` row is the one derived figure, and it is the only place the game reports the player's actual combat competence back to them.

### B. As-built

- **Storage.** `careerStats: { kills:0@23147` and its `runStats` twin on the next line, both **inline ten-field literals** in `_S_DEFAULTS()`.
- **Factory.** `const _STAT_ZERO = () =>@23915` — an arrow const, used by the lazy-init guard and the respawn reset **but not by `_S_DEFAULTS()`**.
- **Writer.** `function _statTally(key, n) {@23916` increments both ledgers. **Fourteen call sites, and every one of them goes through it** — no direct mutation of either object exists. That contract, which is the report's real architectural claim, holds exactly.
- **Fields, 10/10 live.** `kills` `deaths` `dmgDealt` `dmgReceived` `sleeps` `battlesAttempted` `attacksAttempted` `attacksHit` `exitsTaken` `daysAdventuring`.
- **Game-over surface.** `function _populateGameoverChronicle() {@23853` reads `const rs = S_story.runStats || {};@23856`, builds **nine** rows, and gates the div both ways — `el.classList.add('has-data')@23875` on data, `remove` on none, against `#gameover-chronicle.has-data@1722` (`display:block`, default `none`). The div exists at `id="gameover-chronicle"@5030` and `function storyGameOver() {@23878` populates it before revealing the modal, which is reached from `hp === 0`. The surface really renders.
- **Character sheet.** Ten rows, **two columns** — `This Life` (`runStats`) and `All Lives` (`careerStats`), the career column blanked by `const isFirstRun = (cs.deaths || 0) === 0;@37710`.
- **Respawn.** `const _survivingCareerStats@23926` copies the career ledger out, reloads the checkpoint, restores it, and zeroes `runStats`. Exactly as specified.

---

## IV. Spec → shipped delta table

Legend: **✅** as specified · **±** shipped differently · **✗ NOT SHIPPED** · **⚠️** wrong on the day it was written.

| # | Report claim | Measured at HEAD | Verdict |
|---|---|---|---|
| 1 | `kenickie` profile, dialogue as quoted | 7 lines byte-identical since `194a810` | ✅ |
| 2 | Node `CQ` | Real key at `4090c82`; renamed `CDG`, `num:77` preserved | ✅ rename |
| 3 | Unlock on `quest_cat_05 === 'complete'` | `if (qs['quest_cat_05'] === 'complete')@32987` | ✅ |
| 4 | Completion message quoted | Verbatim, prefixed `💰` | ✅ |
| 5 | +900gp and the Don's Signet Ring | `reward gold:900` + `itemChain` grant, `sell:35` | ✅ |
| 6 | Four items at 18 / 28 / 45 / 135gp | Exact | ✅ |
| 7 | Catch +2 · Catch +3 & size↑ · heal 10 · heal 25 | Exact | ✅ |
| 8 | Both bait flavour strings | Verbatim | ✅ |
| 9 | 10% under standard potion price | 50→45, 150→135; still exact after 79 days | ✅ |
| 10 | Bait stacks by name, no duplicate rows | Matches `name` **and** `type==='bait'` | ✅ |
| 11 | Shop is an in-place expansion, not a modal | `insertAdjacentElement('afterend')` | ✅ |
| 12 | `kenickieMarketUsed` set on first purchase | `S_story.kenickieMarketUsed = true;@33038` | ✅ write |
| 13 | …and alters Kenickie's greeting on return | **0 readers**; the quoted greeting has **0 commits ever** | ✗ NOT SHIPPED → §DX-02n |
| 14 | Button *toggles* `#kenickie-shop-div` | Button **removes itself**; Close removes the div; no toggle. Both return on the next `storyRender` | ± |
| 15 | Kenickie's card *replaces* the CQ NPC display | **Appends** — `_cqNpcs.push('kenickie')@35112`, third card beside Jimmy and Sandy | ± |
| 16 | Render block inside `storyRender` (lines 14878–14933) | Extracted verbatim to `NODE_HOOKS` by §VM-01-G4d | ± moved |
| 17 | *"`quest_cat_05` — defeating the Cat-King"* | `quest_cat_05` is the **Don Fluffissimo** fight; the Cat-King is `title:'Tommy: The Cat-King Cometh'@13758` (`quest_cat_06`). Both titles identical at `4090c82` | ⚠️ |
| 18 | Kenickie is *"a single-state encounter"* with no favorability | `impartial` / `friendly` / `dearFriend` present **at birth**, and `{ kind:'favor', npc:'kenickie', set:3 }@34396` now drives him to Dear Friend | ⚠️ |
| 19 | Tiers are *hostile/neutral/friendly/dear* | The tier set is `impartial · questActive · friendly · dearFriend` | ⚠️ |
| 20 | `careerStats`/`runStats` initialised **by `_STAT_ZERO()`** in `_S_DEFAULTS()` | Two inline ten-field literals; the factory is used only by the lazy guard and the respawn reset — the duplication it was adopted to prevent is what shipped, at birth and at HEAD | ⚠️ |
| 21 | `function _STAT_ZERO() { return {…} }` | `const _STAT_ZERO = () =>@23915`, arrow | ± |
| 22 | Ten stat fields, as named | 10/10 live under their specified names | ✅ |
| 23 | Written via **`_trackStat(field, amount)`** | **0 occurrences, 0 commits ever.** The writer is `_statTally(key, n)@23916` | ✗ NOT SHIPPED (name) |
| 24 | No direct mutation outside the writer | Holds — 14 call sites, all `_statTally` | ✅ |
| 25 | Game-over Chronicle has **ten** rows | **Nine.** `deaths` and `attacksHit` are not rows; a derived `['Hit rate',@23862` is | ± |
| 26 | The ten row labels as tabulated | **3 of 10** match (`Damage dealt`, `Damage received`, `Days adventuring`) | ± |
| 27 | `has-data` gates visibility | Both directions, plus CSS at `#gameover-chronicle.has-data@1722` | ✅ |
| 28 | On respawn: career kept, run zeroed | Exact | ✅ |
| 29 | **On NG+: `careerStats` preserved** | `function storyNewGamePlus() {@24002` preserves six named fields and `careerStats` is not one; `Object.assign(S_story, _S_DEFAULTS())` zeroes it. **False at `cab8865` too** | ⚠️ ✗ → **§CHRON-01** |
| 30 | Character sheet shows `careerStats` (not `runStats`) | Shows **both**, `runStats` in the first column, since `cab8865` | ⚠️ |
| 31 | `daysAdventuring` ≠ `gameDay`, not aliased | Correct — `S_story.gameDay = (S_story.gameDay || 0) + 1;@36253` is a separate counter with its own readers | ✅ |
| 32 | `sleeps` *"not equivalent to `daysAdventuring`"* | `_statTally('sleeps', 1);@36279` and `_statTally('daysAdventuring', 1);@36280` are adjacent, are each field's **only** writer, and are unconditional — the two fields are **permanently equal**, and the game-over screen prints both | ⚠️ → **§CHRON-01 (b)** |

---

## V. Recommendation register

The report's *"What Could Be Better"* section, scored against the commits it was written after.

| # | Recommendation | Outcome |
|---|---|---|
| R1 | Cap healing-potion stock (e.g. 3 per visit, resetting on sleep) | **NOT SHIPPED.** Stock is still unlimited; kept as an open idea, not a defect |
| R2 | Inline comment at the `kenickieMarketUsed` declaration naming its purpose | **NOT SHIPPED** — `kenickieMarketUsed: false,@23121` is bare. Superseded: the flag has no purpose to document (delta 13) |
| R3 | Add a *"This Run"* group to the character sheet Chronicle | **ALREADY SHIPPED WHEN WRITTEN** — the two-column `This Life` / `All Lives` sheet is in `cab8865`, four commits and ~20 minutes earlier |
| R4 | Compute and display a hit-rate percentage | **ALREADY SHIPPED WHEN WRITTEN** — `['Hit rate',@23862` is in `aef1650`, the same commit that created `attacksAttempted` and `attacksHit`. The recommendation asks for a feature that could not have existed one commit earlier and did exist in the commit that gave it inputs |

**Two of four recommendations were requests for work already done, and both are stated in the same paragraph that describes the surfaces correctly elsewhere.** This is the §DOC-02j result in its sharpest form: *a report's own status and recommendation blocks are claims like any other, and read against HEAD alone every one of these rows looks like a live gap.*

---

## VI. Findings

### Finding 1 → §CHRON-01 — the career ledger does not survive the boundary it exists for

`careerStats` is the answer to the report's own question *"who are you across everything you have done"*, and its stated justification is NG+: *"a player on their fourth run is a different player than one on their first."* `storyNewGamePlus()` preserves `npcFavorability`, `pitPerks`, `ngPlusRun`, `entry42Written`, `entry42Text` and `questMinusOne`, then calls `Object.assign(S_story, _S_DEFAULTS())`. **`careerStats` is not on that list, so it is zeroed.** This is not rot: the same six-name preserve list is in `cab8865`, the chronicle's own birth commit. It has never worked.

The consequence compounds rather than merely losing data. `ngPlusRun` **is** preserved, so the game knows it is on run four while the ledger says nothing has ever happened. And because the character sheet blanks the career column when `const isFirstRun = (cs.deaths || 0) === 0;@37710`, a zeroed career ledger **also hides itself** — an NG+3 player reads a character sheet byte-identical to a player who has never died. There is no error, no empty column, no zero: the surface silently agrees with the wipe, which is why 79 days of play have not surfaced it.

Fix is one line in the preserve list, mirroring `savedFavorability`. **No design call** — the report, the field name, and the sheet's own `All Lives` heading all specify the same behaviour.

**§CHRON-01 (b), same subsystem, small writing call.** `sleeps` and `daysAdventuring` have one writer each, on adjacent unconditional lines in the sleep path, so they can never diverge — yet the game-over Chronicle prints both as separate rows (*"Sleeps"*, *"Days adventuring"*) and the character sheet prints both again. Either give `daysAdventuring` a second writer that justifies it (day passage from any source, not only sleep) or drop one row from each surface. The report itself asserts they *"serve different systems"*; measured, only `gameDay` does.

### Finding 2 — instrument 12 at its cleanest, and the report refutes itself twice

Everything the author could **copy** is exact: 7/7 dialogue lines, 4/4 prices, 4/4 effects, 2/2 flavour strings, 10/10 field names, both potion discounts, the `has-data` mechanism, the respawn semantics. Every error is in a passage that had to be **composed from memory**:

- The function name `_trackStat` — **0 commits ever**, against a live `_statTally` the report never mentions.
- The `_S_DEFAULTS()` code block showing `careerStats: _STAT_ZERO(),` — a two-line quotation of something that has never been in the file.
- The ten-row label table — 3/10, against a nine-row shipped list.
- The favorability tier vocabulary — *hostile/neutral/friendly/dear*, none of which is the engine's four-tier set.

And it disagrees with itself twice, both times with the transcribed half right:

1. **§I-A** calls `quest_cat_05` the Cat-King fight; **§IV** says the bait flavour *"does not describe a dead Don Fluffissimo explicitly, but the implication is clear to players who completed `quest_cat_05`"* — which is exactly correct, because `quest_cat_05` **is** the Don's death. The section reasoning from the quoted item text is right; the section framing the arc from memory is wrong.
2. **§I-B** calls Kenickie *"a single-state encounter"* that *"does not accumulate favorability"*; the profile it is describing had three tiers when it was written, and its own `dearFriend` line — *"You killed the Cat-King. You buying sardines from me. This is the whole arc right here."* — is the arc-completion voice the report says does not exist.

***Believe a report's transcribed material over its summary of that material, even one paragraph away, even the same hand on the same day.***

### Finding 3 → §DX-02n — `kenickieMarketUsed`: a flag whose only consumer is the report

Three occurrences: the `_S_DEFAULTS()` declaration, the write on purchase, nothing else. The variant greeting it exists to gate — *"Back again. Good. The sardines are fresher today than yesterday."* — has **0 commits ever**. The field persists to `localStorage`, reloads, and is never read, so §DX-02n's round-trip acceptance test passes it green. The report's §III-C defends the choice of a boolean over a counter at length; the boolean is not consulted at all.

Note the shape for the gate design: this is a write-only field whose **absent reader was specified in prose and never in code**, which is why it reads as a deliberate simple instrument rather than as dead weight.

---

## VII. Risk-register outcome

The report filed one explicit maintenance risk — that hardcoding the 10% discount as literal prices creates a dependency on `POTION_TIERS` never changing. **It did not fire.** 50→45 and 150→135 are still exactly 10% after 79 days. Recorded as a correct call, not a lucky one: the flavour rationale (community pricing is a fixed rate, not a market adjustment) is what made the literal prices the honest encoding.

---

## VIII. Verdict

**§XL shipped as specified and works.** Sixteen of nineteen market claims are exact; the three misses are one never-built greeting, one interaction detail (remove-and-rebuild, not toggle), and one arc-framing error about which boss dies in which quest. The feature is reachable, the discount is real, and the NPC card, the shop and the fishing bait line all still land the payoff the design was after.

**§XLII shipped under different names, and its central promise is broken.** The architecture is sound and stricter than described — one writer, fourteen call sites, no direct mutation — but the writer is `_statTally`, the factory is not used where the report says it is, the game-over table has nine rows rather than ten, and `careerStats` is destroyed by New Game+, which is the exact transition the dual ledger was built for.

---

## IX. File references

| Symbol | Content |
|---|---|
| `kenickie: { meta: { name:"Kenickie Clawnickie Mancuso"@10406` | NPC profile — 3 tiers, 7 lines |
| `CDG:{ num:77@8798` | The Cat Quarter (ex-`CQ`), primary in cell 21,182 |
| `quest_cat_05: { id:'quest_cat_05'@13744` | Don Fluffissimo; 900gp + market unlock |
| `itemChain:[{action:'grant',name:"The Don's Signet Ring"@13746` | Trophy grant |
| `title:'Tommy: The Cat-King Cometh'@13758` | `quest_cat_06` — the actual Cat-King quest |
| `function _nodeHookCdgKenickieMarket@32984` | Market block (ex-`storyRender`, §VM-01-G4d) |
| `shopDiv.id = 'kenickie-shop-div';@33008` | Shop container |
| `S_story.kenickieMarketUsed = true;@33038` | The flag's only writer |
| `_cqNpcs.push('kenickie')@35112` | Sheet-swapper card |
| `{ kind:'favor', npc:'kenickie', set:3 }@34396` | §GR La Riva → Dear Friend |
| `const POTION_TIERS = {@24307` | Standard prices the 10% is measured against |
| `careerStats: { kills:0@23147` | Inline literal in `_S_DEFAULTS()` |
| `const _STAT_ZERO = () =>@23915` | Zero factory (arrow const) |
| `function _statTally(key, n) {@23916` | The real dual-ledger writer |
| `function _populateGameoverChronicle() {@23853` | Nine-row run summary |
| `['Hit rate',@23862` | The derived row |
| `#gameover-chronicle.has-data@1722` | Visibility gate |
| `const _survivingCareerStats@23926` | Respawn preserve — correct |
| `function storyNewGamePlus() {@24002` | NG+ — **does not preserve `careerStats`** |
| `const isFirstRun = (cs.deaths || 0) === 0;@37710` | Blanks the career column, hiding the wipe |
| `_statTally('sleeps', 1);@36279` · `_statTally('daysAdventuring', 1);@36280` | The permanently-equal pair |

---
*© 2026 Paul Richeson — MIT License. See [LICENSE](../LICENSE) for full text.*
