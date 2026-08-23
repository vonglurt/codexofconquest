<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->
# Lab Report — §PLAY-01-C *No Postponements*: making the deadline honest

**Parent:** `lab-reports/lab-report-play-review.md` §PLAY-01-C · **Track:** BACKLOG.md §PLAY-01 (face **C** of *The Honest Floor*)
**Written and shipped:** 2026-07-12 12:09:16 (`caa489e`, one commit — spec and code together)
**Class:** design reversal — the user chose the option that changes what the game *says* · **Status:** ✅ SHIPPED, re-verified 2026-08-18 (§DOC-02cg) at **37 days**
**Re-verification verdict:** every line it changed is byte-identical at HEAD and every deferral it declared still holds — and the sentence it wrote onto the opening screen is **false in the direction that kills the player.**

---

## 1. Abstract

The §PLAY-01 review found that `story.md` promises a clock the engine never runs. The prose says
*"The Void does not grant postponements"*; the mechanics let a competent player heal off kills,
grind indefinitely, and sleep only when they choose. The review offered three repairs and asked
the user to pick. **The user picked (c): relax the story, not the systems.**

This report specifies, and its single commit delivers, a **framing-only** change across four
surfaces: the opening courier frame drops *"before Day 49 — the Void's tide will not wait"* for a
generous horizon; the persistent objective chip loses its red alarm and keeps a soft amber inside
three days of the real cap; the chip tooltip is reworded; and nothing mechanical moves at all. The
report's own "Explicitly NOT changed" list — the Day-49 defeat flavour, the Void-Tide events,
`_addVoidPressure`, sleep, the day counter — is unusually specific for a document of 31 lines.

Re-measured 37 days later against live `roll2hit-v3.html` (38,712 lines · 416 nodes · 2,853 quests):
**all four shipped surfaces are byte-identical**, the whole deferral list is byte-identical, the
acceptance test is **1/1 green** and has not been edited since the ship, and **4 of 4 line citations
resolve exactly at the parent build** — the programme's fourth perfect dating result.

The defect is not drift. It is that §1 of this report — the measurement the whole design decision
rests on — **surveyed one of the five things that raise Void pressure**, concluded the systems were
lenient, and put that conclusion on the player's opening screen as a promise. The promise names the
one pressure source that provably *cannot* kill you and omits the one that provably can.

---

## 2. Intention and inspiration — what this buys the player

The §PLAY-01 review reads the whole engine through one accusation: **the game commits its own
subject.** `story.md` is about Froberger seeing the Void, failing to tell anyone, and fixing it alone
until it destroyed him — the Curse of Knowledge, dramatised. The review found six surfaces where the
engine knows something and will not transmit or enact it. Face **C** is the *time* one.

The inspiration is a single line of flavour text, and it is worth quoting because the report takes
its title from it and then declines to touch it:

> *"The Void does not grant postponements — not because it is cruel, but because it is not
> listening."* — `_DEFEAT_COPY.time`

That sentence is a threat. Face **C**'s finding is that the engine never carries it out. Froberger
*"sealed it seventeen times, each time less present"* — and the mechanics reward exactly that: grind,
never be present, arrive late and overpowered. The review's three options were **(a)** advance time
per battle or per cell, **(b)** a passive daily pressure drift, or **(c)** admit the clock is
generous and stop pretending otherwise.

**What (c) buys the player, concretely:**

1. **It removes a false alarm from a permanent HUD element.** Before this increment the objective
   chip turned red at Day 42 for a deadline that, by this report's own measurement, requires ~48
   deliberate sleeps to reach. A warning that fires in a situation the player is not in is worse than
   no warning: it trains them to ignore the colour. Face **A** had shipped that chip **19 minutes
   earlier** specifically to make goals legible; (c) is face A's first bug-fix.
2. **It gives the player permission to explore.** roll2hit is 416 nodes and 2,853 quests wide. A
   doom countdown on the opening screen is an instruction to rush past most of it. *"Take the time
   you need"* is a design statement about what the game is for, delivered in the courier's voice
   rather than in a patch note.
3. **It is the cheapest of the three options by an order of magnitude** — eight changed lines, zero
   balance risk, no new state, no migration — and it was chosen with that trade-off explicit. Options
   (a) and (b) would have re-tuned an economy that touches every fight in the game.
