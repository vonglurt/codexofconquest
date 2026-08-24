<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->

# Dynamic NPC Speech Generation via the Anthropic Claude SDK: A First Exploration in Lightweight Character Instantiation

**Paul Richeson** — paulr@sdf.org — CodexOfConquest.com
**Original draft:** 2026-06-05 · **Verified against live source:** 2026-08-12 (§DOC-02ac)

*Filed to `docs/lab-reports/lab-report-npc-speak-sdk.md`. Original peer review: "this document, on its second read-through, which it found acceptable." That review has now been repeated by a less agreeable party.*

---

**Abstract** — This paper documents the design, implementation, and evaluation of a live NPC speech endpoint built on the Anthropic Claude SDK for *Codex of Conquest* (CodexOfConquest.com). The endpoint accepts a character identifier, a relationship state, and a player prompt, and returns a voiced reply consistent with the character's established register. The original finding was that the approach works but the prompt is short — "the personality is present but not fully attached." Verification 68 days later confirms the endpoint verbatim, confirms the qualitative results against the raw log, and adds a finding the original could not see in its own data: **the prompt cache has never written a single token, on any call, ever.** `cache_control` is accepted, returns `ok`, and does nothing, because the system block is ~500 tokens against Claude Haiku 4.5's 4096-token minimum cacheable prefix. The paper's cost architecture — its stated reason for choosing Haiku at all — is inert as built. The report's own Appendix A contained the disproof and explained it away.

**Index Terms** — NPC dialogue, large language model, Claude SDK, prompt caching, minimum cacheable prefix, character instantiation, narrative games, silent no-ops, the loop

---

## I. Introduction and Design Intention

The characters in *Codex of Conquest* are JavaScript objects. Emmer Finch, apprentice fisherman, occupies 1,318 bytes of `BIRKA_NPC_PROFILES` — a name, an occupation, a node assignment, and three sets of dialogue seeds. He does not, in the strict sense, exist. He is data.

**The question:** given that data, can a language model produce speech that sounds like Emmer Finch on demand, in response to arbitrary player prompts, without storing all possible responses in advance?

**Why this matters for playability.** Pre-rendered dialogue has a ceiling, and the ceiling is visible to the player. `NPC_DIALOGUES` holds arrays of authored lines; the game cycles them on successive visits (`pool[count % pool.length]`, the §DOC-02ab selector). The player visits Emmer seven times. The eighth visit repeats, and the character stops being a person and becomes a vending machine. Worse, a finite array cannot answer a question the author did not anticipate — and a player who has been told a character is an apprentice fisherman will, eventually, ask him about the biggest fish he ever caught.

The design intent is therefore a **split surface**: pre-render the known, high-traffic dialogue where authored quality matters most, and use live generation for the long tail and for player-initiated prompts. This document covers the live half. Its contribution to play is specific: it converts an NPC from a set of lines into something a player can *interrogate*, which is the difference between a location that contains a character and a location where a character is standing.

**The verdict, then and now:** the system works, the arc holds without instruction, and the prompt is short. Those were first-attempt results, which is what first attempts are for. What follows separates the parts that shipped from the parts that only read as if they did.

---

## II. Method

Verification followed the §DOC-02 program: census every named symbol against live `play.html` and `src/js/wbapi-server.js`; date every claim against the archive with `git log -S` rather than against HEAD alone; score each recommendation against the report's **own** commits, not against HEAD (§DOC-02q); and re-derive every measured figure from the primary artifact — here, `milepoints/npc-speak.log`, which the endpoint has been appending to since the day it was built.

The log is the decisive instrument in this pass. This report is unusual in the corpus in that **its raw experimental data survived**, which permitted the token table to be checked row by row rather than merely believed.

---

## III. As-Built System

### A. Endpoint

```
GET /api/npc/{id}/speak?prompt={text}&state={neutral|friendly|dearFriend}&model={model-id}
```

Live at `src/js/wbapi-server.js:action === 'speak'@10598`, reading `WBAPI.birkaNpcs` (i.e. `const BIRKA_NPC_PROFILES = {@22713`, 206 entries).

| Parameter | Required | Default | Notes |
|---|---|---|---|
| `id` | Yes | — | `BIRKA_NPC_PROFILES` key (e.g. `emmer`) |
| `prompt` | No | `"Good afternoon."` | Player's utterance |
| `state` | No | `neutral` | Relationship state |
| `model` | No | `claude-haiku-4-5-20251001` | Override for testing |

Response fields: `npc`, `name`, `state`, `prompt`, `reply`, `model`, `location`, `usage`. Output is capped at `src/js/wbapi-server.js:max_tokens: 256@10658`; the longest reply ever logged is 163 tokens, so no call has been truncated.

