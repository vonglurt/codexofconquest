<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->

# quest.md — The Shattered Codex: Master Quest Register

> **Purpose:** Location-organized register of the **hand-authored** quests — the `quest_*`, `mq_*` and `sq_*` families, 309 ids at 2026-10-08, every one of them cited here by id (the gate's ratchet is 0), implemented, planned and specced. *Arrive?* in the tables below is the cell rule (§AUDIT-03x): ✅ when the quest's `activateNode` is the first node declared in its cell, ⛔ naming the node that holds the cell otherwise; *hook* when the quest has no `activateNode`. `check:questindex` (gate #45, §DX-02ad) scores this file against that population and prints how many it still lacks; the generated per-node five-act corpus (2,544 `<node>_actN` / `<node>_cNaN` skill checks) is not registered here — `./bin/api list quest --node <CODE>` is its index. For five-act quest elaborations see `plan-archive.md §DUNGEON-02`. For skill check mechanic spec see `plan-archive.md §DESIGN-03`. For grief arc quests see `plan-archive.md §GR`.

---

## Quest Format

Each quest entry uses the following tags:
- **[SKILL CHECK]** — Ceremonia Roll: d20 + abilityMod + profBonus ≥ DC
- **[BATTLE]** — Gating combat; must win to proceed
- **[ACCOMPLISHMENT]** — Auto-fires on flag condition; no roll needed
- **[✅ LIVE]** — Implemented in HTML
- **[PLANNED]** — Specced, not yet in HTML

---

## Prices and choices — the `cost` leaf and the choice driver (§VM-01-G4a, 2026-08-04)

**Paying for something is now a bit, not a hand-written `if`.** Six surfaces charged gold with the
same three inline lines (`if (gold < N) { msg; return; } gold -= N;`) — Yva's 50gp, the Junction
Vignette's `[Help — 10gp]`, Kenickie's four prices. The opcode:

```js
{ kind:'cost', gold:50, refuse:"💰 You don't have 50gp." }   // gold
{ kind:'cost', resource:'surgeCharges', count:1 }            // a class resource
```

- **Refuse-at-click is the contract** (user design call). The verb **always renders**; if the player
  is short, `cost` emits `refuse` and **fails the whole chain** — including from inside a `choice`
  option, where it aborts the bits after the choice too. It does **not** hide the option, so a
  `cost` must never appear in a gate or a `when`. The game states its price out loud; that is the
  same telling-vs-asking thesis the rest of §VM-01 is built on.
- **Every currency is tested before any is spent** — a `{gold, resource}` price can never part-pay.
- **Do not spell a price as `reward` with negative gold.** It computes correctly and is wrong
  everywhere else: no affordability test, no refusal, and the word *reward* on a price.
- **hp is not a currency.** The Memory Gate's −15 hp is narrated damage on a branch that always
  succeeds — author it as an effect in that option's bits.

**`choice` can be driven at last.** Its host half (`_uqfRunVerb`/`_uqfRenderAsk`) shipped in the
same slice; before it, `renderChoiceBlock` had never existed and a `choice` bit could only throw.
`choice` is **exclusive by construction** — it suspends, takes one index, runs that option's bits and
discards the rest — so use it only where the surface really is *pick one*. A one-option "choice" is
a labelled effect chain with ceremony, and a menu whose entries are meant to coexist (CDG's three
boss confrontations) is the opposite of one. A `choice` inside `skill_check`'s `onPass`/`onFail`
still throws, by scope fence.

### `NODE_VERBS` — where a verb is authored (§VM-01-G4b, 2026-08-04)

A quest is something you're *given*; a **verb** is something a place lets you *do*. The third small
registry in the `NODE_PANELS`/`NODE_HOOKS` house style holds them, and its bits are ordinary UQF:

```js
{ id:'dus-kern-sable-first', nodes:['DUS'],
  when: st => !st.nexusQuestSeen,
  bits: [ { kind:'choice', prompt:'Two figures at the Frequency Row counter…', options:[
    { label:'👂 Stay quiet. Keep listening.', bits:[ {kind:'flag_write', set:['nexusQuestSeen']},
                                                     {kind:'narrative', msg:'…'} ] },
    …
  ] } ] }
```

Three surfaces, chosen by what the entry carries — **`label` + `bits`** is a button that runs the
chain on click (the ordinary verb); **`bits` with no `label`** means the chain *is* the surface, so
it runs at render and its first bit **must** be a suspending `choice` (anything else is refused out
loud, because it would apply its effects on every draw of the node); **`ambient`** alone is a
flavour line for a state that offers nothing to do. `when` is a plain predicate over state — note
that a `cost` never belongs in it (refuse-at-click, above).

**Dispatch is in place**: `_renderNodeVerbs(node, st, group, container)` is called at the source
position each migrated block occupied, so DOM stacking order is preserved by construction rather
than by analysis. The optional 4th argument is the **concurrent-menu mode** (below): the call site
owns a container element, the group's verbs render into it, and the call site inserts it only when
non-empty.

#### The button verb (§VM-01-G4c, 2026-08-04)

```js
{ id:'trd-yva', group:'trd-yva', nodes:['TRD'],
  when: st => (st.quests||{})['quest_vs_02'] === 'active' && !st.vsWeaponsFound,
  label:'💬 Find Yva (50gp).', btnStyle:'margin-top:6px;',
  bits: st => [ { kind:'cost', gold:50, refuse:"💰 You don't have 50gp." },
                { kind:'narrative', msg:'Yva: "Fifty gold…' + (st.tlMissingShipSolved ? '…' : '') },
                { kind:'flag_write', set:['vsWeaponsFound'] },
                { kind:'favor', npc:'yva', set:1 },
                { kind:'reward', items:[{ name:'Hollow Hands Seal', … }] },
                { kind:'unlock', quests:['quest_vs_03'] } ] }
```

- **`group` names a dispatch position**, and it is the unit the renderer takes. Every group has
  exactly one call site and every call site names a live group — a test asserts both, because an
  entry with no call site would render **nowhere** and nothing else would notice.
- **`bits` may be an array or `fn(st)`** — the same `string | fn` shape `ambient` and `when` already
  have. Use the function form only for text assembled from state (Yva's extra paragraph once the
  Harrow is solved); the VM still receives a plain declarative array.
- **`btnStyle`** is the button's own inline style. A verb with a `label` and no `ambient` **is** its
  button — no wrapper — because the anchor's parent is a flex column: a direct-child button is
  stretched full width, and the same button inside a wrapper shrinks to its text. A DOM diff cannot
  see that; only a screenshot can.
- **`favor` takes `set:`, not `add:`, when mirroring `_setNpcFavor`** — that helper writes an
  absolute level and only ever raises it, so `add:1` would *lower* a favor already at 2.
- **The chain's completion re-renders the node.** Anything the verb satisfies (a quest's completion
  gate) therefore lands in the **same beat** rather than on the next arrival, and the chain's
  narrative survives as `storyRender`'s prefix instead of being overwritten by whatever spoke last.

#### The concurrent menu (§VM-01-G4d, 2026-08-05)

A **choice is exclusive by construction** — pick one option, the rest are discarded. When a place
offers several verbs that are all visible at once and none removes the others, that is not a
choice, it is a **menu**: several entries sharing one `group`, rendered into one container the
call site owns. CDG's boss confrontations are the live consumer:

```js
{ id:'cdg-boss-taz', group:'cdg-boss-menu', nodes:['CDG'],
  when: st => (st.quests||{})['quest_cat_04'] === 'active' && !st.defeatedBattles['CQ_TAZ'],
  label:'🌀 Confront the Taz Devil — Furball Tornado',
  bits: [ { kind:'narrative', msg:'The alley fills with a low rumble…' },
          { kind:'combat', key:'taz_devil', label:'Taz Devil — Furball Tornado', nodeCode:'CQ_TAZ' } ] }
```

`combat`'s optional **`nodeCode`** may be a *synthetic* battle code (`CQ_TAZ` is a
`defeatedBattles` ledger key, not a place — the kernel spreads the live node and overrides only
`code`). The `check:noderegs` gate keeps an explicit `SYNTHETIC_BATTLE_CODES` list for exactly
these; an unlisted synthetic code, or a synthetic code in any *other* node field, still fails.
Note the kernel's combat handler opens the pre-battle overlay **in the same beat as the click** —
a hand-written `setTimeout` beat between the narrative and the overlay does not survive migration.