4. **It kept the guillotine and told the truth about where it is.** The Day-49 defeat was deliberately
   *not* deleted. The chip still reads `☀ Day N/49` and still goes amber within three days of the
   cap, so the far boundary remains visible. The report's argument for this is exactly right: framing
   generous while hiding a hard stop would have been a *reverse* say/do gap, and the review was
   convened to close those, not to trade one for another.

**And what the choice cost, which the report does not say.** The review's §PLAY-01-C section is not
titled *"the deadline is scary"* — it is titled ***"Heal-on-kill quietly defeats the time economy."***
The diagnosed defect is `const reward   = Math.floor((S.enemy.ac@25309`, which refills the player for
free after every kill. Option (c) closes the *say/do gap* by amending the say. **The do is untouched
and still live at HEAD.** That is a legitimate design call — the user made it knowingly, and cheap
honesty beats expensive tuning — but it is worth recording that face C resolved a symptom its parent
had diagnosed as a symptom.

---

## 3. Method

| # | Instrument | Applied to |
|---|---|---|
| 108 | Pin the PARENT build before scoring any line number | `git show caa489e^:roll2hit-v3.html` → `ac651a3`, 37,047 lines, extracted first |
| 84 | `git diff <ship> HEAD -- <report>` before reading | **empty** — untouched since the ship commit |
| 51 | Census with the real parser, never a line regex | `js/wbapi-core.js` `W.load(GAME)` → 416 nodes, 2,853 quests, 38 sleep-capable nodes |
| 4 | `git log -S <symbol> --all` with **no pathspec** | `DAY_DEADLINE` — three commits, born in face A |
| 70 | Re-run the report's own acceptance test | `tests/integration/courier-map.smoke.test.js` — 1/1 |
| 88 | Prove the behaviour in the RUNNING GAME | three throwaway Playwright probes, run and deleted |
| 66 | Census the negative claim before believing it | *"rises **only** when you sleep"* — five writers found |
| 7 | Check the report against its SIBLINGS, not only HEAD | the parent review, face A (§DOC-02ce), `plan-archive.md` §PLAY-01-C/E |
| 123 | A reframe applied to one surface is not applied to the feature | the sidebar day ladder vs the chip day ladder |

The report and the code are **one commit**, so the parent build is the only honest reference for its
line numbers, and there is no window in which the prose could have been typed after the diff.

---

## 4. Citation audit — the dating result

Four line numbers, scored against `ac651a3` (the parent), not HEAD.

| Cited as | Parent build line | Verdict |
|---|---|---|
| `storySleep()` advances the day | 34880 = `S_story.day = Math.min(49, S_story.day + 1);` | ✅ byte-exact |
| tide pressure via `_addVoidPressure(1)` | 34979 = `_addVoidPressure(1);` | ✅ byte-exact |
| the Day-49 time-defeat gate | 34841 = `} else if (S_story.day >= 49) {` | ✅ byte-exact |
| `_DEFEAT_COPY.time` flavour | 23173 = the `Day 49. You lay down.` flavour string | ✅ byte-exact |

**4 of 4.** With §DOC-02cd (13/13), §DOC-02ce (6/6) and §DOC-02cf (5/5), this is the fourth
consecutive perfect dating result in the §PLAY-01 / §XP-01 cluster. Whoever was writing in this
window was reading the file with the line numbers in front of them.

**One inherited figure is wrong, and it is ours, not theirs.** §DOC-02ce and the §DX-02dg BACKLOG row
both date this commit at *"+2 h 40 m"* after face A. The real interval is **19 min 42 s**
(`b46d3f0` 11:49:34 → `caa489e` 12:09:16). Corrected in both places by this increment.

---

## 5. As-built inventory (HEAD, 2026-08-18)

**What §PLAY-01-C wrote — all four byte-identical to the ship commit:**

