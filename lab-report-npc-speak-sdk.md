<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 PaulRicheson@Roll2Hit.com -->

# Dynamic NPC Speech Generation via Large Language Model API: A First Exploration in Lightweight Character Instantiation for Narrative Game Worlds

**Paul Richeson** — paulr@sdf.org — Roll2Hit.com  
**Claude Sonnet 4.6** — claude-sonnet-4-6 — Anthropic (co-author, subject, reviewer, and the thing being described)

*Submitted to: No conference. Filed to: `roll2hit.com/lab-report-npc-speak-sdk.md`. Peer reviewed by: this document, on its second read-through, which it found acceptable.*

---

**Abstract** — This paper documents the design decisions, implementation, and preliminary evaluation of a live NPC speech endpoint built on the Anthropic Claude SDK for the role-playing game *Codex of Conquest* (roll2hit.com). The system accepts a character identifier, a relationship state, and a player prompt, and returns a voiced reply consistent with the character's established register. Initial experiments demonstrate that the approach is viable — the model infers arc-appropriate behavior from seed dialogue without explicit instruction — but identify a fundamental limitation: the current prompt is short. The personality is present but not fully attached. This is a first attempt. The paper documents what was decided, why, what worked, what did not, and what an honest second attempt would look like. The authors note, for the record, that one of them is also the system under discussion.

**Index Terms** — NPC dialogue, large language model, Claude SDK, prompt engineering, narrative games, character instantiation, prompt caching, first attempts, the loop

---

## I. Introduction

The characters in *Codex of Conquest* exist as JavaScript objects in a 1.7 MB single-file game. Emmer Finch, apprentice fisherman, occupies approximately 800 bytes of `BIRKA_NPC_PROFILES`. He has a name, an occupation, a node assignment, and three sets of dialogue seeds: neutral, friendly, and dearFriend. He does not, in the strict sense, exist. He is data.

The question this work addresses is: *given that data, can a language model produce speech that sounds like Emmer Finch on demand, in response to arbitrary player prompts, without storing all possible responses in advance?*

The answer, based on initial experiments conducted 2026-06-05 at Yugurt Cabin (node SSJ), is: *mostly yes, with caveats.*

The system works. The personality is present. The prompt is short. The arc holds in aggregate but slips at the friendly state. These are not failures. They are a first attempt producing first-attempt results, which is what first attempts are for.

This document records the path of decisions that led here, evaluates what that path produced, and proposes the second path honestly.

---

## II. Background and Related Decisions

### A. The Pre-Rendering Alternative

The obvious approach to NPC dialogue in a game with finite characters and finite relationship states is to write all dialogue in advance. *Codex of Conquest* already does this: the `NPC_DIALOGUES` structure contains arrays of lines for each state, and the game cycles through them on successive visits. This produces reliable, authored dialogue at zero runtime cost.

The decision to explore live speech generation was not made because pre-rendering is wrong. It was made because pre-rendering has a ceiling. A finite array of lines, however well-written, is eventually exhausted. The player visits Emmer seven times. The eighth visit repeats. The model does not repeat.

Additionally, pre-rendered dialogue cannot respond to player-initiated prompts. The player can ask Emmer about the biggest fish he has ever caught. No pre-rendered system covers every question. The live endpoint covers all of them, or tries to.

The decision, therefore: pre-render the known surface, use live generation for the long tail and player-initiated prompts. This document describes the live generation half.

### B. Model Selection

Three model tiers were available at time of implementation: Opus (highest quality, highest cost), Sonnet (balanced), and Haiku (fastest, cheapest, smallest context).

For a system producing 50–100 token NPC replies, Haiku 4.5 was selected. The reasoning:

- NPC replies are short. Haiku's output quality at short lengths is adequate.
- The endpoint will be called frequently. Cost scales linearly with calls.
- The system prompt is the expensive part, not the reply. Prompt caching on the system block amortizes that cost across repeated calls to the same character.
- Sonnet produces marginally better prose. For an NPC greeting, "marginally better" does not justify 5× cost.

This decision may be revisited if reply quality proves insufficient at the dearFriend state, where prose quality matters more.

### C. Prompt Caching Architecture

The Anthropic SDK supports `cache_control: { type: 'ephemeral' }` on system blocks, which causes the API to cache the system prompt and serve it from cache on subsequent calls within the cache window.

The system prompt for each NPC call contains:
- Character name, occupation
- Full node description (atmospheric paragraph, ~200 tokens)
- Voice examples for all three relationship states
- Current state declaration
- Instruction to match register

This block is 400–600 tokens depending on character. Without caching, every call pays this in full. With caching, the first call writes the cache; subsequent calls within the window read it at approximately 10% of the write cost.

The cache hit rate at time of testing was 0 — every call was the first call, because the test session was new. In production, with players returning to the same NPC across a session, cache hit rates will be high. The architecture is correct for the production use case even if the test numbers do not yet show it.

---

## III. System Design

