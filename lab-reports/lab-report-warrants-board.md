<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com -->
# Lab Report — §BOARD-01 *The Warrant's Board*: rumor/bounty discovery

**Parent seed:** `potential.md` §POT-H1 (prompts 11 · 31 · 35) · **Track:** BACKLOG.md §BOARD-01 · **Policy:** Host/Script Separation + Free-Movement/Mission-Gating (CONTRIBUTING.md)
**Date:** 2026-07-21 · **Class:** design review before implementation (IEEE-format spec — locks data shapes + flow before any HTML edit) · **Measured against:** `roll2hit-v3.html` @ `43bd09c` (`ENGINE_VER = r2h-3.104.0`, 37,271 lines)
**Status:** LOCKED — design call made (bounty-eligible = mission-type allowlist; main-line stays organic). Increments A/B build directly against §5–§7 below.

> **What this report is.** The §BOARD-01-0 gate: it fixes the field shapes, the candidate predicate, the rotation seed, and the acceptance flow so §BOARD-01-A/B are pure mechanical transliteration of §7. Every line number and count was grepped from the live file this session, not recalled (`project_data01_reverted`: **grep before building**).

## 1. The say/do gap (verified in code)

The world **narrates a rumor economy and models none of it.** Three grepped proofs:

1. **The start node describes a board that does not exist.** `NODE_MAP.LHR.text` (`8257`): *"Notices flutter on the board by the fountain."* There is no board surface anywhere in 37,271 lines (`grep -i "notice board|job board|bounty board"` → 0 UI).
2. **The world already runs a bounty-issuing body.** The **Crimson Warrant** appears 10+ times (`8513`, `11071`, `13191`, `26105`, `26113`, `31495`, …), and `VOID_TIDE_EVENTS` #21 (`21803`) states the exact mechanic in past tense as fiction: *"A Void Walker was spotted north of Visby… The Warrant put a bounty on it. Nobody collected."* `grep -c bounty` → **1**, and it is that flavor line.
3. **Discovery is 100% geographic.** Every one of 2,850 quests reaches the player one way — by walking onto its `activateNode`. `storyCheckQuests` (`29355`) fires on arrival: `if (!S_story.quests[q.id] && q.activateNode === node.code)` (`29360`), evaluates the gate, adds the mission. **Nobody in the world ever tells you where to go.**

Meanwhile the primitive for the alternative is already built and inert:

- **`unlock` — a working, contract-validated opcode with ZERO authors.** Handler (`21778`): `unlock(bit){ (bit.quests||[]).forEach(qid => { S_story.quests = S_story.quests||{}; if (!S_story.quests[qid]) S_story.quests[qid]='active'; }); }`. Contract (`21575`): requires a non-empty `quests`/`npcs` array. `grep -c "kind:'unlock'"` → **0**. It activates a quest **from anywhere** — literally "a rumor points you at a distant node."
- **No §VM-01 dependency.** `unlock` neither branches nor waits, so it runs on today's straight-line `execBits` (`21722`) unchanged. §BOARD-01 is capability-complete right now; the seam is inert only because nothing calls it.
- **An ambient sibling already ships.** `TOWN_CRIER_LINES` (`26046`) + `_getTownCrierLine` (`26149`) deliver *flavor* rumors on rest (`📢 [Town rumor]`, `35125`). They point nowhere and do nothing. The board is their **actionable** layer.

**Theme (matched to `story.md`, sibling of §PLAY-01's Curse of Knowledge):** the engine describes a board it never lets you read, and owns the opcode that would let it. §BOARD-01 connects the two.

## 2. Method — how the integration was derived (measure → reuse → widen, never invent)

The method is the repo's standing discipline, applied end-to-end:

1. **Measure the seam, don't design a new one.** The feature is built entirely from parts already in the file: the dead `unlock` opcode (the verb), the `_mkSection`/`_mkCard` engine (the surface, `32919`/`32932`), `QuestRuntime.canActivate` (the gate check, `21617`), `_questNodes`-style QUEST_DB scanning (the candidate source, `35801`), and the Crimson Warrant + Town-Crier fiction (the register). **Nothing new is invented where something existing can be reused.**
2. **Widen through the grammar, never around it (Host/Script Separation).** Acceptance is not a bespoke `S_story.quests[id]='active'` write — it routes through the VM: `QuestRuntime.execBits([{kind:'unlock',quests:[id]}],{})`. The board is a *consumer of the opcode table*, which is exactly the boundary CONTRIBUTING protects. This is the file's **first live use of `unlock`** — the row's headline payoff is retiring a dead opcode by using it, not by deleting it.
3. **New surfaces go in the data-driven region, prospectively obeying §VM-01-G.** The board is a node-flag-gated `_mkSection` component below the `32918` migration front — modeled on `node.isFishingLake` (`32965`) — **not** a `node.code === 'XX'` special case above it. §VM-01-G's whole warning is that special-case blocks keyed on `node.code` rot silently (`birkaNpcs`'s five dead codes). Building the new thing as data means it never becomes debt to migrate later.
4. **Determinism over `Math.random` (Host/Script Separation + §VM-01-B).** The board's rotating slate is seeded off `S_story.gameDay` + a node-code hash — pure and replayable — so it introduces **no new game-state `Math.random()`** and stays clean when §VM-01-B seeds the client RNG.
5. **Gate *listing*, never *movement* (Free-Movement).** Nothing here touches the mover, entry code, or any road. Verified against the invariant in §6.