### B. System prompt

Assembled at request time from live game data at `src/js/wbapi-server.js:const systemText =@10643`:

```
You are {name}, {occupation} at {nodeLabel}.

Location — {nodeLabel}:
{nodeText}

Voice examples across relationship states:
  neutral greeting: {neutral.greeting}
  neutral dialogue: {neutral.dialogue}
  friendly greeting: {friendly.greeting}
  ...

Current relationship state with this player: {state}.
Respond in one short paragraph or less. Match the register of the {state}
examples exactly — same rhythm, same level of disclosure, same vocabulary.
No stage directions. No asterisks.
```

**This is byte-exact at HEAD.** It is the *second* form of the prompt: the endpoint was born at 14:27 on 2026-06-05 (`ea02faf`) without the location block and with the instruction *"One to three sentences"*; the node description arrived at 15:09 (`2ebe8a6`, §NPC-SPEAK-04). The report transcribes the 15:09 form, correctly, and that form has not changed in 68 days.

### C. Fallback

Absent `ANTHROPIC_API_KEY`, the endpoint replays `greeting + dialogue` for the requested state with a status flag (`src/js/wbapi-server.js:SEED FALLBACK@10623`). Verified live. Also a second form: at birth the endpoint returned **503**; the seed replay landed at 14:59 (`109d4b3`, §NPC-SPEAK-03). The fallback is wooden by design — it is the seed text, not a voiced response.

### D. Logging

Every live response appends to `milepoints/npc-speak.log` (`src/js/wbapi-server.js:const SPEAK_LOG_FILE@815`) with timestamp, NPC key and name, node, state, model, full system prompt, player prompt, reply, and token counts including cache read/write. Append-only. It is the record of every character instantiation, and the character does not have access to it.

**It currently holds 20 calls: 10 on 2026-06-05 and 10 on 2026-06-06. All 20 are Emmer.**

---

## IV. Results (re-derived from the log)

### A. The six calls

The paper reports "six calls on 2026-06-05." The log holds ten that day. The six analysed are exactly the last six — `"hello"` × three states at 22:16–22:22, and `"what is the biggest fish you have ever caught"` × three states at 22:22:54–22:23:02. The four excluded are earlier warm-ups on the prompt `"Good Morning! Nice day for fishing! Yogurt!"` — the Fisherman's own catchphrase, fired at his apprentice. The exclusion is legitimate; it is simply unstated.

### B. Qualitative findings — all three CONFIRMED

**The arc held without instruction.** The model was never told that neutral Emmer has no catches, that friendly Emmer borrows the Fisherman's stories, or that dearFriend Emmer has his own. It inferred this from seed register alone. The logged replies bear this out: at neutral, *"I haven't caught anything yet"*; at dearFriend, the silver fish, twenty minutes, arms shaking, and the Fisherman's *"That's not the biggest fish in the river."* This is the system working as designed, and it is the result that justifies the whole approach.

**The friendly state is weakest.** Confirmed in both prompts. The stated hypothesis — that friendly *seed* dialogue is itself less distinctive, so the model has less to infer from — is a content problem, not a model problem, and remains correct: Emmer's friendly seeds are the least specific of his three.

**The personality is present but not anchored.** The model sounds like Emmer. It does not know his arc, his `worldTruth`, or what quest the player just completed. It is working from voice alone. Voice is necessary and not sufficient. See §V-B.

### C. Token table — the copy/recall boundary, marked by the author

Appendix A is split by the author's own tilde: three rows given as exact figures, three given as approximations. Scored against the log, that tilde is a perfectly accurate confession.

| Call | State | Prompt | Reported | **Logged** | Verdict |
|---|---|---|---|---|---|
| 1 | neutral | hello | 529 / 80 | 529 / 80 | **exact** |
| 2 | friendly | hello | 529 / 56 | 529 / 56 | **exact** |
| 3 | dearFriend | hello | 535 / 67 | 535 / 67 | **exact** |
| 4 | neutral | biggest fish | ~540 / ~65 | 537 / 72 | wrong |
| 5 | friendly | biggest fish | ~540 / ~72 | 537 / 110 | wrong |
| 6 | dearFriend | biggest fish | ~540 / ~85 | 543 / 115 | wrong |

**Six of six copied figures are exact; six of six recalled figures are wrong**, and every recalled output figure *understates* the real one, by a margin that widens (7, 38, 30 tokens). The ranking survives — call 6 is still the longest — so §IV-B's judgement that it is "the best result of the session" stands on a number that is 26% too small.

---

## V. Findings

