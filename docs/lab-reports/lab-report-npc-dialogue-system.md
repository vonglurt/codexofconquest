<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->

# Lab Report — Layer 42: The NPC Dialogue System (World Truth · 4-State Speech · Groundhog Day)

**IEEE-format design document · original 2026-05-22 · verified against live `play.html` 2026-08-12 (§DOC-02ab)**
**Home doc:** `docs/story/story-arc-npc-dialogues.md` · **Reference build:** `32c10c5` (2026-05-24, earliest surviving — this report **predates** it)
**Status:** architecture ✅ shipped and scaled 35× · dialogue script ❌ 0 of 120 lines shipped · payoff ⛔ blocked by §EPIC-01

> **Verification note (§DOC-02).** This is a re-measured rewrite. Claims that did **not** ship are marked
> **NOT SHIPPED** and **kept**. §VI keeps all 120 original dialogue lines **verbatim** — they exist
> nowhere else, and the §DOC-02p rule applies: *deleting a document that holds the only copy of authored
> content is not a cleanup.* What was compressed is the unmeasurable prose around them. Anchors are
> `` `symbol@line` `` (§DX-01e). The original's own 2026-05-24 implementation note is superseded by §IV.

---

## Abstract

Layer 42 specifies the relationship layer of *Codex of Conquest*: a per-NPC dialogue schema
(`meta.worldTruth` / `meta.enemy` / `meta.missionBit` plus four favor-keyed quote pools), a
deterministic cycling selector, a quest-log **Disposition** line that voices each NPC's structural
grievance, and the **Groundhog Day** ending mechanic in which the player who seals the Void
*efficiently* — without the connections that produce no output — is told they have become the thing the
game warned them about.

Verification finds a **clean split between container and contents**. The schema shipped and grew from
6 NPCs to **213**; the selector shipped byte-faithful; the Disposition field shipped on **201** quests;
the four-way ending nest shipped with the exact thresholds specified. Against that: **0 of 120 quoted
dialogue lines exist at HEAD or in the earliest surviving build**, **0 of 6 World Truths are verbatim**,
**4 of 7 characters are named things they were never called**, and — the finding that matters — the
Groundhog Day mechanic is **inverted at HEAD by an unrelated rename**: three of its four endings are
unreachable and the fourth, the accusation, fires unconditionally.

---

## I. Design intent — and what it buys the player

### A. The thesis

> *"The problem with most RPG dialogue is that NPCs have **information**, not **perspective**. They tell
> you where the dungeon is. They don't have a theory about why people like you keep going into dungeons
> and what that says about the world."*

Three principles, all of which survive as live code:

1. **Occupation as lens.** Each NPC carries one sentence — `meta.worldTruth` — that is the theory their
   working life produced. A guard captain believes power flows through enforced norms; an innkeeper
   believes survival is invisible maintenance; a fence believes morality is what you can afford.
2. **The curse weaves through personality.** The Curse of Knowledge — *once you know how to fix a thing
   you can no longer remember not knowing* — has a per-NPC expression. The guard who stops seeing
   residents and sees patrol sectors. The bard who stops playing music and starts calculating reach.
3. **Friendship changes the angle, not the voice.** A friendly NPC does not get warmer and vaguer; they
   get warmer and **more specific**. *"Move along"* becomes *"Varga changed his pigeon route three days
   before the last tax collection — that's his tell."*

### B. What it adds to play

- **It makes favorability a content key rather than a stat.** Four pools per NPC × 213 NPCs = **1,614
  authored lines** at HEAD, and roughly a quarter of them are only ever visible to a player who did
  optional work. The relationship ledger is the largest gated content surface in the game.
- **It gives repeat visits a reason.** `return { quote: pool[count % pool.length], meta: d.meta, fav };@23640`
  cycles rather than randomises, so the fifth visit is *new*, not a reroll. This is the single most
  durable line in the document — specified in §II, shipped, unchanged in 82 days.
- **It converts kindness into an ending.** `function _missionComplete() {@23649` counts twelve acts that
  produce no loot, and the ending branches on it. The game's best outcome is reserved for the player who
  did the things with no output — *"the part you did because you were there, and someone needed
  something, and you were the kind of person who noticed."*
- **It puts the antagonist in the quest log.** `meta.enemy` is rarely a person; it is a system, a
  structure, an incentive. Surfacing it as a voiced **Disposition** line makes every side quest an
  argument rather than an errand.

---

## II. Method

1. **Batch symbol census** before reading prose (§DOC-02 instrument 2): every identifier, CSS class,
   state field and mission bit through one `grep -c` pass.
2. **Mechanical quote scoring.** All 120 fenced dialogue lines extracted from §VI and substring-matched
   (apostrophe-normalised, 55-char prefix) against **both** HEAD and the archive. No sampling.
3. **Archive adjudication (instruments 4, 8, 18).** The report is dated **2026-05-22, two days before
   the earliest surviving commit `32c10c5`**, so HEAD cannot adjudicate it alone and the archive is the
   reference for "was this ever true."
4. **Reachability closure (instrument 19).** Every mission bit traced to a writer; every ending branch
   traced to an attainable score.

---

## III. As-built inventory

### A. The schema — shipped, and scaled 35×

`const NPC_DIALOGUES = {@10396` (a `◆◆◆ WORLDBUILDER ◆◆◆` data section, so it is API-authorable).

| | Archive `32c10c5` | HEAD | Ratio |
|---|---|---|---|
| NPC entries | 6 | **213** | 35.5× |
| Authored quotes | 144 | **1,614** | 11.2× |
| `impartial` / `questActive` / `friendly` / `dearFriend` | — | 421 / 416 / 413 / 364 | — |

`meta` field coverage at HEAD: `worldTruth` **213/213** · `missionBit` **209** · `enemy` **202** ·
`name` + `occupation` **21**. The last is **not** a gap: only the 10 dialogue-only NPCs (no
`BIRKA_NPC_PROFILES` entry) need `meta.name`, and **all 10 have it** — §NPC-01-SF2's synthesised-profile
fallback is exactly covered. *Checked and deliberately not filed.*

