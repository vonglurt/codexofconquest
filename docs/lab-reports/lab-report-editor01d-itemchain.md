<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->
# Lab Report — §EDITOR-01-D: declarative `itemChain` (token item manager)

**Original status:** DESIGN LOCKED → implementing · **Original date:** 2026-06-27
**Verified status (§DOC-02bp, 2026-08-17): SHIPPED IN FULL — 5 of 5 planned increments executed, and the deferred follow-up closed 25 hours after the lock.**

> **Verification header.** File mtime `2026-06-26 19:13:50 −0700`; birth commit `8560254`
> (`2026-06-26 19:14:19 −0700`). The header's *2026-06-27* is **correct in UTC**
> (`2026-06-27T02:13:50Z`) — the repo's clocks are `−0700`, so read the date before judging it.
> **Reference build** for every "as-written" figure below is `57f9f44` = `8560254^`
> (2026-06-26 19:03:25, `roll2hit-v3.html` 33,007 lines). HEAD figures are dated 2026-08-17.
> Bare line numbers in the original text are preserved as **historical citations**; live pointers
> are `` `symbol@line` `` anchors (§DX-01e). This file is HISTORY in `src/scripts/legacy-codes.js` —
> annotate, never rewrite.

---

## Abstract

Item grants and removals — the most common way a quest pays the player — were, at the reference
build, hand-written JavaScript in two places the authoring API could not reach: inside quest handler
closures, and inside a per-id reward ladder in `storyCheckQuests`. The source-patch API
(`editStructuredField`, §WBAPI-01 ph3) replaces whole *field values*; it cannot reach inside a
function body. The consequence was not cosmetic: **the single most common quest payoff in the game
was content only a code editor could author**, invisible to the worldbuilder that the project
otherwise builds the world with.

This report locked a declarative alternative — `q.itemChain: Step[]`, an ordered array of four
action kinds (`grant` · `take` · `grantBit` · `takeBit`) compiled at completion time by a runtime
applier — chosen over the alternative on the table, a regex editor for function bodies. It was the
right call and it shipped fast: the runtime landed **six minutes** after the lock, the authoring
surfaces within two hours, and the follow-up the report explicitly deferred closed the next evening.

Re-measured at HEAD: **10 of 10 line citations byte-exact**, 3 of 4 census figures exact, the data
shape shipped verbatim and unchanged, and the field carries **27 quests / 32 steps** of live
content. The report's single measurement error — a **58**-branch ladder that held **61** — is
consequential not because it was wrong but because of where it was corrected: in a gate, and never
in the four documents that had copied it.

---

## I. Intent and inspiration — what this buys the player

The design constraint that makes this project work is that content is authored *through the API*
(prompt.md §3, invariant 7). The corollary nobody writes down is the hard one: **anything the API
cannot express is content that does not get made.** A designer who wants a quest to hand the player
a weapon, a readable log, or a tome that quietly improves their death saves must either write engine
code or not have the idea.

`itemChain` removes that fork for the commonest case. Its inspiration is the same one behind the
whole UQF direction (§ARCH-01, invariant 4 — Host/Script separation): *widen capability through the
grammar, never with a new single-use closure.* The alternative the user rejected — a regex editor
for handler bodies — would have bought the same authoring reach by parsing code with a pattern, and
the repo already knows what that costs (`§AUDIT-03f`: a scanner blind to comments silently ate whole
entries). Declaring the effect is strictly cheaper than parsing the code that performs it.

The playability argument is short and it is measurable in §VII: without this field the Cat Quarter's
four escalating trophies, the Rod of Self-Discovery, three Watchmaker tomes and the entire §KG
kindergarten-corridor chain are ladder code. With it, they are data — editable in the worldbuilder,
patchable over HTTP, and checkable by a gate.

---

## II. Method

1. Establish the reference build (`8560254^`) and replay every "as-written" count there, never at
   HEAD (instrument 11).
2. Resolve all ten line citations against the reference build's `roll2hit-v3.html`,
   `worldbuilder.html` and the then-root `wbapi-server.js`.
