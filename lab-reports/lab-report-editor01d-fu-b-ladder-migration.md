# Lab Report — §EDITOR-01-D-FU (b): reward-ladder → itemChain migration

**Status:** ✅ **CLOSED** (Inc 1 design → Inc 2 guard → Inc 3 b2a → Inc 4 b1 → **Inc 5 b2b**). 22 reward-ladder branches migrated (9 b2a + 13 b2b); the rest stay code by design (see §7 Residue). Item (a) (visual chain editor) was already CLOSED, so **§EDITOR-01-D-FU is fully closed.**
**Date:** 2026-06-27

## 7. Residue — what stays as code after (b) closes (LOCKED, by design)

(b) is **partial extraction**: only the *inventory* ingredient moved into `itemChain`. Everything below is intentionally NOT migrated and remains in the `storyCheckQuests` ladder (or its quest object):

- **`fishing_guide`** — the one "pure push", but its `readText` is `FISHING_GUIDE_TEXT`, a **const defined at line 24017, AFTER `QUEST_DB` (line 9373)**. Referencing it from a QUEST_DB data literal is a temporal-dead-zone error; inlining the long canonical text would duplicate a single-source string and risk divergence. **Stays code.** (Only a relocation of the const — out of this FU's scope — would let it migrate.)
- **`tl_01`, `tl_03`** — dynamic/computed item `description` (concatenated from other state). Non-static; only a computed-effects layer could take them. **Stays code, forever under the static-itemChain model.**
- **`wm_01`** — `Scholar Kings' Seal` removal is conditional (`!archiveLetterObtained`) AND count-limited to 3; a flat `take` can't express it. **Stays code** (effects-layer territory).
- **19 no-inventory branches** (gold/favor/XP/flag only) + **16 message-only branches** — nothing for `itemChain` to model; these are the **§DATA-01-REVERTED effects-layer** candidates, explicitly out of scope (§3.5 scope fence).
- **Per migrated branch (all 22 are PARTIAL):** gold/favor/XP, ability-score writes (`guide_06`/`scar_04` WIS), flag sets, NPC-favor/Dear-Friend calls, and the **verbatim narrative `msgs.push`** all stay as code; only the `inv.push`/`filter` left.

**The larger lever remains §DATA-01-REVERTED** (a declarative effects layer) — it would subsume the 19 gold/favor branches, the 2 dynamic-item branches, and `wm_01`. (b) deliberately shrank the ladder without inventing a second gold/favor mechanism.
**Scope:** §EDITOR-01-D-FU item **(b)** — mechanically extract the *inventory* operations from the 61-branch `if (id === 'quest_…')` reward ladder in `storyCheckQuests` (roll2hit-v3.html **25875–26094**) into the declarative `itemChain` quest field shipped in §EDITOR-01-D core. Item (a) — the visual chain editor — is **✅ CLOSED** (Inc 1–4) and is the authoring surface this migration feeds. Overlaps the deferred **§DATA-01-REVERTED** (`QUEST_EFFECTS`/`HOOKS` effects layer); §3.5 reconciles the boundary.

This is a **runtime + data refactor** of roll2hit-v3.html. No worldbuilder/server change beyond the grant-grammar widening that (b1) shares with the codec + the §EDITOR-01-D-FU(a) widget schema.

## 1. Reframing the FU brief — what the ladder actually is

The FU brief assumed a population of *pure* `inv.push` / `splice` branches ready to lift out. **There is essentially one** (`quest_fishing_guide`, and even it carries a `readText` the current grammar can't hold). The ground truth, from a full classification of all 61 branches (`/tmp/classify-ladder.js`, reproduced below — re-runnable), is that the ladder is overwhelmingly **mixed effects**: gold + favor + XP + flags + ability scores + narrative message, with an inventory push as one ingredient among several. So (b) is not "lift pure branches"; it is **partial extraction** — pull *only* the inventory ingredient into `itemChain`, leave every other effect as code — gated on a grammar widening.

## 2. Ground truth — the 61-branch classification (LOCKED reference)

| Bucket | Count | Migratable? | Notes |
|--------|------:|-------------|-------|
| **Expressible now** — `grant` with only `name/icon/type/sell/desc` | **7** | ✅ b2a (no b1 needed) | `couperin_lute` (Cipher Scrap; also a take), `pit_training`, `cat_03`, `cat_04`, `cat_05`, `cat_06`, `night_eel` |
| **Take-only** — name-based removal → `take` | **3** | ✅ b2a | `brynn_ledger`, `pachelbel_shipment`, `wm_01` (multi-`Scholar Kings' Seal` removal, count-gated) |
| **Needs grammar ext (b1)** — literal push w/ rich fields | **14** | ✅ b2b (after b1) | `readText`×7 (`fishing_guide`, `shale_drop`, `muffat_02/03/05`, `solm_01`, `signal_01`), `bonus`+`description`×3 (`wm_02/03/04` tomes), weapon-stats (`guide_06` Rod), `readText`+`passive` (`scar_04`), `uses` (`void_below` EMP), `readableKey`/`readable` (`va_02`) |
| **Dynamic/computed item** — runtime-built object | **2** | ❌ never (stays code) | `tl_01`, `tl_03` — item `description` is conditionally concatenated from *other* state (`wmFirstResearcherKnown`, presence of `Froberger's Field Notes`). Not a static literal. |
| **No inventory op** — gold/favor/XP/flag only | **19** | ❌ out of scope (future effects layer) | `slums_cleanup`, `cat_01/02/void`, `city_watch_patrol`, `pit_debut`, `fish_01`, `horned_shark`, `ng_01/03`, `wm_05`, `va_03/04`, `vs_01/02/03/warden`, `lame_lystra`, `brynn_firewood` |
| **Message-only** | **16** | ❌ nothing to migrate | the Damascus/Lystra/Antioch §LIX–LXIV arc beats, `va_01`, `tl_02`, `ng_02`, `d0206_a5`, `d0208_a4/a5`, `antecedent_01` |

**Total 61.** Inventory work actually touched by (b): **24 branches** (7 + 3 + 14). The other 37 are out: 16 have no state to move, 19 are gold/favor/flag (a *different* refactor — the effects layer), 2 are non-static.

## 3. The five blockers (each one a locked decision)

### 3.1 The `grant` grammar is too thin — **b1 is a hard prerequisite for the bulk**
`_applyItemChain` grant (roll2hit-v3.html **23549**) builds exactly `{name, icon, type, sell, desc?}`. But the ladder's pushed items use, across 26 objects: `readText`×8, `description`×7 (note: a **different key** from the grammar's `desc`), `bonus`×3, plus `passive`, `readableKey`/`readable`, `uses`, `minLevel`, and four weapon stats (`atkBonus/dmgDie/dmgCount/dmgFlat`). 14 of the 24 migratable branches are unreachable until grant can carry these.

**LOCKED — (b1) grant-shape widening (explicit allow-list, not arbitrary passthrough):** extend the grant Step + `_applyItemChain` to copy a fixed allow-list of optional item fields when present:
`desc`/`description` (unify: grammar keeps `desc`; runtime writes whichever the original item used — see 3.4 name/shape parity), `readText`, `readableKey`, `readable`, `passive`, `bonus` (object), `uses` (number), `minLevel` (number), `atkBonus`/`dmgDie`/`dmgCount`/`dmgFlat` (numbers). Anything not on the list is dropped (the codec + widget can't author it; a stray field would silently diverge). This widening lands in **four** places kept in lockstep: `_applyItemChain` runtime, the `parseItemChainText`/`itemChainToText` codec, the §EDITOR-01-D-FU(a) `CHAIN_KINDS.grant` widget schema, and `scripts/check-itemchain.js`. Pipe-grammar text stays viable only for the scalar fields; `readText`/`bonus` are JSON-authored via the visual widget (a new "advanced fields" JSON textarea per grant row) — **the text codec is no longer lossless for rich grants, and that's accepted** (the widget is now the canonical authoring path post-(a)).

### 3.2 Message reconciliation — **migrated grants run silent**
`_applyItemChain` runs at **25869**, *before* the ladder body, and grant emits its own `"<icon> <name> obtained."`. The ladder's custom line frequently **names the same item** (`'💰 +500gp + Rhinestone Collar trophy.'`). Naïvely migrating doubles the mention. **LOCKED:** add an optional `silent:true` to migrated grant steps (suppresses only the auto-`obtained` line; `grantBit`'s own message is unaffected); the ladder keeps its hand-written narrative line **verbatim**. This preserves exact user-visible output, so the parity guard (3.6) can assert message equality, not just inventory equality. `silent` joins the (b1) allow-list + widget (a checkbox).

### 3.3 Item names are load-bearing — **names must be byte-preserved**
Pushed item names are referenced elsewhere by string match: `KEY_EVENTS[].item` (e.g. `'Shipping Manifest (Intercepted)'` → `ke_manifest`, `'Eel Skin Pouch'` → `ke_eel_pouch`, `'Antecedent Seal'`), and quest `completeItems`/`completeFn` name-includes checks. A migration that renames or reshapes an item silently breaks a key event. **LOCKED:** migration is name-preserving; the parity guard cross-checks every migrated item name against `KEY_EVENTS` + `completeItems` references and fails on a drift.

### 3.4 Ordering & idempotency — **grant `once` vs the ladder's name-dedup**
Two ladder branches guard with `!inventory.some(i => i.name === X)` before pushing (`guide_06`, `scar_04`). Grant's default `once:true` already skips when an item of that name exists (**23548**) — semantically equivalent for a quest that completes once. **LOCKED:** migrate these as default-`once` grants; do **not** emit `once:false`. (Their ability-score/flag effects stay as code — they are PARTIAL, not FULL.)

### 3.5 Boundary with §DATA-01-REVERTED (the effects layer) — **drawn, not crossed**
The 19 "no inventory op" branches (gold/favor/XP/flag) and the 2 dynamic-item branches are exactly what a declarative `QUEST_EFFECTS`/`HOOKS` layer (§DATA-01-REVERTED) would absorb. (b) deliberately **does not** build that layer — it migrates *only* inventory, the one effect `itemChain` already models. **LOCKED scope fence:** if the effects layer is later prioritized, it subsumes the residue; (b) leaves the ladder strictly smaller and never invents a second gold/favor mechanism. Gold/favor/XP/flag/ability/dynamic-item all **stay as code** after (b).

### 3.6 Parity guard — **the safety net (`scripts/check-ladder-migration.js`)**
A headless guard run in CI: for each migrated quest, it loads the quest's `itemChain` and the *removed* ladder push, and asserts (a) the resulting inventory delta (item objects, field-by-field over the allow-list) is identical, (b) the item name is preserved and still satisfies any `KEY_EVENTS`/`completeItems` reference, (c) the surviving ladder branch (gold/favor/flag/msg) is unchanged. Built **before** the first migration so every wave is gated. Wired into the `invariants` job alongside `check:itemchain`.

## 4. What changes vs what stays

- **Changes (per migrated quest):** the quest object in `QUEST_DB` gains an `itemChain:[…]` (authored via the (a) widget); the corresponding `inv.push`/`filter` lines are deleted from its ladder branch.
- **Stays as code (every migrated branch is PARTIAL):** that branch's `S_story.gold +=`, `_setNpcFavor`, `S_story.xp`, ability-score writes, flag sets, and the verbatim narrative `msgs.push`.
- **Untouched:** 37 branches (16 msg-only, 19 no-inventory, 2 dynamic). The `_applyItemChain` call site (25869), both completion paths, persistence (ph3) — all unchanged in shape; only grant's field set widens.

## 5. Increment plan

- **Inc 1 (this report)** — design lock + full branch classification + blocker decisions. No code.
- **Inc 2** — **the parity guard first** (`scripts/check-ladder-migration.js`) + wire into CI, against the *current* (un-migrated) ladder as a baseline harness (asserts zero migrations, name index builds). De-risks every later wave.
- **Inc 3 — wave b2a (no grammar change):** migrate the **10 expressible-now** branches (7 grant + 3 take) to `itemChain` with `silent` grants; delete their push/filter lines; guard green. (`silent` is the only new grant field this wave needs — a minimal slice of b1.)
- **Inc 4 — b1 grammar widening:** extend grant runtime + codec + (a) widget schema + `check:itemchain` for the rich allow-list (3.1). Headless tests: each new field round-trips; non-allow-list field dropped.
- **Inc 5 — wave b2b:** migrate the **14 rich-field** branches; guard green. **Closes (b).**
- (Waves are independently shippable; if (b1) proves too broad, b2a still stands alone and (b) can close partial with a logged residue.)

## 6. Non-goals / risks

- **The effects layer (gold/favor/XP/flag) is explicitly out** — that's §DATA-01-REVERTED, deferred. (b) shrinks the ladder; it does not eliminate it.
- **2 dynamic-item branches (`tl_01`, `tl_03`) stay code forever** under the static-`itemChain` model — only a computed-effects layer could take them.
- **Risk — rich-field codec divergence:** the pipe text grammar can't losslessly carry `readText`/`bonus`; mitigated by routing rich grants through the (a) widget's JSON field and asserting widget↔runtime parity in `check:itemchain`, *not* through the text codec.
- **Risk — silent breakage of a key event** via item rename/reshape: mitigated by the name-preservation cross-check in the parity guard (3.3/3.6), built before any migration.
- **Risk — message double-mention:** mitigated by `silent` grants + verbatim-msg preservation (3.2); guard asserts message equality.
- **Strategic note for the next continue:** (b) is real but narrow — it removes ~24 branches' worth of `inv.push` while 37 branches and all non-inventory effects remain. If the goal is "kill the ladder," the **§DATA-01-REVERTED effects layer** is the larger lever and would subsume (b). Recommended order stands: guard (Inc 2) → b2a (Inc 3) is low-risk, high-confidence, and ships value without the grammar widening — a good place to pause and reassess whether b1+b2b or the effects layer comes next.
