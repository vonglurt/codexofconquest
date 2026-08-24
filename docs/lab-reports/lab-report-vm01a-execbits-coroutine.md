<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->
# Lab Report — §VM-01-A · *Give the VM a `yield`*: `execBits` → coroutine

> **Status:** ✅ **SHIPPED IN FULL** — the mechanism, the driver, the envelope and the acceptance
> suite all landed, and every one of them is still load-bearing 30 days later.
>
> **Written:** 2026-07-21 18:41 as a pre-implementation lock (Lab Report Policy row 4 — spec only,
> no HTML edited), against `play.html` at **37,618 lines**, branch `feat/board-01-warrants-board`.
> **Lock commit:** `7f2f45d` (docs-only, so `7f2f45d:play.html` **is** the build it measured).
> **Ship commit:** `c22f4f0` (2026-07-22 10:34) — 16 hours later, landing A + B + C as one commit.
> **Verified:** 2026-08-21 (§DOC-02cm) against the parent build **and** live HEAD (38,712 lines),
> with the engine driven in a real browser at HEAD.
>
> **Head of the seven-report §VM-01 series.** `execBits` is the host half of everything the other six
> describe. Children: B (seeded RNG) · C (`_ENV`) · D (quest-core parity) · E (softlock prover) ·
> F (gate AST) · F-FU (`activateNode` index).
>
> **HISTORY doc — annotate, do not rewrite.** Claims that did not ship are marked **NOT SHIPPED** and
> kept. Live pointers use the `symbol@line` form (§DX-01e); the original's bare line numbers survive
> only where a figure is being scored.

---

## Abstract

The quest VM had an opcode table and no jump instruction. `execBits` was a straight-line `for` loop
that looked up `HANDLERS[bit.kind]`, called the handler, and threw the return value away — **no
branch, no suspend**. Three opcodes were inert or smuggled because of it: `choice` was an empty
function body with a note-to-self in it, `item_check` wrote a result nothing ever read, and
`skill_check` had the language's only conditional hard-coded inside one leaf.

This report locked a ~30-line change: make `execBits` a `function*`, add a host-layer driver that
pumps it, and let a handler suspend by `yield`ing an `{ ask, prompt, options }` envelope. It locked
three design calls, fenced its own scope hard, and predicted the regression would be a provable
no-op across 2,853 live quests.

**Re-measured 30 days on: it is the strongest single artefact in this corpus.** Every code block it
quotes is byte-exact at its parent build. All 33 of its anchors resolve. Its acceptance suite is
**5/5 green at HEAD** and its five named regressions are **337/337**. Its three design calls all
shipped as recommended, and two of them are still exactly right. The third — *"a choice resolves
within a single interaction turn"* — was **falsified in production** eight days later, and the engine
survived it **for the precise reason this report gave**, in the paragraph immediately above the one
that broke. And the report's own §11 verdict, written into the commit that shipped it, gets its
headline test count wrong, contradicts its own §9, contradicts its own commit message, and calls
itself uncommitted while being committed.

---

## I. Intention and inspiration — why this matters to play

codexofconquest is a **49-day doom clock**. Every step and every rest spends a day you do not get back. In a
game built entirely on that one question — *is this worth a day of the world* — the engine could only
ever **tell** you what happened. It could not **ask**.

That is not a missing feature; it is a missing *word*. A quest chain was a list of statements the game
executed at you: a narrative line, a flag, a reward, a battle. There was no instruction in the
language that meant **stop here and wait for a person**. So every branch a designer wanted had to be
smuggled: either baked into a leaf handler (`skill_check`, which could branch only on a d20 it rolled
itself) or written as bespoke hand-coded HTML with its own buttons and its own `if/else` chain, one
per scene, unreachable by the VM and invisible to every gate that audits it.

The theme the track took from `story.md` is **No Word for Wait**. Inc A adds the word. One `yield`.

The playability argument is not "add dialogue trees." It is that **agency and consequence become
authorable in data instead of hand-built in markup**. A `choice` bit is a prompt and a list of
options, each option carrying its own bit chain — so a branch is now the same kind of object as a
reward, validated by the same contract table, executed by the same pump, and countable by the same
census. Once the VM can wait, *quest acceptance* is a choice, a *moral fork* is a choice, and
"the engine can't do that" becomes "author it."

