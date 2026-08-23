<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->
# Lab Report — §PLAY-01-D *Friendships With Magic*: signposting the magic path through a person

**Track:** BACKLOG.md §PLAY-01 (*The Honest Floor*), face **D** of seven ·
**Parent review:** `lab-reports/lab-report-play-review.md` §PLAY-01-D ·
**Authored / shipped:** 2026-07-12 · one commit, `cfdeb21` (14:21:02) ·
**Parent build:** `a52f9cd` (§DEATH-01, 13:40:03) — 37,244 lines; ship 37,254 (+10) ·
**Re-verified:** 2026-08-18 against HEAD (38,712 lines, +1,458 / 37 days) — §DOC-02ch.

**User design calls, both honoured:** (1) **signpost only** — fishing stays the sole intended
source of magic gear, §FC06 intact, zero balance change; (2) **Yael in Birka** delivers it —
start city, turn one, unmissable.

---

## Abstract

The game's most valuable long-term power vector was reachable only by stumbling into an
optional sub-menu. §PLAY-01-D took the *honesty* branch of the fix: rather than re-opening
magic drops, it made the game's most-seen NPC say the thing she already knew. One string was
rewritten inside `yael.impartial[0]`; verification then exposed two render defects that were
suppressing the monologue entirely, and both were repaired in the same increment.

Re-measured at 37 days, the increment is **mechanically intact and diagnostically wrong**.
The shipped string is byte-exact to its specification; the ten-line dialogue guarantee is
byte-identical parent → HEAD; the acceptance test has never been edited and still passes.
But the second render fix rests on a false premise — `CI` was **not** a dead node code, it was
a live node the report never opened — and the evidence cited against it (`NODE_COORDS.CI`)
proves the opposite of what it was cited for. The fix is right anyway, for a reason nobody
would name for another 17 days.

The larger result is about scope. The report's own thesis is a **chain of two people**, and it
verified one end. The other end rendered no card for 11 more days; the destination that chain
points at cannot be reached at all, today; and what waits there would not close the gap the
report opened with. Three separate tracks now own those three facts. None of them existed
when this was written, and each was findable on the day.

---

## I. Intent, inspiration, and what it does for playability

**The design problem.** §FC06 deliberately capped monster drops at base tier so that fishing
would become the one durable edge — a reward for patience rather than for grinding. That is a
good intent, and it created a bad shape: the single most important power vector in the game
sat behind a sub-system a player could complete the entire campaign without ever noticing.
A player who never finds it is capped at base gear all the way to Commander Bruhns
(`const BOSS_COMMANDER_AUROS = {@26246`, AC 22 / HP 300) and never learns why the fight feels
impossible. Nothing on screen is lying, but nothing on screen is telling, either — the
signature §PLAY-01 failure: *the engine knows things it will not transmit.*

**The inspiration, in the review's own words:** *"magic that is the byproduct of choosing
people over efficiency."* The path already **started** with a person — the Fisherman hands the
rod to anyone who asks, free, and asks nothing back. The Curse of Knowledge was the whole bug:
the people who know cannot imagine you do not. So make the knowing deliberate. Have the one
character every player meets on turn one *choose* to hand it over.

**Why this improves the game rather than merely documenting it.**

- **It converts a hidden system into a relationship beat.** The most important power vector
  stops reading as "a menu you happened to open" and starts reading as *someone chose to help
  you* — which is the theme the whole act is built on.
- **It replaces a decoy with a destination.** The retired line offered *"a fishing dock … a
  hook and a slow river."* Measured at HEAD: **15 nodes carry "dock" or "river" in their
  label, and exactly one node in 416 is fishable** (`BOO`, Yugurt Lake). The old line pointed
  at fifteen plausible wrong answers and zero right ones. Naming *Yugurt* and *the cabin* is
  not a stylistic upgrade; it removes a real misdirection.
- **It builds a chain, not a sign.** Yael names the Fisherman; the Fisherman gives freely.
  Two people, and the second is a mentor the game already wrote in full.
- **It costs nothing in balance.** No new quest, item, flag, drop or tier. The most
  conservative possible fix for a problem that could have been "solved" by re-opening loot.

> *"I tell you plainly because the last three who came through, I met once and after that only
> read their reports."* — Yael Scheidemann, `yael.impartial[0]`, the shipped line

---

## II. Method

1. Pin the parent build (`git show a52f9cd:roll2hit-v3.html`) and the ship (`cfdeb21`); score
   every cited line number against **both**, because a report that documents its own fix is
   written across two builds.