3. `git log -S "<symbol>" --all` **with no pathspec** on every symbol the report calls new or
   absent, to separate NOT SHIPPED from RETIRED (instruments 4, 67).
4. Census the field at HEAD **through `wbapi-core`'s parser**, not a line regex (instrument 51/74).
5. Run the report's own acceptance gates (instrument 70).
6. Check the delta **both ways** — engine-rot as well as report-rot (instrument 6) — and check the
   report against its siblings (instrument 7).

---

## III. The gap, as it actually stood

Two authoring-opaque surfaces, both confirmed at the reference build:

**1. Handler bodies.** Item effects inlined in `onPass` / `onComplete` / `onFail` / `completeFn`.
The report's representative literal (cited `~30534`) resolves to **30531–30536** and the
transcription is **byte-faithful** — including `sell:1`, which is easy to get wrong and was not:

```js
const inv = S_story.inventory = S_story.inventory || [];
const fishIdx = inv.findIndex(i => i.name === "Smalt's Trust");
if (fishIdx !== -1) inv.splice(fishIdx, 1);              // ← the cited line, 30534
inv.push({ name:"Pip's Friendship Bead", icon:'🪵', type:'misc',
           desc:"A gnawed wooden bead from a merchant's abacus. …", sell:1 });
```

**2. The reward id-ladder.** A flat `if (id === '…') { … }` block in `storyCheckQuests`, each branch
inlining pushes, filters, gold, favor and `msgs.push`.

> **⚠ CORRECTION — the ladder held 61 branches, not 58.** Lines **25835–26054** are exact: 25835 is
> the first branch and 26054 the last. The count between them is **61**, at the reference build and
> at every commit that day. This was never 58. See §VIII/§DX-02ce — the number matters less than
> where it got fixed.

**Census at the reference build — 3 of 4 exact:**

| Claim | As written | Measured at `8560254^` | |
|---|---|---|---|
| ladder branches | 58 | **61** | ✗ |
| quests defining `onComplete` | 27 | **27** (`onComplete:`) | ✓ |
| `itemChain` references in `roll2hit-v3.html`, `worldbuilder.html`, `wbapi-core.js`, `wbapi-server.js` | 0 ("greenfield") | **0 / 0 / 0 / 0** | ✓ |
| `_takeMissionBit` exists | no | **0 occurrences** | ✓ |

---

## IV. As-built inventory (live pointers)

| Surface | Anchor at HEAD |
|---|---|
| Runtime applier | `` `function _applyItemChain(q) {@26169` `` |
| Idempotent grant (`once`) | `` `if (s.once !== false && inv.some(i => i.name === s.name)) break@26176` `` |
| Rich-field allow-list (FU-b1) | `` `for (const f of ['desc', 'description', 'readText'@26182` `` |
| Silent-grant suppression (FU-b) | `` `if (!s.silent) msgs.push(item.icon@26189` `` |
| `take all` — spliced in place | `` `if (s.all) { for (let i = inv.length - 1@26195` `` |
| `takeBit` dispatch | `` `case 'takeBit':  _takeMissionBit(s.flag); break@26199` `` |
| Mission-bit removal | `` `function _takeMissionBit(flagName) {@26153` `` |
| §MBIT-02-E gate safety | `` `kept gate-referenced flag@26160` `` |
| The one live hook | `` `msgs.push(..._applyItemChain(q)); // §EDITOR-01-D@30198` `` |
| Ladder's obituary, in the engine | `` `W7c folded the per-id hardcoded effects block (61 ids@30193` `` |
| Pipe codec (parse) | `` `worldbuilder.html:function parseItemChainText(txt) {@8493` `` |
| `desc` re-join — the limitation that dissolved | `` `worldbuilder.html:if (p[5]) step.desc = p.slice(5)@8502` `` |
| CRUD field declaration | `` `worldbuilder.html:arr:'itemchain',ta:true@6106` `` |
| Quest-create serializer (§ARCH-01 W8b) | `` `src/js/wbapi-server.js:const JSONF@1710` `` |
| Parity guard's live branch tally | `` `src/scripts/check-ladder-migration.js:ladder branches@265` `` |