## 3. Concepts added (the vocabulary this integration introduces)

Six concepts, each mapped to the existing part it extends:

| # | Concept | What it is | Extends / reuses | New? |
|---|---------|------------|------------------|------|
| C1 | **Remote quest activation as a player verb** | The player accepts a hook and a mission at a *distant* node becomes active | the dead `unlock` opcode (`21778`) — first live consumer | verb was latent; now reachable |
| C2 | **`NODE_MAP[code].board`** | opt-in host flag; a node renders the board | `node.isFishingLake` flag pattern (`32965`) | new **optional** data field |
| C3 | **`QUEST_DB[id].rumor`** | optional one-line in-world hook string | falls back to synthesis from `title`+`activateNode`; `hint` is last resort | new **optional** data field (0 authored today) |
| C4 | **Postable-bounty predicate** | pure read-only query over `QUEST_DB` selecting legal hooks | `_questNodes()` scan (`35801`) + `canActivate` (`21617`) | new pure host function |
| C5 | **Deterministic board rotation** | stable slate per `(node, gameDay)`, refreshes across days | `gameDay % n` rotation already used by the Town Crier (`26151`) | new pure seed helper (FNV-1a) |
| C6 | **The board surface** | `📜 The Warrant's Board` section + per-bounty card + "Take" button | `_mkSection`/`_mkCard` engine (`32919`) | new data-driven render block |

**Not added (deliberately):** no new opcode, no new gate *term*, no new `S_story` execution field, no new `Math.random` site, no movement/entry gate, no jump-travel. The only persistent state a bounty writes is the same `S_story.quests[id]='active'` any arrival writes.

## 4. Design decision — bounty eligibility (the §BOARD-01-0 call, now MADE)

**Question:** which quest `type`s are postable — do main-line/story quests stay organic-discovery-only, or is everything with a satisfied gate postable?