Live consumers: the Kern & Sable overture at DUS (Q-NEXUS-00/01/02) — the first `choice` ever
executed in this game — plus four button verbs (Sweelinck's S49 scene at NUE, Ori at STN, Yva at
TRD, Brynn's firewood at TLL), and CDG's five-child menu (§VM-01-G4d): the three boss
confrontations in group `cdg-boss-menu`, the Kenickie Black Market launcher (a `NODE_HOOKS`
entry — a shop is an interface, not a verb), and the la_riva_03 account-book delivery in group
`cdg-la-riva`. The Junction Vignette's `[Help — 10gp]` pays through `cost` **without**
being a verb: `_uqfRunChain(bits)` runs a chain in place, with no mount and no re-render, for a
surface a re-render would erase. The remaining D1 blocks (delayed beats, hand-styled panels) wait on
§VM-01-G4c-FU's design calls.

---

## Arrival activation and the §AUDIT-03e seam (2026-07-29)

A quest lists on arrival when `_uqfActivateAtNode` finds it in the `activateNode → [quests]` index (`_questsByNodeRevalidate` runs the size guard once per arrival at the top of `storyRender`, which passes `indexFresh` to its two activation passes, §DX-02ea; every other caller goes through `_questsByNode` and pays the guard) and its
`gate` passes. Until §AUDIT-03e that lookup was **dead at 287 of the 416 nodes**: those NODE_MAP
entries omit the redundant `code:` field, so `node.code` was `undefined` and the index returned
nothing. **2,283 quests named one of them in `activateNode`** — including whole shipped arcs
(§MATH-01's `quest_math_*`, §KG's `quest_kg_*`) that had never activated in live play.

The `code = key` backfill (maps.md §NODE_MAP) fixes the lookup. Activation is unblocked **selectively**,
because most of those 2,283 are the §AUDIT-03d imported-chain corpus:

| Shape | Behaviour at a backfilled node |
|-------|-------------------------------|
| Real `gate:` **or** a `completion:` clause | Activates normally (staged by its own gate) |
| Vacuous `gate:{}` **and** no `completion:` — a free-floating vignette with no objective | **Held** pending §AUDIT-03d staging |

Measured: **5** quests newly fire on arrival across all 287 nodes (the §KG + §MATH-01 chain heads and
`mq_4` at BK), worst node 1 — well under the live worst of 31 at NUE. Without the seam, WM alone would
fire **151** in one arrival, act4/act5 finales ahead of their own act1. **When authoring a quest for a
backfilled node, give it a real gate or a real completion** — an objective-less `gate:{}` vignette will
not list until §AUDIT-03d lands.

---

## The `npc` field — authoring metadata, not gameplay (§AUDIT-03b, 2026-07-29)

`quest.npc` **anchors a quest to an NPC for authoring purposes only.** The game client
(`play.html`) has **zero** quest-level `.npc` reads — nothing a player sees depends
on it. Its consumers are the worldbuilder display, the server's `_questsByNpc` index,
`./bin/api advise` (an unresolvable key is a *warning*), `./bin/api audit` (a **missing**
field is an *error* — every quest must be anchored), and the NPC delete-guards.

**The accepted vocabulary is four registries** (`WBAPI.npcKeyOk`, `src/js/wbapi-core.js`):

| # | Registry | Key form |
|---|----------|----------|
| 1 | `BIRKA_NPC` profiles | the profile key (`long_john_silver_sen`) |
| 2 | `NODE_MAP` inline `npc` | display name normalized — lowercased, spaces → `_`. **Excludes the seven `NPC_ALIASES` slugs** (§AUDIT-03k): where that person already has a profile, the slug resolves *to* the profile key rather than alongside it |
| 3 | `NPC_DIALOGUES` | the dialogue key (`jimmy`, `solvak`, `benedikt_rasp`) |
| 4 | `EB_NPC_DIALOGUE` | the Epic-Battleground giver's name, normalized |

**Anchoring rule, in priority order:** the scene's named speaker if that speaker has a key
→ else the arc/chain's convening NPC → else the quest's `activateNode` inline NPC.
Do **not** leave it unset (that is an audit error), and do **not** bulk-default it — the
`ea02faf` sweep did exactly that and mis-stamped 203 quests as Long John Silver's.

**Bulk re-anchoring:** `./bin/api batch-npc updates.json` (`[{id, npc}, …]`) — one parse and
one save for the whole batch instead of N full-file rewrites.

**Coverage is now total (§AUDIT-03g, 2026-07-29): all 2,853 quests carry an `npc`, so
`./bin/api audit` reports `errors: 0`** — the standing error that provoked the `ea02faf`
bulk-default is gone. The last 68 unanchored quests were derived one family at a time:

| Family | Key | Why |
|--------|-----|-----|
| `quest_d0201_*`, `quest_d0209_*` (RAI) | `captain_selene_draketide` | a §D02 **Epic-Battleground approach arc inherits its battleground's giver** — the same key `quest_ea_primary`/`_return` already carry at that node |
| `quest_d0205_*` (BK) | `warlord_kael_mordus` | same rule, via `quest_eg_primary` (Void Shaman's Sanctum) |
| `quest_d0207_*`, `quest_d0204_*`, `quest_d0210_*`, `quest_d0206_*`, `quest_void_below`, `quest_void_tide_21/35/42` | `auros` | Commander Seraphine Bruhns — profile key `auros`, the `NODE_MAP` inline npc of **both** HKG and TLS, the named figure of the Workshop schematics, and the corpus anchor of the Warrant thread (`quest_signal_01`) |
| `quest_d0208_*` (Mimic Meadows), `quest_inquisitor_*`, `clr_01_act5` | `archivus_sweelinck` | the Shattered-Codex archivist: NUE's own NPC for the Inquisitor gauntlet, and the named "archivist at Weimar" who closes the `clr_01` chain. **`quest_d0208_*` is provisional** — its presiding character is the Mother Mimic, who has no registry entry (§AUDIT-03i) |
| `clr_01_act3/act4` | `watcher_gvw` | chain coherence — acts 1–2 already carry it |
| `quest_math_01–05` | `johannes_von_weisheit` | the §MATH-01 arc's convening voice; the Event Horizon Station literally speaks in `quest_math_03`'s `onComplete` |
| `quest_ceremonia_yael_*`, `quest_slums_cleanup`, `quest_city_watch_patrol`, `quest_crypt_survey` | `yael` | Yael Scheidemann is the named actor (crypt survey = the §DESIGN-03 Birka commission set, hers by chain) |
| `quest_courier_release`, `quest_sir_jullean` | `yael` | LHR's desk-guard scenes. Anchored to the inline slug `city_guard_captain` at the time, together with the `quest_ng_0*` Froberger set; **all five collapsed onto `yael` by §AUDIT-03k** — it was the same woman under a second heading |
| `quest_brynn_firewood`, `quest_brynn_ledger` | `brynn` | TLL's own profile |
| `quest_pit_debut` | `crov` | Pit Master Weckmann, matching `quest_pit_training` |

Pinned by `src/tests/integration/audit03g-npc-coverage.test.js` (coverage · the 68 keys · vocabulary
resolution · the EB-giver derivation re-asserted from the live corpus, not hard-coded).

**One character, one key — the alias map does this for you now (§AUDIT-03k ✅ 2026-08-04).** A
node's inline `npc` string normalizes to a key that is often the *same character* as a
`NPC_DIALOGUES` / `BIRKA_NPC` profile under a different spelling. Both used to pass `npcKeyOk`, so
`_questsByNpc` filed one person under two headings — `city_guard_captain` held 5 quests while
`yael`, the woman LHR's own node text names, held 17. **`WBAPI.NPC_ALIASES` (`src/js/wbapi-core.js`)
now collapses all seven pairs on write**, the alias slugs are **out of the vocabulary** (a quest
still carrying one advise-warns), and `_questsByNpc` indexes under the canonical key even for a
hand-authored UQF block that never passed through the API:

| Inline display name | → profile key | Corroboration |
|---|---|---|
| `city_guard_captain` (LHR) | `yael` | occupation ≡ slug · `NODE_NPC_KEYS.LHR` · LHR's node text names her |
| `innkeeper_brynn` (TLL) | `brynn` | name *Innkeeper Brynn Clerambault* ⊇ slug · `NODE_NPC_KEYS.TLL` |
| `bard_tomas_couperin` (MHQ) | `quill` | name ≡ slug · `NODE_NPC_KEYS.MHQ` |
| `city_fence` (LLA) | `pachelbel` | name *Fence Pachelbel* · occupation · `NODE_NPC_KEYS.LLA` |
| `commander_bruhns` (HKG, TLS) | `auros` | name *Commander Seraphine Bruhns* ⊇ slug |
| `archivus_ptolemy_sweelinck` (NUE) | `archivus_sweelinck` | name ≡ slug · `profile.node = NUE` |
| `jimmy_two-tails` (CDG) | `jimmy` | name *Jimmy "Two-Tails" Carbonara* ⊇ slug · `profile.node = CDG` |

**A role collision is not an identity.** SEN's inline `ship_captain` matches
`captain_smollett_sen` by occupation exactly — but Smollett captains the Hispaniola at `HMS` and
SEN is the *Tilbury Star*. That is why `check:npcregs` phase 5 classifies **explicitly**: a new
display name that collides with a live profile must be listed in `NPC_ALIASES` or in the gate's
`NOT_AN_ALIAS` with a reason, and an unlisted one **fails**. The node's display string itself is
never rewritten — it is supposed to be a name (§AUDIT-03h). Pinned by
`src/tests/integration/audit03k-npc-aliases.test.js`.

**Write the registry KEY, never the display name (§AUDIT-03h, 2026-07-30).** Ten quests held a
human-readable name (`npc:"Emmer Finch"`) where the key belongs (`emmer`). Capitals and spaces
resolve in **no** registry, so those quests advise-warned forever and `_questsByNpc` filed them
under a heading no other quest could reach. All ten are normalized; **the corpus now holds zero
unresolvable `npc` values**, and `audit03b-npc-anchor.test.js`'s tolerated list is empty:

| Quest(s) | Was | Now | Why |
|----------|-----|-----|-----|
| `quest_guide_01/02/03/05` | `"Emmer Finch"` | `emmer` | the `BIRKA_NPC` profile at `SSJ`, the arc's own `activateNode`; `quest_guide_06`'s `onComplete` already spends `{kind:'favor', npc:'emmer'}` |
| `quest_guide_04` | `"Bog Mudwhistle"` | `emmer` | **Bog is not an NPC** — he is a `NPC_TOUR_OPPONENTS` row (key `bog`), a Yugurt-tournament opponent in none of the four registries. The corpus precedent is unambiguous: the sibling `quest_tour_*` quests are each titled after an opponent (`quest_tour_03` is literally *"Bog's Terms"*) and every one anchors to `emmer`. Beat 4 of Emmer's own six-quest arc |
| `quest_guide_06` | `"The Fisherman"` | `the_fisherman` | an `NPC_DIALOGUES` key **and** `SSJ`'s inline `npc` normalized — registries 2 and 3 agree on the identical slug |
| `quest_scar_01/03/04` | `"Gret Orrens"` | `gret` | the profile at `NUE`; `quest_scar_04`'s `onComplete` already spends `{kind:'favor', npc:'gret'}` |
| `quest_scar_02` | `"Pier Falk"` | `pier` | the profile at `NUE`; the §NPC-01 card map already pushes `'pier'` on `pierFalkWarm` |

⚠️ **The key is not always the name slugified.** `Gret Orrens` → `gret`, not `gret_orrens`;
`Pier Falk` → `pier`. Resolve every key against `WBAPI.npcKeyVocab()` before writing it.
And note the inverse: **`NODE_MAP`'s inline `npc` is *supposed* to be a display name** (`SSJ.npc
= 'The Fisherman'`) — normalizing *that* would be the bug, since it is what makes the key
resolve. Pinned by `src/tests/integration/audit03h-npc-normalize.test.js`.

---

## MAIN LINE — The Seven Shards (`mq_*`) and the Warrant's side line (`sq_*`)

The spine `story.md` tells. Each shard quest is `type:'main'`, gate `{}`, giver `yael` (Sweelinck for the last) and completes on holding its shard item; no quest here pays gold, the shard is the pay.

| ID | Title | Type | Node → waypoint | Cond | Reward | Arrive? |
|----|-------|------|------|------|--------|---------|
| `mq_1` | Follow the Bloodstained Map | [MAIN] | LHR → LCY | `{}` | Trade Seal (Shard #1) held | ✅ |
| `mq_2` | Find Brother Aldric | [MAIN] | LCY → FRO | `{}` | Grove Token (Shard #2) held | ✅ |
| `mq_3` | The Sea Road South | [MAIN] | SDQ → RAI | `{}` | Tidal Rune (Shard #3) held | ⛔ SDQ's cell is held by `WG0` |
| `mq_4` | The Goblin Shaman | [MAIN] | BK → TRD | `{}` | Crimson Warrant (Shard #4) held | ⛔ BK's cell is held by `LHR` |
| `mq_5` | The Djinn's Binding | [MAIN] | DOH → DOH | `{}` | Sand Cipher (Shard #5) held | ✅ |
| `mq_6` | The Mythic Circuit | [MAIN] | HER → BKK | `{}` | Codex Shard #6 + Weimar Fragment (Shard #7) held | ⛔ HER's cell is held by `SEA` |
| `mq_7` | The Reckoning | [MAIN] | NUE → TLS | `{}` | `VICTORY` held (the Convergence) — giver `archivus_sweelinck` | ✅ |
| `sq_1` | The Disappeared Merchants | [SIDE] | TLL → LCY | `{}` | Trade Seal (Shard #1) held — giver `brynn` | ✅ |
| `sq_2` | Kelpie in the Loch | [SIDE] [BATTLE] | KIR → KIR | `{}` | Highland Horse held; the `onComplete` narrative opens the Dunfall road (§PORT-02) | ✅ |
| `sq_battling` | Battling — Earn Your Reputation | [SIDE] | LHR | `{}` | `dropsCollected ≥ 3` | ✅ |
| `sq_leveling` | Leveling — The Spoils of War | [SIDE] | LHR | `{}` | `defeatedBattles ≥ 5` | ✅ |

---

## BIRKA — Act I (Nodes: BA, SL, IN, TA, bar, CP, CY, CDG, AMS, MM)

### City Streets (BA) — NODE 1

| Quest ID | Title | Type | Acts | Reward |
|----------|-------|------|------|--------|
| `quest_courier_release` | "The Released" | [SKILL CHECK] CHA DC 10 | 1 | Map + 50gp + 100 XP | [✅ LIVE §DESIGN-03] |
| `quest_city_watch_patrol` | "The Route" | [ACCOMPLISHMENT] | 1 | 50gp + 150 XP + Yael fav+1 | [✅ LIVE §DESIGN-03] |

**`quest_courier_release` — The Released**
*Node: BA. Trigger: arrive at Node 1 (game start). Object: the courier's body, unclaimed.*
- Act I: [STORY SKILL CHECK] Persuade City Guard to release the courier. CHA DC 10.
  - Pass: Map retrieved, 50gp saved. Fail: Pay 20gp bribe instead (map still retrieved).
- Reward: `Bloodstained Map` + 50gp + 100 XP.

---

### Birka Slums (SL) — NODE 51

| Quest ID | Title | Type | Acts | Reward | Status |
|----------|-------|------|------|--------|--------|
| `quest_slums_cleanup` | "The Vermin Pit" | [BATTLE] ×3 | 1 | 80gp + Yael Friendly | [✅ LIVE] |
| `quest_brynn_ledger` | "The Worn Ledger" | [ACCOMPLISHMENT] | 1 | Free lodging + Brynn Friendly | [✅ LIVE] |

---

### The Inn (IN) — NODE 2

| Quest ID | Title | Type | Acts | Reward | Status |
|----------|-------|------|------|--------|--------|
| `quest_brynn_firewood` | "The Firewood" | [ACCOMPLISHMENT] | 1 | Brynn fav+1 | [✅ LIVE] |

---

### Tavern (TA) — NODE 3

| Quest ID | Title | Type | Acts | Reward | Status |
|----------|-------|------|------|--------|--------|
| `quest_couperin_lute` | "The Lute" | [ACCOMPLISHMENT] | 1 | 40gp + cipher scrap + Quill Friendly | [✅ LIVE] |

---

### Bar District — NODE 4

| Quest ID | Title | Type | Acts | Reward | Status |
|----------|-------|------|------|--------|--------|
| `quest_pachelbel_shipment` | "The Sealed Box" | [ACCOMPLISHMENT] | 1 | 60gp + Pachelbel Friendly | [✅ LIVE] |

---

### The Crypt (CP) — NODE 5

| Quest ID | Title | Type | Acts | Reward | Status |
|----------|-------|------|------|--------|--------|
| `quest_crypt_survey` | "The Survey" | [SKILL CHECK] WIS DC 12 | 1 | 75gp + 200 XP + `cryptSurveyed` | [✅ LIVE §DESIGN-03] |

**`quest_crypt_survey` — The Survey**
*Node: CP. Trigger: first CP visit. Object: the surveyor's chalk, left by Froberger fifteen years ago.*
- Act I: [STORY SKILL CHECK] Map the second chamber. WIS (Perception) DC 12.
  - Pass: 75gp + 200 XP. Fail: Retry next day — the chalk is still where Froberger left it.

---

### Neon Undercity (CY) — NODE 6

| Quest ID | Title | Type | Acts | Reward | Status |
|----------|-------|------|------|--------|--------|
| `quest_pit_training` | "Pit Training" | [BATTLE] ×3 wins | 1 | Pit Legend Token + Weckmann Friendly | [✅ LIVE] |
| `quest_void_below` | "Void Below" | [BATTLE] CY_VOID clear | 1 | EMP Grenade + Scholar's Note + Auros Dear Friend | [✅ LIVE] |
| `quest_pit_debut` | "First Blood" | [ACCOMPLISHMENT] | 1 | 100gp + 250 XP + flavor | [✅ LIVE §DESIGN-03] |
| `quest_d0207_a1–a5` *(design: quest_cy_madness_gate)* | "The Maintenance Plate" | [SKILL CHECK]+[BATTLE] | 5 acts | `cyOriginKnown` + Name Plate item | [✅ LIVE §D02-07] |

**`quest_cy_madness_gate` — "The Maintenance Plate"** *(5-act, see §D02-07)*
*Node: CY. Trigger: first visit. Object: the copper maintenance plate dated 300 years ago.*
1. [STORY SKILL CHECK] WIS Perception DC 10 — notice the plate
2. [STORY SKILL CHECK] WIS Save DC 12 — madness gate (fail = Madness Table d10, flavor only)
3. [STORY GATING BATTLE] Data Wraith — AC 14 / HP 30
4. [STORY SKILL CHECK] INT Arcana DC 13 — decode the cipher
5. [STORY-DRIVING] CHA Persuasion DC 12 — accept the name on the log
- Reward: `Scholar King's Name Plate` (flavor item) + `cyOriginKnown: true`

---

### The Mathematics Pocket (EHZ, ZERO, MONS, CNTR) — NE of the Undercity — §MATH-01

*Four-node walkable pocket anchored on HKG "Neon Undercity" (29,246): EHZ "Event Horizon — Math Station" through the east panel (29,247), ZERO "The Zero Corridor" north of the station (28,247), MONS "The Monster's Manifold" east (29,248), CNTR "Cantor's Attic" northeast (28,248). All five quests are UQF collect quests — the document is the node's first-visit loot; completion fires at the collect node. Gold rides `onComplete` reward bits; XP is the engine's side-quest award. Design: `docs/lab-reports/lab-report-math01-completions.md`.*

| Quest ID | Title | Type | Activate → Collect | Reward | Status |
|----------|-------|------|--------------------|--------|--------|
| `quest_math_01` | "The Number That Means Nothing" | [COLLECT] Zero Treatise | JRS → ZERO | 300gp + 350 XP | [✅ LIVE §MATH-01] |
| `quest_math_02` | "What the Snowflake Knows" | [COLLECT] 12-Symmetry Manuscript | EHZ → MONS | 350gp + 400 XP | [✅ LIVE §MATH-01] |
| `quest_math_03` | "The Quintic's Impossibility" | [COLLECT] Hamadani Failure Record | OST → EHZ | 350gp + 400 XP | [✅ LIVE §MATH-01] |
| `quest_math_04` | "The Counting Quest" | [COLLECT] Counting Document Bundle | JRS → ZERO | 500gp + 500 XP | [✅ LIVE §MATH-01] |
| `quest_math_05` | "The Moonshine Memo" | [COLLECT] Moonshine Memo | MONS → CNTR | 600gp + 600 XP | [✅ LIVE §MATH-01] |

---

### Cat Quarter (`CDG`) — NODE 77

| Quest ID | Title | Type | Acts | Reward | Status |
|----------|-------|------|------|--------|--------|
| `quest_cat_01` | "The New Scratch" | [BATTLE] ×8 cats | 1 | 200gp | [✅ LIVE] |
| `quest_cat_02` | "Beefy Business" | [BATTLE] ×3+drop | 1 | 350gp + Sandy NPC | [✅ LIVE] |
| `quest_cat_03` | "Honcho Problems" | [BATTLE] ×2 boss | 1 | 500gp + Rhinestone Collar | [✅ LIVE] |
| `quest_cat_04` | "When the Tornado Comes" | [BATTLE] Taz Devil | 1 | 750gp + Furball Crown | [✅ LIVE] |
| `quest_cat_05` | "Fat Cats Don't Tip" | [BATTLE] ×4+boss | 1 | 900gp + Don's Signet Ring | [✅ LIVE] |
| `quest_cat_06` | "The Cat-King Cometh" | [BATTLE] Cat-King | 1 | 1500gp + Cat-King's Claw + `catKingDefeated` | [✅ LIVE] |
| `quest_cat_void` | "Void Strays" | [BATTLE] ×5 | 1 | 400gp | [✅ LIVE] |

**Activation model (§VM-01-G3, 2026-07-28):** the chain is declaratively staged at CDG via `gate:` + `activateNode:'CDG'` — `cat_01` unconditional → `cat_02` (questsDone `cat_01`) → `cat_03`/`cat_05`/`cat_void` (questsDone `cat_02`) → `cat_04` (questsDone `cat_03`) → `cat_06` (questsDone `cat_04`+`cat_05`). The Jimmy/Sandy/Tommy arrival narrations ride the quests' `onActivate` fields. (Before G3, appended duplicate `activateNode:"CDG"` fields made the WHOLE chain activate on first arrival — the storyRender stanzas' staging had silently died.)

**Node code (§AUDIT-03c, 2026-07-29):** the node is **`CDG`**, num 77, label *"The Cat Quarter"* — never `CQ`. `CQ` was author shorthand that `710bb75` remapped away; the only `CQ_*` strings left in the engine are the three **pseudo-battle codes** `CQ_TAZ` / `CQ_BOSS` / `CQ_KING`, which are `pendingBattle.nodeCode` labels for the panel-launched boss fights, not nodes. Audit verdict: `cat_05`/`cat_06`/`cat_void` → `CDG` is **right** — corroborated by the node's own label + inline npc (Jimmy Two-Tails), by `waypointNode:'CDG'`, and by the boss-button panel that guards on `node.code === 'CDG'`. One correction applied: `quest_cat_06` had been anchored to `jimmy_two-tails` (the CDG inline-name slug) while its three siblings use the `NPC_DIALOGUES` profile key `jimmy` — the same character under two index headings (§AUDIT-03k). Now `jimmy` on all four.

---

### Fishmonger's Row (`AMS`) — NODE 79

| Quest ID | Title | Type | Acts | Reward | Status |
|----------|-------|------|------|--------|--------|
| `quest_la_riva_01` | "What Remains" | [ACCOMPLISHMENT] | 1 | `connieMet` | [✅ LIVE §GR] |
| `quest_la_riva_02` | "The Weight of a Net" | [BATTLE] ×5 + drop | 1 | 500gp + Aldo Friendly | [✅ LIVE §GR] |
| `quest_la_riva_03` | "The Account Book" | [ACCOMPLISHMENT] | 1 | Kenickie Dear Friend + `laRivaComplete` | [✅ LIVE §GR] |

**Node code + activation model (§AUDIT-03c, 2026-07-29):** the node is **`AMS`**, num 79, label *"Fishmonger's Row"* — never `FR`. The `FR` shorthand survives only in the arc's design IDs (`Q-FR-01/02/03`) and in the engine's own hook/handler comments (`_nodeHookLaRivaRow`, guarded on `node.code === 'AMS'`; the `frCatKillCount` counter). Audit verdict: `FR → AMS` is **right**, and the arc is legitimately **bi-nodal** — Kenickie sends you east from `CDG`, Connie and Aldo are at `AMS`, and the account book goes back to Kenickie at `CDG` (hence `la_riva_03`'s `waypointNode:'CDG'`). All three quests carry **`activateNode:null`** and are staged by code, not by arrival: `la_riva_01` by the `CQ_KING` defeat handler, `02` by Connie's first-visit hook at `AMS`, `03` by Aldo's hook once the net + 5 kills are in. `710bb75`'s appended `activateNode:"AMS"` on `02`/`03` would have mass-activated them past that staging; §VM-01-G3 removed it (and §AUDIT-03a removed `la_riva_01`'s).

---

### Mimic Meadows (MM) — NODE

| Quest ID | Title | Type | Acts | Reward | Status |
|----------|-------|------|------|--------|--------|
| `quest_d0208_a1–a5` *(design: quest_mimic_colony)* | "Colony Curation" | [SKILL CHECK]+[BATTLE if provoked] | 5 acts | 200gp + Mimic's Wax + Baby Mimic + `tribbleGladesFed` | [✅ LIVE §D02-08] |

**`quest_mimic_colony` — "The Dropped Coin"** *(5-act, see §D02-08)*
*Node: MM. Trigger: first visit. Object: a shiny coin dropped by the baby chest mimic.*
1. [STORY SKILL CHECK] WIS Animal Handling DC 10 — pick up coin gently without pocketing
2. [STORY SKILL CHECK] WIS Animal Handling DC 12 — approach napping bookshelf mimic
3. [STORY GATING BATTLE] Mother Mimic AC 16 / HP 60 — triggered ONLY if a mimic was attacked
4. [STORY SKILL CHECK] WIS Animal Handling DC 14 — return coin to baby mimic in front of Mother
5. [STORY-DRIVING] CHA Persuasion DC 10 — accept the pet + name it
- Reward: `Mimic's Cache` + 3× Fuzzy Tribble + `Baby Mimic` item + `mimicPetName`

---

### Ceremonia Arc — Yael Scheidemann (LHR, BMA)

| Quest ID | Title | Node | Type | DC | Status |
|----------|-------|------|------|----|--------|
| `quest_ceremonia_yael_01` | "The Watch" | LHR | [SKILL CHECK] CHA | 10 | [✅ LIVE §DESIGN-03] |
| `quest_ceremonia_yael_02` | "The Route" | LHR | [SKILL CHECK] WIS | 12 | [✅ LIVE §DESIGN-03] |
| `quest_ceremonia_yael_03` | "The Crate" | BMA | [SKILL CHECK] STR | 12 | [✅ LIVE §DESIGN-03] |
| `quest_ceremonia_yael_04` | "The Report" | LHR | [SKILL CHECK] CHA | 14 | [✅ LIVE §DESIGN-03] |
| `quest_ceremonia_yael_05` | "The Name" | LHR | [SKILL CHECK] CHA | 15 | [✅ LIVE §DESIGN-03] |

---

## WEIMAR — Act VII (Nodes: NUE `scholars_qtr`, SZG `workshop`)

### Weimar Archive (WM)

#### Scholar Gate chain (§XVI — activation declarative since §VM-01-G3 2026-07-28)

| Quest ID | Title | Gate (activation) | Node | Reward | Status |
|----------|-------|-------------------|------|--------|--------|
| `quest_wm_01` | "Isolde: The Revocation Record" | `{}` (Isolde's line rides `onActivate`; the old "Act VI+" leg was vestigial — NUE is an act-6+ node) | NUE | Lower Archive access | [✅ LIVE] |
| `quest_wm_02` | "Isolde: Lower Archive" | questsDone `wm_01` | NUE | Froberger's Field Notes + Isolde Friendly | [✅ LIVE] |
| `quest_wm_03` | "Benedikt: The Reading Circle" | `wmArchiveComplete` | NUE | Scholar Kings' History + Benedikt Dear Friend | [✅ LIVE] |
| `quest_wm_04` | "Benedikt: The First Researcher" | `wmBenediktCircleComplete` | NUE | Benedikt's Annotated Copy + 300gp | [✅ LIVE] |
| `quest_wm_05` | "The Open File" | `_legacyFn` gate (unchanged) | — | 200gp | [✅ LIVE] |

| Quest ID | Title | Type | Acts | Reward | Status |
|----------|-------|------|------|--------|--------|
| `quest_inquisitor_handshake` + `quest_inquisitor_questions` + `quest_inquisitor_final` *(design: quest_inquisitor)* | "The Extended Hand" | [SKILL CHECK]+[BATTLE if lying] | 3-quest gauntlet (NUE) | Archive key + `inquisitorPassed` | [✅ LIVE §D02-02] |
| *(node-woven at NUE — no quest ids; story-render interaction behind the Archive Key, sets `priorCarrierSeen/Spoke`)* | "The Worn Boots" | [STORY] | node interaction | Prior Carrier's Token + `priorCarrierSeen` | [✅ LIVE §D02-03] |

**`quest_inquisitor` — "The Extended Hand"** *(5-act, see §D02-02)*
*Node: WM. Trigger: `wmLowerArchiveUnlocked`. Object: the construct's outstretched hand.*
1. [STORY SKILL CHECK] CHA Persuasion DC 10 — volunteer to sit
2. [STORY SKILL CHECK] WIS Insight DC 12 — answer truthfully (matched against state flags)
3. [STORY GATING BATTLE] Inquisitor Construct AC 14 / HP 30 — triggered by two lies only
4. [STORY SKILL CHECK] CHA Persuasion DC 12 — third question ("Why are you still here?")
5. [STORY-DRIVING] INT Investigation DC 13 — find your own name in the record book

**`quest_prior_carrier` — "The Worn Boots"** *(5-act, see §D02-03)*
*Node: WM cell. Trigger: `inquisitorPassed`. Object: the Prior Carrier's worn boots.*
1. [STORY SKILL CHECK] WIS Perception DC 10 — notice the lock is on their side
2. [STORY SKILL CHECK] CHA Persuasion DC 11 — answer truthfully ("Did the Void open again?")
3. [STORY GATING BATTLE] Void Outrider AC 14 / HP 35 — tracking the Prior Carrier
4. [STORY SKILL CHECK] WIS Insight DC 12 — understand what the token means
5. [STORY-DRIVING] CHA Persuasion DC 13 — "How do you know my name?"

---

### Scholar's Quarter (NUE) — Gret Orrens, §SCAR-01

Four beats at NUE. The skill checks pay from their own `onPass`; the close pays from `onComplete` and sets favor `gret` to 2.

| ID | Title | Type | Node | Cond | Reward | Arrive? |
|----|-------|------|------|------|--------|---------|
| `quest_scar_01` | The Open Ledger | [SKILL CHECK] INT Investigation DC 8, retry next day | NUE | `{}` | +100 XP (`onPass`) | ✅ |
| `quest_scar_02` | The Labyrinth | [SKILL CHECK] WIS Insight DC 12, retry next day | NUE | `gretMet` | +200 XP (`onPass`) — giver `pier` | ✅ |
| `quest_scar_03` | The Shock | [SKILL CHECK] WIS Insight DC 11, one try | NUE | `gretLabyrinth`, not `gretChoice` | +250 XP (`onPass`) | ✅ |
| `quest_scar_04` | The Star | [SIDE] | NUE | `gretChoice` | at NUE with `gretChoice` → 500gp + 350 XP, `gretComplete`, favor `gret` 2 | ✅ |

### Scholar King's Workshop (WK) — NODE

| Quest ID | Title | Type | Acts | Reward | Status |
|----------|-------|------|------|--------|--------|
| `quest_d0206_a1–a5` *(design: quest_scholar_workshop)* | "The Blueprint Roll" | [SKILL CHECK]+[BATTLE/SPIRIT] | 5 acts | Prototype Wand + `aurosBlueprintKnown` + `scholarWorkshopComplete` | [✅ LIVE §D02-06] |

**`quest_scholar_workshop` — "The Blueprint Roll"** *(5-act, see §D02-06)*
*Node: SW. Trigger: first SW visit. Object: blueprint roll — plans for Auros's armor.*
1. [STORY SKILL CHECK] INT Investigation DC 10 — confirm the blueprint
2. [STORY SKILL CHECK] WIS Perception DC 11 — assess prototype wand stability
3. [STORY GATING BATTLE / SPIRIT] CHA DC 12 OR Spirit combat AC 12 / HP 25 — after second short rest
4. [STORY SKILL CHECK] WIS Insight DC 13 — understand Auros's armor weak point
5. [STORY-DRIVING] CHA Persuasion DC 13 — accept your name on the cover

---

## TILBURY — Act II (Nodes: docks, market_quarter, storefront, merchant_ship)

*(Existing quests live. §SPARK-01 quests below: PLANNED — see plan-archive.md §SPARK-01 for full spec.)*

### Tilbury Harbor Arc (§XIX — STN/TL; **revived §VM-01-G3 2026-07-28**, was dead from Q-TL-02 on: `NODE_MAP.TL` had no `code` field)

| Quest ID | Title | Gate (activation) | Node | Reward | Status |
|----------|-------|-------------------|------|--------|--------|
| `quest_tl_01` | "Rennau: The Ledger" | `{}` (unconditional; silent) | STN *(was mis-remapped LCY)* | Harrow Manifest + Rennau Friendly | [✅ LIVE] |
| `quest_tl_02` | "Rennau: The Embargo" | `tlLedgerRead` | TL | embargo decision + FU6 referral → tl_03 | [✅ LIVE] |
| `quest_tl_03` | "Rennau: The Missing Ship" | questsDone `tl_02` + not `tlMissingShipSolved` | STN | 300gp + Ori's Account + Rennau Dear Friend (paid once, via onComplete) | [✅ LIVE] |

### The Architecture — Magistra Muffat's Station 7 thread (§ARCH-01 / §ARCH-02)

Muffat's beats run LCY → DUS → SVO and back (the family numbers 01, 02, 03 and 05); the Antecedent chamber HAJ, below HKG, closes the question; Benedikt Rasp's four Architecture beats are hook-driven (no `activateNode`) and point at the Scholar's Quarter. Side quests pay from `onComplete`, the one skill check from `onPass`.

| ID | Title | Type | Node → waypoint | Cond | Reward | Arrive? |
|----|-------|------|------|------|--------|---------|
| `quest_muffat_01` | The Third Berth | [SKILL CHECK] DEX Stealth DC 13, retry next day | LCY | holds Trade Seal (Shard #1) | `muffatBerthReached` + 150gp + 150 XP (`onPass`) — giver `magistra_elara_muffat` | ✅ |
| `quest_muffat_02` | The Distribution Pattern | [SIDE] | LCY → DUS | `muffatBerthReached` | at DUS → 300gp + 250 XP, `muffatManifestRead`, Shipping Manifest (Intercepted) | ✅ |
| `quest_muffat_03` | The Dark Station | [SIDE] | LCY → SVO | `muffatManifestRead` | at SVO → 350gp + 300 XP, `station7LogRead`, Station 7 Transmission Log | ✅ |
| `quest_muffat_05` | Cycle 4 | [SIDE] | LCY → LCY | `antecedentMet` | `cycle4NoteRead` → 200gp + 150 XP, Scholar Kings Requisition (Handwritten) | ✅ |
| `quest_solm_01` | The Field Analyst | [SIDE] | LCY → STN | `antecedentMet` | `solmFound` → 150gp + 200 XP, Analyst Solm Field File — giver `proprietor_dusk` | ✅ LCY; STN's cell is held by `LCY` |
| `quest_antecedent_01` | The Question | [SIDE] | HKG → HAJ | `suppressorLogRead` | `antecedentMet` → 400 XP — giver `auros` | ✅ |
| `quest_va_01` | The Architecture: Five Marks | [SIDE] | hook → LHR | — | `vaAllMarksFound` → narrative only — giver `benedikt_rasp` | hook |
| `quest_va_02` | The Architecture: Constructor's Log | [SIDE] | hook → NUE | — | `vaLogFound` → The Constructor's Log (readable) | hook |
| `quest_va_03` | The Architecture: The Sealed Tunnel | [SIDE] | hook → GVA | — | `vaLastWardVisited` → 200gp | hook |
| `quest_va_04` | The Architecture: The Chain | [SIDE] | hook → NUE | — | `vaArchitectureKnown` → 500gp | hook |

### §SPARK-01 — The Harmony Chain (📋 PLANNED)

**Arc:** French vignette theater, 2 acts, 5 scenes. Objects created/destroyed as emotional tokens. Friendship chain: cat → mouse → blood tick → mind-control parasite → harmony. Authority figure (Inspector Wren-Pembury) has an impossibly inconsistent backstory — witness protection. Naval component at MS: "Steamboat Who Done It" — the monster is friendly.

| Quest ID | Title | Type | Node | Activation | Completion | Reward |
|----------|-------|------|------|-----------|------------|--------|
| `quest_spark_01` | "Smalt" | [SKILL CHECK] CHA DC 10 | DK | Always at DK | `smaltBefriended=true` | Smalt's Trust (token) + 100gp + 100 XP |
| `quest_spark_02` | "The Overture" | [ACCOMPLISHMENT] | DK | `smaltBefriended` | `pipMet=true` | Pip's Friendship Bead (token) + 150 XP |
| `quest_spark_03` | "Clot's Revelation" | [SKILL CHECK] WIS DC 13 | MS | `pipMet` | `bioluminescentParasiteFound=true` | Clot's Glow (1-use torch) + 200gp + 200 XP |
| `quest_spark_04` | "The Steamboat Who Done It" | [SKILL CHECK] INT DC 14 | MS | `bioluminescentParasiteFound` | `whodunitSolved=true` | Letter of Safe Passage + 300gp + 300 XP |
| `quest_spark_05` | "Aldous Comes Clean" | [ACCOMPLISHMENT] | DK | `whodunitSolved` + `wrenpemburyInconsistencyNoticed` | `aldousConfessed=true` | 400gp + 400 XP + Aldous recurring ally |

**`quest_spark_01` — "Smalt"** *(Scene 1: The Problem)*
*Node: DK. Trigger: always available at Harbor Docks. Object: Smalt's Trust (dried salt fish).*
- Inspector Wren-Pembury presents his King's Writ (Counterfeit). The harbor cat Smalt has been sitting on cargo manifests since Tuesday. The Inspector wants it removed.
- Act I: [STORY SKILL CHECK] CHA Persuasion DC 10 — befriend the cat. (On fail: Smalt bites for 1 damage, memorable; retry allowed. The Inspector looks vindicated. On pass: Smalt drops Smalt's Trust and begins following.)
- Act II: [ACCOMPLISHMENT] Inspector is displeased; backstory claim #1 delivered: "The Pembury estate, Eastern Reach, three hundred years."
- Act III: No battle. Smalt as the "obstacle" is defused by kindness.
- Act IV: Smalt's Trust created. First link in the chain.
- Act V: Inspector says *"This resolves nothing officially."* He is wrong.
- **Reward:** Smalt's Trust (quest token, destroyed in Scene 2) + 100gp + 100 XP.

**`quest_spark_02` — "The Overture"** *(Scene 2: The Unlikely Alliance)*
*Node: DK/MQ boundary. Trigger: `smaltBefriended`. Object: Pip's Friendship Bead (gnawed wooden bead).*
- Smalt leads the player to Pip the dock mouse. A cat and a mouse, sitting together near the MQ entrance.
- Act I: [ACCOMPLISHMENT] Meet Pip. The alliance is presented without explanation.
- Act II: Inspector reappears (tracking the Writ). Mentions his father "the Admiral." [INT DC 12 optional check — `wrenpemburyInconsistencyNoticed=true` — no fail state, retry until noticed]
- Act III: No battle. Pip's presence is the obstacle resolved by acceptance.
- Act IV: Pip gives the player its gnawed bead. Smalt eats the Smalt's Trust (endorsement of the alliance). Token: Smalt's Trust destroyed; Pip's Friendship Bead created.
- Act V: Vendor Mira, if encountered, notes "the calm mouse" with mild recognition.
- **Reward:** Pip's Friendship Bead (token, handed to Inspector in Scene 5) + 150 XP.

**`quest_spark_03` — "Clot's Revelation"** *(Scene 3: The Revelation)*
*Node: MS. Trigger: `pipMet`. Object: Clot's Glow (bioluminescent pustule from the blood tick Clot).*
- Pip travels with the player to the Tilbury Star. Brannick the rat catcher is in the hold, surrounded by rats who are not behaving like rats.
- Act I: [STORY SKILL CHECK] WIS Medicine/Nature DC 13 — examine the blood tick Clot on Pip's ear. On pass: Clot detaches cleanly; the pustule glows amber; The Warmth is identified as a colonial microorganism producing social bonding chemistry.
- Act II: [ACCOMPLISHMENT] Brannick testifies: *"They never bit me once."* The cargo hold smells unusual.
- Act III: No battle. The "monster" is first identified here — it is not hostile.
- Act IV: Clot's Glow created (1-use item: warm amber light, 30ft radius, 1 hour). Inspector appears on deck, mentions "Saltwick" unprompted — backstory claim #3.
- Act V: The Warmth is named. The mystery is not yet solved — the perfumes need investigation.
- **Reward:** Clot's Glow + 200gp + 200 XP.

**`quest_spark_04` — "The Steamboat Who Done It"** *(Scene 4: The Mystery)*
*Node: MS. Trigger: `bioluminescentParasiteFound`. Object: Letter of Safe Passage (from the captain, for solving the mystery).*
- The captain reports the imported perfume cargo has spoiled. Commercially useless. Smells "warm and extremely personal." She wants answers before port.
- Act I: [STORY SKILL CHECK] INT Investigation DC 14 — trace the Warmth colony: Clot → Pip's wandering → warm perfume vats → full colony bloom. The "murder victim" (the perfumes) was ruined by friendship.
- Act II: [ACCOMPLISHMENT] Brannick confirms the timeline. The rats are witnesses. The Inspector is aboard.
- Act III: No battle. The confrontation is with the Inspector: three inconsistent claims now on record. The player faces the mystery's human layer.
- Act IV: [ACCOMPLISHMENT] `whodunitSolved=true`. The captain accepts the explanation. The Warmth colony is not destroyed — it is transferred (in a sealed jar) to the player.
- Act V: Inspector, watching the resolution, says: *"You solved it without removing anything."* He is thinking about himself.
- **Reward:** Letter of Safe Passage (future gate use at port nodes) + 300gp + 300 XP.

**`quest_spark_05` — "Aldous Comes Clean"** *(Scene 5: The Confession)*
*Node: DK. Trigger: `whodunitSolved` + `wrenpemburyInconsistencyNoticed`. Object: Letter of True Passage (Aldous writes it).*
- The player confronts Aldous with the three inconsistencies: the Estate, the Admiral, Saltwick. No roll required. The player presents the evidence. Aldous has watched the player show kindness to a cat, make an alliance with a mouse, examine a tick without disgust, and solve a mystery by recognizing the monster was friendly. He cannot maintain the performance.
- Act I: [ACCOMPLISHMENT] Aldous tears the King's Writ (Counterfeit). Token destroyed.
- Act II: [ACCOMPLISHMENT] He returns Pip's Friendship Bead to the player ("I understand why you should have this"). Token transferred back.
- Act III: No battle. The confession is the climax.
- Act IV: [ACCOMPLISHMENT] He writes the Letter of True Passage (his real authority document, valid). Token created.
- Act V: *"My name is Aldous. I have contacts in six ports. If you need something that isn't on any manifest, I am who you speak to."* `aldousConfessed=true`. Aldous becomes a recurring ally NPC at DK.
- **Reward:** Letter of True Passage + 400gp + 400 XP + Aldous recurring ally (black market contacts in Tilbury, Visby, Malta).
- **⚠ Engine findings (§VM-01-G-FU-d, 2026-08-05):** (1) Scene 1's counterfeit-writ beat was **circular-dead since it shipped** — the LCY panel's insertion guard required `kingsWritSeen`, whose only writer was the Inspector button inside that panel; the arc survived only because `quest_spark_01` (gate `{}`) sets `smaltBefriended` from the quest panel, skipping the writ scene and its item entirely. Fixed in the `spark-lcy-harmony` hook: the panel inserts whenever LCY renders, and the button gates on its own flag (no second writ). (2) The Scene 5 confrontation **double-paid** (found 2026-08-05, **FIXED 2026-08-06 §SPARK-01-FU**): the panel button and `quest_spark_05`'s `onComplete` each granted +400gp/+400 XP and each added a Letter of True Passage (the quest completes on `aldousConfessed` in the same render). The fix is the la_riva/hg1 shape: the button now writes only `aldousConfessed`; the quest's `onComplete` is the single payer. The button's own `storyMsg` was never readable anyway (destroyed by its own bare `storyRender` — §BOARD-01-FU6 class), so the player-visible text is unchanged. Single-pay pinned by `uqf-node-harbor.test.js`.

---

**The Harmony Chain — complete arc reward:** All five links closed (Smalt + Pip + Clot + The Warmth + Aldous = five-creature harmony). Bonus flag: `harmonyChainComplete: true`. Future §SPARK arcs recognize this flag and give the player a reputation for kindness to small things.

---

### §SPARK-01 SEA Extension (✅ LIVE — three quests; the spec is plan-archive.md §SPARK-01-H)

A Deep Warmth Eel (CR 4, non-aggressive) at open sea between DK and LW. Three-mile calm radius. Two pirate crews cooperating. Monster hunt: 4-phase structure. Resolution: escort the eel to deeper water. Reward: pirate crews owe a debt; sea route unlocks.

| ID | Title | Type | Node → waypoint | Cond | Reward | Arrive? |
|----|-------|------|------|------|--------|---------|
| `quest_sea_01` | The Calm Sea | [SIDE] | SEN → NWI | `{}` | at NWI → `seaStrangenessNoticed` + 100 XP — giver `ship_captain` | ⛔ SEN's cell is held by `LCY`; NWI is primary |
| `quest_sea_02` | The Warmth Eel | [SKILL CHECK] INT Investigation DC 13, retryable | NWI | `seaStrangenessNoticed` | `warmthEelFound` (`onPass`) — giver `redmast_quartermaster` | ✅ |
| `quest_sea_03` | The Escort | [SKILL CHECK] WIS Nature DC 14, retryable | NWI | `warmthEelFound` | `warmthEelEscorted` (`onPass`) | ✅ |

---

## THE TILBURY STAR VOYAGE — §NAVAL-01 · §PORT-01 · §PORT-02 · §SPARK-02 · §WHODUNIT-01 · §HUNT-02

The ship's run after §SPARK-01: the intercept three miles out (GCI), Saltwick (MME), Dunfall (DNF, opened by `sq_2`), the bilge aboard (SEN) and the relay road inland (WRO → BNX). Side quests pay from `onComplete`, skill checks from `onPass`; the role trio at GCI is gated on `sbChosenRole`.

### §NAVAL-01 — A Privateer Commission (GCI, Captain Vera Keel)

| ID | Title | Type | Node | Cond | Reward | Arrive? |
|----|-------|------|------|------|--------|---------|
| `quest_sb_01` | A Privateer Commission | [SIDE] | GCI | `{}` | `sbApproachSeen` → nothing paid; the role choice is the pay — giver `captain_vera_keel` | ✅ |
| `quest_sb_parley` | Speak to Their Captain | [SKILL CHECK] CHA Persuasion DC 12, one try | GCI | `sbApproachSeen` + `sbChosenRole` = parley | `sbParleySucceeded` (`onPass`) | ✅ |
| `quest_sb_examine` | Read the Letter of Marque | [SKILL CHECK] INT Investigation DC 11, one try | GCI | `sbApproachSeen` + `sbChosenRole` = examine | `sbPapersRead` (`onPass`) | ✅ |
| `quest_sb_fight` | Board and Clear | [BATTLE] `SB_PRIVATEER` | GCI | `sbApproachSeen` + `sbChosenRole` = fight | `sbResolved` + 200gp + 400 XP + Letter of Marque (Keel) | ✅ |

### §PORT-01 — Saltwick (MME, Harbormaster Dorit)

| ID | Title | Type | Node | Cond | Reward | Arrive? |
|----|-------|------|------|------|--------|---------|
| `quest_sk_01` | The Unwritten Port | [SIDE] | MME | `{}` | `saltwickAccessed` → nothing paid — giver `harbormaster_dorit` | ✅ |
| `quest_sk_02` | The Missing Consignment | [SKILL CHECK] CHA Persuasion DC 12, retryable | MME | `saltwickAccessed` | `saltwickJobAccepted` (`onPass`) | ✅ |
| `quest_sk_hull` | The Cracked Strake | [SIDE] | MME | `saltwickAccessed` | `shipRepaired` (the 200gp dry dock) → +200 XP | ✅ |

### §PORT-02 — Dunfall (DNF, Mairén Fionn)

| ID | Title | Type | Node | Cond | Reward | Arrive? |
|----|-------|------|------|------|--------|---------|
| `quest_df_01` | The Open Harbor | [SIDE] | DNF | `{}` | `dunfallAccessed` → nothing paid — giver `mairén_fionn` | ✅ |
| `quest_df_02` | The Salt Price | [SKILL CHECK] WIS Insight DC 11, retryable | DNF | `dunfallAccessed` | `dfBarterLearned` (`onPass`) | ✅ |

### §SPARK-02 — The Commissioner's Problem (DNF)

| ID | Title | Type | Node | Cond | Reward | Arrive? |
|----|-------|------|------|------|--------|---------|
| `quest_spark2_01` | The Commissioner's Problem | [SIDE] | DNF | `dunfallAccessed` | `spark2HookReceived` — giver `mairén_fionn` | ✅ |
| `quest_spark2_02` | Bram and the Ledger | [SKILL CHECK] WIS Animal Handling DC 11, retryable | DNF | `spark2HookReceived` | `bramBefriended` (`onPass`) | ✅ |
| `quest_spark2_03` | Bram Leads South | [SIDE] | DNF | `bramBefriended` | `oatMet` | ✅ |
| `quest_spark2_04` | What Oat Carries | [SKILL CHECK] INT Nature DC 12, one try | DNF | `oatMet` | `brimFound` (`onPass`) | ✅ |
| `quest_spark2_05` | Commissioner Fehn's Three Names | [SIDE] | DNF | `brimFound` | `fehnConfessed`; the DNF confrontation button pays 400gp + 400 XP, the quest pays nothing | ✅ |

### §WHODUNIT-01 — Missing from the Hold (SEN, the ship's captain)

| ID | Title | Type | Node | Cond | Reward | Arrive? |
|----|-------|------|------|------|--------|---------|
| `quest_bilge_01` | Missing from the Hold | [SIDE] | SEN | `saltwickAccessed` | `whodunit2HookReceived` — giver `ship_captain` | ⛔ SEN's cell is held by `LCY` |
| `quest_bilge_02` | The Port Drain | [SKILL CHECK] INT Investigation DC 12, one try | SEN | `whodunit2HookReceived` | `whodunit2ClueFound` (`onPass`) | ⛔ |
| `quest_bilge_03` | What Delt Remembers | [SKILL CHECK] WIS Insight DC 13, one try | SEN | `whodunit2ClueFound` | `whodunit2WitnessRead` (`onPass`) | ⛔ |
| `quest_bilge_04` | Clear the Bilge | [BATTLE] `MS_BILGE` | SEN | `whodunit2WitnessRead` | `whodunit2Solved` + 600gp + 600 XP + Sea Spawn Scale Fragment | ⛔ |

### §HUNT-02 — The Relay Road (WRO → BNX, the Elder Fisherwoman)

| ID | Title | Type | Node | Cond | Reward | Arrive? |
|----|-------|------|------|------|--------|---------|
| `quest_hunt2_01` | The Relay Road Warning | [SIDE] | WRO | `{}` | `huntHook2Received` — giver `the_elder_fisherwoman` | ✅ |
| `quest_hunt2_02` | Reading the Road | [SKILL CHECK] WIS Perception DC 11, one try | WRO | `huntHook2Received` | `bendRoadClue` (`onPass`) | ✅ |
| `quest_hunt2_03` | The Sleeping Post | [SKILL CHECK] INT Investigation DC 13, one try | BNX | `bendRoadClue` | `bendLairFound` (`onPass`) | ✅ |
| `quest_hunt2_04` | Drive the Hag Out | [BATTLE] `BN_NIGHTHAG` | BNX | `bendLairFound` | `hagDefeated2` + 400gp + 600 XP + Relay Station Token | ✅ |

---

## VISBY — Act V (Nodes: alley, sewers, goblin_cave, pirate_cave, bar)

*(Existing quests live.)*

### Visby Underground Arc (§XX — VS/TRD; **revived §VM-01-G3 2026-07-28**, was entirely dead: `NODE_MAP.VS` had no `code` field)

| Quest ID | Title | Gate (activation) | Node | Reward | Status |
|----------|-------|-------------------|------|--------|--------|
| `quest_vs_01` | "Solvak: The Collector" | `{}` (unconditional; silent — the old "Act V+" leg could never fire at an act-2 node) | VS | Solvak Friendly + `vsDebtProbed` | [✅ LIVE] |
| `quest_vs_02` | "Yva: The Broker" | `vsDebtProbed` (or §BOARD-01-FU6 referral unlock; Yva's TRD button keys on the quest being active) | VS | Hollow Hands Seal + Yva Friendly | [✅ LIVE] |
| `quest_vs_03` | "Mordus Pays" | `vsWeaponsFound` | VS | 400gp + `vsDebtSettled`/`vsShamanKnown` (paid once, via onComplete) | [✅ LIVE] |
| `quest_vs_warden` | "The Warden" | hook-driven (Layer 56 Void Shaman hook; `activateNode:null`) | MT tunnel | `wardensLegacyKnown` + warden token | [✅ LIVE] |

---

## EPIC BATTLEGROUNDS — Approach Quests (✅ ALL LIVE — §D01-01 + §D02)

### The twenty approach pairs — the `_primary` / `_return` quests (§D01-01)

Each battleground has a giver at a road node and two quests. `_primary` completes on the battleground's boss battle and pays nothing itself (the boss drop is the pay); `_return` completes on `ebReturnDone.<battleground>` and pays its `reward` in gold. *Arrive?* is the giver node's cell rule, with the battleground's own failure noted where it has one (the eight chains §AUDIT-03x counts).

| Battleground | `_primary` → battle | `_return` → pays | Giver node | Giver | Arrive? |
|--------------|---------------------|-------------------|------------|-------|---------|
| Abyssal Scriptorium | `quest_ea_primary` → IST | `quest_ea_return` → 300gp | RAI | `captain_selene_draketide` | ✅ RAI; ⛔ IST's cell is held by `SEA` |
| Wreck of the Unbroken | `quest_eb_primary` → FLR | `quest_eb_return` → 300gp | BGI | `harbormaster_tula` | ✅ |
| Scholar Kings' Forge | `quest_ec_primary` → SOF | `quest_ec_return` → 250gp | GIB | `runewright_ossian` | ✅ |
| Trench Titan | `quest_ed_primary` → OTP | `quest_ed_return` → 320gp | SID | `first_mate_darro` | ✅ SID; ⛔ OTP's cell is held by `WG0` |
| Pharaoh's Vault | `quest_ee_primary` → CAI | `quest_ee_return` → 300gp | AHB | `caravan_master_zephyrine` | ✅ AHB; ⛔ CAI's cell is held by `AHB` |
| Thornwood Maw | `quest_ef_primary` → PRN | `quest_ef_return` → 220gp | FRO | `woodcutter_bram` | ✅ |
| Void Shaman's Sanctum | `quest_eg_primary` → TBS | `quest_eg_return` → 400gp | BK | `warlord_kael_mordus` | ⛔ BK's cell is held by `LHR` |
| Loch of the Drowned King | `quest_eh_primary` → INV | `quest_eh_return` → 260gp | KIR | `shepherd_rona` | ✅ |
| Isle of the Wyrm Crown | `quest_ei_primary` → ACE | `quest_ei_return` → 280gp | PDL | `island_elder_maris` | ✅ |
| Canopy Cathedral | `quest_ej_primary` → SJO | `quest_ej_return` → 250gp | BEL | `herbalist_mael` | ✅ |
| Shattered Seraph's Spire | `quest_ek_primary` → MAD | `quest_ek_return` → 0gp | CTU | `grounded_seraph_ithiel` | ✅ |
| Sunken God's Throne | `quest_el_primary` → BEG | `quest_el_return` → 280gp | TRF | `river_trader_aldous` | ✅ |
| Noonwraith Queen's Field | `quest_em_primary` → WAW | `quest_em_return` → 260gp | MAN | `farmer_wren` | ✅ |
| Leviathan's Eye | `quest_eo_primary` → KUN | `quest_eo_return` → 320gp | SID | `navigator_cassius` | ✅ |
| Admiral's Last Cove | `quest_ep_primary` → HAV | `quest_ep_return` → 300gp | NAS | `fence_boss_carrick` | ⛔ NAS's cell is held by `VBY`; HAV's by `HOR` |
| Frost Warden's Throne | `quest_er_primary` → RKV | `quest_er_return` → 350gp | LYR | `fur_trader_sigrid` | ✅ |
| Sunken Altar | `quest_es_primary` → SDR | `quest_es_return` → 240gp | MSY | `herbalist_gwynne` | ⛔ MSY's cell is held by `WG0` |
| Peak of the Eldest | `quest_et_primary` → KTM | `quest_et_return` → 300gp | ERF | `blacksmith_dora_flint` | ✅ ERF; ⛔ KTM's cell is held by `INN` |
| Djinn Lord's Palace | `quest_ev_primary` → MCT | `quest_ev_return` → 350gp | DOH | `izador_al-rashun` | ✅ |
| Hag Mother's Cradle | `quest_ew_primary` → PMO | `quest_ew_return` → 200gp | SDQ | `wane` | ⛔ SDQ's cell is held by `WG0` |

### Abyssal Scriptorium (AT)

| Quest ID | Title | Type | Acts | Reward | Status |
|----------|-------|------|------|--------|--------|
| `quest_d0201_a1–a5` *(design: quest_scriptorium_approach)* | "The Drowned Page" | [SKILL CHECK]+[BATTLE] | 5 acts | Shard path unlock + `scriptorium_approach_complete` | [✅ LIVE §D02-01] |

**`quest_scriptorium_approach` — "The Drowned Page"** *(5-act, see §D02-01)*
*Node: AT approach. Trigger: first AT entry. Object: drowned manuscript page, Froberger's hand.*
1. [STORY SKILL CHECK] INT Investigation DC 10 — recognize Froberger's handwriting
2. [STORY SKILL CHECK] DEX Stealth DC 12 — cross flooded chamber silently
3. [STORY GATING BATTLE] Archivist's Guardian AC 16 / HP 40
4. [STORY SKILL CHECK] INT Arcana DC 13 — decode Scholar King cipher
5. [STORY-DRIVING] CHA Persuasion DC 14 — "What are you here to preserve?"

### Void Shaman's Sanctum (BK)

| Quest ID | Title | Type | Acts | Reward | Status |
|----------|-------|------|------|--------|--------|
| `quest_d0205_a1–a5` *(design: quest_void_maze)* | "The Chalk Mark" | [SKILL CHECK]+[BATTLE] | 5 acts | `mazeSolvedChecks: 3` + boss room unlocked | [✅ LIVE §D02-05] |

**`quest_void_maze` — "The Chalk Mark"** *(5-act, see §D02-05)*
*Node: BK approach — Void Fracture Maze. Object: chalk mark on the first wall.*
1. [STORY SKILL CHECK] DEX Sleight of Hand DC 10 — mark holds (auto 1 check)
2. [STORY SKILL CHECK] WIS Survival DC 14 — first wall shift
3. [STORY GATING BATTLE] Void Construct AC 15 / HP 40 — defeat auto-completes check 3
4. [STORY SKILL CHECK] INT Arcana DC 14 — read void runes on final panel
5. [STORY-DRIVING] STR/DEX Athletics DC 12 — dash through closing wall

### (Arcane Inversion Zone — AT mid-chamber or CY_VOID)

| Quest ID | Title | Type | Acts | Reward | Status |
|----------|-------|------|------|--------|--------|
| `quest_d0209_a1–a5` *(design: quest_void_flux)* | "The Spell Scroll" | [SKILL CHECK]+[BATTLE] | 5 acts | Dual-use scroll + `voidFluxCleared` | [✅ LIVE §D02-09] |

**`quest_void_flux` — "The Spell Scroll"** *(5-act, see §D02-09)*
*Node: AT mid-chamber or CY_VOID. Object: a spell scroll in the player's pack.*
1. [STORY SKILL CHECK] INT Arcana DC 10 — recognize inversion field
2. [STORY SKILL CHECK] INT Arcana DC 12 — choose immunization
3. [STORY GATING BATTLE] 3× Void-flux constructs AC 14 / HP 20
4. [STORY SKILL CHECK] INT Arcana DC 13 — stabilize the changed scroll
5. [STORY-DRIVING] DEX Acrobatics DC 12 — dash through rebound window

---

## COSMIC REALM — Act VIII (Node: CO)

### Sacrifice Gates — Catacombs Approach

| Quest ID | Title | Type | Acts | Reward | Status |
|----------|-------|------|------|--------|--------|
| `quest_d0204_a1–a5` *(design: quest_memory_gate)* | "The Journal Entry" | [SKILL CHECK]+[BATTLE bypass] | 5 acts | Passage + `memorGatePassedEntry` | [✅ LIVE §D02-04] |

**`quest_memory_gate` — "The Journal Entry"** *(5-act, see §D02-04)*
*Node: CO approach — catacombs. Object: a journal entry, chosen to be offered.*
1. [STORY SKILL CHECK] INT Arcana DC 10 — read the rune inscription
2. [STORY SKILL CHECK] WIS Insight DC 12 — identify which entry to surrender
3. [STORY GATING BATTLE] Gate Guardian AC 15 / HP 45 — bypass path if refusing to pay
4. [STORY SKILL CHECK] CHA Persuasion DC 13 — "I give this freely"
5. [STORY-DRIVING] INT Investigation DC 12 — examine the room on the other side

### Codex Core Chamber — Pre-Boss

| Quest ID | Title | Type | Acts | Reward | Status |
|----------|-------|------|------|--------|--------|
| `quest_d0210_a1–a5` *(design: quest_loop_heart)* | "The Seventh Shard" | [SKILL CHECK]+[BATTLE] | 5 acts | Shard + ending variant set + `codexCoreChosen` | [✅ LIVE §D02-10] |

**`quest_loop_heart` — "The Seventh Shard"** *(5-act, see §D02-10)*
*Node: CO pre-boss chamber. Object: the seventh Shard inside the pulsing column.*
1. [STORY SKILL CHECK] WIS Perception DC 10 — sense the room's history
2. [STORY SKILL CHECK] INT Arcana DC 12 — read the three paths and their costs
3. [STORY GATING BATTLE] Commander Auros AC 22 / HP 300 / ATK+12 (or STR DC 15 Destroy bypass)
4. [STORY SKILL CHECK] Choice-dependent (WIS DC 12 / CHA DC 17 / none)
5. [STORY-DRIVING] CHA Persuasion DC 12 — Sweelinck's Last Question; honest answer passes

---

## THE SAUL→PAUL ARC — Act IV (§LIX–§LXIX + §PAUL-01)
*(Live nodes: JRS, DAM, RUH, ADA, HTY, CI2, KYA, KVA, ATH, EF2, ZTH, MLA, FCO — design-era codes HR/KS/DR/TS/AO/LT/PL/AE/KR/EF/MT/ST from `lab-report-saul-paul-vignette-spec.md` shipped under real-world names. Full-chain doc sync 2026-07-07 (§FUTURE-01 audit): the 13 conversion-chain/Malta quests below were live but undocumented.)*

Skill checks use the Ceremonia Roll system; accomplishment quests complete on `S_story` flags set by node arrival (`storyRender` — the DAM conversion, the MLA snake), NPC first-interaction mutations (`NPC_DIALOGUE` quoteFn ladders — Anath, Barnach), or the sleep-day counters (`storyConfirmSleep` — 3 blind days at DAM, 15 Hellenist days at JRS). The conversion is the availability rewrite: every quest below (except the opener) is flag-gated downstream of `saulConverted`, set on first DAM arrival. Post-conversion, `Thorn (Permanent)` appears on the character sheet — no mechanical penalty, no tooltip, no removal quest.

| Quest ID | Title | Type | Check | DC | Pass Flag | XP | Status |
|----------|-------|------|-------|----|-----------|----|--------|
| `quest_road_damascus` | "The Light at Noon" | [ACCOMPLISHMENT] | — | — | `saulConverted` | 200 | [✅ LIVE §LIX — JRS→DAM; needs Three Jerusalem Warrants] |
| `quest_anath` | "The House on the Lower Road" | [ACCOMPLISHMENT] | — | — | `anathSightRestored` | 300 | [✅ LIVE §LIX — DAM; 3 blind sleep-days, Anath arrives day 3] |
| `quest_basket_damascus` | "Over the Wall" | [SKILL CHECK] | STR Athletics | 12 | `escapedDamascus` + `basketRopeComplete` | 150 | [✅ LIVE §LX — DAM; retryable, 1-day gate] |
| `quest_hellenists_jerusalem` | "Fifteen Days" | [ACCOMPLISHMENT] | — | — | `hellenistsThreaten` | 150 | [✅ LIVE §LXI — JRS; 15 sleep-days after Barnach vouches] |
| `quest_barnach_finds` | "A Year Looking" | [ACCOMPLISHMENT] | — | — | `barnachFoundPaul` | 100 | [✅ LIVE §LXI — ADA (Tarsus)] |
| `quest_antioch_commission` | "The Sending" | [ACCOMPLISHMENT] | — | — | `commissionReceived` | 150 | [✅ LIVE §LXII — HTY] |
| `quest_ezzir` | "The Sorcerer's Opposition" | [SKILL CHECK] | WIS Insight | 14 | `ezzirConfronted` | 200 | [✅ LIVE §LXIII — CI2; retryable, 1-day gate] |
| `quest_governor_cyprus` | "The Governor Listens" | [SKILL CHECK] | CHA Persuasion | 11 | `govCopperConverted` | 250 | [✅ LIVE §LXIII — CI2; retryable, same-day] |
| `quest_lame_lystra` | "The Gate" | [SKILL CHECK] | WIS Faith | 10 | `lameManHealed` | 200 | [✅ LIVE §LXIV — KYA; non-retryable, fail is narrative] |
| `quest_stoning_lystra` | "Left for Dead" | [SKILL CHECK] | STR Athletics | 13 | `stoningEvent` (both paths; fail → HP capped 1 at KYA) | 150 | [✅ LIVE §LXIV — KYA] |
| `quest_philippi` | "The Purple Merchant" | [ACCOMPLISHMENT] | — | — | `lyraConverted` | 150 | [✅ LIVE §LXV — KVA] |
| `quest_prison_phillam` | "Seven Stairs, Then Five" | [SKILL CHECK] | WIS Insight | 12 | `phillippiJailerConverted` | 200 | [✅ LIVE §PAUL-01 — KVA] |
| `quest_areopagus` | "To An Unknown One" | [SKILL CHECK] | CHA Persuasion | 13 | `areopagusSpeech` | 200 | [✅ LIVE §LXVI — ATH] |
| `quest_ephesus_riot` | "The Silversmith's Meeting" | [SKILL CHECK] | CHA Persuasion | 12 | `demetriusRiotEscaped` | 175 | [✅ LIVE §LXVII — EF2] |
| `quest_corinth_letters` | "Tent Canvas & Letters" | [ACCOMPLISHMENT] | — | — | `corinthLettersWritten` | 200 | [✅ LIVE §LXVIII — ZTH] |
| `quest_shipwreck_melta` | "Two Hundred and Seventy-Six" | [SKILL CHECK] | STR Athletics | 12 | `shipwreckSurvived` | 250 | [✅ LIVE §PAUL-01 — MLA] |
| `quest_snake_melta` | "It Did Nothing" | [ACCOMPLISHMENT] | — | — | `maltaSnakeEvent` | 150 | [✅ LIVE §PAUL-01 — MLA; fires on arrival, no roll, no explanation] |
| `quest_rome_arrest` | "The Rented House" | [ACCOMPLISHMENT] | — | — | `romeArrestBegun` | 300 | [✅ LIVE §LXIX — FCO] |

**Chain order (flag-gated availability, movement never gated):** `road_damascus` (warrants) → `saulConverted` → `anath` → `anathSightRestored` → `basket_damascus` · then `barnachVouchedHR` (JRS Barnach NPC) → `hellenists_jerusalem` → `barnach_finds` → `antioch_commission` → `commissionReceived` → `ezzir` → `governor_cyprus` · `philippi` → `prison_phillam` · `shipwreck_melta` → `snake_melta` → `rome_arrest`. `lame_lystra` → `stoning_lystra` (questsDone gate).

**`quest_philippi` — "The Purple Merchant"** *(Node: KVA — design PL. Object: the purple cloth arranged on the bridge stall.)*
Lyra has been watching from across the bridge for two days before she speaks. When she speaks, it is because she has already decided. NPC first-visit mutation sets `lyraConverted: true`. Quest completes on flag. The earthquake (every door of the city prison opens) is narrated in the NPC text; it is not a separate event.

**`quest_areopagus` — "To An Unknown One"** *(Node: ATH — design AE. Object: the inscription — TO AN UNKNOWN ONE.)*
The altar has been maintained for two hundred years. Paul has been standing in front of it for a long time. CHA Persuasion DC 13: begin with the altar, not with a correction. Pass: Dionysius stays; Damaris stays. Fail: the steward receives the interpretation politely; the council does not invite him to speak.

**`quest_ephesus_riot` — "The Silversmith's Meeting"** *(Node: EF2. Object: the guild meeting notice, larger than the hall.)*
Demetrius's argument is economic and theological simultaneously. The theater fills. CHA Persuasion DC 12: the city clerk reaches the front and names the legal position before the charges can be filed. Pass: the theater empties before dark; the charges are never filed. Fail: Paul leaves Ephesus the next morning.

**`quest_corinth_letters` — "Tent Canvas & Letters"** *(Node: ZTH — design KR. Object: the letters written at night, canvas on the frame behind.)*
Prisca and Akil hire him because he knows the trade. NPC first-visit mutation sets `corinthLettersWritten: true` and delivers the 18-month compressed narrative. Some of the letters written here are the most important things he will ever write. He does not know which ones yet.

**`quest_rome_arrest` — "The Rented House"** *(Node: FCO — design ST. Object: the door that cannot be opened from the inside.)*
Requires `maltaSnakeEvent: true` (Malta arc fires first on arrival at MLA). NPC first-visit mutation by Timael sets `romeArrestBegun: true`. Visitors every day. Letters every night. The arc does not end here. It stops here. Disposition: *"Where are you going next?"*

---

## THE LITTORAL COURTS — Act IV (§SIREN-01)
*(Nodes: LC1, LC2, LC3, LC4, LSO — implemented 2026-05-28)*

Sequential ocean-route arc. Entry: DS.E → LJ0 → LC1 south chain. Four court quests + one parallel Overseer quest. Betrayal mechanic: `checkFailFlag` sets `betrayalThought` / `betrayalWord` / `betrayalDeed` on skill-check fail. Arc-close at LCA reads betrayal count (0 / 1–2 / 3). See `lab-report-littoral-courts.md` for full design record.

| Quest ID | Title | Node | Type | Check | DC | Pass Flag | Fail Flag | XP | Status |
|----------|-------|------|------|-------|----|-----------|-----------|----|--------|
| `quest_aurel_tide` | "The Tidal Schedule" | LC1 | [SKILL CHECK] | WIS Insight | 12 | `aurelTideRead` | `betrayalThought` | 150 | [✅ LIVE §SIREN-01] |
| `quest_calice_bridge` | "The Wheel in the Courtyard" | LC2 | [SKILL CHECK] | INT Investigation | 13 | `caliceBridgeCrossed` | `betrayalWord` | 175 | [✅ LIVE §SIREN-01] |
| `quest_mireille_ami` | "Name Your Standing" | LC3 | [SKILL CHECK] | CHA Persuasion | 14 | `mireilleAmiNamed` | `betrayalDeed` | 200 | [✅ LIVE §SIREN-01] |
| `quest_solen_horizon` | "The Ship That Does Not Come" | LC4 | [SKILL CHECK] | WIS Insight | 13 | `solenSoonRead` | — | 225 | [✅ LIVE §SIREN-01] |
| `quest_sea_overseer` | "The Voice in the Fog" | LSO | [SKILL CHECK] | WIS Insight | 15 | `charmResisted` | `seaOverseerMet` | 250 | [✅ LIVE §SIREN-01] |

**`quest_aurel_tide` — "The Tidal Schedule"** *(Node: LC1 — Port Aurel. Object: the tide table, open on her desk.)*
BUSY (*Occupée*). She reads it while speaking. She speaks while reading it. Every appointment is borrowed from the schedule. WIS Insight DC 12: read that the schedule is calibration, not fact. Pass: you make yourself the appointment; she closes the table; the seal is given. Fail: you wait for the window; `betrayalThought` set; the seal comes eventually.

**`quest_calice_bridge` — "The Wheel in the Courtyard"** *(Node: LC2 — Port Calice. Object: the bridge chain, thick iron links, visible from the window.)*
MAYBE (*Peut-être*). "Perhaps at the evening tide." The wheel mechanism is in the courtyard below. It is not locked. INT Investigation DC 13: find the wheel; cross before the tide. Pass: you turn the wheel; you cross; the perhaps is over. Fail: you wait for the evening; `betrayalWord` set; the crossing happens but you are no longer the person who initiated it.

**`quest_mireille_ami` — "Name Your Standing"** *(Node: LC3 — Port Mireille. Object: the herald at the door, name on his tongue.)*
FRIEND (*Ami*). "My most trusted companion" — said before the herald can speak your name and title. The court nods. The frame is set. CHA Persuasion DC 14: address the court with name and title before the frame holds. Pass: the Lady looks at you differently; the seal is given from a different position. Fail: you counsel the court through the evening; `betrayalDeed` set; the role stays with you.

**`quest_solen_horizon` — "The Ship That Does Not Come"** *(Node: LC4 — Port Solen. Object: the ship on the horizon, three seasons unmoving.)*
SOON (*Bientôt*). She names the ship. The fishermen at the dock have been watching it for three seasons. No one asks them first. WIS Insight DC 13: go to the dock before the court; bring the specific fact back; require a date. Pass: she gives a real date; the letters come with a courier who exists. Fail: you wait; the season passes; the letters arrive eventually by a different path.

**`quest_sea_overseer` — "The Voice in the Fog"** *(Node: LSO — The Fog Bank. Object: the navigator's mouth, speaking in a second register.)*
The Overseer. It has been in the water since Port Aurel, in telepathic contact with the ship's navigator (who is not aware of this). It offers to arrange the fourth court differently. WIS Insight DC 15 (matching Succubus/Incubus charm DC). Pass (`charmResisted`): name the structure flat, without drama; go to the fourth court anyway; the fog lifts. Fail (`seaOverseerMet`): accept the offer; give the specific word at Port Solen; the frame shifts a degree you do not notice.

---

## §CROWN-01 — The Three Crowns of the Swamp [✅ LIVE Layer 105]

9-node arc extending the HS Crones' Domain south (WG0→HCA, c:3). Three Crown domains (Whisper/Glut/Wane) each with 6 quests + 4 junction nodes (3 combat, 1 inn) + arc-close altar. Mechanics: Kindness Meter (`innmotherKindness`), Crone Marks (`croneMarks`), free booking threshold, Mère Boudine name reveal. See `lab-report-crown-three-hags.md`.

| Quest ID | Title | Node | Type | Check | DC | onPass/onComplete | XP | Status |
|----------|-------|------|------|-------|----|----|----|----|
| `quest_whisper_01` | "The Unspoken Request" | HW1 | [SKILL CHECK] | WIS Insight | 12 | `_addCroneMark()` | 150 | [✅ LIVE §CROWN-01] |
| `quest_whisper_02` | "The Withheld Name" | HW1 | [SKILL CHECK] | INT Investigation | 13 | `_addCroneMark()` | 175 | [✅ LIVE §CROWN-01] |
| `quest_whisper_03` | "The Empty Gift" | HW1 | [SKILL CHECK] | WIS Perception | 12 | `_addCroneMark()` | 175 | [✅ LIVE §CROWN-01] |
| `quest_whisper_04` | "The Absent Warning" | HW1 | [SKILL CHECK] | WIS Insight | 14 | `_addCroneMark()` | 200 | [✅ LIVE §CROWN-01] |
| `quest_whisper_05` | "The Saint's Work" | HW1 | [COMPLETION] | — | — | `whisperSaintSeen`, `_innKindness(1)` | — | [✅ LIVE §CROWN-01] |
| `quest_whisper_06` | "The Forgiven Absence" | HW1 | [SKILL CHECK] | CHA Persuasion | 13 | `_addCroneMark()`, `whisperCrownComplete` | 225 | [✅ LIVE §CROWN-01] |
| `quest_glut_01` | "The Offered Feast" | HG1 | [SKILL CHECK] | WIS Insight | 13 | `_addCroneMark()` | 150 | [✅ LIVE §CROWN-01] |
| `quest_glut_02` | "The Smothering Gift" | HG1 | [SKILL CHECK] | CHA Persuasion | 13 | `_addCroneMark()` | 175 | [✅ LIVE §CROWN-01] |
| `quest_glut_03` | "The Locked Door" | HG1 | [SKILL CHECK] | INT Investigation | 14 | `_addCroneMark()` | 200 | [✅ LIVE §CROWN-01] |
| `quest_glut_04` | "The Endless Feeding" | HG1 | [SKILL CHECK] | WIS Insight | 13 | `_addCroneMark()` | 200 | [✅ LIVE §CROWN-01] |
| `quest_glut_05` | "The False Protection" | HG1 | [SKILL CHECK] | WIS Insight | 15 | `_addCroneMark()` | 225 | [✅ LIVE §CROWN-01] |
| `quest_glut_06` | "The Open Hand" | HG1 | [COMPLETION] | — | — | remove Glut's Gift, `glutGiftReturned`, `glutCrownComplete`, `_innKindness(1)` | — | [✅ LIVE §CROWN-01; **dead until §VM-01-G-FU-a** — see note] |
| `quest_wane_01` | "The Carried Grief" | HN1 | [SKILL CHECK] | WIS Insight | 12 | `_addCroneMark()` | 150 | [✅ LIVE §CROWN-01] |
| `quest_wane_02` | "The Diminishing Task" | HN1 | [SKILL CHECK] | STR Athletics | 13 | `_addCroneMark()` | 175 | [✅ LIVE §CROWN-01] |
| `quest_wane_03` | "The Hopeless Errand" | HN1 | [SKILL CHECK] | INT Investigation | 13 | `_addCroneMark()` | 175 | [✅ LIVE §CROWN-01] |
| `quest_wane_04` | "The Burden" | HN1 | [SKILL CHECK] | WIS Insight | 14 | `_addCroneMark()` | 200 | [✅ LIVE §CROWN-01] |
| `quest_wane_05` | "The Drain" | HN1 | [SKILL CHECK] | WIS Insight | 13 | `_addCroneMark()` | 200 | [✅ LIVE §CROWN-01] |
| `quest_wane_06` | "The Refusal" | HN1 | [SKILL CHECK] | CHA Persuasion | 14 | `_addCroneMark()`, `waneCrownComplete` | 225 | [✅ LIVE §CROWN-01] |
| `quest_inn_01` | "The First Night" | INN | [COMPLETION] | — | — | `_innKindness(1)` | — | [✅ LIVE §CROWN-01] |
| `quest_inn_02` | "The Unrequested Thing" | INN | [SKILL CHECK] | WIS Insight | 12 | `_innKindness(1)` | 150 | [✅ LIVE §CROWN-01] |
| `quest_inn_03` | "The Correction" | INN | [SKILL CHECK] | CHA Persuasion | 13 | `_innKindness(1)` | 175 | [✅ LIVE §CROWN-01] |
| `quest_inn_04` | "The Tired Hour" | INN | [SKILL CHECK] | WIS Insight | 12 | `_innKindness(1)` | 150 | [✅ LIVE §CROWN-01] |
| `quest_inn_05` | "The Return" | INN | [COMPLETION] | — | — | `_innKindness(1)` (on return to INN after departing it — `flagsPath:['departedNodes.INN']`) | — | [✅ LIVE §CROWN-01] |
| `quest_inn_06` | "The Free Booking" | INN | [THRESHOLD] | Kindness ≥5 | — | `freeBookingUnlocked`, Innmother's Key | — | [✅ LIVE §CROWN-01] |

**Amendment A — the hag commissions and the iodine track.** A commission opens once the crown quest named in its gate has been *attempted*; the hunts complete on their battle key and pay from `onComplete`, the iodine checks from `onPass`.

| ID | Title | Type | Node | Cond | Reward | Arrive? |
|----|-------|------|------|------|--------|---------|
| `quest_whisper_kelpie` | Track the Silent One | [BATTLE] `HW1_KELPIE` | HW1 | `quest_whisper_01` attempted | its legacy `onComplete` handler | ⛔ HW1's cell is held by `WG0` |
| `quest_whisper_witch` | The Unnamed Thing | [BATTLE] `HW1_WITCH` | HW1 | `quest_whisper_03` attempted | Sea Witch's Tome knowledge (INT checks +1) | ⛔ |
| `quest_glut_mudcrab` | Find What Left | [BATTLE] `HG1_MUDCRAB` | HG1 | `quest_glut_01` attempted | its legacy `onComplete` handler | ⛔ HG1's cell is held by `WG0` |
| `quest_glut_octopus` | What I Fed | [BATTLE] `HG1_OCTOPUS` | HG1 | `quest_glut_03` attempted | Glut's Hoard Fragment (loot) | ⛔ |
| `quest_wane_spawn` | What Moved It Before You | [BATTLE] `HN1_SPAWN` | HN1 | `quest_wane_02` attempted | `waneStoneDCReduced` | ⛔ HN1's cell is held by `WG0` |
| `quest_wane_demon` | The Better Drainer | [BATTLE] `HN1_DEMON` | HN1 | `quest_wane_03` attempted | `atlanteanProcessKnown` + Atlantean Kelp Scroll knowledge | ⛔ |
| `quest_inn_eel` | The Smell in the South Corridor | [BATTLE] `INN_EEL` | INN | `quest_inn_03` attempted | `electricEelOrganHeld` + Electric Eel Organ (craft) | ✅ |
| `quest_iodine_01` | The Salt Test | [SKILL CHECK] INT Investigation DC 11, retryable | INN | `quest_inn_01` attempted | +100 XP (`onPass`) | ✅ |
| `quest_iodine_02` | The Gathered Burn | [SIDE] | INN | `quest_iodine_01` attempted | 2× Swamp Kelp at INN → both consumed, Iodine Salt (+3 to one skill check) | ✅ |
| `quest_iodine_03` | The Charged Reduction | [SIDE] | INN | `electricEelOrganHeld` + `quest_iodine_01` attempted | organ + kelp at INN → both consumed, `atlanteanProcessKnown` | ✅ |

**Kindness Meter thresholds:** ≥3 first register shift · ≥5 free booking + Innmother's Key · ≥7 `innmotherNamed = true` ("Mère Boudine.")

**Crone Mark conversion at HCA:** 6–9 → WIS +1 · 10–14 → WIS +1 + Crone Bead · 15–18 → WIS +1 + Crone Bead + Crone Staff (🪄 +3 ATK, 1d8)

**`quest_whisper_05` — "The Saint's Work"** *(Node: HW1. Object: the cairn at the still water's edge.)*
NOTHING (*Rien*). Whisper tends a small cairn without mention or invitation. Fires on any HW1 return visit after quest_01 attempted. No check. `whisperSaintSeen = true`, `_innKindness(1)`.

**`quest_glut_06` — "The Open Hand"** *(Node: HG1. Object: Glut's Gift jar, warm in the coat.)*
MORE (*Encore*). The jar given at first arrival. Completion: player holds Glut's Gift and is at HG1. No check. Item removed, `glutGiftReturned = true`.
> **§VM-01-G-FU-a (2026-08-05): this quest was DEAD end to end until now, twice over.** (1) The
> gift block's once-guard was `!visited['HG1']`, and `storyCollectLoot` flips `visited[code]`
> earlier in the same render — so the jar was never granted and the quest (gate
> `flags:['glut_gift_held']`) never listed, while HG1's own node text said *"She gives you the
> jar as you arrive."* The panel is a `NODE_PANELS` once-panel now, guarded by
> `!glut_gift_held && !glutGiftReturned`. (2) The completion `flags:['glutGiftReturned']` was
> **circular** — its only writer was the quest's own `onComplete`. The return the paragraph
> above describes is now a real surface: the `hg1-gift-return` `NODE_VERBS` button
> (*🍯 Return Glut's Gift to the feeding pool*) writes the flag, and the quest's own pipeline
> (onComplete + passText) does the rest. Pinned by `uqf-node-verbs-crown.test.js`.

**`quest_inn_03` — "The Correction"** *(Node: INN. Object: the spoon, held incorrectly for the third time.)*
MINE (*À moi*). She corrects it again. The correction is the same each time. CHA Persuasion DC 13: set the spoon down; say you are not leaving. Pass: the correction produces a response she did not have a category for; `_innKindness(1)`. Fail: you apologize; the corrections continue.

---

## §LXX–§LXXIII — The Atlantean Chain (HCA → DS0 → DS1 → DSF → DA1 → DA2 → CAN)

Opened by the Leviathan boss at HCA, §CROWN-01's arc close. Skill checks pay from `onPass`; the button/quest pairs pay once from `onComplete` (the §LXX-01-FU shape, see the note under §QUEST COUNT SUMMARY). Every node of the chain sits in `SEA`'s cell, and HCA itself in `WG0`'s, so nothing here is arrival-activated under the cell rule (§AUDIT-03x).

| ID | Title | Type | Node → waypoint | Cond | Reward | Arrive? |
|----|-------|------|------|------|--------|---------|
| `quest_shore_01` | The Path Opens | [SIDE] | HCA → DS0 | battle `HCA_BOSS` won | at DS0 → `shorePathFound` + 200gp + 200 XP — giver `the_tide_reader` | ⛔ HCA's cell is held by `WG0` |
| `quest_shore_02` | The Bed Register | [SKILL CHECK] WIS Perception DC 12, retryable | DS1 | `{}` | +150 XP (`onPass`) | ⛔ DS1's cell is held by `SEA` |
| `quest_forge_01` | The Mechanism | [SKILL CHECK] INT Arcana DC 14, retryable | DSF | `atlanteanProcessKnown` | +300 XP (`onPass`) — giver `the_forge_echo` | ⛔ |
| `quest_forge_02` | The Smelting | [SIDE] | DSF | `forgeActivated` | `seaElementCrafted` → 400gp + Sea Element (weapon) | ⛔ |
| `quest_sunken_01` | The Foundation | [SKILL CHECK] INT Arcana DC 13, retryable | DA1 | `{}` | +250 XP (`onPass`) — giver `the_stone_inscription` | ⛔ |
| `quest_sunken_02` | The Tide Gate | [SIDE] | DA2 | `inscriptionRead` | `tideGateOpened` → Sea Element consumed, 500gp + 500 XP | ⛔ |
| `quest_depth_01` | The Depth — 18 Meters | [SIDE] | DA2 | `tideGateOpened` | `antecedentDepthMet` → 500 XP + Constructor Design knowledge | ⛔ |
| `quest_ca_01` | The Adjusted Timeline | [SIDE] | LCY → CAN | `tideGateOpened` + `cycle4NoteRead` | `conclaveResponseRead` → 300gp + 300 XP — giver `magistra_elara_muffat` | ✅ LCY; CAN's cell is held by `VBY` |

---

## THE VOID TIDE — Auros's board calls (§BOARD-01-FU8) and Void Below

Day-gated `combat` cards posted by Commander Bruhns (`auros`), each a retryable STR check paying XP from `onPass`; `quest_void_below` is her Undercity side quest.

| ID | Title | Type | Node | Cond | Reward | Arrive? |
|----|-------|------|------|------|--------|---------|
| `quest_void_below` | Auros: Void Below | [BATTLE] `CY_VOID` | HKG | `{}` | favor `auros` 2 + Scholar's Note + EMP Grenade + `bruhnsDepthsReported` | ✅ |
| `quest_void_tide_21` | The Uncollected Bounty | [COMBAT] STR DC 13 | VS | day 21–35 | +150 XP (`onPass`) | ⛔ VS's cell is held by `VBY` |
| `quest_void_tide_35` | The Thing at the Signal-Fire | [COMBAT] STR DC 15 | ECF | day 35–42 | +220 XP (`onPass`) | ✅ |
| `quest_void_tide_42` | The Outriders at the Crossing | [COMBAT] STR DC 17 | RVP | day ≥ 42 | +320 XP (`onPass`) | ✅ |

---

## YUGURT LAKE — §GUIDE-01 · §XLV tournament · §FISH-01/02 (SSJ cabin, BOO lake, MJF)

Emmer Finch's six-beat Self-Discovery arc, the six-opponent cast tournament and the Fisherman's hunts. Every quest here activates at the cabin SSJ, which is primary, and sends the player to the lake BOO, whose cell is held by `LYR` (§AUDIT-03x: the player can meet the Fisherman and never fish). Side quests pay from `onComplete` and `xpAward`, the one skill check from `onPass`.

| ID | Title | Type | Node → waypoint | Cond | Reward | Arrive? |
|----|-------|------|------|------|--------|---------|
| `quest_guide_01` | The Fool's First Cast | [SIDE] | SSJ → BOO | holds Fishing Rod | `fishingCatchLog ≥ 1` → 50 XP — giver `emmer` | ✅ SSJ; ⛔ BOO's cell is held by `LYR` |
| `quest_guide_02` | The Weight of the Hook | [SIDE] | SSJ → BOO | `quest_guide_01` done + 1 catch | `fishingCatchLog ≥ 2` → 150 XP | ✅ |
| `quest_guide_03` | Morning Repetitions | [SIDE] | SSJ → BOO | `quest_guide_02` done | `fishingCatchLog ≥ 5` → 250 XP | ✅ |
| `quest_guide_04` | The Middle Way Sneers | [SKILL CHECK] WIS Insight DC 11, retryable | SSJ | `quest_guide_03` done | +250 XP (`onPass`) | ✅ |
| `quest_guide_05` | The Cast That Didn't Think | [SIDE] | SSJ | `emmerStage4a` | at SSJ → 300 XP | ✅ |
| `quest_guide_06` | Just Be Yourself | [SIDE] | SSJ → BOO | `quest_guide_05` done | `fishingCatchLog ≥ 6` → 400 XP, `emmerComplete`, favor `emmer` 2, Rod of Self-Discovery — giver `the_fisherman` | ✅ |
| `quest_tour_01` | Pip's Challenge | [SIDE] | SSJ | holds Fishing Rod | `yugurtTourBeat.pip` → 50gp + 100 XP | ✅ |
| `quest_tour_02` | The Spreadsheet Casts | [SIDE] | SSJ | `yugurtTourBeat.pip` | `yugurtTourBeat.renard` → 75gp + 150 XP | ✅ |
| `quest_tour_03` | Bog's Terms | [SIDE] | SSJ | `yugurtTourBeat.renard` | `yugurtTourBeat.bog` → 150gp + 200 XP | ✅ |
| `quest_tour_04` | Vera's Rulebook | [SIDE] | SSJ | `yugurtTourBeat.bog` | `yugurtTourBeat.vera` → 300gp + 300 XP | ✅ |
| `quest_tour_05` | Tonnage | [SIDE] | SSJ | `yugurtTourBeat.vera` | `yugurtTourBeat.dirk` → 600gp + 500 XP | ✅ |
| `quest_tour_06` | The Fisherman's Tournament | [SIDE] | SSJ | `yugurtTourBeat.dirk` | `yugurtTourBeat.master` → 1500gp + 1000 XP | ✅ |
| `quest_no_fishing_sign` | The No-Fishing Sign | [SIDE] | hook → SSJ | — | `fishingRodCouponRedeemed` → 50 XP and the free Fishing Rod — giver `the_fisherman` | hook |
| `quest_fishing_guide` | The Fisherman: Listen Closely | [SIDE] | SSJ → BOO | `{}` | 1 catch, then at SSJ → Fishing Guide (zone DCs in the modal) | ✅ |
| `quest_fish_01` | The Leviathan Class | [SIDE] | SSJ → BOO | holds Fishing Rod + 1 catch | `fishingQuestFlags.landed15Plus` → 200gp + 750 XP, `fishingYugurtFavour` | ✅ |
| `quest_horned_shark` | The Noon Point | [SIDE] | BOO | `fishingYugurtFavour` | `hornedSharkSlain` → 300gp + 500 XP — giver `the_fisherman` | ⛔ BOO's cell is held by `LYR` |
| `quest_night_eel` | Night Water | [SIDE] | BOO | `hornedSharkSlain` | `lanternEelLanded` → 150gp + 400 XP, `eelSkinPouchActive` | ⛔ |
| `quest_shale_drop` | The Shale Drop | [SIDE] | BOO → MJF | `eelSkinPouchActive` | `shaleDropFound` → 250gp + 300 XP, Y. Gurt Field Survey | ⛔ BOO; MJF is primary |

---

## §1367 — Historical 1367 AD Integration ✅ LIVE (Events A–G)

Seven standalone historical vignettes grounded in real 1367 AD events, each a single-fighter quest with a Project Gutenberg primary source (Event G's source is the unseen pen itself — it does not sign its work). Design + full four-act vignettes: `docs/notes/Year1367AD.md`. Placed 2026-07-07 at nearest-thematic nodes (relocated off the `HKG` integration placeholder). **Event G "The Unseen Pen" (LXVII67) shipped 2026-07-07** — the seventh, meta faith-puzzle (the scribe Claude, no combat; "the story of the system that wrote the other six"). It was authored by promoting the pre-existing `quest_lxvii67` "The Jester's Crossroads" folk-wisdom quest into the arc: relocated off `HKG` → `FRO` (Aldric's Forest), re-themed to the *al-qalam al-ghaib* framing, and its `faith_folk` reward bumped +1 → +2 per the design doc. A single quest — no duplicate answer-67 puzzle.

| Quest ID | Title | Node | Type | Check | DC | Track / Reward | XP | Protagonist · Source | Status |
|----------|-------|------|------|-------|----|----|----|----|----|
| `quest_1367_a_najera` | "The Free Company" | MLA | [BATTLE] | STR | 12 | `faction_hansa` −1 | 150 | Renaud le Bâtard · Froissart PG61710 | [✅ LIVE §1367] |
| `quest_1367_b_tamerlane` | "The Warlord on the Eastern Wind" | DAM | [SKILL CHECK] | WIS Perception | 13 | `faith_folk` +1 | 120 | Marta of Ragusa · Mandeville PG782 | [✅ LIVE §1367] |
| `quest_1367_c_ottoman` | "The Patchwork of Adrianople" | ATH | [SKILL CHECK] | CHA Deception | 14 | `faith_orthodox` +1 | 130 | Bogdan · Arabian Nights PG128 | [✅ LIVE §1367] |
| `quest_1367_d_hansa` | "The Amber Embargo" | BK | [SKILL CHECK] | CHA Persuasion | 15 | `faction_hansa` +2 (fail −1) | 140 | Hilde Magnusdóttir · Mandeville PG782 | [✅ LIVE §1367] |
| `quest_1367_e_wycliffe` | "The Sealed Pamphlet" | LGW | [SKILL CHECK] | CHA Deception | 13 | `faith_reform` +1 | 110 | Thomas Cobb · Chaucer PG2383 | [✅ LIVE §1367] |
| `quest_1367_f_plague` | "The Empty Village" | CDG | [BATTLE] | STR | 12 | `faith_folk` +1 (fail `plague_exposed` risk) | 160 | Cécile Aubert · Boccaccio PG23700 | [✅ LIVE §1367] |
| `quest_lxvii67` | "The Unseen Pen" | FRO | [SKILL CHECK] | WIS Insight | 10 | `faith_folk` +2 | 67 | Claude the scribe · none (the pen does not sign) | [✅ LIVE §1367-G] |

Events A–F use `gate:{}` (always listed on arrival) and `retryable:true`. **Event G "The Unseen Pen"** uses a load-bearing `activateCond: faith_folk >= 1` behind a `gate:{_legacyFn:true}` — the meta-capstone lists only after you have walked at least one of the six faith paths (the puzzle "requires two"; you are the second). No anachronisms; historical figures (Black Prince, Wycliffe, Murad I, Tamerlane) appear as distant authority, never as early combatants.

---

## §KG — Russia "Kindergarten" Corridor ✅ LIVE (all 3 increments shipped)

**§KG Increment 2 (zones) is LIVE** — the St. Petersburg → Moscow corridor nodes (SPB/KMS/ZVD/FBR/TVR), 6 low-level "training" monsters (mLevel 1–4), and 5 Soviet-cyberpunk terrains all shipped. See world.md §"The St. Petersburg → Moscow Corridor" + monsters.md §"Soviet-Cyberpunk Training Tier."

**§KG Increment 3 (the quest chain) is SHIPPED and the head is unblocked** — ⚠ **the XP band is still 199 short of its stated L6 (§AUDIT-03bl).** `quest_kg_01` needs 3 `monsterKills.sparring_droid`; the counter's writer was repaired on 2026-08-23 (§DX-02cy) and three real victories now complete the quest, pinned by `src/tests/integration/dx02cy-kill-counter-writer.test.js`. As authored: 11 UQF-1.0 side quests, honor-central, carrying a fresh L1 fighter east to ~L6 (mission *listing* gated W→E; movement always free). Each is anchored to one of the five corridor NPCs (audit-verified `npc` resolution). One new generic mechanic: a per-monster `monsterKills` counter (battle-win handler, in `_S_DEFAULTS`) read by the cull/duel quests' `completion.countMin` — reusable by any future arc. Design: `docs/lab-reports/lab-report-kg-corridor-quest-chain.md`.

| Quest | Node · NPC | Type | Completion | Reward |
|-------|-----------|------|-----------|--------|
| `quest_kg_01` Honest Work in the East | SPB · Volkov | cull | 3× `sparring_droid` | 120xp/30 + Guild Enlistment Papers → `kgEnlisted` |
| `quest_kg_02` The Sealed Manifest | SPB · Volkov | delivery | Sealed Recruit Manifest @ KMS | 150xp → `kgManifestDelivered` |
| `quest_kg_03` The Sparring Floor | KMS · Roshkova | cull | 4× `komsomol_cadet` | 200xp/40 + Red Star Pin |
| `quest_kg_04` Lose Cleanly | KMS · Roshkova | skill_check | WIS/Insight DC10 (retryable) | 180xp → `kgFormsPassed` |
| `quest_kg_05` First Bout | ZVD · Grimka | mini-boss | 1× `gladiator_bot` | 250xp/50 + Bout Token → `kgFirstBout` |
| `quest_kg_06` A Clean Card | ZVD · Grimka | cull | 3× `gladiator_bot` + 3× `zavod_sparbot` | 300xp/60 + Clean-Card Trophy + Stripped Reactor Core |
| `quest_kg_07` Core to the Fabrika | ZVD · Grimka | delivery | Stripped Reactor Core @ FBR | 220xp → `kgCoreDelivered` |
| `quest_kg_08` Clearing the Floor | FBR · Iosif | cull | 3× `fabrika_enforcer` | 250xp/50 + Cortex Shunt |
| `quest_kg_09` The Chair | FBR · Iosif | mini-boss | 1× `trainer_bot_prime` | 400xp/80 + Prime Core → `kgSimCleared` + Certified Skill-Chit |
| `quest_kg_10` Certified and Resupplied | TVR · Lena | delivery | Certified Skill-Chit @ TVR | 220xp/40 + Field Ration (heal 20) |
| `quest_kg_11` Why the Line Went Quiet | TVR · Lena | skill_check | INT/Investigation DC12 (retryable) | 500xp/100 → `kgCorridorCleared` |

Gate spine (W→E, listing only): `{}` → `kgEnlisted` → `kgManifestDelivered` → `kg_03 done` → `kgFormsPassed` → `kg_05 done` → `kg_06 done` → `kgCoreDelivered` → `kg_08 done` → `kgSimCleared` → `kg_10 done`. Tail seeds the existing SVO / Station 7 thread (Lena's closing line).

---

## NEW GAME+ — Froberger Remembrance (LHR) — §XV Layer 50

*(Activation declarative since §VM-01-G3 2026-07-28: `activateNode:'LHR'` + an `ngPlusRun ≥ 1` countMin gate replaced the storyRender block; silent (`onActivate:null`) and `boardExempt` — a personal remembrance is not Warrant work.)*

| Quest ID | Title | Gate (activation) | Reward | Status |
|----------|-------|-------------------|--------|--------|
| `quest_ng_01` | "Froberger: The Remembered Path" | `ngPlusRun ≥ 1` | 500gp | [✅ LIVE] |
| `quest_ng_02` | "Froberger: The Open Page" | `ngPlusRun ≥ 1` + `priorQuestMinusOne` | Entry 42 | [✅ LIVE] |
| `quest_ng_03` | "Froberger: The Letter" | `ngPlusRun ≥ 1` | 300gp | [✅ LIVE] |

---

## §ALCHEMY-01 — The Personal Legend ✅ SHIPPED (`e339aeb`, 2026-05-28) · ⛔ arrival-dead past `MAN` (§AUDIT-03x)

**Nodes (live codes):** KIR → MAN → SEN → PDL → MLA → ATH → KIR — six existing nodes, none new; the design under its pre-§CELL codes is `docs/archive/plan-archive-verbatim-2026-06-12.md` §ALCHEMY-01. **Companion:** Roen, Highland shepherd — `world.md` §Roen. **Flags:** `roenMet → roenMidlandsWisdom → roenAtSea → roenOracleRead → roenMaltaCrisis → roenAlchemistMet → personalLegendComplete`, each the gate of the next. **`npc`:** `elder_fionn` (KIR, MAN) · `ship_captain` (SEN) · `oracle's_apprentice` (PDL) · `malta_shore_islanders` (MLA) · `deacon_nikolaos_ath` (ATH) — authoring metadata, not speakers (§AUDIT-03b).
**Who pays:** the five `side` quests carry `bits:[]` and `reward:0`; their flags, prose and tokens come from the arrival panels registered in the node-hook table (`_nodeHookAlchKirDream@33895`, `_nodeHookAlchManNoon@33967`, `_nodeHookAlchSenShip@33990`, `_nodeHookAlchAthStoic@34013`), and each quest completes on its flag. The two `skill_check` quests pay in their own `onPass` and roll from the quest panel anywhere once active (§DX-02ah).

| ID | Title | Type | Node | Gate | Completion — who writes it | Arrive? |
|----|-------|------|------|------|----------------------------|---------|
| `quest_alch_01` | The Shepherd's Dream | [SIDE] | KIR | `{}` | `roenMet` — `_nodeHookAlchKirDream` (Shepherd's Fortune Slip) | ✅ KIR is its cell's primary |
| `quest_alch_02` | The Noon Plain | [SIDE] | MAN | `roenMet` | `roenMidlandsWisdom` — `_nodeHookAlchManNoon` | ✅ |
| `quest_alch_03` | The Ship Remembers | [SIDE] | SEN | `roenMidlandsWisdom` | `roenAtSea` — `_nodeHookAlchSenShip` | ⛔ SEN shares its cell with LCY and STN; LCY is first-declared, so the panel never renders |
| `quest_alch_04` | The Oracle's Reading | [SKILL CHECK] CHA Persuasion DC 11, retryable | PDL | `roenAtSea` | `roenOracleRead` (own `onPass`) | ✅ — the gate never opens |
| `quest_alch_05` | The Lost Stone | [SKILL CHECK] WIS Insight DC 12, retryable | MLA | `roenOracleRead` | `roenMaltaCrisis` (own `onPass`) | ✅ — the gate never opens |
| `quest_alch_06` | The Stoic's Gold | [SIDE] | ATH | `roenMaltaCrisis` | `roenAlchemistMet` — `_nodeHookAlchAthStoic` | ⛔ ATH's cell is held by `SEA` |
| `quest_alch_07` | The Gold Was Home | [SIDE] | KIR | `roenAlchemistMet` | `personalLegendComplete` — `_nodeHookAlchKirDream` (Loch Gold Flake) | ✅ — the gate never opens |

**Reachability at HEAD (§AUDIT-03aw, 2026-10-08, by the `CELL_GRID` first-declared rule):** **2 of 7** complete in order (`alch_01`, `alch_02`). `alch_03`'s panel fires only when the player stands on `SEN`, which `S_story.currentCode` can never hold, so `roenAtSea` has no reachable writer and `alch_04`–`07` wait behind it. The 5-of-7 figure in `lab-report-wisdom-arc.md` (verified 2026-08-13) still holds; the fix is §AUDIT-03x's.

---

## §WISDOM-01 — The Book of Human Nature ✅ SHIPPED (`e339aeb`, 2026-05-28) · ⛔ arrival-dead at the hook (§AUDIT-03x)

**Nodes (live codes):** VS (hook, W6, close) · LCY (W1) · MME (W2) · GCI (W3) · BK (W4) · ATH (W5) — six existing nodes; the design is `docs/archive/plan-archive-verbatim-2026-06-12.md` §WISDOM-01, lab report `lab-report-wisdom-arc.md`. **Companion:** Roen, after `personalLegendComplete` — `world.md` §Roen. **The ghost:** Master Fenn Ardley, court historian, never met; six scattered pages of his suppressed *Complete Account of Human Nature*, one law each. **Flags:** `wisHookReceived` opens every page; `wisPage1_masks … wisPage6_shadow`; `wisArchiveLetter` (W5); `personalLegendMature` at the close. **`npc`:** `solvak` (VS) · `magistra_elara_muffat` (LCY) · `harbormaster_dorit` (MME) · `captain_vera_keel` (GCI) · `warlord_kael_mordus` (BK) · `deacon_nikolaos_ath` (ATH).
**Who pays:** W1–W6 are `skill_check` quests that pay inside their own `onPass` (`mission_bit` + `reward` with a knowledge entry). The hook and the close are `side` quests with `reward:0`, paid by `_nodeHookWisVsHub@34061` (the hook button writes `wisHookReceived` and hands over the Pages of the Ardley Manuscript; the close writes `personalLegendMature`). W6 has two paths — the Insight roll on `quest_wis_06` itself (§AUDIT-03ad, `bf34ce2`) or the `VS_SHADOW` mirror-construct battle from `_nodeHookWisVsUnderground@34039` — and both `quest_wis_06` and `quest_wis_07` accept either (`flagsAny` + `battles`).

| ID | Title | Type | Node | Gate | Pays | Arrive? |
|----|-------|------|------|------|------|---------|
| `quest_wis_00` | The Manuscript Hook | [SIDE] | VS | `personalLegendComplete` | `wisHookReceived` — `_nodeHookWisVsHub` | ⛔ VS's cell is held by `VBY` |
| `quest_wis_01` | Mask Check | [SKILL CHECK] WIS Insight DC 13 | LCY | `wisHookReceived` | `wisPage1_masks` + 150gp + 250 XP + knowledge (Silas Vance's hands) | ✅ |
| `quest_wis_02` | What Dorit Already Knew | [SKILL CHECK] WIS Insight DC 12 | MME | `wisHookReceived` + `saltwickAccessed` | `wisPage2_aggression` + 250 XP + knowledge | ✅ |
| `quest_wis_03` | The Chart Room | [SKILL CHECK] INT Investigation DC 11 | GCI | `wisHookReceived` + `sbResolved` | `wisPage3_thumbscrew` + 300 XP + knowledge (Keel's survey data) | ✅ |
| `quest_wis_04` | The Stalemate Cost | [SKILL CHECK] INT Investigation DC 12 | BK | `wisHookReceived` | `wisPage4_sight` + 300 XP + knowledge | ⛔ BK's cell is held by `LHR` |
| `quest_wis_05` | The Philosopher's Pivot | [SKILL CHECK] WIS Insight DC 12 | ATH | `wisHookReceived` + `roenAlchemistMet` | `wisPage5_form` + `wisArchiveLetter` + 300 XP + knowledge | ⛔ ATH's cell is held by `SEA` |
| `quest_wis_06` | The Shadow Room | [SKILL CHECK] WIS Insight DC 14, retryable · or [BATTLE] `VS_SHADOW` | VS | `visbyUnderground` | `wisPage6_shadow` + 350 XP + Shadow Shard + knowledge | ⛔ `visbyUnderground` is written only by `_nodeHookWisVsUnderground` at VS |
| `quest_wis_07` | Ardley's Book | [SIDE] | VS | `wisHookReceived` | all six pages → `personalLegendMature` — `_nodeHookWisVsHub` | ⛔ |

**Reachability at HEAD (§AUDIT-03aw, 2026-10-08):** **0 of 8.** The hook fires only on `VS`, which is not its cell's primary, and its gate is `personalLegendComplete`, which §ALCHEMY-01 cannot reach either. Were `wisHookReceived` ever set, W1–W5 would roll from the quest panel anywhere (§DX-02ah), three of their five nodes being primaries regardless. `lab-report-wisdom-arc.md` (verified 2026-08-13: 8 of 8 unreachable) still holds; the fix is §AUDIT-03x's.

---

## QUEST COUNT SUMMARY

| Status | Count |
|--------|-------|
| ✅ Live (main story) | ~35 |
| ✅ Live §DESIGN-03 | 9 (4 Birka Ceremonia + 5-act Yael arc) |
| ✅ Live §DUNGEON-01/02 | 43 quests (8 five-act `d02xx` arcs + 3-quest Inquisitor gauntlet) + node-woven Prior Carrier + D02-11 framework |
| ✅ Live §GR | 3 (La Riva: Q-FR-01/02/03) |
| ✅ Live §MATH-01 | 5 (Mathematical World collect quests — Undercity pocket) |
| ✅ Live §LIX–§LXIX + §PAUL-01 | 18 (Saul→Paul arc — conversion chain + Mediterranean journeys; full-chain doc sync 2026-07-07) |
| ✅ Live §SIREN-01 | 5 (Littoral Courts + Overseer) |
| ✅ Live §CROWN-01 | 24 (Whisper ×6, Glut ×6, Wane ×6, Inn ×6) |
| ✅ Live §CROWN-01 Amendment A | 10 (3 failure dispatches + 4 hag commissions + 3 iodine track) |
| ✅ Live §LXX | 4 (Shore Road + Tide Register + Forge Mechanism + Smelting) — `quest_forge_02` single-pays since the §LXX-01-FU fix (see note below) |
| ✅ Live §LXXI | 2 (Sunken Hall inscription + Tide Gate activation) — `quest_sunken_02` single-pays since the §LXX-01-FU fix (see note below) |
| ✅ Live §LXXII | 1 (Conclave Annex post-event note) — the button/quest pair done RIGHT: the button writes only flag + knowledge, `quest_ca_01`'s onComplete pays (the la_riva/hg1 shape) |
| ✅ Live §LXXIII | 1 (The Depth — 18 Meters: both-chains closure) — `quest_depth_01` single-pays since the §LXX-01-FU fix (see note below) |
| **Total live** | **~128** |
| ✅ Live §SPARK-01 | 5 (Smalt + Overture + Clot + Who Done It + Aldous Comes Clean) |
| ✅ Live §SPARK-01 SEA | 3 (Calm Sea + Warmth Eel + The Escort) |
| ✅ Live §HUNT-01 | 4 (Hook + Hull Investigation + Trail + Den Confrontation) |
| ✅ Live §HUNT-02 | 4 (Relay Warning + Road Read + Sleeping Post + Night Hag) |
| ✅ Live §PORT-01 | 3 (The Unwritten Port + The Missing Consignment + The Cracked Strake) |
| ✅ Live §PORT-02 | 2 (The Open Harbor + The Salt Price) |
| ✅ Live §NAVAL-01 | 4 (Approach + Parley CHA DC 12 + Examine INT DC 11 + Board and Clear) |
| ✅ Live §1367 | 7 (Historical 1367 AD vignettes A–G; Event G "The Unseen Pen" shipped by promoting `quest_lxvii67`) |
| ✅ Shipped §ALCHEMY-01 | 7 (Roen's Personal Legend, KIR → MAN → SEN → PDL → MLA → ATH → KIR) — ⛔ 2 of 7 complete in order; the chain dies on `SEN` (§AUDIT-03aw / §AUDIT-03x) |
| ✅ Shipped §WISDOM-01 | 8 (Ardley's six pages + hook + close) — ⛔ 0 of 8; the hook is on `VS` behind §ALCHEMY-01's last flag (§AUDIT-03aw / §AUDIT-03x) |
| **Total live** | **~156** (Event G re-themed an existing quest — no net new quest object; 15 of the 156 are shipped but unreachable at HEAD — §AUDIT-03x) |
| Planned | 0 |

> **✅ §LXX-01-FU (measured 2026-08-05, §VM-01-G-FU-e; FIXED 2026-08-06):** three of the four
> §LXX-family button/quest pairs **double-paid** — `quest_sunken_02` (DA2), `quest_depth_01`
> (DA3) and `quest_forge_02` (DSF) each carried their button's ENTIRE effect in `onComplete`
> and auto-completed on the same arrival that drew the button, so the still-rendered button
> paid a second time: DA2 a **second permanent INT +1** (+500gp), DA3 +500 XP + a duplicate
> knowledge entry, DSF a second Sea Element (+400gp). **The fix is the `quest_ca_01` /
> la_riva/hg1 shape:** each button/verb now writes ONLY its flag (`tideGateOpened` /
> `antecedentDepthMet` / `seaElementCrafted`), each quest's `completion` is keyed on that
> flag, and the quest's `onComplete` pays exactly once — with the DA2/DA3 handlers' Station 7
> prose (never readable before: destroyed by its own bare `storyRender`, §BOARD-01-FU6 class)
> moved into the quests' `narrative` bits. Single-pay pinned by `uqf-node-lxx.test.js`.

---

---

## §HUNT-01 — What's In The Lake ✅ LIVE (Layer 111)

**Nodes:** LS → LH → LN → LD (new). **Monster:** Drowner × 3. **Key item:** Drowned Compass.  
**NPC:** The Elder Fisherwoman (LS). **Wrong theory:** Guild spirit offerings.  
**Design principle (REF-04):** Setup gives wrong theory → investigation chain corrects → confrontation → resolution with salvage item.

| ID | Title | Type | Node | Cond | Reward |
|----|-------|------|------|------|--------|
| `quest_hunt_01` | Something in the Lake | [ACCOMPLISHMENT] | LS | arrive + speak | +100 XP; opens quest_hunt_02 |
| `quest_hunt_02` | Scale Marks on the Hull | [SKILL CHECK] INT Investigation DC 12 | LH | huntHookReceived | lakeClueFound + knowledge entry + 200 XP |
| `quest_hunt_03` | Drag Tracks North | [SKILL CHECK] WIS Perception DC 13 | LN | lakeClueFound | lakeLairLocated + 250 XP; unlocks LD |
| `quest_hunt_04` | The North Den | [BATTLE] Drowner × 3 | LD | lakeLairLocated | 500gp + 500 XP + Drowned Compass + knowledge entry |

**`quest_hunt_01` — Something in the Lake**
*Node: LS. Trigger: arrive at south shore. Object: three missing boats.*
- Act I: [STORY] The Elder Fisherwoman states the facts — three boats, spring collapse, Guild offerings, her disagreement with the Guild theory.
- Act II: storyRender button "Speak to the Elder Fisherwoman" → huntHookReceived, +100 XP. Quest chain opens.
- Act III: No battle here. Investigation begins at LH.
- Act IV: Guild master at LH presents spirit mark theory (on boat hull).
- Act V: Elder Fisherwoman's words remain the accurate framing. "Something that eats a boat is not a spirit."

**`quest_hunt_02` — Scale Marks on the Hull**
*Node: LH. Trigger: huntHookReceived. Object: recovered boat hull.*
- Act I: [SKILL CHECK] INT Investigation DC 12. The marks are at the waterline, port side.
- Act II: On fail — "Marks unclear. More evidence on the north shore path." Not retryable; player must proceed to LN.
- Act III: On pass — lakeClueFound, knowledge push: *physical claw drag, not spirit-made*. +200 XP.
- Act IV: Harbor Guild Master reads the hull a second time: "Those are grip-marks. Something held the boat."
- Act V: Object changed — the hull goes from evidence of a mystery to evidence of a creature.

**`quest_hunt_03` — Drag Tracks North**
*Node: LN. Trigger: lakeClueFound. Object: disturbed north shore path.*
- Act I: [SKILL CHECK] WIS Perception DC 13. Path mud, shelf edge worn. Repeated passage pattern.
- Act II: On fail — "Pattern unclear from path. Move further along the shelf." Not retryable; move along LN.
- Act III: On pass — lakeLairLocated. LD unlocked. +250 XP.
- Act IV: storyRender at LN updates: "Trail read. Three of them — from track spacing. Den at the shelf collapse."
- Act V: Object changed — the path goes from disturbed ground to a location. North Shore Den is now accessible.

**`quest_hunt_04` — The North Den**
*Node: LD. Trigger: lakeLairLocated. Object: the den itself.*
- Act I: [STORY] storyRender at LD — shelf collapse, flooded chamber, boat timbers present. Drowners not hidden.
- Act II: Button "Enter the den — clear the drowners" → storyPreBattle(LD_DROWNERS).
- Act III: [GATING BATTLE] Drowner × 3 — The North Den.
- Act IV: On win — drownersDefeated, +500gp +500 XP, Drowned Compass added, knowledge push.
- Act V: Elder Fisherwoman at LS closes the arc: "It was the rock fall that brought them — not the boats. The boats were just the nearest thing. You got to them before they established range north."

## QUEST DESIGN PRINCIPLES (see §D02-11 for full framework)

1. Every quest is a 5-act Chrétien arc named for its object, not its goal.
2. Tag every act: `[STORY SKILL CHECK]` or `[STORY GATING BATTLE]`.
3. No permanent fail. Retry gates are day-advance, quest-state, or immediate.
4. The battle is Act III. Always.
5. Act V is always the story-driving Ceremonia Roll.
6. The object must arrive changed by Act V.

---
*© 2026 Paul Richeson — MIT License. See [LICENSE](../../LICENSE) for full text.*