**Ten of ten line citations byte-exact at the reference build:** `_rollCeremonia` 6246–6251 (6246 =
`if (passed) {`, 6247 = the `'done'` set, 6251 = `if (q.onPass) q.onPass();`) · `storyCheckQuests`
25820–25829 (25821 = the `'active'` guard, 25829 = `if (q.onComplete) q.onComplete();`) · ladder
25835–26054 · handler literal ~30534 · `edBuildQuestObj` at `worldbuilder.html` **9082** · the PUT
Array branch at the then-root `wbapi-server.js` **8905**. This equals the corpus best.

---

## V. Spec → shipped delta

| § | Locked | Outcome | Evidence |
|---|---|---|---|
| 3 | `Step[]`, 4 action kinds, field contracts, defaults `📦`/`misc`/`sell:0`, `once` implicit-true | **SHIPPED VERBATIM**, unchanged at HEAD | §IV applier anchors |
| 3 | "No server change required" | **TRUE of the PUT path — and false of the path it did not measure.** `POST /api/quest` silently dropped `itemChain` for 7 days until §ARCH-01 W8b registered it | `11af1e5`; §IV serializer anchor |
| 4 | `_takeMissionBit` (flag clear + token splice by `flagRef`) | **SHIPPED, then hardened.** HEAD *keeps* a gate-load-bearing flag and warns (§MBIT-02-E) rather than clearing it unconditionally | §IV gate-safety anchor |
| 4 | `_applyItemChain`, 4 cases, unknown action skipped | **SHIPPED**, `d64376e`, **6 minutes** after the lock; HEAD hardens the switch to `s && s.action` | `d64376e`; §IV |
| 4 | `take` with `all:true` → `inv.filter(…)` reassign | **SHIPPED AS WRITTEN — AND IT WAS A LATENT BUG.** Reassigning orphaned the cached `inv`, so a later grant in the same chain vanished. Fixed to reverse in-place splice 25 h later, by the parity guard the follow-up built | `5454543` |
| 4 | Two hooks: `_rollCeremonia` 6251 **and** `storyCheckQuests` 25829 | **HALVED — correctly.** §ARCH-01 W7d deleted the legacy roll body; skill-check completion merged into `storyCheckQuests`. **Two hooks became one because two paths became one**; the "fires once per completion" invariant is intact | `f8691c1`; §IV hook anchor |
| 5 | Pipe-delimited grammar, `desc` last, lowercased match, `sell` coerced, `once` not surfaced | **SHIPPED EXACTLY; live at HEAD** | §IV codec anchors |
| 5 | *"a literal `\|` inside desc is the one documented limitation"* | **DISSOLVED BY ITS OWN DESIGN.** Because `desc` is last, the parser re-joins (`p.slice(5).join('\|')`) and pipes survive in prose | §IV `desc` re-join anchor |
| 5 | `arr:'itemchain'` in `CRUD_TYPES.quest.fields` | **SHIPPED**, still declared | §IV CRUD field anchor |
| 5 | Textarea codec on both surfaces | **RETIRED 25 h later, as planned.** FU(a) replaced it with `buildChainEditor`; the codec is kept for export/parity and still bridges the two IIFEs via `window.*` | `c2e6892` |
| 5 | *"visual chain UI is a later increment (§EDITOR-01-D-FU)"* | **HONOURED AND CLOSED** the next day | `2430dd0`→`c2e6892` |
| 7 | ladder + 27 `onComplete` handlers "stay **untouched**" | **HELD ~22 h, THEN FULLY SUPERSEDED.** FU(b) migrated 22 quests' inventory ops; §ARCH-01 W7c folded all **61** branches into UQF chains. HEAD: **0 ladder branches**, **105** `onComplete`, **all array-valued**, **zero** function-valued | `a79c76a` |
| 7 | "No quest uses `itemChain` … the runtime is **inert**" | **TRUE THAT DAY; 27 carriers / 32 steps at HEAD** | §VII |
| 7 | ladder migration "out of scope … tracked as §EDITOR-01-D-FU" | **A deferral with a 25-hour expiry** — filed, scoped and closed same week. The inverse of the §DOC-02bo failure mode | `de64c16` |
| 9 | `src/scripts/check-itemchain.js` + `npm run check:itemchain` + CI `paths:` | **SHIPPED; 29/29 green today**, ten weeks on | `.github/workflows/walk-invariants.yml:32,51,80` |
| 9 | `src/tests/integration/worldbuilder-itemchain.test.js` | **NOT SHIPPED.** `git log -S` finds exactly one commit naming it — this report. Coverage landed in the *existing* `worldbuilder-quest-editor` / `worldbuilder-crud-arrays` specs, plus a later `worldbuilder-chain-editor` | instrument 4 |
| 9 | headless smoke · live `PUT` round-trip · `check:walk` green | **ALL PERFORMED** and recorded in the ship record | `plan-archive.md:70` |
| 10 | 5-increment plan | **5 of 5 EXECUTED IN ORDER** | Timeline, below |