### B. The selector — `function _getNPCDialogue(npcKey) {@23561`

Pool order at HEAD is `if (fav >= 2) pool = d.dearFriend;@23570`, then `questActive`, then `friendly`
(fav ≥ 1), then `impartial` — a **three-number** ledger (0/1/2), not the report's four (0/1/2/3). The
selector has since grown eight one-time injection paths in front of the pool (onboarding, act-three
weight, Froberger traces, cross-refs, void-pressure lines, and three per-NPC beats), all of which
`return` early. The cycling tail is unchanged.

### C. The mission ledger — `function _missionComplete() {@23649`

Twelve named bits, `return Object.values(bits).filter(Boolean).length >= 8;@23664`. **Byte-identical to
the archive except two node codes** (`'CO'`→`'TLS'`, `'CI'`→`'LHR'`) — 82 days, zero drift.

### D. The endings — four variants, thresholds 0 and 15, exactly as specified

`if (missionDone && curse <= 0) {@28245` → Covenant Keeper · `else if (curse <= 0)` → the Capable Warden ·
`} else if (curse >= 15) {@28259` → the Loop Continues · `else` → the Imperfect Covenant. Plus a stricter
fifth standing added later, `const _isTrue = missionDone && curse <= -6@28231`.

### E. The Disposition line — `docs`' quietest success

**201 quests carry a `disposition:` field**, voiced and attributed, e.g.
`disposition: '"The commissioners don\'t read field reports about the Slums.@21224` — Yael's grievance,
in her voice, on her quest. The report proposed it for six NPCs; it shipped as a schema field for the
whole quest database.

---

## IV. Spec → shipped delta table