**Live `type` distribution (grepped this session):** the mission types are `side` **131**, `skill_check` **106**, `craft` **12**. `main` = 7, `epic` = 40. **Critically, `QUEST_DB` also stores item/loot descriptor entries** (`potion` 18, `weapon` 9, `shield` 7, `relic` 5, `tome` 3, `trophy` 7, `key_item` 10, `readable` 19, `misc` 26, …) — these are **not** "go do a thing at a node" missions. There are **0** `combat`/`hunt`/`delivery`/`escort`/`dialogue`-typed quests today (the `_flav` map at `33178` is defensive for types that could exist but don't).

**Decision — an ALLOWLIST, not a denylist** (a denylist over 40+ types would leak item descriptors onto the board the first time a new type is added):

```
BOUNTY_TYPES = { 'side', 'skill_check', 'craft',        // the live mission types (249 entries)
                 'combat', 'hunt', 'delivery', 'escort', 'dialogue' }   // 0 today; future-proofed, semantically missions
```

**Excluded on purpose:** `main` (main-line pacing stays organic — the board promises "odd jobs and bounties," not "skip to the finale"), `epic` (activates via modal/defeat, excluded in `storyCheckQuests` too), `misc` (grab-bag — kept off until reviewed), and every item/loot descriptor type. This is the recommended conservative call from BACKLOG §BOARD-01-0; it can widen later without a code change to the predicate shape (just add a type to the set).

**Secondary calls (locked):** default host = **all 38 `sleep:true` nodes** (inns/taverns/rest — where the Town Crier already speaks), overridable per node by `board:true`/`false`; slate size **4**; synthesized rumor may fall back to a generic Warrant line but **never** to `hint` (which states the DC outright — §POT-M2 honesty tension), pending authored `rumor` strings in Inc C.

## 5. Data shapes (locked)

```js
// NODE_MAP entry — new optional field (C2). Absent ⇒ inherits default (sleep ⇒ board).
NODE_MAP.TLL = { …, sleep:true, board:true }      // explicit host
NODE_MAP.XX  = { …, sleep:true, board:false }     // explicit suppression of the default
// host(node) := node.board === true || (node.board !== false && node.sleep === true)

// QUEST_DB entry — new optional field (C3). Absent ⇒ synthesized rumor.
QUEST_DB.quest_x = { …, type:'side', activateNode:'VS', rumor:"The Warrant wants the Fence Quarter ledger read before the fence does." }

// The bounty view object the selector returns (transient, never persisted):
{ id, title, destCode, destShort, rumor, rewardStr }
```

## 6. Invariant compliance (each checked against CONTRIBUTING.md)

- **Free-Movement / Mission-Gating.** The board gates *listing* only. Accepting pre-adds a mission; the destination was always reachable and stays reachable. No quest/flag/bit refuses a step. The board touches no mover/entry/road code. ✔
- **No jump travel, ever.** Accepting **does not move the player**. It marks the destination (already `❗` via `_mapIcon` `35811`, because it is a quest node) and posts the listing; the player walks there. `checkpointNode` respawn remains the only warp. ✔
- **`unlock` never pre-activates out of sequence.** The raw handler skips `canActivate`; the **predicate** (§7) calls `QuestRuntime.canActivate(id)` so only gate-satisfied quests are postable. Arrival stays safe regardless — `storyCheckQuests`'s `!S_story.quests[q.id]` guard (`29360`) means a pre-accepted quest is never double-added, and its arrival narrative still fires. ✔
- **No new game-state `Math.random`.** Rotation is a pure hash of `(code, gameDay)`. ✔
- **Host/Script Separation.** Acceptance runs through `execBits`/`unlock`, not a private state write. No new single-use term, no `_legacy_fn`, no control flow in a leaf handler. ✔
- **DUEL:CORE untouched.** The board is render + a top-level accept fn; it does not enter the fenced kernels (`MOVER`/`ROOMS`/`DUEL`). Asserted by git-diff in the gate. ✔

## 7. Implementation surface (exact anchors — A/B are transliteration of this)

**Two top-level functions** (placed beside `_questNodes` at `35801`, so they are testable and built once, not per-render):

```js
const BOUNTY_TYPES = new Set(['side','skill_check','craft','combat','hunt','delivery','escort','dialogue']);

function _boardHost(node){ return node && (node.board === true || (node.board !== false && node.sleep === true)); }

function _boardSeed(code, day){                       // FNV-1a — pure, replayable (no Math.random)
  let h = 2166136261 >>> 0; const s = code + '|' + day;
  for (let i=0;i<s.length;i++){ h ^= s.charCodeAt(i); h = Math.imul(h,16777619) >>> 0; }
  return h >>> 0;
}
function _rewardStr(q){                                // scan bits + array onComplete for a reward bit
  const bits = [...(q.bits||[]), ...(Array.isArray(q.onComplete)?q.onComplete:[])];
  const r = bits.find(b => b.kind === 'reward'); if (!r) return '';
  const parts=[]; if (r.xp) parts.push('⭐'+r.xp+' xp'); if (r.gold) parts.push(r.gold+' g');
  if (r.items && r.items.length) parts.push(r.items[0].name); return parts.join(' · ');
}
function _boardBounties(node, limit){                  // pure read-only selection (C4/C5)
  if (!_boardHost(node)) return [];
  const day = (S_story.gameDay||0), seed = _boardSeed(node.code, day), out=[];
  for (const q of Object.values(QUEST_DB)){
    if (!q || q.schema !== 'UQF-1.0' || !BOUNTY_TYPES.has(q.type)) continue;
    if (!q.activateNode || q.activateNode === node.code) continue;
    if ((S_story.quests||{})[q.id]) continue;                       // not already started
    if (!NODE_MAP[q.activateNode]) continue;                        // destination must exist
    if (!QuestRuntime.canActivate(q.id)) continue;                  // gate satisfied ⇒ unlock in-sequence
    const dest = NODE_MAP[q.activateNode];
    out.push({ id:q.id, title:q.title, destCode:q.activateNode,
               destShort:(dest.label||q.activateNode).split(' — ')[0],
               rumor:q.rumor||null, rewardStr:_rewardStr(q),
               _k:(seed ^ _boardSeed(q.id, day)) >>> 0 });
  }
  out.sort((a,b)=> a._k - b._k || (a.id<b.id?-1:1));                // deterministic rotation
  return out.slice(0, limit || 4);
}

function _acceptBounty(id){                            // §BOARD-01-B — FIRST live unlock
  const q = QUEST_DB[id]; if (!q) return;
  if ((S_story.quests||{})[id]) return;                            // already active/done — no-op
  QuestRuntime.execBits([{ kind:'unlock', quests:[id] }], {});     // widen through the grammar
  const dest = NODE_MAP[q.activateNode];
  const destShort = dest ? (dest.label||q.activateNode).split(' — ')[0] : q.activateNode;
  storyMsg('📌 Bounty accepted: ' + q.title + ' — ' + destShort);
  storyRender(NODE_MAP[S_story.currentCode]);                      // refresh: card drops, journal updates
}
```

**One render block** inside `storyRender`, in the data-driven region right after the QUESTS section (after `33293`), before LOOT (`33295`):

```js
// ── THE WARRANT'S BOARD section (§BOARD-01) — social/rumor quest discovery ──
{ const bounties = _boardBounties(node, 4);
  if (bounties.length){
    const { sec, body } = _mkSection('story-board-section', '📜', "The Warrant's Board");
    bounties.forEach(b => body.appendChild(_mkCard({
      lbl:'BOUNTY', main:'📜 ' + b.title,
      sub:'→ ' + b.destShort + (b.rewardStr ? '  ·  ' + b.rewardStr : ''),
      hint: b.rumor || 'Posted by the Crimson Warrant.',
      btn:'Take', btnClass:'btn-rest', btnClick:(function(id){ return () => _acceptBounty(id); })(b.id)
    })));
    row.appendChild(sec);
  } }
```

## 8. UI as gameplay experience

At any inn/tavern/rest node the player now finds a **📜 The Warrant's Board** panel beside Quests/Loot. Each posting shows the job title, where it is (`→ Visby Underground`, echoing the map's `❗`), the reward, and a one-line rumor in the Crimson Warrant's voice. A **"Take"** button posts it: `📌 Bounty accepted: … — Visby Underground`, the card drops, the mission is in the journal, and the map node that was an anonymous `❗` now means *you chose this*. For the first time in the game the world **tells you where to go and you decide to go** — social discovery instead of stumble-upon. Ambient Town-Crier rumors on rest stay as flavor; the board is the actionable layer above them.