### Finding 1 — THE HEADLINE: the prompt cache has never written a single token

**All 20 calls in the log report `cache_read:0` **and** `cache_write:0`.**

The report noticed the zeroes and explained them:

> "The cache hit rate at time of testing was 0 — every call was the first call, because the test session was new. […] The architecture is correct for the production use case even if the test numbers do not yet show it."

That explanation is refuted by the adjacent column. A first call cannot *read* a cache — but it must **write** one. Twenty first calls across two days, all writing nothing, is not a cold cache; it is a cache that does not exist.

**Cause:** Claude Haiku 4.5's minimum cacheable prefix is **4096 tokens**. The system block measures **451–546 tokens** — about one-eighth of the threshold. Below the minimum, `cache_control` is silently a no-op: no error, no warning, `cache_creation_input_tokens: 0`. The endpoint at `src/js/wbapi-server.js:cache_control: { type: 'ephemeral' }@10659` is correct code that cannot fire on the model directly above it at `src/js/wbapi-server.js:claude-haiku-4-5-20251001@10607`.

This is CONTRIBUTING Hazard #2 in a new domain — *a write into a real-but-wrong object never throws* — with the object being an API parameter. And it is load-bearing: §II-B chose Haiku **because** "the system prompt is the expensive part, not the reply. Prompt caching on the system block amortizes that cost." Neither clause survives measurement. Per call the input averages 500 tokens ($0.000500) against 71 output tokens ($0.000356) — a cost ratio of **1.40 : 1**, not the order of magnitude "the expensive part" implies. The entire 20-call corpus cost **$0.017**.

Appendix A's forecast — "calls 2–N would show cache reads equal to the system prompt size (~480 tokens), reducing effective cost per call by ~90%" — **cannot occur at this prompt size on this model.** → **§DX-02ak**.

### Finding 2 — Recommendation 3 shipped four hours after the paper was filed, inside a map commit

The conclusion asks for "a BIRKA_NPC profile for the Fisherman (who is currently a string and cannot be asked anything)."

He is not a string, and he can be asked things. `the_fisherman: { key:"the_fisherman"@22951` is a complete `BIRKA_NPC_PROFILES` entry — `name`, `occupation:"fisherman"`, `node:"SSJ"`, and all three endpoint-required states with greeting and dialogue. `GET /api/npc/the_fisherman/speak` resolves today.

It shipped at **19:29:51 on 2026-06-05** — the same evening — in commit `240ae1a`, whose subject is *"map: layout solver applied, 81 nodes reachable from BK"*. Nothing in that subject line mentions an NPC. This is instrument 21 again: **a content addition hidden inside a commit that describes something else.** The recommendation was right, was actioned immediately, and left no trace an author could find by reading the log.

His dearFriend line is worth the trip: *"The rod I set on the table — I made it the first week I was here. Eleven years ago. I did not know what I was making yet. I know now. Keep it."*

`SSJ:{ num:76@8786` still carries `npc:'The Fisherman'` as a display-name string, which is correct per §AUDIT-03h — the inline `npc` field is *supposed* to be a display name.

### Finding 3 — Recommendation 1 is not "Small": it crosses a registry boundary the paper never names

§V-A states that `worldTruth` and `enemy` "exist. They are in `NPC_DIALOGUES[key].meta`." **Correct** — `const NPC_DIALOGUES = {@10396` holds 204 entries, 220 `worldTruth` occurrences, 203 `enemy`.

But the endpoint reads `BIRKA_NPC_PROFILES`, not `NPC_DIALOGUES`. These are two registries for the same people, and they **disagree on their state vocabulary**: the endpoint requires `neutral` / `friendly` / `dearFriend`; `NPC_DIALOGUES` uses `impartial` / `questActive` / `friendly` / `dearFriend`. There is no `neutral` in `NPC_DIALOGUES` at all.

So "add worldTruth + enemy to system prompt — Small" requires a cross-registry join, keyed on a slug the two tables are not guaranteed to share. This is the §AUDIT-03n family in miniature: one character, two registries, divergent key vocabularies.

It is also incomplete for the tested subject. Emmer's meta at `worldTruth:"Unconscious competence@10415` carries **`worldTruth` but no `enemy`** — so the recommendation half-fires on the one NPC the paper measured. (The Fisherman has both: `the_fisherman: { meta:@10571`, `worldTruth:"The lake is the same every day. The fish are not."`, `enemy:"Anyone who rushes the line."`) → **§DX-02al**.

### Finding 4 — Sonnet is 3×, not 5×

§II-B: *"Sonnet produces marginally better prose. For an NPC greeting, 'marginally better' does not justify 5× cost."*