| # | Spec claim (2026-05-22) | Shipped at HEAD | Verdict |
|---|---|---|---|
| 1 | `NPC_DIALOGUES` keyed by npcKey, `meta` + 4 pools | exactly that, 213 entries | ✅ EXACT |
| 2 | `meta: {name, occupation, worldTruth, enemy, missionBit}` | 3 of 5 universal; `name`/`occupation` only where no profile exists | ✅ by design |
| 3 | Cycling by `visitCount % pool.length`, not random | `pool[count % pool.length]@23640` | ✅ **EXACT, 82 days** |
| 4 | 4 favor states numbered 0/1/2/3 | **three** numbers; Friendly = 1, Dear Friend = 2 | ⚠️ compressed (§V-B) |
| 5 | World Truth footer at "favorability 2 (Friendly)" | `if (fav >= 2 && dlg.meta && dlg.meta.worldTruth) {@23764` | ⚠️ literal shipped, **tier moved** (§V-B) |
| 6 | `enemy` surfaces only in the quest log | **also an NPC-card footer at fav ≥ 1** (§NPC-01-C) | ✅ + expansion |
| 7 | `renderNPCDialogueCard()`, `.npc-dialogue-card`, `.npc-state-badge`, `.npc-world-truth` | **0 occurrences, all four** — ships as `_renderNpcCard` with inline styles | ❌ NOT SHIPPED |
| 8 | 120 authored dialogue lines across 6 NPCs × 4 states | **0 of 120** present at HEAD **or** in the archive | ❌ **NOT SHIPPED** (§V-A) |
| 9 | 6 World Truths, quoted | **0 verbatim**; 1 (Auros) a recognisable paraphrase, Yael's truncated, 4 replaced outright | ❌ NOT SHIPPED |
| 10 | Yael Stormhook · Brynn Fenn · Tomas Quill · Crane | **0 commits ever**, all four | ❌ NOT SHIPPED (§V-C) |
| 11 | "Deacon", the BA fence with a code on the wall | the **code** shipped, owned by Pachelbel — `const DEACON_CODE_TEXT =@27548` | ⚠️ name demoted to an artifact (§V-C) |
| 12 | Nodes CI · IN · TV · BA · CY · SQ | `LHR` · `TLL` · `MHQ` · `LLA` · `HKG` · `NUE` | ⚠️ 0 of 6 resolve, all 6 correctly remapped |
| 13 | Crov and Auros share a node | `HKG:['crov','auros']@35122` | ✅ EXACT — the one geography claim that holds |
| 14 | `_missionComplete()` = `bits.every(Boolean)` over 12 bits | `filter(Boolean).length >= 8` over a **different** 12 | ❌ NOT SHIPPED (author's own note said so) |
| 15 | Bit `weckmannPitTrainingDone` | **0 occurrences**; ships as `crovPitTrainingWins@23655` | ❌ renamed to the profile key |
| 16 | Bit `couperiSongReceived` | **shipped, typo and all** — 9 occurrences (§V-C) | ✅ EXACT |
| 17 | Bit `ebReturnsCompleted >= 20` | `allEbReturns@23657` reads `ebReturnDone`, threshold **5** | ⚠️ and it minted a dead field (§V-D) |
| 18 | Bit `journalEntriesRead >= 17` (a number) | `journalHalf@23658` — an **array**, `length >= 9` of 41 | ⚠️ type + threshold changed |
| 19 | Bits `frobergerLastEntryRead` · `ebNegotiatedPayments > 0` · `roughWhiskeyUsed` | **dropped**; replaced by `sealedVoid` · `atLeastThreeFriends` · `noHighCurse` | ⚠️ 3 of 12 replaced |
| 20 | Four endings on `_missionComplete()` × `_curseScore()` at 0 / 15 | exactly that nest, both thresholds | ✅ EXACT — and **3 of 4 unreachable** (§V-E) |
| 21 | Quest-log **Disposition** line, voiced, enemy-derived | **201 quests** carry `disposition:` | ✅ **+ shipped 33× wider than proposed** |
| 22 | "8 NPCs × 4 states × 8 quotes = 256; 700+ at scale" | **213 NPCs, 1,614 quotes** | ✅ under-projected by 2.3× |

**Score: 8 exact · 3 exact-plus-expansion · 11 deltas, of which the entire dialogue script is one.**

---

## V. Findings

### A. The container shipped and the contents did not — 0 of 120

Every one of the 120 dialogue lines in §VI was substring-matched against HEAD **and** against
`32c10c5`, the earliest surviving build, two days after this document was written. **None is present in
either.** The archive already held six `NPC_DIALOGUES` entries with 144 quotes — so the table existed,
was populated, and was populated with **entirely different text**.

This is the exact inverse of §DOC-02e's result on the Ceremonia spec (*"100 % of its prose survives and
0 % of its field names do"*). Here 79 % of the field names survive and 0 % of the prose does.
***A schema is a promise the codebase can keep; a script is a promise only an author can keep, and the
two ship on different days.*** The corpus now has one clean instance of each direction, which is what
makes the pair worth stating as a rule rather than an anecdote.

The one line that *nearly* survived is instructive: Yael's `impartial[0]` slot — the report's *"Keep
moving. This district's quiet right now"* — is at HEAD the 400-word §PLAY-01-D onboarding monologue.
The **slot** was load-bearing enough to be fought over; the **line** was not.

### B. The four states became three numbers, and one footer moved a tier without changing a character

The report defines `0 Impartial · 1 Quest-Active · 2 Friendly · 3 Dear Friend`. HEAD stores **three**
values and derives Quest-Active from `_hasActiveQuestFor` instead: `0 Impartial · 1 Friendly ·
2 Dear Friend`. The author's own 2026-05-24 note caught this.

What the note missed is the consequence. §V of the original specifies the World Truth footer as
*"when favorability reaches 2 (Friendly)."* HEAD ships
`if (fav >= 2 && dlg.meta && dlg.meta.worldTruth) {@23764` — **the literal is byte-faithful to the spec
and one whole tier stricter than the spec meant**, because the number 2 changed meaning underneath it.
The World Truth — the payload of principle 1 — is now a Dear Friend reveal, not a Friendly one.

***A magic number is a contract between a spec and its code, and renumbering the states silently
re-signs it.*** (The engine later added an `enemy` footer at fav ≥ 1, which restores a two-stage reveal
— friendly-reveal then dear-friend-reveal — so the design intent came back by a different door.)

### C. Six of seven characters are named at least two ways in this one document

| §III heading | Its `missionBit` | §VI/§VII prose | HEAD key | HEAD `meta.name` |
|---|---|---|---|---|
| YAEL STORMHOOK | `yaelEscortUsed` | Yael Scheidemann | `yael` | Yael Scheidemann |
| BRYNN FENN | `brynnsJournalRead` | Brynn | `brynn` | **Brynn Clerambault** |
| TOMAS QUILL | `couperiSongReceived` | Tomas Couperin | `quill` | Tomas Couperin |
| DEACON | `pachelbelPaidBack` | Pachelbel | `pachelbel` | Fence Pachelbel |
| CROV | `weckmannPitTrainingDone` | Weckmann | `crov` | Pit Master Weckmann |
| SERAPHINE AUROS | `bruhnsDepthsReported` | Auros | `auros` | Cmdr Seraphine Bruhns |
| CRANE | — | Sweelinck (§IV) | `archivus_sweelinck` | — |

**`Yael Stormhook`, `Brynn Fenn`, `Tomas Quill` and `Crane` have 0 commits in the file's entire
history.** §DOC-02d identified its neighbour as the traceable origin of §AUDIT-03n — *a design doc that
uses two names for one character mints two keys.* **This document is that failure at six characters and
industrial scale**, and it is worse in a specific way: the ambiguity did not resolve *consistently*.

- `crov` — key wins, flag renamed to `crovPitTrainingWins@23655`.
- `auros` — key wins, flag keeps the surname: `bruhnsDepthsReported`.
- `quill` — key wins, flag keeps the surname **and the surname is misspelled**.
- `pachelbel` — the **flag's** name won and became the key; the §III heading name lost.

Four characters, four different resolutions of one ambiguity, all in the table at `@10396`.
***An ambiguous name is not a coin flip you lose once; it is a coin flip you lose again at every site
that has to spell it.***

**Two consequences worth keeping.** (1) **`couperiSongReceived` is a typo that became a save format.**
Nine occurrences at HEAD, including `S_story.couperiSongReceived = true;@35282` and a `_S_DEFAULTS()`
field — and because `_S_DEFAULTS()` fields persist to `localStorage`, renaming it would break every
existing save. *The document wrote "couperi" once and the repository will spell it that way forever.*
(2) **"Deacon" survived as a thing rather than a person.** The fence's *"My code's on the wall. Read
it"* shipped as `const DEACON_CODE_TEXT =@27548` — *"Deacon's Code (4 rules; readable at BA; Pachelbel
Dear Friend)"* — with `function _nodeHookBirkaDeaconCode(node, { npcRowDiv }) {@32109` rendering it at
`LLA`. The character's name is now the name of his rulebook, owned by the character who replaced him.
A third, unrelated `Deacon Nikolaos` exists at ATH. ***When a document gives one character two names,
the engine does not always drop one — sometimes it keeps both and demotes one to furniture.***

### D. The report's own mission bit minted the repository's cleanest dead field

§IV lists `S_story.ebReturnsCompleted >= 20` as a mission bit. HEAD writes that field on every EB
return — and `allEbReturns@23657` reads **`ebReturnDone`** instead. `ebReturnsCompleted` has **12 fewer
readers than its twin, which is to say zero**: it is §DX-02n(b), *"the quietest form of Hazard #2 — it
saves, reloads, and is never consulted, so even the round-trip acceptance test passes it green."*

**This document is where it came from.** §DOC-02b found the field; this pass supplies the cause. The
spec named a counter, the engine wrote it, and the reader was built against a sibling that already
existed. ***A dead field usually has a document behind it, and the document usually reads as a
requirement.***