**And the dividend arrived.** Thirty days on, the game's first branching conversation is live at DUS:
Kern and Sable, two people at a bar counter taking diligent notes on a book called *Don't Create The
Torment Nexus*, underlining the parts that describe it in the most detail, because they believe the
author was being helpful. You get three answers. Stay quiet and walk on. Ask what they are building
(and receive a full transcript of two people saying "rad" at each other about infrastructure). Or
tell them the truth — *that book is a warning, not a manual* — which lands, quietly, and completes a
quest called **Creative Literacy**. Nothing is written to your save on the way in; the branch you did
not pick never runs. It is the whole mechanism, in one scene, doing the one thing the engine could
never do before: **it waits for you.**

The `choice` bit is the seam. Everything above is content that could not exist without it.

---

## II. Method

A structural read of the `QuestRuntime` block and every live `execBits` call site, grepped and quoted
verbatim rather than recalled. No quest-by-quest audit — the defect was in the engine and there was
exactly one of it. That discipline is why the report scores as well as it does: **§9 of the corpus
method (tables and function bodies are evidence, traces and reconstructions are claims) predicts a
report made almost entirely of pasted function bodies will not rot, and this one did not.**

Verification method for this pass: pin the parent build (`git show 7f2f45d:play.html`), score
every anchor and every quoted block against it, then measure the shipped state at HEAD, run the
report's own acceptance suite, and drive the authored consumer in a real browser.

---

## III. The engine as it stood — every quoted block byte-exact

**All three code blocks the report quotes reproduce byte-for-byte at the parent build.**

| Quoted block | Parent lines | Result |
|---|---|---|
| `execBits` — the straight-line loop | 21824–21831 | ✅ byte-exact, comment line included |
| `resolveSkillCheck` — the smuggled branch | 21850–21855 | ✅ byte-exact |
| `choice` — the empty handler with the Phase-2 note | 21882 | ✅ byte-exact |

**The §1 defect table, re-scored:**

| Opcode | Report's claim | Re-measured at the parent build |
|---|---|---|
| `choice` | contract at 21680 requires `prompt` + `options`; handler empty; **0 authors** | ✅ all three exact — 0 authored `choice` bits in `QUEST_DB` |
| `item_check` | writes `ctx._itemCheck`; **nothing reads it back (full-file grep = one line)** | ✅ exact — `grep -c _itemCheck` = **1** |
| `skill_check` | the sole conditional, hard-coded in the leaf at 21853 | ✅ exact |

**Anchor score against the parent build: 33 of 33 resolve.** Every entry in the report's §7 table
points at the line it names, including the four the original itself hedged. Two are worth a note
rather than a mark against it: the *"Open-Q #5 comment"* is on 21773, one line below the cited 21772
(21772 is the sentence it belongs to); and the load/`JSON.parse` pair cited as 23251/23267 is exact
at 23251, with 23267 being the second `Object.assign` rather than a second `JSON.parse`. Neither
misdirects a reader by a single line of reading.

**`HANDLERS` census:** the report's §4.1 says *"all eleven live ones"* return `undefined`. `HANDLERS`
held **12** keys at the parent build, of which `choice` is the one becoming a generator. **Eleven is
exactly right** — a precision most reports in this corpus do not reach.

### III-A. The three figures that are wrong

| Figure | As written | Measured | Class |
|---|---|---|---|
| Live quest count | *"the 2,850 live quests"* | **2,853** (real parser, parent build) | rounded/inherited, off by 3 |
| File size | *"5.11 MB"* | 5,427,539 bytes = **5.18 MiB / 5.43 MB** | wrong under either unit |
| Line count | *"37,618 lines"* | **37,618** | ✅ byte-exact |

The line count — the figure that actually dates the build and makes every anchor scorable — is
exact. The two that are wrong are the two nothing depends on.

---

## IV. Locked shapes → shipped