2. `git diff cfdeb21 HEAD` over the report and over its acceptance test.
3. Census the magic-gear grant paths with the real parser (`js/wbapi-core.js`, `W.load`) and
   then **prove the census by execution** in the running game, not by reading.
4. Run the report's own acceptance test and its stated regressions.
5. Drive the render path in a browser at **both builds** — the parent and HEAD — to separate
   "did not render" from "rendered somewhere else."
6. Check the corpus before filing: every finding below was grepped against BACKLOG.md and the
   sibling reports first.

---

## III. As-built inventory

| Artefact | Anchor (HEAD) | State |
|---|---|---|
| The rewritten monologue | `yael: { meta: { name:"Yael Scheidemann"@10397` | byte-exact to spec |
| One-time delivery guarantee | `!(S_story.ngPlusRun > 0) && !S_story.yaelOnboardingSeen) {@23579` | byte-identical ship → HEAD |
| Its state field | `yaelOnboardingSeen: false,@23171` | declared in `_S_DEFAULTS()` |
| Pool selection it overrides | `function _getNPCDialogue(npcKey) {@23560` | unchanged |
| Cycling rule cited in §1 | `return { quote: pool[count % pool.length], meta: d.meta, fav };@23639` | unchanged |
| The card key that was remapped | `const birkaNpcs = { LHR:['yael'], TLL:['brynn']@35139` | remapped again by §PLAY-01-G |
| Card renderer | `function _renderNpcCard(key, container) {@23683` | unchanged |
| The alternate discovery, preserved | `quest_no_fishing_sign: {@13878` | live |
| Its lamppost hook | `function _nodeHookBirkaNoFishingSign(node, { npcRowDiv }) {@32417` | live at LHR |
| The second person in the chain | `the_fisherman: { key:"the_fisherman"@22950` | profile live; card fixed later |
| The drop nerf the thesis rests on | `function _rollMonsterWeaponDrop(monsterDmgDie) {@24581` | byte-exact to §1 |
| Its degrade term | `const deg = Math.min(0, d6 - 5);@24592` | −4…0 on a d6 |
| The loot table §1 calls empty | `const _D100_TABLE = [@24516` | 7 rows, weight 100, no weapons |
| The weapon set | `const WEAPON_ITEMS = [0, 1, 2, 3, 4].flatMap(magic =>@24494` | 70 items, 56 unreachable |
| The lake reward that did ship | `const LAKE_MAGIC_DB = {@26536` | 8 passive items, 0 weapons |

---

## IV. Verification ledger

| # | Claim as written | Verdict | Evidence |
|---|---|---|---|
| 1 | `_rollMonsterWeaponDrop` filters `magicBonus === 0` | **EXACT** | filter and the −4…0 prefix ladder byte-identical parent → HEAD |
| 2 | `_D100_TABLE` carries no mainweapon/dagger rows | **EXACT** | 7 rows at both builds; 20,000 live rolls at L20 returned 0 weapons, 0 daggers |
| 3 | Monster kills cannot drop positive magic | **PROVED BY EXECUTION** | 20,000 drops across every damage die: 0 positive, 13,369 degraded (66.8 %, the d6 predicts 66.7 %) |
| 4 | Final fight is AC 22 / HP 300 | **EXACT** | `const BOSS_COMMANDER_AUROS = {@26246` |
| 5 | The lamppost coupon is the first touch of the path | **EXACT** | hook live at LHR; grants a Free Rod Coupon redeemable at SSJ |
| 6 | The Fisherman is at Yugurt Cabin | **EXACT** | `SSJ` = Yugurt Cabin; profile `node:'SSJ'` |
| 7 | The old line was geographically loose | **UNDERSTATED** | 15 dock/river labels in the world, 1 fishable node |
| 8 | The lake is north of Birka | **EXACT** | LHR row 10 → SSJ row 4 → BOO row 2; the Fisherman also says *"The lake is north"* |
| 9 | First meeting yields `impartial[0]` | **SELF-CONTRADICTED** | true of the cycling rule, false in practice — §2b of the same document refutes it and §1 was never corrected |
| 10 | The Slums quest is auto-active from turn one | **EXACT** | `quest_slums_cleanup` ships `gate:{}` |
| 11 | The rewritten string | **BYTE-EXACT** | 700-character verbatim match, spec → HEAD |
| 12 | The delivery guarantee | **BYTE-IDENTICAL** | 10 lines unchanged across 37 days and +1,458 lines |
| 13 | New flag defaulted in `_S_DEFAULTS()` | **EXACT** | §STATE-INIT honoured |
| 14 | NG+ excluded from the guarantee | **EXACT** | `!(S_story.ngPlusRun > 0)` |
| 15 | `CI` is a dead pre-§WALK code | **FALSE** | live `NODE_MAP` node at both builds — see §VI |
| 16 | No `NODE_MAP` node `CI`; `CI` is only a geo coordinate | **INVERTED** | `NODE_COORDS` has **0** keys absent from `NODE_MAP` at both builds |
| 17 | The card never rendered | **TRUE, wrong cause** | browser-proved 0 cards at CI on the parent build — see §VI |
| 18 | Sibling codes IN/TV/BA/CY are the same class | **TRUE** | all four absent from `NODE_MAP`; only `CI` was live |
| 19 | Acceptance test 1/1 | **GREEN** | 1/1 in 1.0 s, file never edited since the ship |
| 20 | Regressions courier-map 1/1, enemy-ai 4/4 | **GREEN** | 5/5, 6/6 overall with the acceptance test |
| 21 | Full render path verified | **GREEN AT HEAD** | fresh game at LHR renders 5 cards; Yael's carries Yugurt and Fisherman |
| 22 | Screenshot artefact | **NOT REPRODUCIBLE** | `test-results/` is ephemeral; the DOM assertion stands in its place |
| 23 | Inline script parses clean | **GREEN** | 0 page errors across every probe session |