Two smaller shapes in the same twelve lines: `allEbReturns` opens with
`allEbReturns: Object.keys(NPC_DIALOGUES).length > 0@23657` — a conjunct over an immutable non-empty
literal, so it is **always true and tests nothing**; and `journalHalf: (S_story.journalEntriesRead || []).length >= 9,@23658`
is named *half* while asking for 9 of `FROBERGER_JOURNAL`'s 41 entries — **22 %**. Also
`returnedToCI: !!(S_story.visited && S_story.visited['LHR'] && S_story.level >= 5),@23662`: a dead node
code preserved in an **identifier**, where no gate can see it (`check:legacycodes` scans `.md`,
`check:noderegs` scans references, and this is a property name).

### E. THE FINDING — the Groundhog Day mechanic is inverted at HEAD, and it accuses the wrong player

The report's thesis is §IV: *"The TRUE win — transcending the curse — requires completing every mission
bit… Because they were the part of the mission that had no output."* The four-way nest that delivers it
shipped **exactly as specified**. It cannot fire as specified, and here is the arithmetic.

`function _curseScore() {@28193` scores each of the twenty `const _EB_CODES = [@28032` as *returned*,
*started-not-returned* (×3) or *never started* (×1). `returned` reads `S_story.ebReturnDone[code]`,
written **only** by `function _storyEbReturnBeat(ebCode) {@30360`, called **only** from
`c.addEventListener('click', () => _storyEbReturnBeat(ebCode));@35861`, which renders only when
`const returnId   = 'quest_' + ebCode.toLowerCase() + '_return';@35848` is active — i.e.
`quest_prn_return`. `QUEST_DB` holds `quest_ef_return` … `quest_eg_return`, the **retired EA–ET codes**.
The same mismatch sits in `const primaryId = 'quest_' + code.toLowerCase() + '_primary';@28198`.
**That is §EPIC-01.** No id resolves, the RETURN chip never renders, `ebReturnDone` is never written.

With `returned = false` for all twenty, `_curseScore()` has a **hard floor of 20** (all-never-started)
and a ceiling of 60 (all-accepted-none-returned). Therefore:

| Branch | Condition | Reachable? |
|---|---|---|
| Covenant Keeper (**TRUE SEAL**) | `missionDone && curse <= 0` | ⛔ never |
| The Capable Warden (**EFFICIENT**) | `curse <= 0` | ⛔ never |
| The Imperfect Covenant | `0 < curse < 15` | ⛔ never |
| **The Loop Continues (CURSED)** | `curse >= 15` | ✅ **always** |

`const _isTrue = missionDone && curse <= -6@28231` — the "Covenant Keeper (True)" standing — likewise
never renders, and the three score-banded `const SWEELINCK_DIALOGUE_VARIANTS = [@27231` below 15 are
dead (the fifth, `birka:true`, is checked first via `_lubeckFriends() >= 3` and is fine).

**So the only ending any player can reach is the accusation** — *"you couldn't slow down long enough to
catch them… It's not a condemnation. It's a pattern. I've seen it seventeen times."* A player who
befriends all six Birka NPCs, reads the journal, trains at the pit, walks the beat with Yael and stays
for Quill's song is told, word for word, that they were the efficient one who skipped the people.
***The mechanic still works. It is pointed the wrong way.***

`_missionComplete()` takes collateral damage from the same cause: `noHighCurse: _curseScore() < 10,@23661`
and `allEbReturns` are **both permanently false**, so the ledger needs **8 of 10** attainable bits, not
8 of 12. And `sealedVoid` is a tautology at both call sites — the victory screen only renders once
`defeatedBattles['TLS']` is set — so the real bar is **7 of 9 genuine choices**. The design's stated
generosity (*"8 of 12, you can miss a third of it"*) is, in play, 7 of 9.

→ **§ENDING-01 extended** (this is the third independent reproduction, and the first from the dialogue
side); **§EPIC-01 gains its sharpest single sentence of player impact.**

### F. What the world truths became

Zero of the six shipped verbatim. Auros's is a tightened paraphrase
(*"…built on infrastructure that was never meant to be permanent"* → *"…invisible until it fails"*);
Yael's is truncated (the report's *"…that never make the papers"* clause is gone); the other four are
different sentences making different arguments. Brynn's *"The thing that keeps a city running is the
work no one names"* became *"Safety is a thing people carry in, not a thing rooms provide."* Quill's
economics became aesthetics: *"The best songs are the ones that take three listenings to understand."*

Not rot — **revision**. The shipped set is more concrete and less thesis-shaped, which is the same edit
the dialogue got. ***The document argued that the theme should emerge and never be explained; the
rewrite it received is that argument applied to the document.***

---

## VI. The unshipped dialogue draft — six NPCs, four states, 120 lines

> **Kept verbatim, deliberately.** Every line below was scored against HEAD and against `32c10c5`;
> **none is present in either.** This document is therefore the only surviving copy, and the §DOC-02p
> rule applies — *a report that holds the only copy of authored content is an archive, not a stale
> claim.* The names, node codes and mission bits in the headings are the originals and are **wrong at
> HEAD**; §V-C maps every one of them. Read this section as a draft script, not as a description of the
> game.

### YAEL STORMHOOK (CI — Guard Captain)

**Occupation:** City guard captain, 12 years. Enforces norms she partially designed.  
**World Truth:** Every riot that gets suppressed becomes three quiet riots that never make the papers.  
**Enemy:** City commissioners who erase evidence of unrest to keep the books clean.  
**Wound:** She filed the riot suppression report herself. She followed orders. She has read it approximately four times. She filed it correctly.  
**Curse Expression:** The guard who stops seeing people and sees patrol sectors. The soldier who gets so good at keeping order that she can no longer remember what order was for.  