| Locked in this report | Shipped at `c22f4f0` | Status at HEAD |
|---|---|---|
| `execBits` becomes `function*`, `yield* r` when a handler is itself a generator | yes | ✅ `*execBits(bits, ctx) {@22224` |
| `choice` becomes `*choice`, applying **only** the picked option's bits, **after** the pick | yes | ✅ `*choice(bit, ctx) {@22320` |
| `ask` envelope `{ ask:'choice', prompt, options:string[] }`, never persisted | yes | ✅ still the only `ask` kind in the file |
| Module-level slot holding `{ gen, ask }` | yes, as `_uqfPending` | ✅ `let _uqfPending = null;@6824` |
| `pump(gen, answer)` | shipped **renamed** `_uqfPump` | ✅ `function _uqfPump(gen, answer) {@6827` |
| `runToCompletion(gen)` | shipped **renamed** `_uqfRunToCompletion` | ✅ `function _uqfRunToCompletion(gen) {@6840` |
| Driver lives beside `_resolveQuestUQF`, in the host layer | yes | ✅ same block, 6813–6842 |
| Five production call sites wrapped | yes | ✅ all five, each tagged `// §VM-01-A` |
| **Zero** `choice` bits authored into `QUEST_DB` | yes | scope fence held; **2** authored since (§VIII) |
| No new opcode, gate term, `S_story` field, or save-migration | yes | ✅ `_uqfPending` still absent from every save path |
| `BIT_CONTRACTS` untouched | yes | ✅ `const BIT_CONTRACTS = {@21971` |

**Two shapes have moved since, both by later increments and both cited to this report:**

- **`QuestRuntime` is no longer an object literal.** The report anchors *"`QuestRuntime` object 21713."*
  §VM-01-D refactored it into a factory — `const QuestRuntime = createQuestRuntime({@22342` — so the
  runtime could be `require`d by a headless server. **RETIRED, not wrong.**
- **A second, pure `runToCompletion` exists inside the kernel.** `function _questRunToCompletion(gen) {@22037`
  is the parity twin `resolveSkillCheck` uses so a `require('./quest')` server needs no host driver.
  Its own comment cites *"lab-report-vm01a §6.2"* — the lock held; a *pure* twin was added beside it,
  not in place of it.

---

## V. The three design calls — how each aged

### §6.1 — which `ask` shapes exist? → **`choice` only; envelope discriminated for `confirm`/`prompt` later.**
**HELD, and never tested.** `choice` is still the only `ask` kind emitted anywhere in the HTML or in
`src/js/quest.js`, 30 days and four consumer increments later. The deferral cost nothing and the
discriminator was never needed — which is the correct outcome for a bet whose whole value was
optionality.

### §6.2 — where does the driver live? → **module-level pump in the host layer, never in a kernel.**
**HELD, with one amendment the report could not have anticipated.** The host driver is still host
(`_uqfPump` renders nothing itself but sits in the DOM-touching layer, beside `_resolveQuestUQF`).
When §VM-01-D needed the runtime to be requireable without a DOM, it did **not** move the driver into
the kernel — it added a pure twin *inside* the kernel and left the boundary where this report drew
it. The lock is cited by name in the comment that does it.

### §6.3 — how does an un-answered `ask` survive a save/reload? → **it doesn't, and that is the design.**
**This is where the report is most interesting, because its conclusion was falsified and its
reasoning was not.**

The lock rested on three legs. Two are still true at HEAD:

1. **The generator lives only in `_uqfPending`, never in `S_story`** — so it is structurally
   impossible to serialize. ✅ `_uqfPending` appears 7 times in the file and **not once** in
   `_S_DEFAULTS`, `storyAutoSave`, or any `setItem` path.
2. **Effects apply only after the pick**, so a player who walks away mid-choice has written nothing.
   ✅ Still exactly how `*choice` is written, and browser-proved below.

The third leg was the assumption: *"a `choice` resolves within a single interaction turn."* Eight days
later, §VM-01-G4a put a real choice panel on a real node screen and discovered it does not — a node
choice can sit on screen across a render. The engine records the correction in its own source, and
the record is worth quoting because of what it leans on:

> `// §VM-01-G4a: the sweep below takes any pending choice panel@34601` — *"Inc A's single module slot
> assumed 'a choice resolves within one interaction turn'; a NODE choice can sit on screen across a
> render. **Safe by construction — `choice` applies only the picked option's bits, AFTER the pick, so
> an abandoned suspension has written nothing.**"*