| Surface | Anchor | State |
|---|---|---|
| the generous goal line | `Take the <b>time you need</b> — the seals will hold a long while yet@4953` | ✅ live |
| the reworded covenant tooltip | `Return all 7 Codex Shards, reach Level 20, and defeat Commander Auros@4260` | ✅ live |
| the calmed chip day-leg | `dayEl.className = 'obj-leg' + (day >= DAY_DEADLINE - 3 ? ' warn' : '');@36193` | ✅ live |
| the goal constants, untouched | `const SHARD_GOAL = 7, LEVEL_GOAL = 20, DAY_DEADLINE = 49;@36175` | ✅ unchanged |

**The time machinery it measured and declined to touch:**

| Symbol | Anchor | Role |
|---|---|---|
| the only day writer in the file | `S_story.day = Math.min(49, S_story.day + 1);@36270` | inside `storyConfirmSleep@36244`; **1 writer, at parent and at HEAD** |
| the sleep-flow time defeat | `} else if (S_story.day >= 49) {@36231` | fires inside `storySleep@36197`, before the overlay opens |
| the tide schedule | `const VOID_TIDE_EVENTS@22368` | 7 entries: days 3 · 7 · 14 · 21 · 28 · 35 · 42 |
| the tide pressure tick | `_addVoidPressure(1);@36369` | in `storyCheckVoidTide@36358`, after the mercy window |
| the pressure helper | `function _addVoidPressure(n) {@26975` | clamps, fires three milestones, refreshes the HUD |
| the clamp | `S_story.voidPressure = Math.min(10, prev + n);@26978` | the only guard against overshoot |
| the last-warning milestone | `if (cur === 9 && !S_story.voidImminentWarned) {@26982` | exact equality, in a system with a `+3` writer |
| the defeat flavour, deliberately kept | `flavor: 'Day 49. You lay down. The court had granted forty-nine days@23888` | source of this report's title |

**The pressure sources §1 did not survey** — four writers outside the tide:

| Anchor | Raises pressure when | Costs days |
|---|---|---|
| `_addVoidPressure(1);@36386` | you pass a second sleep-capable node **without sleeping** | **none** |
| `onFail:[{ kind:'_legacy_fn', fn:() => { S_story.voidPressure@21513` | a quest skill check fails | none |
| `onFail:[{ kind:'_legacy_fn', fn:() => { S_story.voidPressure@21535` | a second quest skill check fails | none |
| `S_story.voidPressure  = (S_story.voidPressure@31865` | you claim the Ceremonia column as power | none |

---

## 6. Spec → shipped delta

| Spec item (§2 of the original) | Shipped | Note |
|---|---|---|
| courier frame goal line 4 → generous horizon | ✅ byte-exact | `@4953`; *"it will not rush you"* added beyond the spec text |
| chip day-leg: remove the `danger` class entirely | ✅ byte-exact | the `day >= 42 ? ' danger'` arm is gone |
| chip day-leg: soft amber at ≥ 46 only | ✅ **and better than specified** | expressed as `DAY_DEADLINE - 3`, so it tracks the cap instead of hardcoding 46 |
| retooltip the chip, drop *"before Day 49"* | ✅ byte-exact | `@4260` |
| `SHARD_GOAL` / `LEVEL_GOAL` untouched | ✅ | `@36175` unchanged since face A |
| the `☀ Day N/49` readout stays | ✅ | the cap is still on screen every second of play |
| NOT changed: `_DEFEAT_COPY.time` | ✅ | present at `@23888` |
| NOT changed: the Void-Tide events | ✅ | the `VOID_TIDE_EVENTS` block is **9 lines, byte-identical** parent → HEAD |
| NOT changed: `_addVoidPressure` | ✅ | **15 lines, byte-identical** parent → HEAD |
| NOT changed: sleep, the day counter | ✅ | still exactly one writer of `S_story.day` |

**Ten for ten**, and the deferral list is as clean as §DEATH-01's — the cleanest previously recorded
in this programme. Nothing this report promised to leave alone has moved in 37 days.

Two things the spec did *not* enumerate, both shipped:

- **The sidebar day ladder was left carrying the old doom.** `dayEl.className = 'stat-val' +
  (S_story.day >= 42 ? ' danger' : S_story.day >= 35 ? ' warn' : '');@36105` still runs face A's
  original amber-35 / red-42 schedule. This is §DX-02dg, filed by §DOC-02ce, and this increment is
  its cause. **§5 adds the mechanism that row did not have:** the chip's threshold is *derived*
  (`DAY_DEADLINE - 3`) and the sidebar's is *hardcoded*. They did not merely diverge — they are
  built to diverge again the next time the cap moves.