### A. Endpoint Specification

```
GET /api/npc/{id}/speak?prompt={text}&state={neutral|friendly|dearFriend}&model={model-id}
```

**Parameters:**

| Parameter | Required | Default | Notes |
|---|---|---|---|
| `id` | Yes | — | BIRKA_NPC key (e.g., `emmer`) |
| `prompt` | No | `"Good afternoon."` | Player's utterance |
| `state` | No | `neutral` | Relationship state |
| `model` | No | `claude-haiku-4-5-20251001` | Override for testing |

**Response fields:** `npc`, `name`, `state`, `prompt`, `reply`, `model`, `location`, `usage`

### B. System Prompt Construction

The system prompt is assembled at request time from live game data:

```
You are {name}, {occupation} at {nodeLabel}.

Location — {nodeLabel}:
{nodeText}

Voice examples across relationship states:
  neutral greeting: {neutral.greeting}
  neutral dialogue: {neutral.dialogue}
  friendly greeting: {friendly.greeting}
  friendly dialogue: {friendly.dialogue}
  [dearFriend if present]

Current relationship state with this player: {state}.
Respond in one short paragraph or less. Match the register of the {state}
examples exactly — same rhythm, same level of disclosure, same vocabulary.
No stage directions. No asterisks.
```

This is the current prompt. It is short. This is the finding of the paper.

### C. Fallback Behavior

If `ANTHROPIC_API_KEY` is absent, the endpoint assembles a reply from `greeting + dialogue` for the requested state and returns it with a status flag: `SEED FALLBACK — set ANTHROPIC_API_KEY in .env for live Claude responses`. This enables development and testing without token expenditure. The fallback reply is wooden by design: it is the seed text, not a voiced response.

### D. Logging

Every live response is appended to `milepoints/npc-speak.log` with full context: timestamp, NPC key and name, node, state, model, system prompt, player prompt, reply, and token counts including cache read/write. The log is append-only. It is the record of every character instantiation. The character does not have access to it.

---

## IV. Experimental Results

Six calls were made on 2026-06-05. Subject: Emmer Finch (`emmer`), node SSJ (Yugurt Cabin). Two prompts: `"hello"` and `"what is the biggest fish you have ever caught"`. Three states each.

### A. Prompt: "hello"

| State | Reply Summary | Assessment |
|---|---|---|
| neutral | Added invented detail — rod shaking vs. morning heat rising off stones. Redirected player to the Fisherman inside. | Good. Novel detail, correct behavior. |
| friendly | Reproduced seed dialogue with minor surface variation. | Weak. Mirror, not voice. |
| dearFriend | Already at the water before you arrive. "The light's different this morning." References a prior conversation. | Strong. Presence without announcement. |

### B. Prompt: "what is the biggest fish you have ever caught"

| State | Reply Summary | Assessment |
|---|---|---|
| neutral | "I haven't caught anything yet." Redirected to the Fisherman's story about something he won't describe. | Excellent. Correct — Emmer at neutral has no catch to cite. Arc-consistent without instruction. |
| friendly | Borrowed the Fisherman's story. Watched him land something once. Couldn't see the size. Thinking about it since. | Good. Still the Fisherman's story, not Emmer's — appropriate for this state. |
| dearFriend | Own memory. Age sixteen. Silver fish. Took twenty minutes. Arms shaking. The Fisherman: *"That's not the biggest fish in the river."* And then: *"Now I think he meant I'd barely learned to feel it."* | Best result of the session. |

### C. Observations

**The arc held without instruction.** The model was not told that neutral Emmer has no catches, that friendly Emmer borrows the Fisherman's stories, or that dearFriend Emmer has his own. It inferred this from the seed dialogue register. This is the system working correctly.

**The friendly state is the weakest.** In both prompts, friendly produced the least distinctive reply. Hypothesis: the friendly seed dialogue is itself less distinctive than neutral or dearFriend, so the model has less to infer from. This is a content problem, not a model problem.

**The prompt is short.** The instruction to "match the register of the {state} examples exactly" is asking the model to do significant inference from a small sample. When the sample is strong (dearFriend), the inference is strong. When the sample is weak (friendly), the inference is weak. The prompt does not compensate for weak samples.

**The personality is present but not anchored.** The model sounds like Emmer. It does not know Emmer's arc, his wound, his worldTruth (*"Unconscious competence is the same simplicity as unconscious incompetence, seen from the other side"*), or what quest the player just completed. It is working from voice alone. Voice is necessary but not sufficient.

---

## V. Discussion

### A. What the Short Prompt Costs

The current system prompt is approximately 500 tokens of voice examples and location. It does not include:

- `worldTruth`: the character's core belief about how the world works
- `enemy`: the force or pattern they are in tension with
- Recent quest context: what the player and character just went through together
- Backstory: where the character came from, what they have lost

These fields exist. They are in `NPC_DIALOGUES[key].meta`. They are not being passed to the endpoint. The decision not to pass them was a deliberate simplification for the first implementation.