**Impartial** *(fav = 0, no quest active)*  
```
"Keep moving. This district's quiet right now and I'd like to keep it that way."
"Papers if you're trading. Move along if you're not."
"You want information, you want the notice board. I'm not it."
"Conclave district east, market district west. If you don't know where you're going, you're already in the wrong place."
"Quiet night. I'd like it to stay quiet."
```

**Quest-Active** *(quest in journal, Ghetto cleanup active)*  
```
"You took the Ghetto work. Good. Most people say they want to help and mean it for about forty minutes."
"The east alley drains backed up again. If you clear them before I finish my patrol, I won't pretend I didn't notice."
"Don't antagonize Pachelbel's people while you're in there. They know which trouble is which."
"Merchants from the market district offered to 'assist' with the Ghetto cleanup. I told them we had it handled. We do have it handled?"
"Report back when the northern section's clear. I'll verify personally."
```

**Friendly** *(fav = 2)*  
```
"Varga changed his pigeon route three days before the last tax collection. That's his tell. If he changes it again, something's moving."
"Eleven years on this corner, the same guard. Nivers. She hasn't called in sick once. She's either a machine or she's scared. I keep watching."
"The Ghetto stabilized. I'm not thanking you publicly — city politics — but you'll notice the eastern patrol route added two stops."
"Gigault runs the bread stall on Conclave Way. She goes home an hour early when there's going to be trouble. I use her schedule to calibrate mine."
"The blue shutters on Scholar's Row — that's not a bookshop. It's a Scholar King archive. They call themselves private collectors. They are not private collectors."
```

**Dear Friend** *(fav = 3)*  
```
"There's a report I filed twelve years ago. Riot suppression, east quarter. I wrote it exactly as I was told. Every word accurate, every context removed. You know what I learned? Accurate and honest are different categories."
"I know every corner of this city and I don't know what it looks like when it's actually okay. I've been keeping order for so long I've forgotten what the order is supposed to protect."
"When they offered me the captain's post I thought: now I can make it better. Twelve years later the definition of 'better' has drifted considerably toward 'stable.' I'm not sure when that happened."
"You keep coming back. Most people don't. I think about that."
"The city doesn't need more capable guards. It needs guards who remember why they became guards. I'm working on that. It's slow."
```

### BRYNN FENN (IN — Innkeeper)

**Occupation:** Innkeeper, solo for 6 years. Runs a 14-bed inn with one part-time kitchen helper.  
**World Truth:** The thing that keeps a city running is the work no one names.  
**Enemy:** Anyone who benefits from infrastructure without acknowledging it exists.  
**Wound:** Baseline exhaustion so structural it reads as her personality. No one asks if she's okay because she's always managing.  
**Curse Expression:** The innkeeper who stops noticing she's tired and just tracks the deficit. Systems thinking as survival, until the system is all that's left.  

**Impartial**  
```
"Beds are four copper, meals three. Full board for a week, twenty-five. Sign the ledger."
"Fire's warm. Avoid the third step on the left — it creaks. Kitchen closes at ninth bell."
"Bring noise upstairs and I'll know it by morning. I always know."
"Take the corner room if you want quiet. The street-side one's for people who sleep hard."
"No tab. Payment at time of service. That's how this works."
```

**Quest-Active** *(journal delivery quest)*  
```
"She put that journal in the lockbox herself. Wouldn't tell me what was in it. Just — 'if the right person asks, give it to them.' You're apparently the right person."
"My daughter writes 'expedition' in very hard pencil. Like the word needs to be certain. I've stopped trying to explain what expeditions actually involve."
"The journal's got a cipher on the back pages. She learned it from the archivist on Scholar's Row. I don't know what she wrote. I think she wanted me not to know."
"You'll be careful with it. That's not a question."
"Come back when you've read it. I want to know what she said."
```

**Friendly**  
```
"Third step still creaks. It'll keep creaking until someone fixes it. Probably me, eventually, when there's a week with nothing else."
"I haven't slept past sixth bell in six years. I don't miss it. I miss missing it."
"The merchants in this district take infrastructure for granted the way they take weather for granted. It doesn't occur to them that someone made it."
"My daughter sent a letter. She's in the Heartwood. She said the trees are older than the city. She wanted me to know that."
"Free lodging, whenever you're back. Don't argue. I have the room."
```

**Dear Friend**  
```
"You ever get so competent at something that the competence starts feeling like the whole point? I run this inn perfectly. I don't know if I'm still running it for something or just... running it."
"When my husband died I told myself: you know how to do this. You've run the inn for twelve years, you know every system. And I did. I do. It turns out knowing how to manage grief and actually doing it are entirely separate skills."
"My daughter asked me why I stayed in Birka. I said: because someone has to run the inn. She looked at me for a long time. She's very patient. I'm working on better answers."
"The thing no one says about keeping everything running is that eventually the running becomes the thing and you forget what you were running toward. I think I knew, once."
"You came back. I started keeping the corner room. In case."
```

### TOMAS QUILL (TV — Bard)

**Occupation:** Unlicensed bard, 4 years. Performs at the Tavern while paying off a license debt that accrues faster than he earns.  
**World Truth:** Institutions license creativity to capture the upside; the downside falls to the creator.  
**Enemy:** The Bardic Guild licensing apparatus, specifically the debt collector who visits every third Tuesday.  
**Wound:** He's good enough to be licensed. The debt structure makes it functionally impossible. He has started doing math during performances.  
**Curse Expression:** The artist who gets so good at calculating reach that he stops playing music and starts playing audiences. Professionalization as slow disappearance.  

**Impartial**  
```
"Request list is on the board. Standard fee, coin up front. I don't take trade."
"If you want the Scholar's Walk cycle, that's a long engagement — talk to the tavern keeper first."
"Can't do the Elven ballads without a permit. Guild rules. Don't ask me why, I didn't write them."
"The lute's new. The old one had a crack in the second fret. Still worked. New one is better. It's still not mine."
"Playing through ninth bell. After that I pack up."
```