**Citation dating.** Ten line numbers. **Nine land byte-exact at the parent build**; one —
`birkaNpcs` — lands only at the **ship**, and it is the single line the increment moved. A
report that documents its own repair is written across two builds, and the split falls exactly
on the boundary between the sections written before the edit and the section written after.

---

## V. Spec → shipped delta

| Specified | Shipped | Δ |
|---|---|---|
| Rewrite one sentence in `yael.impartial[0]` | done, verbatim | none |
| No new quest, item, flag or drop | held, except one boolean the fix required | `yaelOnboardingSeen` — needed, declared, defaulted |
| §FC06 preserved; fishing stays the sole magic source | held in the engine | the *source* was already empty — §IX |
| `quest_no_fishing_sign` kept as an alternate discovery | kept and live | none |
| `CI` → `LHR` for Yael's card | done | correct fix, false rationale — §VI |
| IN/TV/BA/CY deferred to §PLAY-01-G, not guessed | deferred, then shipped | **21 min 52 s later** by `a6a1ce7` |
| One-time delivery matching existing injection patterns | done | placed after the pool pick, so the card badge disagrees — §X |

Two things deserve saying plainly. First, the deferral was the right call and it cost nothing:
the report refused to guess four node codes it could not confirm, wrote the reason in-code, and
the very next commit resolved them properly. That is the discipline working. Second, every
scope promise was kept — this increment did not sprawl.

---

## VI. Finding 1 — the fix is right, the diagnosis is not, and the real cause was 17 days away

**Written:** *"`birkaNpcs` keyed her card to `CI:['yael']` — a dead pre-§WALK code (no
`NODE_MAP` node `CI`; `CI` is only a geo-grid coordinate)."*

**Measured, at the parent build and at HEAD:**

- `CI: { num:429, name:"city"@9229` is a **live node** — *Chancery Court — The Officer's Pen* —
  minted on 2026-06-05 by `76f6133`, the Grimm's Fairy Tales importer, 37 days before this
  report. One quest activates there (`erf_01_act5`, *"Falada Speaks — The Officer's Pen"*).
- `NODE_COORDS` contains **zero keys that are not `NODE_MAP` keys**, at both builds. The line
  cited as proof that `CI` is *only* a coordinate is proof that the node exists.
- The card genuinely did not render. Browser-proved on the parent build: **0 cards at CI.**
  The cause is that `CI` is one of **291 of 418** `NODE_MAP` entries at the parent build
  (289 of 416 at HEAD) carrying no source-level `code:` field, so `birkaNpcs[node.code]`
  looked up `undefined`. `LHR:{ num:1,  code:'LHR'@8427`
  is one of the 127 that do — which is the entire reason the fix worked.
- That defect had no name yet. The runtime backfill arrived on 2026-07-29 in `f08f70f`
  (§AUDIT-03e, *"287 nodes stop sharing one `undefined` state slot"*) — **17 days later**.
  Since then the original `CI:['yael']` key would resolve, and Yael would appear in a
  fairy-tale chancery; the remap incidentally prevented that.