**Timeline.** mtime 19:13:50 → lock `8560254` 19:14:19 → runtime `d64376e` 19:20:08 → Quest Creator
`ac74565` 19:35:33 → CRUD `6515592` 21:28:41. **Spec to closed core: 2 h 14 m.** Both deferred
follow-ups closed by `de64c16` the next evening — **25 h 09 m** from lock to nothing outstanding.
*"DESIGN LOCKED → implementing"* was accurate for about six minutes.

---

## VI. Risk register — outcome

| Risk as filed (§8) | Verdict at HEAD |
|---|---|
| **SP-only; the WBAPI server has no completion runtime, so no MP parity surface** | ✅ **STILL TRUE.** The server's sole `itemChain` mention is a create-time field list, not a runtime |
| **`takeBit` lands a §MBIT-02 deliverable — logged so §MBIT-02 doesn't double-implement** | ✅ **THE LOG WORKED.** Exactly one `_takeMissionBit` at HEAD; §MBIT-02 *hardened* it (E) instead of rebuilding it. A stated negative that held — the inverse of this corpus's usual result |
| **Ordering: authored handler runs before `itemChain`** | ✅ **EXACT** — the `onComplete` bit chain runs one line above the applier (§IV hook anchor) |
| **Unknown action → skipped, never throws** | ✅ **EXACT**, and hardened further (`s && s.action` tolerates a null step) |

**Four risks filed, four correct.** The register did not, however, contain the defect that actually
bit: the `take all:true` reassignment in its own §4 listing. *A risk register looks outward; the
thing that broke was in the code block on the previous page.*

---

## VII. Playability — what the field bought, measured

Census at HEAD, taken through `wbapi-core`'s parser over 2,853 quests:

- **27 quests carry `itemChain`; 32 steps — 29 `grant`, 3 `take`.**
- **17 steps carry a rich item field** (`readText`, `bonus`, `passive`, weapon stats, `uses`,
  `minLevel`, `heal`) — the b1 widening, an explicit 14-name allow-list with no arbitrary passthrough.
- **29 of 29 grants are `silent:true`.**

That last number is the design detail that matters most to a player, and it is worth being explicit
about why. A generic applier wants to announce itself: *"🪵 X obtained."* A migrated reward branch
already had a hand-written line — Brynn noting the woodpile is full, the Mother Mimic opening her
lid. `silent` lets the declarative path keep the authored sentence instead of stacking a database
message on top of it. **Every live grant uses it. The prose won.**