**Quest-Active** *(license debt quest)*  
```
"You want to help with the debt? Fine. But I'm not paying off the Guild with stolen coin — that comes back worse."
"The collector's name is Boyvin. He's punctual. I'll give him that. Shows up every third Tuesday like the world owes him a schedule."
"There's a payment the Conclave made to the Guild that was supposed to credit my account. It didn't. I have the receipt. The Guild says they don't. Someone's math is wrong."
"If you find the discrepancy, bring me the document. Don't confront Boyvin. He has friends I don't have."
"I wrote a song about the debt. I haven't performed it. The Guild would cite me for something."
```

**Friendly**  
```
"Song's ready. I've been working on it since last month. It's specifically for you. Don't get used to that."
"The Rough Whiskey you didn't buy? I appreciate it. The lute strings are sensitive and I smell everything from up here."
"Boyvin came by. The discrepancy cleared. He didn't apologize. I didn't expect him to. The debt is mine alone now — which is actually better."
"I've started playing without counting the reach. Just... playing. It's been a while."
"Come back when you're in the city. I'll have something new."
```

**Dear Friend**  
```
"You know what I noticed? I started doing arithmetic during 'The Long March.' Three hundred and twelve bars, I've played it so many times I was calculating the evening's take during the bridge. I noticed. I stopped. I'm not sure when it started."
"The Guild system is designed so that I'm always one missed payment away from losing the license I don't technically have. That's not an accident. That's the product."
"My teacher said the best performers don't play the music, they become the music for the duration. I understand that. I can't always do it anymore. The math keeps interrupting."
"You fixed the one thing I couldn't fix myself. I've been thinking about what I owe you. The answer is: nothing, because that's not how it works, but also: everything, because that's how it feels."
"I have a song. It's about someone who keeps coming back to a city that doesn't seem to need them, and how the city actually does. I'm still finishing it. I'll play it when it's right."
```

### DEACON (BA — Fence)

**Occupation:** Fence. Runs a legitimate salvage front at BA. Strict moral code: no bodies, no children, no desperation goods.  
**World Truth:** The market doesn't have morality. The people in it do. Usually not enough.  
**Enemy:** Merchants who operate with moral plausible deniability — they didn't steal anything, they just bought it.  
**Wound:** Raison got arrested on a job Pachelbel passed to him. Pachelbel declined because the margin was thin. He didn't go to the trial.  
**Curse Expression:** The fence who gets so good at assessing risk that he stops assessing people. The moral code as armor that eventually becomes a wall.  

**Impartial**  
```
"Salvage and surplus. What you've got, I'll look at. What I've got, posted on the board."
"No questions about provenance on standard goods. On specific goods, I ask once and believe the answer."
"I don't deal in desperate. If you're selling because you need the coin badly enough to take half price, come back when you don't."
"My code's on the wall. Read it. If your business fits inside it, we can talk."
"Market price plus ten percent for identification, minus twenty for obvious damage. That's baseline."
```