**The assumption that broke was rescued by the invariant stated one paragraph above it in this
report.** §4.2 called apply-after-the-pick *"the property that makes the save decision safe"* — it was
filed as support for §6.3's conclusion, and it turned out to be load-bearing for the case §6.3 got
wrong. The repair was `_uqfPending = null` on render sweep plus an inert-stale-button guard in
`_uqfRenderAsk`; no state model changed, because none had to.

*A design lock is worth more than the decision it reaches when it writes down why.*

---

## VI. Invariant compliance — re-checked at HEAD, not re-copied

| Invariant | Re-measured |
|---|---|
| **Host/Script Separation** | ✅ `QUEST_DB` is still script; the runtime + both drivers are host/kernel. The boundary gained a `yield` and did not move. |
| **Three kernels untouched** | ✅ `MOVER:CORE` / `ROOMS:CORE` / `DUEL:CORE` sentinels sit ~11,600 lines above the edit region at the parent build; `check:parity` unchanged. |
| **Free-Movement / Mission-Gating** | ✅ still exactly two movement refusals in the file, `'oob'` and `'sea'` — unchanged across 1,094 lines of growth. |
| **No new game-state `Math.random()`** | ✅ Inc A added none. (`_rollSkill`'s roll moved to the seeded stream in the same commit, by **§VM-01-B**, not by A.) |
| **Purity claims stay honest** | ✅ `execBits` is still not labelled pure, and still isn't. |

---

## VII. Verification at HEAD

**The report's own acceptance suite, re-run at HEAD, WBAPI server stopped:**

```
npx playwright test src/tests/integration/uqf-coroutine.test.js
  5 passed (3.4s)
```

All five cases the §9 test plan specified are present and green — including case 5, the `item_check`
bonus proof the report hedged as *"if this exceeds ~30 lines it moves to the follow-on."* It did not
move; it shipped.

**The five named regressions, re-run at HEAD:**

```
quest-runtime-uqf 303 · warrants-board 25 · courier-map 1 · enemy-ai 4 · kg-quest-chain 4
  337 passed (3.8m)
```

**Browser-proved — the authored consumer, driven live in Chromium at HEAD:** seeded at DUS, the verb
`dus-kern-sable-first@34278` renders **3 option buttons** and parks the generator in `_uqfPending`.
Before the pick: `creativeLiteracyToken` false, inventory unchanged. Clicking *"That book is a
warning. Not a manual."* sets `nexusQ02Complete`, leaves the unpicked branch's `nexusQ01Active`
**false**, grants the **Creative Literacy Token**, releases the slot, and removes the panel. The
mechanism this report locked is executing player-facing content, correctly, 30 days on.

---

## VIII. Scope fence — what the report deferred, and what became of it

| Deferred by §10 | Status at HEAD |
|---|---|
| **Choice UI content** — a live on-screen `choice` render | ✅ **shipped**, §VM-01-G4a/G4b — but **NOT** under the name this report predicted. `renderChoiceBlock` appears exactly once in the file, in a comment recording that it **never existed as code**. The capability shipped as `function _uqfRenderAsk(gen, ask, mount, step) {@6885` + `function _uqfRunVerb(verb, mount) {@6914`. |
| **Quest-acceptance rewrite** | ⚠️ **not shipped.** The seam exists; nothing has used it for acceptance. |
| **Un-smuggling `skill_check`** | ⚠️ **not shipped, 30 days open.** `resolveSkillCheck(bit, ctx) {@22257` still branches inside the leaf, now wrapped in the pure twin and explicitly scope-fenced: a `choice` in `onPass`/`onFail` throws by design. |
| **`'abandoned'` status / transactional rollback** | ⚠️ **not shipped.** `'abandoned'` has **0** occurrences in the file. |
| **Forward pointers** — *A · B · C independent; D needs C; E needs C; F answers `canComplete`'s `or`; G needs A + F* | ✅ **the whole dependency graph held.** A/B/C `c22f4f0` · D `9f10bfe` · E `354b20a` · F `c6be7f8` · F-FU `549d6b4` · G through G4d + G-FU a–f2. |

**The keystone claim is the one that verifies best.** Every §VM-01-G increment — 30-odd hand-written
scene blocks migrated into `NODE_VERBS`, `NODE_HOOKS` and `NODE_PANELS` — is a consumer of the word
this report added. The prediction *"every 'the engine can't do that' becomes 'author it in data'"* is
not rhetoric; it is the shape of the six weeks that followed.

---

## IX. Errors in this report, corrected

**The §11 verdict is the weakest paragraph in the document, and it was written last.** It is a
textbook case of the corpus rule that *a report's inventory earns trust and its summary does not* —
same hand, same file, one page apart, and the error rate inverts.

1. **"not committed — user rule" is false.** The sentence saying so was itself committed, in
   `c22f4f0`, as part of the +5-line diff that added the verdict. It was true at the instant of
   typing and false when the increment closed.
2. **The headline test figure is wrong three ways at once.** §9 sets the target at *"302/302."* §11
   reports *"286 passed / 17 failed."* The commit message for the very same commit says
   *"quest-runtime-uqf 286/286."* The file holds **303** tests, so **286 + 17 = 303** — §11 has the
   only internally consistent pair, §9 is off by one, and the commit message silently drops 17
   failures. **Re-measured at HEAD: 303/303, fully green.** The *"15 pre-existing failures in this
   environment"* caveat §9 carried forward from §BOARD-01 is now stale twice over — the count was 17,
   and the baseline has since been repaired to zero.
3. **"HTML diff +56/−9" is not a measurable figure.** The commit's actual HTML numstat is **+106/−30**
   for A + B + C, and its own message states the reason it cannot be split: *"the working-tree HTML
   diff is a single indivisible change (the execBits hunk carries both the Inc A generator and the
   Inc C env seed)."* The report published a per-increment attribution for a diff the commit that
   carried it declares unattributable.

**The one thing the report noticed about itself was right, and is the most durable line in it.**
§4.4 enumerated the five *production* callers and missed the **32 test-file callers** (7 in
`quest-runtime-uqf.test.js`, 25 in `warrants-board.test.js`). Its own conclusion — *"when an engine
function's signature changes, 'wrap every caller' includes the harness, and the only honest verdict is
a git-stash-diff of failing sets, not a raw pass count"* — is exactly the discipline the three wrong
counts above would have caught.

---

## X. Findings filed by this verification

- **§DX-02ds** 🟢 — the driver's own safety comment cites *"no autosave (storyAutoSave, 23237) ever
  captures a suspension."* `storyAutoSave` was at **23313** at the commit that wrote the comment, and
  is at `function storyAutoSave() {@23806` today. **Wrong when written, by exactly 76 — the
  increment's own net line delta** (+106/−30). The author read the anchor off this report's §7 table,
  where it is *correct* for the **parent** build, and pasted it into a comment living in the **child**
  build. Today it resolves into `_S_DEFAULTS`, at `sbPapersRead: false` — a real-but-wrong line, the
  worst kind. Comment-only, no behaviour.
- **§DX-02dt** 🟢 — the game's only two authored `choice` bits (`dus-kern-sable-first@34278` and its
  follow-up) have **no test that names them**. `uqf-verb-driver.test.js` proves the driver thoroughly,
  but entirely against in-test fixtures; the one piece of shipped content that exercises the keystone
  end-to-end is covered only incidentally. One test.
- **`index.md` corrected in this increment** — line 148 pinned `quest-runtime-uqf.test.js` at
  **293 tests**; measured **303**. Fixed in place (two-way doc sync), not filed.

---

## XI. Verdict

**✅ SHIPPED 2026-07-22, exactly as locked, and it has not needed a correction since.** Three design
calls, all shipped as recommended; two still exactly right and the third safe for the reason the
report itself supplied. Every quoted block byte-exact; 33 of 33 anchors resolving; the acceptance
suite **5/5** and the named regressions **337/337** at HEAD; the authored consumer browser-proved
executing the mechanism end-to-end. Three wrong numbers, all of them in the verdict paragraph, none
of them touching a shape, a decision or a line of code.

Inc A is the keystone, and the thirty days after it are the evidence. The VM learned one word, and
the word was *wait*. Kern and Sable are still at that bar counter, still on Chapter 7, still
underlining the parts with the most detail — and for the first time in this engine's life, whether
anyone tells them is up to the person holding the keyboard.

*© 2026 Paul Richeson — MIT License.*