The content that exists in declarative form because of this field: the Cat Quarter's four escalating
trophies (Rhinestone Collar → Furball Crown → Don's Signet Ring → Cat-King's Claw) · the **Rod of
Self-Discovery**, a real weapon carrying `atkBonus`/`dmgDie`/`dmgCount`/`dmgFlat`/`minLevel` · three
Watchmaker tomes with `bonus:{deathSave | initiative | atkWhileQuestActive}` · the Muffat / Solm /
Signal / Va readable logs · and **five §KG kindergarten-corridor quests**.

The §KG five are the strongest evidence, because they were authored *after* the migration and never
existed as ladder code — and because writing them **grew the grammar**: `heal` joined the allow-list
in `d6aeefd`, the §KG increment itself. The field did what a good grammar does; it got extended by
its content rather than bypassed by it.

**And the negative space.** `itemChain` is why the 61-branch ladder could die. Making item effects
declarative is what made the ladder *migratable*, which is what let §ARCH-01 W7c fold the whole block
into UQF chains a week later. Two `if (id === …)` mesh-UI lines aside, the ladder is at **zero**.

---

## VIII. Defects and follow-ups

**FILED → §DX-02ce.** *The ladder-count correction landed in a gate and never in the prose.* Four
documents still say **58** — `index.md:168`, `plan-archive.md:70`, `plan-archive.md:123`, and
`docs/lab-reports/lab-report-editor01d-fu-chain-ui.md:5` — all traceable to this report. Three
independent sources say **61**: the FU(b) design lock, `src/scripts/check-ladder-migration.js:5`, and
`a79c76a`'s own commit subject. All four wrong figures additionally describe a structure that
**no longer exists**.

**NOT RE-FILED (instrument 7, corroborated).** §DX-02cd already carries `index.md:168`'s
*"19 checks"* → **29** correction and the four undocumented CI gates. §DX-02cc already carries the
ph3 gate's object-branch coverage gap.

**Gates run this pass.** `npm run check:itemchain` **29/29** · `npm run check:laddermigration`
**148/148** (22 quests migrated, **0 ladder branches**, 7 key-event items indexed) ·
`npm run check:legacycodes` exit 0 · `check:anchors` **3,098 → 3,113 across 74 docs, 0 dead**
(117 stale hints = the unchanged pre-existing baseline, so all 15 new anchors are byte-exact; this
was the 74th doc, having had none). `roll2hit-v3.html` untouched — every measurement was read-only.

> **⚠ Anchor hazard, new this pass — a second way to write a pointer that is checked by nothing.**
> `ANCHOR_RE` (`src/scripts/resolve-anchors.js`) is ``/`([^`\n]{1,80}?)@(\d{2,6})`/`` — the line number
> needs **at least two digits**. A first draft here pointed at
> `src/scripts/check-ladder-migration.js` line **5**; it rendered as a plain code span, resolved
> nowhere, and failed nothing. This is the 80-character cap's twin at the other end of the range:
> **always confirm the anchor COUNT rose by the number you wrote** — that check catches both.

---

## IX. Conclusion

The report was right about the problem, right about the shape, and fast enough that its own status
line expired in six minutes. Its data contract has not changed in ten weeks; the parts that *did*
change all moved in the direction it pointed — the applier widened to carry a full item shape, the
textarea became a widget, the two hooks became one because the two completion paths merged, and the
ladder it promised to leave alone was demolished a week later precisely because this field made
demolition possible.

Two lessons outlast it. The first is the one the design got right by accident: **`desc` was placed
last so prose would be safe, and that ordering turned the one limitation the report documented into
a limitation it did not have.** Put the free-text field last and the escaping problem stops existing.

The second is the one it got wrong, and it is not the miscount. **A census error survives its own
correction when the correction lands in a gate and the prose is never told.** The number was
re-measured within a day, by a follow-up that read the same block and got 61; a parity guard was
built that asserts 61 and has passed 148 checks ever since; the engine grew a comment saying 61. And
four documents still say 58, describing a ladder that has been gone since July. **Machines
back-propagate. Prose has to be pushed.**

---

*Verified 2026-08-17 (§DOC-02bp). © 2026 Paul Richeson — MIT License.*