**Quest-Active** *(Raison's restitution quest)*  
```
"You want to square the debt. Fine. The family's in the east district. Don't tell them where the coin came from."
"Raison knew the risk. I knew the risk. The difference is I passed it to him. That's the part I can't square mathematically."
"The family doesn't know me. Keep it that way. This isn't about making me feel better."
"Bring me proof of delivery. Not because I don't trust you — because I want to know it's done."
"After this is finished, we're even. I don't mean you and me. I mean the other thing. The one I've been carrying."
```

**Friendly**  
```
"Market district bought a lot of 'salvaged antiques' last season. I can tell you exactly where they came from. I'm choosing not to, because I'd have to explain how I know."
"Moral plausible deniability is the operating principle of legitimate commerce. They didn't steal it. They just bought it from someone who did. Clean hands. The blood's upstream."
"I turned down a consignment last week. Good margin. Wrong provenance. My code said no. I said no. It felt like something."
"You kept your word about how the delivery went. I notice those things."
"I owe you a look at the back stock. Next time you need something specific, ask."
```

**Dear Friend**  
```
"Raison's kid is eight now. The family got stable. I found out from a contact — I didn't go see them. I don't know why. I know why."
"My code started as a set of minimums. Don't do the worst things. Over the years it became a comfort — I do the code, I'm okay. But the code doesn't do Raison. The code just tells me I didn't do anything wrong."
"I know what everything's worth. I've spent thirty years learning it. The things I don't know: what it would feel like to do the thing I should have done twelve years ago. I have a theory. I think it would feel like relief."
"You're the only person in this city I've told that to. I want you to know that's not nothing."
"If you find yourself on the wrong side of a deal and you need someone to know where you are — I'll know. That's the offer."
```

### CROV (CY — Pit Master)

**Occupation:** Pit master, 28 years. Runs the legal fights at CY. Quietly campaigns against illegal pits.  
**World Truth:** Pain is information. The question is whether you chose to receive it.  
**Enemy:** Pit operators who run illegal fights because the legal overhead cuts into margin.  
**Wound:** Lost Bruna at 23 to an illegal pit. The fight Bruna took was one Weckmann declined because the odds were too good.  
**Curse Expression:** The coach who gets so good at reading fighters that he stops seeing fighters and sees fighting. Bruna became a variable. That was before the pit.  

**Impartial**  
```
"Entry fee's posted. Fight when your number's called. Don't tap the post — tap the mat."
"You want to watch, the benches are behind the rail. You want to fight, sign the book."
"No weapons. No outside bets. Both fighters walk out or neither walks out. Those are the rules here."
"I've seen every type come through here. Most of them fight fine. A few of them are good. You want to find out which you are?"
"Sign in if you're fighting. Move to the benches if you're not. This isn't complicated."
```

**Quest-Active** *(illegal pit tip quest)*  
```
"You know about an illegal operation and you're telling me instead of the guard. Good instincts."
"I don't want them arrested. I want them gone. Different things."
"The guard'll file it and lose it. You get me location and schedule, I have contacts who can make the operation nonviable. Quietly."
"These operators know the margins. They're not desperate — they just don't want to pay the legal overhead. That's the type I have the least patience for."
"When it's done, come back. We'll see what you can do in the pit."
```

**Friendly** *(post-quest)*  
```
"You showed up drunk. First time in eight years that's happened in the legal pit. I won't say I wasn't entertained."
"The whiskey didn't make you sloppy. It made you aggressive in ways you weren't calculating. Interesting to watch. Don't do it again."
"Training sessions: fifths bell, three days a week. You show up, I'll show you what I know. I don't do this for everyone."
"Bruna would have liked you. He liked people who showed up weird and meant it."
"The illegal pit's gone. They moved or stopped — I don't know which and I'm okay not knowing."
```

**Dear Friend**  
```
"Bruna was twenty-three. He took a fight at an illegal pit because the money was good and I'd told him he was ready. I believed it. I was right about his skill. I wasn't thinking about anything else."
"I became very good at reading fighters. Styles, patterns, tells. Bruna had a tell — he dropped his left when he was tired. I'd been watching it for two years. I mentioned it six times. I didn't think about what it meant in an illegal pit with no rules and an opponent who'd been watching too."
"I got so good at knowing what a fighter needed to know that I forgot to know them. That's the thing. He wasn't a fighter to me. He was. I mean, he was a person. But I was seeing the fighter so clearly."
"I run legal fights because rules protect people who don't know they need protecting yet. That's the whole reason. It's not complicated. I just had to lose someone first before I understood it."
"You keep coming back. Training, not fighting. That tells me something. The people who only want to fight don't become good. The people who want to understand it — sometimes they do."
```

### SERAPHINE AUROS (CY — Undercity Tech Researcher)

**Occupation:** Independent researcher, undercity access specialist. Works out of CY because the depth access is best here.  
**World Truth:** The infrastructure that holds a city up is built on infrastructure that was never meant to be permanent.  
**Enemy:** City planning officials who refuse to fund undercity surveys because the findings would create liability.  
**Wound:** Submitted a structural integrity report three years ago. It was reclassified. She found out because she kept a copy.  
**Curse Expression:** The researcher who gets so good at finding structural failure that she stopped imagining structural success. Diagnosis as worldview.  

**Impartial**  
```
"You're not here about the depths. Most people aren't. Move along."
"If you need CY access for training, talk to Weckmann. He handles the pit side. I handle the down side."
"My work isn't available for public viewing. If you know what you're looking for, you probably already know how to find me."
"Don't touch the survey equipment. It's calibrated."
"I'm busy."
```

**Quest-Active** *(undercity anomaly report)*  
```
"You actually went down. And came back. That's a better result than my last three contractors."
"The readings you brought are consistent with what I've been tracking. Which is not good news, but it's accurate news."
"The city planning office will ignore this. I need you to understand that before you get invested in what we're doing here."
"Froberger came back once. He didn't stay long. He said he'd seen something similar in three other cities. He left before I could ask what happened to those cities."
"The Void isn't just below us. It's been below us for a long time. Something's changed about the timeline."
```

**Friendly**  
```
"The report I submitted three years ago — if you're ever in the Scholar King archive, look for the reclassified shelf on sub-district drainage. It's there under a different title. They couldn't destroy it, so they buried it."
"Weckmann thinks I'm paranoid about the undercity. He's not wrong that I'm fixated. He's wrong that fixation and paranoia are the same thing."
"The structural failure modes I study — most of them happen slowly. You can see them coming for years if you're looking. The ones that kill people are the ones where no one was looking."
"You can access the depth records now. Everything I've documented. Use it carefully."
"Froberger had a theory about the Void. He didn't finish explaining it. I've been working on the rest of the theory for two years. I think I'm close."
```

**Dear Friend**  
```
"The report exists. The findings are real. The city is choosing not to know. I have spent three years being angry about this and I think I have arrived at something past anger. I'm not sure what it's called."
"I am very good at finding things that are wrong. I find them systematically. I document them thoroughly. I have submitted twenty-six reports in seven years. Four were acted on. The others are reclassified, delayed, or lost. I keep making them."
"Froberger looked at my data and said: 'this is what it looks like before.' I asked him before what. He looked at me for a long time. He said: 'before it's too late, or after.' I didn't understand. I think I do now."
"The Void Below — the thing in the depths — it responds to attention. Not to capability. To presence. That's the only thing I can't put in a report."
"You came back from the depths. Something down there is looking back up. I want you to know that, because most people who know it have either left or stopped talking."
```

### CRANE (SQ — The Watcher)

**Occupation:** Last of the Covenant Wardens. Maintains the Seal. Has been doing this for longer than the current city exists.  
**World Truth:** The covenant is not held by those who know how. It is held by those who remember why.  
**Enemy:** No enemy. Only a grief — that capability outlasts connection, and then what was the capability for.  
**Wound:** He trained the last generation of Covenant Wardens. He was very good at it. They became excellent. They left to use the excellence. He sealed the Void alone.  
**Curse Expression:** He IS the Curse of Knowledge, resolved into acceptance. He knows everything about the Seal and cannot feel it anymore. He watches others discover it for the first time and remembers, faintly, what it felt like.  

*(Sweelinck dialogue is curse-score-gated, not favorability-gated. See SWEELINCK_DIALOGUE_VARIANTS.)*

---

---

## VII. Recommendation register

| Proposal | Where | Outcome |
|---|---|---|
| `NPC_DIALOGUES` schema: `meta` + 4 pools, keyed by npcKey | §V | ✅ **SHIPPED**, 6 → 213 entries |
| Cycling selector (`visitCount % pool.length`), not random | §II | ✅ **SHIPPED**, unchanged 82 days |
| "No-touch extension" — adding quotes is adding strings | §V | ✅ **SHIPPED and then some**: the block is a `◆◆◆ WORLDBUILDER ◆◆◆` data section, so quotes are addable through `./api.sh`, not just by hand |
| World Truth footer at Friendly | §V | ⚠️ shipped **at Dear Friend** (§V-B) |
| `enemy` as a voiced quest-log **Disposition** line | §VI | ✅ **SHIPPED at 201 quests** — the document's most successful single idea |
| `renderNPCDialogueCard` + 3 CSS classes | §V | ❌ NOT SHIPPED (the surface exists as `_renderNpcCard`) |
| 4-state numbering 0/1/2/3 | §II | ❌ NOT SHIPPED — compressed to 0/1/2 |
| `_missionComplete()` as `every(Boolean)` over its 12 bits | §IV | ❌ NOT SHIPPED — 8-of-12 over a different 12 |
| Four ending variants on `_missionComplete()` × `_curseScore()` | §IV | ✅ shipped exactly · ⛔ **3 of 4 unreachable** (§V-E) |
| The 120-line dialogue script | §VI | ❌ **NOT SHIPPED**, 0 of 120 |

**6 of 10 adopted.** Every adopted item is *structural*; every rejected item is *content or presentation*.
That is not a coincidence and it is the report's real lesson about itself.

---

## VIII. Defects filed from this pass

| Row | Severity | Summary |
|---|---|---|
| **§ENDING-01** extended | 🔴 | Third independent reproduction, first from the dialogue side, and the sharpest statement of impact: with `_curseScore()` floored at 20 the **only** reachable ending is the accusation, delivered to the most attentive possible player. `_missionComplete()` also drops from 8-of-12 to **7 of 9 real choices**. Released by §EPIC-01. |
| **§EPIC-01** annotated | 🔴 | The id mismatch is at two computing sites, not one: `const primaryId = 'quest_' + code.toLowerCase() + '_primary';@28198` and `const returnId   = 'quest_' + ebCode.toLowerCase() + '_return';@35848`. Fixing only the primaries leaves `ebReturnDone` unwritable and the curse floor intact. |
| **§DX-02n** +2, and one **origin** | 🟢 | `ebReturnsCompleted`'s origin traced to §IV of this report. New: the always-true conjunct in `allEbReturns@23657`, and `journalHalf@23658` — a bit named *half* that asks for 9 of 41. |
| **§AUDIT-03s** family +1 | 🟢 | `returnedToCI@23662` — a retired node code preserved in an **identifier**, invisible to every gate by construction. |
| **§AUDIT-03n** post-mortem | 🟢 | This document is the root cause at six characters; `couperiSongReceived` is a **typo that reached the save format** and cannot be renamed without breaking saves. Recorded, not actionable. |

**Checked and deliberately NOT filed** (existing-work-first): the 21-of-213 `meta.name` coverage is
correct by design — all 10 profile-less NPCs carry it; `quest_drunk_fight` in
`const npcQuests = { yael:['quest_slums_cleanup','quest_city_watch_patrol']@23643` is still dangling but
is already §DX-02o.

---

## IX. File references and dating

The report cites no line numbers, so it cannot be dated by instrument 18. What can be established:

- It **predates the repository's earliest surviving build** (`32c10c5`, 2026-05-24 17:34) by two days,
  so §DOC-02f's instrument 8 applies in its strongest form: *absence at HEAD proves nothing; absence at
  the archive is the only available evidence, and here it is decisive* — the archive already had a
  populated `NPC_DIALOGUES` with entirely different text.
- Its own 2026-05-24 implementation note is the earliest self-correction in the corpus, and **both of
  its two corrections are right** (the `questActive` derivation and the 8-of-12 threshold) — a rare
  clean result for a status block (cf. §DOC-02j, §DOC-02x, where status blocks were the wrong half).

Live anchors: `const NPC_DIALOGUES = {@10396` · `function _getNPCDialogue(npcKey) {@23561` ·
`function _missionComplete() {@23649` · `function _curseScore() {@28193` ·
`const SWEELINCK_DIALOGUE_VARIANTS = [@27231` · `const DEACON_CODE_TEXT =@27548` ·
`function _lubeckFriends() { return Object.values(S_story.npcFavorability || {}).filter(v => v >= 1).length; }@23461`.

Cross-references: `lab-report-birka-beginner-arc.md` (§DOC-02d — the six Birka NPCs' quests and the same
naming defect at one character) · `lab-report-endings-and-echoes.md` (`SWEELINCK_DIALOGUE_VARIANTS`'
own home) · `docs/story/story-arc-npc-dialogues.md` (the maintained home doc) · `story.md` FL8
Milepoint B (the implemented bit list).

---

## X. Conclusion

This document got the architecture right and the world wrong, and it is worth being precise about which
half is which. The schema it drew — one sentence of theory, one named enemy, one mission bit, four pools
keyed by trust — absorbed a 35× expansion without a single change to its shape, and the selector it
specified in nine lines of pseudocode is running unmodified 82 days later. That is as good as a design
document gets.

Everything the document actually *wrote* was replaced. All 120 lines, all six World Truths, four of
seven names. The replacement is better — more concrete, less thesis-shaped, exactly the edit the
document's own §VII argues for — but the document did not survive it, and the only reason its draft is
still legible is that nobody deleted the file.

The thing to fix is neither. §IV promises that the player who does the work with no output gets a
different ending, and the four-way nest that delivers that promise shipped intact and correct. An
unrelated rename in a different subsystem then floored the curse score at 20, and now every player —
including the one who did everything — is told they were the one who couldn't slow down.

> *"It's not a condemnation. It's a pattern. I've seen it seventeen times."*

The engine has now said it to everyone, which was not the design. **§EPIC-01 is a rename; it is also the
difference between this game's thesis and its opposite.**

---

*Original: `lab-report-npc-dialogue-system.md` — Layer 42 design document, 2026-05-22.*
*Verified and rewritten 2026-08-12 (§DOC-02ab).*

---
*© 2026 Paul Richeson — MIT License. See [LICENSE](../LICENSE) for full text.*