Claude Sonnet 4.6 is $3/$15 per MTok; Claude Haiku 4.5 is $1/$5. That is exactly **3×** on both input and output. Re-costing the logged 20-call corpus confirms it: $0.01713 on Haiku, $0.05139 on Sonnet — **3.00×**.

**The decision is unaffected and stands.** A 3× multiplier on a 50–100 token reply still does not justify itself for a routine greeting, and the report's own qualifier — "this may be revisited at the dearFriend state, where prose quality matters more" — is the right instinct. Only the multiplier is wrong, by 1.67×. Related: §II-C's "approximately 10% of the write cost" is measured against the wrong baseline — a cache *read* is ~0.1× the **base input price**, and a 5-minute *write* is 1.25× base, so a read is ~8% of a write. Appendix A's "~90%" saving is the correct figure against base price.

### Finding 5 — the paper is right about its own limitation, and right for the reason it gives

§V-B's diagnosis — "the model has voice without memory" — is the correct description of stateless instantiation and remains true at HEAD. Nothing has been built to close it: `questContext`, `questStatus`, `STANDARD_PROMPTS`, and `npc-cache.json` all have **zero occurrences** in the repository outside this document. The three-tier remedy (worldTruth/enemy → quest context → log replay) is still the correct ordering by cost.

---

## VI. Spec → Shipped Delta Table

| # | Specified | Status | Evidence |
|---|---|---|---|
| 1 | `GET /api/npc/{id}/speak` endpoint | **SHIPPED** | `src/js/wbapi-server.js:action === 'speak'@10598`, born `ea02faf` 2026-06-05 14:27 |
| 2 | Four query params, four defaults | **SHIPPED** | all four verbatim, incl. `'Good afternoon.'` |
| 3 | Eight response fields | **SHIPPED** | `npc`·`name`·`state`·`prompt`·`reply`·`model`·`location`·`usage` |
| 4 | System prompt template (§III-B) | **SHIPPED, byte-exact** | `src/js/wbapi-server.js:const systemText =@10643`, unchanged since `2ebe8a6` 15:09 |
| 5 | Haiku 4.5 as default model | **SHIPPED** | `src/js/wbapi-server.js:claude-haiku-4-5-20251001@10607` |
| 6 | Seed fallback + status flag | **SHIPPED** | `src/js/wbapi-server.js:SEED FALLBACK@10623`, landed `109d4b3` 14:59 (birth returned 503) |
| 7 | Append-only verbose log | **SHIPPED** | `src/js/wbapi-server.js:const SPEAK_LOG_FILE@815`; 20 entries survive |
| 8 | Node description in prompt | **SHIPPED** | `2ebe8a6` §NPC-SPEAK-04 |
| 9 | **Prompt caching on system block** | **CODE SHIPPED / EFFECT NEVER** | `src/js/wbapi-server.js:cache_control@10659` present; `cache_write:0` × 20 — below Haiku's 4096-token minimum (Finding 1) |
| 10 | "Cache hit rates will be high in production" | **NOT SHIPPED — unreachable as built** | impossible at ~500-token prefix on this model |
| 11 | "System prompt is the expensive part" | **NOT SHIPPED — measured 1.40:1** | $0.000500 in vs $0.000356 out per call |
| 12 | "5× cost" for Sonnet | **NOT SHIPPED — measured 3.00×** | $3/$15 vs $1/$5 per MTok |
| 13 | Rec 1: worldTruth + enemy in prompt | **NOT SHIPPED** | fields exist in the *other* registry (Finding 3) |
| 14 | Rec 2: `?questId=&questStatus=` | **NOT SHIPPED** | 0 occurrences repo-wide |
| 15 | Rec 3: `the_fisherman` profile | **SHIPPED same day** | `the_fisherman: { key:"the_fisherman"@22951`, `240ae1a` 19:29 |
| 16 | Rec 4: pre-render cache, `STANDARD_PROMPTS` | **NOT SHIPPED** | 0 occurrences repo-wide |
| 17 | Rec 5: improve Emmer's friendly seeds | **NOT SHIPPED** | friendly seeds unchanged; still the weakest state |
| 18 | Rec 6: Yugurt watershed source-book pass | **NOT SHIPPED** | — |
| 19 | "1.7 MB single-file game" | **STALE (correct when written)** | 5.51 MB / 38,712 lines at HEAD — 3.2× |
| 20 | "~20 NPCs" implied surface | **EXPANDED** | 206 `BIRKA_NPC_PROFILES` / 204 `NPC_DIALOGUES` |