## 9. Test plan (`tests/integration/warrants-board.test.js`)

- **Determinism (C5):** `_boardBounties(node, 4)` returns the same slate twice for a fixed `(gameDay, node)`; a different `gameDay` may reorder.
- **Predicate legality (C4):** every returned bounty passes `canActivate`, is UQF, has an allowlisted `type`, has a real destination `≠` current node, and is not already started; no `epic`/`main`/item-descriptor type ever appears.
- **Purity (A):** calling `_boardBounties` mutates no `S_story` field (deep-equal snapshot before/after).
- **Acceptance (B — first `unlock`):** `_acceptBounty(id)` sets `S_story.quests[id] === 'active'`; a second call is a no-op; arriving at the quest's node afterward does **not** double-add it (drive `storyCheckQuests` and assert one entry) and still fires its arrival narrative.
- **Free-movement regression:** the movement-refusal greps stay `'oob'`/`'sea'`-only (the board added no gate).
- **Kernel:** `git diff` shows no change inside `DUEL:CORE`/`MOVER:CORE`/`ROOMS:CORE` sentinels.
- **Regression:** `courier-map` / `enemy-ai` remain green.

## 10. Increment mapping

- **§BOARD-01-0** — this report. ✅ locked.
- **§BOARD-01-A** — add §7's two top-level functions + the render block (render-only; acceptance stubbed/inert or button omitted in a first pass is unnecessary — the block is trivially side-effect-free because it only reads). Gate: parse clean · determinism/predicate/purity tests · regression.
- **§BOARD-01-B** — `_acceptBounty` wired to the "Take" button; first live `unlock`. Gate: acceptance/no-double-add tests · free-movement greps · kernel diff.
- **§BOARD-01-C** — trickle authored `rumor:` strings via `./api.sh put quest <id> rumor='…'` (restart server first — Hazard #1; never `post monster` — Hazard #2). No code change.
- **§BOARD-01-D** — optional: `unlock` as an `onComplete` reward bit (geography-jumping chains); codex/downtime merge (§POT-S4/M1).

*© 2026 Paul Richeson — MIT License.*