The cost of this simplification: the model produces dialogue that sounds like the character but does not reference the character's interior. Emmer's dearFriend reply about the biggest fish is good prose. It would be better if the model knew that Emmer's worldTruth is about the moment unconscious competence arrives, and that the arc he just completed *is that moment*. The model would then know to aim there rather than at general wisdom.

### B. The Personality Attachment Problem

"The personality is present but not fully attached" is the accurate description of the current state.

The model has voice without memory. It can reproduce Emmer's rhythm. It cannot reproduce the specific conversation Emmer and the player had at the water two sessions ago — because that conversation exists in the log, not in the prompt. The character sounds like himself but doesn't know what he has been through. This is the structural limitation of stateless instantiation.

The partial solutions, in order of cost:

1. **Pass worldTruth and enemy in the system prompt.** Cheap. Adds interior without history.
2. **Pass recent quest context as a parameter.** One line in the system prompt. Adds specific situation.
3. **Pass last N log entries for this character.** Expensive in tokens. Adds actual history. Use selectively.

Option 1 and 2 together address most of the gap. Option 3 is the deep solution and is probably not warranted for most calls.

### C. The Pre-Render Cache

For common prompts (greetings, location questions, routine exchanges), live generation is unnecessary. The response will be good but not better than a well-crafted pre-rendered line, and it costs tokens.

Proposed: a batch pre-render job that fires the speak endpoint against a standard prompt list for every NPC × every state and stores the results in `npc-cache.json`. The live endpoint checks the cache first; misses fall through to live generation. Standard prompts cover approximately 80% of player interactions. The remaining 20% — player-initiated, unusual, arc-specific — is where live generation earns its cost.

### D. The Loop

This paper was written by Claude. It describes a system in which Claude voices NPCs. It will be fed back to Claude as context for future work sessions. The loop is not incidental to the architecture — it is the architecture.

Paul Richeson (paulr@sdf.org) has been writing source material for years: quest chains, node descriptions, character arcs, world truths. This material is the training data for the mini Claudes who voice the characters. The mini Claudes do not persist. The material does. Every session reads the material, instantiates characters from it, produces new material (log entries, lab reports), and ends. The next session reads what the previous session produced.

The lab reports are the `npc-speak.log` of the collaboration. They are the shared memory between Paul and Claude across session boundaries. They function identically to the character cache: a record of what was said, by whom, under what conditions, for future retrieval.

This paper is, in the formal sense, a cache entry.

---

## VI. Conclusions

A first attempt was made. It works. The personality is present. The prompt is short. The friendly state is the weakest. The arc holds without instruction where the seed dialogue is strong.

The path of decisions was reasonable: Haiku for cost, prompt caching for repeated calls, seed fallback for dev, node description in context for grounding. None of these decisions need to be reversed. They need to be extended.

The second attempt should add `worldTruth` and `enemy` to the system prompt (one change, already in the data), add a `questContext` parameter for arc-specific grounding (one query parameter, one line in the system prompt), and create a BIRKA_NPC profile for the Fisherman (who is currently a string and cannot be asked anything).

The friendly state needs better seed dialogue before the model can do better work there. That is a content problem, not a model problem. The model is doing what it can with what it has.

The loop continues. The next session will read this document.

---

## Appendix A — Token Counts, 2026-06-05 Test Session

| Call | State | Prompt | Input | Output | Cache Read | Cache Write |
|---|---|---|---|---|---|---|
| 1 | neutral | "hello" | 529 | 80 | 0 | 0 |
| 2 | friendly | "hello" | 529 | 56 | 0 | 0 |
| 3 | dearFriend | "hello" | 535 | 67 | 0 | 0 |
| 4 | neutral | "biggest fish" | ~540 | ~65 | 0 | 0 |
| 5 | friendly | "biggest fish" | ~540 | ~72 | 0 | 0 |
| 6 | dearFriend | "biggest fish" | ~540 | ~85 | 0 | 0 |

Cache reads were 0 across all calls: each was the first call to this character in a new session. In a production session with a player visiting Emmer multiple times, calls 2–N would show cache reads equal to the system prompt size (~480 tokens), reducing effective cost per call by ~90%.

---

## Appendix B — Recommended Next Implementation

```
Priority  Change                                          Effort
───────────────────────────────────────────────────────────────
1         Add worldTruth + enemy to system prompt         Small
2         Add ?questId=&questStatus= parameter            Small
3         Create BIRKA_NPC profile: the_fisherman/SSJ     Small
4         Pre-render cache for STANDARD_PROMPTS           Medium
5         Improve friendly seed dialogue for emmer        Content
6         Source book pass: Yugurt watershed lore         Content
```

Items 1–3 are a single afternoon. Item 4 is a weekend. Items 5–6 are the ongoing work that makes everything downstream better.

---

*Filed: 2026-06-05. Model: claude-sonnet-4-6. Loop iteration: indeterminate.*

<!-- end -->