- **The commit deleted the only assertion that tied the two surfaces together.** At the parent, the
  acceptance test carried the comment *"day threshold colouring agrees with the sidebar (danger at
  >= 42)"* and an `out.dayDanger` check enforcing it. `caa489e` removed the comment and the
  assertion in the same hunk that broke the agreement. ***The regression that guarded the invariant
  was retired by the change that violated it*** — which is the whole answer to why §DX-02dg survived
  37 days.

---

## 7. The design decision — and the measurement underneath it

The user was handed three options and picked (c) on the strength of one paragraph: *"the systems are
already lenient — time is nearly free and the hard cap is a corner case."*

**Half of that paragraph is exactly right.** Re-measured at HEAD: `S_story.day` has **one writer** in
38,712 lines, movement and combat are genuinely timeless, and Day 49 requires ~48 deliberate sleeps.
Instrument 66 confirms the negative claim survives its own census.

**The other half surveyed the wrong resource.** The day counter is not the loss condition. The loss
condition is `voidPressure`, and the report's §1 asserts it *"rises **only** when you sleep into a
scheduled Void-Tide day."* There are **five** writers. Sleep is the one that cannot kill you: seven
tide days × 1 point = **7 maximum, against a threshold of 10**, before the mercy window subtracts
from it. ***Sleeping through the entire game, all forty-nine days, cannot reach the breach.***

The path that can is `storyCheckMissedSleep@36375`, which adds a pressure point every second time
you stand on a sleep-capable node and decline to rest. There are **38 such nodes** (real-parser
census), so the exhaustion path alone offers **19 points** — nearly double what it takes to lose.

**Proved in a real browser** (throwaway Playwright probe, run and deleted): a fresh Level 1 character
who never sleeps and simply visits sleep-capable nodes reaches `voidPressure` **10/10 after 20
nodes**, `story-defeat-modal` opens with *"☠ The Void Has Breached"*, and the scoreboard on it reads
**"Day reached — Day 1."** The day counter never moved. The game ends on day one, from wandering.

So the sentence this increment wrote onto the opening screen —

> *"The Void gains only slowly, and only while you sleep; it will not rush you."*

— names the harmless source, denies the lethal one, and inverts the actual advice. The engine's own
string at `storyMsg('😴 Exhausted — DIS on next 2 battles. Void pressure rising. Sleep soon.@36388`
tells the player *sleep soon*. The courier frame tells them time is theirs and the Void only stirs
when they rest. **Two player-facing strings, in one game, giving opposite instructions about the same
mechanic** — which is precisely the say/do gap this face was convened to close, re-created one screen
over.

**This is a review defect, not report rot.** It was wrong on 2026-07-12, at its own parent build,
where all five writers were already present and a single `grep` for `voidPressure` would have
returned them. The report's rigour on the day counter — one writer, cited by line, correct — is
exactly what makes the omission invisible: it looks like a census because half of it was one.

**The irony worth keeping.** The game already owns an honest doom gauge. `voidEl.className =
'inv-stat-val' + (S_story.voidPressure >= 7 ? ' danger'@36109` paints the Void meter amber at 4 and
red at 7 against a real threshold of 10 — a colour ladder that tracks the resource that actually
ends runs. §PLAY-01-C spent its increment calming the counter that was never dangerous and never
looked at the gauge beside it.

---

## 8. Verification record — the report's own §3 plan, re-run at 37 days

| # | Planned check | 2026-08-18 result |
|---|---|---|
| 1 | whole-file inline-script parse, 0 errors | ✅ **1 inline block, 0 parse errors** |
| 2 | `courier-map.smoke.test.js`: no `danger` ever, soft `warn` at ≥ 46, no *"will not wait"* | ✅ **1/1 in 2.4 s**, and `git diff caa489e HEAD` over the test file is **empty** |
| 3 | screenshot: chip calm mid-game, frame states a generous horizon | ✅ superseded by live DOM assertion over nine days across both surfaces |