**Why this is worth recording rather than scolding.** The file itself teaches the wrong lesson.
In the same render layer, the comment `// ── No Fishing Sign at CI ──@32418` sits directly
above `if (node.code === 'LHR')` — a rename that moved the code and left the comment. And
`scripts/legacy-codes.js` opens by stating that codes like `CI` *"name nodes that no longer
exist under those names"*, carries `CI` in its ambiguity set, and offers an `--annotate` mode
that rewrites `CI` to `` `LHR` (historical `CI`) ``. An author reading
that file would conclude exactly what this report concluded. The repo already caught the
collision — `docs/maps/node-index.md` flags it explicitly — but the tooling and the data still
disagree about whether `CI` names a place.

***A dead-code verdict is a claim about the data section. Read the data section: a node's
coordinate entry is evidence that it exists, not that it does not.***

---

## VII. Finding 2 — the thesis is a chain, and only one end was checked

The document's own argument: *"Two people, not a menu — Yael points to the Fisherman; the
Fisherman gives freely."* §2b fixed the first person's card and §3 verified it end to end,
screenshot included.

The second person's card rendered **nothing**. `SSJ` is a curated `birkaNpcs` key, and the
curated literal shadowed the derived map; the SSJ list was `emmerMet ? ['emmer'] : []`, which
never names `the_fisherman`. So the game pointed every new player at a mentor whose card did
not exist. Repaired 2026-07-23 by §NPC-01-SF5, whose row says so directly: *"This closes the
§PLAY-01-D thesis (Yael → the Fisherman) at the render layer."* **Eleven days open.**

Today, browser-proved at HEAD: SSJ renders 2 cards and the Fisherman is one of them.

> *"The fire has been going since four. The rod is by the door — if you want it, take it."*
> — The Fisherman, whose card rendered nowhere at all between 2026-07-12 and 2026-07-23

***When a fix is argued as a chain of N surfaces, the acceptance test must open all N. The one
you edited is the one least likely to be broken.***

---

## VIII. Finding 3 — the destination is unreachable, and was on the day

`BOO` (Yugurt Lake) shares grid cell `2,194` with `LYR` (Arctic Wastes — Detour), which is
declared 59 lines earlier in `NODE_MAP`. Only the first locale in a cell can become
`S_story.currentCode`, so arriving renders the arctic node, `isFishingLake` is never true, and
*Cast a Line* never draws. Exactly **one node in 416** is fishable, and it is that one.

This is §FISH-01 🔴 — filed 2026-08-12, **corroborated here, not re-filed**. What is new is the
player-facing consequence, which belongs to this increment: **the game's only tutorial speech
now sends every new player, by name, to a lake the engine cannot deliver.** Before §PLAY-01-D
the pointer was vague enough to be harmless. The honesty fix made the broken promise specific.

The cabin survives — `SSJ` is alone in its cell, so the player can meet the Fisherman, accept
the rod, read the guide, and never fish. That is the shape §FISH-01 describes, and it is
precisely the itinerary Yael now recommends.

---

## IX. Finding 4 — and what waits at the lake is not what the sentence promises

The shipped line: *"The smiths in this city cannot sell it; the lake can … The water gives up
what no shop stocks."*

- `WEAPON_ITEMS` generates 5 magic tiers × 14 base weapons = **70**; **56 carry `magicBonus`
  1–4 and have no live grant path.** `DAGGER_ITEMS` holds 4 entries, all with a positive
  `atkBonus`, and its **only** reader is the unreachable `_D100_TABLE` branch — the whole
  table is dead.
- `const LAKE_MAGIC_DB = {@26536` holds **8** items, all `type:'lake_magic'`, **none** a
  weapon: AC, first-strike, fishing-DC, attack, night-type and all-ability trinkets.
- `function _magicTierAllowed(magic) {@24509` has two call sites, both inside branches the
  table can never select.

So the trade §FC06 describes is one-sided: the taking shipped, the giving did not. This is
**§FISH-02, corroborated not re-filed** — with one addition. Prior passes measured it by
reading. This one measured it by **running the engine**: 20,000 `_rollD100Loot()` at level 20
and 20,000 `_rollMonsterWeaponDrop()` across every damage die produced **zero** positive-bonus
weapons of any kind. The lake does give something no shop stocks, and the attack trinkets are a
real edge — the sentence is not a lie. It is a sentence about weapons in a game where the
weapon half of the trade was never built, said now to every player on turn one.