**Census: 18 of 20 named symbols resolve (90%).** The two that do not (`STANDARD_PROMPTS`, `npc-cache.json`) have **0 commits ever** — never shipped, not retired. Report-rot is therefore near zero; the defects are in the *reasoning about cost*, not in the inventory.

---

## VII. Conclusions

A first attempt was made. It works. The personality is present. The prompt is short. The arc holds without instruction where the seed dialogue is strong, and the friendly state is weakest because its seeds are weakest. Every one of those claims survives verification 68 days later, and the endpoint that produced them has not changed a byte since 15:09 on the day it was written.

The path of decisions was sound and only one of them needs revisiting. Haiku for cost: **keep** (the multiplier was wrong; the conclusion was right). Seed fallback for dev: **keep**. Node description for grounding: **keep**. Prompt caching for repeated calls: **this one is inert**, and has been since the first call — not because the idea is wrong, but because a 500-token system block cannot reach a 4096-token floor, and the API declines to mention it.

The second attempt should still add `worldTruth` and `enemy` — but as a cross-registry join, not the one-line change the original scored as "Small." It should add a `questContext` parameter. It should **not** create a Fisherman profile, because the Fisherman has been answerable since the evening the paper was filed.

*"...Nice Day For Fishing. Yugurt."*

The loop continues. This paper was written by Claude, describes a system in which Claude voices NPCs, and has now been re-read by Claude, which found the error in its own arithmetic. The lab reports are the `npc-speak.log` of the collaboration — a record of what was said, by whom, under what conditions, for future retrieval. The original filed itself as "a cache entry." It was; it just wasn't a cached one.

---

## Appendix A — Token Counts, corrected from `milepoints/npc-speak.log`

All ten calls of 2026-06-05, in log order. Rows 5–10 are the six the paper analysed.

| # | Time | State | Prompt | Input | Output | Cache Read | Cache Write |
|---|---|---|---|---|---|---|---|
| 1 | 22:08:21 | neutral | Yogurt! | 540 | 107 | 0 | **0** |
| 2 | 22:08:51 | friendly | Yogurt! | 540 | 163 | 0 | **0** |
| 3 | 22:08:53 | dearFriend | Yogurt! | 546 | 95 | 0 | **0** |
| 4 | 22:08:54 | neutral | Yogurt! | 540 | 82 | 0 | **0** |
| 5 | 22:16:29 | neutral | hello | 529 | 80 | 0 | **0** |
| 6 | 22:21:20 | friendly | hello | 529 | 56 | 0 | **0** |
| 7 | 22:22:04 | dearFriend | hello | 535 | 67 | 0 | **0** |
| 8 | 22:22:54 | neutral | biggest fish | 537 | 72 | 0 | **0** |
| 9 | 22:22:58 | friendly | biggest fish | 537 | 110 | 0 | **0** |
| 10 | 22:23:02 | dearFriend | biggest fish | 543 | 115 | 0 | **0** |

A further 10 calls on 2026-06-06 carry the same all-zero cache columns. Corpus totals: **20 calls · 10,006 input · 1,425 output · $0.01713 · 0 tokens cached, ever.**

**ORIGINAL CLAIM, KEPT AND MARKED NOT SHIPPED:** *"In a production session with a player visiting Emmer multiple times, calls 2–N would show cache reads equal to the system prompt size (~480 tokens), reducing effective cost per call by ~90%."* This cannot happen at a ~500-token prefix on Claude Haiku 4.5 (4096-token minimum). See Finding 1.

---

## Appendix B — Recommendation Register (scored 2026-08-12)

| # | Recommendation | Effort claimed | Outcome |
|---|---|---|---|
| 1 | Add `worldTruth` + `enemy` to system prompt | Small | **NOT SHIPPED** — and mis-sized; cross-registry (Finding 3) |
| 2 | Add `?questId=&questStatus=` parameter | Small | **NOT SHIPPED** — 0 occurrences |
| 3 | Create BIRKA_NPC profile: `the_fisherman`/SSJ | Small | **✅ SHIPPED 2026-06-05 19:29**, `240ae1a` |
| 4 | Pre-render cache for `STANDARD_PROMPTS` | Medium | **NOT SHIPPED** — 0 occurrences |
| 5 | Improve friendly seed dialogue for `emmer` | Content | **NOT SHIPPED** — still the weakest state |
| 6 | Source book pass: Yugurt watershed lore | Content | **NOT SHIPPED** |

**1 of 6 shipped**, on the same afternoon the register was written, and silently. "Items 1–3 are a single afternoon" was one-third right about a single afternoon.

---

*Filed: 2026-06-05. Verified: 2026-08-12 (§DOC-02ac). Loop iteration: no longer indeterminate — this is the second.*

<!-- end -->