**Additional gates run by this re-verification:** 0 page errors across three independent browser
sessions; `VOID_TIDE_EVENTS` and `_addVoidPressure` diffed line-for-line parent → HEAD; the
416-node / 2,853-quest / 38-sleep-node census taken with `js/wbapi-core.js`, not a line regex.

**The two-surface sweep** (§DX-02dg, corroborated not re-filed):

| Day | `#s-day` sidebar | `#obj-day` chip |
|---|---|---|
| 34 | plain | plain |
| 35–41 | **amber** | plain |
| 42–45 | **RED** | plain |
| 46–49 | RED | **amber** |

The two agree on no day above 34. At Day 42 the sidebar screams and the chip introduced to explain
the sidebar says nothing.

**A retired phrase, surviving one deck over.** `grep -c "will not wait"` = **1** at HEAD — not the
Void's tide but a literal one: *"The Hispaniola is loading. The tide will not wait."@16265*, in a
Treasure Island quest. The idiom this increment retired for lying is still doing honest work
somewhere else in the file.

---

## 9. Findings → BACKLOG

### D1 — the game's most reachable loss condition is undocumented, and the opening screen denies it (§DX-02dk 🔴)

`storyCheckMissedSleep@36375` raises `voidPressure` for **not** sleeping; 38 sleep-capable nodes
offer 19 points against a threshold of 10; browser-proved to a full defeat screen **on Day 1**. The
shipped copy at `@4953` and `@4260` states the opposite. Either the copy is corrected, the exhaustion
path is capped, or the Void meter gets the framing the day counter received. This is the only §PLAY-01
finding that can end a run.

### D2 — three writers bypass the pressure helper, and the last-chance warning is an exact-equality test (§DX-02dl 🟡)

`@21513`, `@21535` and `@31865` write `S_story.voidPressure` directly, skipping the clamp, all three
milestones, the HUD refresh and the caller-side defeat check. Browser-proved: 9 + 3 direct = **12**
where the helper clamps to 10. Separately, `if (cur === 9 && !S_story.voidImminentWarned)@26982` is
`===`, so any step of 2 or more walks over it — proved live, `_addVoidPressure(8)` then
`_addVoidPressure(3)` lands on 10 with the *"THE VOID IS IMMINENT"* warning never fired. The engine's
last mercy is skippable by arithmetic.

### Corroborated, not re-filed

- **§DX-02dg** — this increment is the cause; §6 adds the derived-vs-hardcoded mechanism and the
  deleted cross-surface assertion. Both belong in that row.
- **Heal-on-kill** (`@25309`) is live and unchanged, exactly as the parent review diagnosed it. Option
  (c) was chosen knowing this; recorded, not filed.
- **`plan-archive.md` §PLAY-01-E** was scoped *"resolves as a consequence of §PLAY-01-B/C."* Option (c)
  is the branch under which C contributes nothing to it. The archive noticed and re-based the
  dependency onto B alone (*"B now presses + can flee, so tools matter more already"*) — **honest
  bookkeeping, no defect**, and worth recording that it was caught at close time rather than missed.

### Corrections applied by this increment

- `lab-reports/lab-report-play-01a-courier-map.md` and BACKLOG §DX-02dg: *"+2 h 40 m"* → **+19 min 42 s**.

---

## 10. Standing

**As a piece of engineering, this is one of the cleanest increments in the corpus.** Ten of ten spec
items shipped byte-exact, an unusually specific deferral list that has not moved a byte in 37 days,
an acceptance test that has never needed an edit, four of four citations exact at the parent build,
and a threshold expressed as `DAY_DEADLINE - 3` rather than a magic number — a small piece of care
that makes the chip the *more* maintainable of the two day surfaces.

**As a piece of measurement, it made one mistake and it is the expensive kind.** It measured the
clock rigorously, called it the time economy, and shipped that conclusion to the player as a
promise. The clock was never the danger. The report is a demonstration of its own subject: it knew
something true about `S_story.day`, transmitted it faithfully, and the thing it did not know is now
printed on the first screen a new player reads.

***A negative claim about a resource is a census of its writers. One writer cited by line is not a
census — it is the half of one that happens to be right.***