***Read the whole chain, not the individual claims. Every sentence in §1 of this report is
defensible; the inference all of them support is not.***

---

## X. Finding 5 — the card labels the honest line dishonestly

The delivery guarantee returns `impartial[0]` **after** the pool has already been chosen, but
the badge is computed separately from `_hasActiveQuestFor(key)`. Browser-proved on a fresh
game at LHR: the card reads **📋 Quest Active** above the *Impartial* welcome speech. A
one-line mismatch, on the one card this increment exists to make honest. → **§DX-02dm** 🟢.

---

## XI. Finding 6 — the transmission failure was position, and position did not change

Measured at HEAD, the shipped monologue is **2,228 characters / 426 words** — the longest
single string a new player is shown, and the entire tutorial surface of the game. The word
*Yugurt* first appears at character **1,089**: **word 206 of 426, the exact midpoint.**

The report's own diagnosis was that Yael *"buries it as a throwaway aside."* The fix replaced
one buried sentence with five sentences buried at the same depth. The content is now correct
and the delivery vehicle is unchanged: a wall of text with no rules surface behind it.

§CODEX-01 🔴 already owns this and already cites this increment as its evidence — *"the entire
tutorial is one NPC monologue, and §PLAY-01-D had to add a special-case guarantee purely to
deliver it once."* **Corroborated with a measurement, not re-filed.** The number is the useful
part: any future signpost added to this speech lands in the same place.

---

## XII. What the report got right, and it is most of it

- The **string** shipped byte-exact and has not drifted in 37 days.
- The **mechanism** — a one-time guaranteed delivery keyed to a defaulted flag, NG+ excluded —
  is byte-identical parent → HEAD and is the correct pattern.
- The **shadowing diagnosis** (§2b item 1) is exactly right and non-obvious: an auto-active
  quest with `gate:{}` silently swapping a welcome speech for a mid-arc line is a genuine
  discovery, and it generalises to every NPC with a turn-one quest.
- The **acceptance test** is the strongest artefact in the increment. Twelve behavioural
  assertions plus a page-error guard, including the negative case (it fires exactly once)
  and a cross-contamination check on another NPC.
  Never edited, still green.
- The **scope discipline** held: nothing was guessed, the deferral was written down in code,
  and it shipped 21 min 52 s later.
- The **honesty about half-fixes** is explicit — the report names what it did *not* change and
  why, which is how three of the findings above were even locatable.

---

## XIII. Defects filed by this re-verification

| Row | Severity | Summary |
|---|---|---|
| §DX-02dm | 🟢 | Yael's card shows the **Quest Active** badge above the force-delivered **Impartial** monologue |
| §AUDIT-03r | amended | duplicate `num` is **14 groups, not 1** — `num:77` plus a contiguous 420–432 block, including `CI`/`RGS` at 429 |

**Corroborated without re-filing** (instrument 7): **§FISH-01** 🔴 (the lake is unreachable —
now with its player-facing consequence attached) · **§FISH-02** (the magic-weapon trade, now
proved by execution) · **§CODEX-01** 🔴 (no rules surface — now with the 206-of-426 measurement)
· **§AUDIT-03e** (`f08f70f`, the missing `code:` field, which is the true cause of §VI) ·
**§NPC-01-SF5** (already shipped the other end of the chain).

---

## XIV. Dating appendix

| Event | Commit | Time | Gap |
|---|---|---|---|
| Parent build (§DEATH-01) | `a52f9cd` | 2026-07-12 13:40:03 | — |
| §PLAY-01-D report + code | `cfdeb21` | 2026-07-12 14:21:02 | +40 min 59 s |
| §PLAY-01-G remaps the deferred siblings | `a6a1ce7` | 2026-07-12 14:42:54 | +21 min 52 s |
| §NPC-01-SF5 renders the other end of the chain | — | 2026-07-23 | +11 days |
| §AUDIT-03e backfills the field that caused §VI | `f08f70f` | 2026-07-29 11:06 | +17 days |
| §FISH-01 / §FISH-02 filed | — | 2026-08-12 | +31 days |
| This re-verification | — | 2026-08-18 | +37 days |

**Status:** the increment is **SHIPPED and intact**. Its string, its mechanism and its test are
unchanged and green. Its rationale for one of two render fixes is **NOT SHIPPED as described**
and is corrected in §VI rather than removed. The path it signposts is **blocked downstream** by
§FISH-01 and **empty at the end** by §FISH-02 — neither caused here, both now attached to the
sentence that sends players there.
