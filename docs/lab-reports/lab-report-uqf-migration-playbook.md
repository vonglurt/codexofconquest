<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->

# Lab Report: The UQF Migration Playbook (§ARCH-01)

**Document ID:** §ARCH-01 (Phase 3 companion) — a **method** document, not a feature close-out.
**Original date:** 2026-06-28 · **Closed:** 2026-07-05, Wave 8c (`647e070`)
**Reference build:** `24becb6` (2026-06-28 14:32:20 −0700, Wave 1a) — the tree the §2 survey was taken against.
**Status:** ✅ CLOSED. Every `QUEST_DB` entry executes as UQF-1.0 except 30 deliberate stubs. `QuestRuntime` is the sole execution surface; `QUEST_DB` is the single source of truth.
**Verified:** 2026-08-17 (§DOC-02bu) against HEAD and against the archive. Findings in §7–§10.

---

## 1. Abstract

`QUEST_DB` began as **data with JavaScript stapled to it**: each quest carried its own
`activateCond` predicate, `onPass`/`onFail`/`onComplete` closures, and a bespoke `completeFn`.
Behaviour lived in ~2,800 hand-written functions with no shared vocabulary, no validator, and no
way to ask *"what does this quest do?"* except to read it.

§ARCH-01 replaced that with the **Universal Quest Format (UQF-1.0)**: a quest is *pure declarative
data* — `schema` · `gate` · `bits` · `completion` — executed by a host VM (`QuestRuntime`). Logic
moved out of the content and into an opcode table (`BIT_CONTRACTS`). The migration ran in eight
waves over eight days, hand-migrating the 79 bespoke arcs and bulk-transforming the remaining
~2,340 through a deterministic codemod verified against a pre-migration golden capture.

This document is the **playbook** — the repeatable procedure, the grammar it produced, and the
per-wave ship record. Its central claim is procedural: *a migration should widen the grammar, never
special-case the content.* Fifty days of subsequent engineering have not needed a single exception.

---

## 2. Intention, inspiration, and what the player actually gets

### 2.1 The design intention

The inspiration is the **script/host split** familiar from game engines and from the JVM: content is
script, the engine is the host, and capability grows **through the grammar** (a new opcode, a new
gate term) rather than through a new one-off branch per quest. The design goals, in the order the
report argued them:

1. **One execution surface.** A quest resolves in exactly one place, so a fix reaches all 2,853.
2. **Declarative gates.** *When does this list?* becomes readable data, not an opaque predicate.
3. **Validatable content.** `validateQuest` can refuse a malformed quest; a closure cannot be checked.
4. **Authorable content.** If quests are data, the worldbuilder can author them — realised in Wave 8b.
5. **Generalise, never special-case.** Every gap becomes a reusable primitive. The whole grammar in
   §6 was produced by twenty-odd quests each demanding one thing the engine could not yet say.

### 2.2 What it did for playability — the load-bearing number

The migration is usually described as a refactor. It was not. **Recon in Waves 4 and 5 found that
177 quests could not be played at all**, and the archive confirms it exactly:

| Legacy type | Count at `24becb6` | Had any completion surface | Verdict |
|---|---|---|---|
| `combat` | 78 | 0 | dead |
| `delivery` | 57 | 0 | dead |
| `escort` | 22 | 0 | dead |
| `hybrid` | 13 | 0 | dead |
| `dialogue` | 7 | 0 | dead |
| `main` (`mq_1`–`7`) | 7 | **7** (`completeItems`) | alive |

The cause is one line in the legacy resolver — `if (q.type !== 'skill_check') return;` — and no
other code accepted those types. They had no `completeFn`, no `completeItems`, no `waypointNode`.
**A player who accepted one of them could never finish it**, and because downstream acts gated on
their pass-flags, *every arc containing one stalled at that act.* Waves 4–6 turned 177 inert entries
into playable content and repaired three dead gates in the Emmer arc as a rider.

Three further fixes reached the whole game:

- **§SKILLFIX-01 (`662ee99`)** — the legacy resolver read only `q.checkAbility`, but **2,443 quests
  store the ability in `checkStat`**. Those checks rolled `d20 + 0 + proficiency` and printed the
  ability name as **"undefined"**. Your Wisdom score was decorative on the overwhelming majority of
  the game's skill checks. Four read sites were aliased; the fix is verbatim at HEAD.
- **§SKILLFIX-02** — ~176 more quests stored a *skill name* (`Persuasion`, `History`, `Insight`) in
  the stat field, hitting the same `+0` path. The migrator maps skill → governing ability (D&D 5e;
  homebrew Courage/Presence → CHA) and keeps the name for display and proficiency.
- **Wave 2c** — three `ath_*` acts carried a duplicate `activateCond`, the real function *plus* a
  dead string copy. Last-key-wins made the parsed value a string, so `q.activateCond()` **threw a
  TypeError on arrival at those nodes**. The migration fixed a live crash. Wave 4 found and removed
  three more; at HEAD `activateCond:"` occurs **0 times**.

### 2.3 What it did for the author

Wave 8b carried the grammar into the worldbuilder: the Mission Builder compiles arcs to UQF, the
✏ Editor authors outcome **bits** instead of JavaScript textareas, and `serializeQuestLiteral`
learned to write `schema`/`gate`/`bits`/`completion` — which it had been **silently dropping**, so
every UQF quest posted through the API had been arriving stripped dead. A grammar the tools can
speak is the difference between a format and a filing convention.

---

## 3. Diagnosis at the reference build

The 2026-06-28 survey, re-measured at `24becb6` by two independent methods (the `wbapi-core`
parser and a standalone brace-depth walk, which agree exactly):

| Figure | Report | Measured at `24becb6` | Verdict |
|---|---|---|---|
| Total `QUEST_DB` entries | 2,515 | **2,839** | ✘ short by 324 |
| Already UQF (`§WISDOM-01` ×8 + Wane ×6) | 14 | **14** | ✔ exact, ids match |
| `skill_check` | 2,192 | **2,482** | ✘ |
| `side` | 129 | **133** | ✘ |
| `combat` | 71 | **78** | ✘ (the Wave-4 "drift" was an undercount on day one) |
| `delivery` / `hybrid` | 38 / 9 | **57 / 13** | ✘ (likewise recounted in Wave 5) |
| `epic` / `escort` / `main` / `dialogue` | 40 / 22 / 7 / 7 | **40 / 22 / 7 / 7** | ✔ |
| skill_checks with an `onPass` closure | 78 | **79** | ≈ off by one |
| entries with a `completeFn` closure | 163 | **163** | ✔ **exact** |
| `checkStat` carriers (§SKILLFIX-01) | 2,443 | **2,443** | ✔ **exact** |
| `checkAbility` carriers | ~30 | **83** | ✘ (inherited from `662ee99`'s own comment) |

> **The report distrusted its first count, replaced it with a brace-walker, and printed
> *"Treat the originals as void."* The replacement is wrong by 324.** The instinct was right; the
> second instrument was not better than the first. Note precisely *which* figures survived: every
> exact number is one that could be taken by grepping a single field (`completeFn` 163,
> `checkStat` 2,443, the 14 UQF ids). Every wrong one required walking the whole corpus. **A count
> you can copy is evidence; a count you must derive is a claim.**

The *implication* the survey drew was nonetheless correct and is the document's best judgement
call: at either figure, Wave 2 is not sixty hand-migrations but ~2,340 near-identical ones, so it
must be a programmatic transform. Being wrong about the magnitude did not change the decision.

---

## 4. Method — the playbook

### 4.1 Recon (per arc, once)

1. `grep -n "quest_<arc>_" roll2hit-v3.html` — enumerate the arc.
2. Read each quest's **full** legacy object; capture the verbatim long strings.
3. **Grep for external consumers** of every field you intend to drop
   (`\.checkStat|\.checkPassFlag|\.onPass|\.completeFn`). Confirm they occur only inside
   `_rollCeremonia` / the `storyCheckQuests` loop, both schema-guarded. A field read by a
   `storyRender` block stays.

### 4.2 Transform (per quest)

4. **`activateCond` → `gate`.** `()=>!!A` → `{flags:['A']}` · `A && B` → `{flags:['A','B']}` ·
   `A || B` → `{flagsAny:[…]}` · negation → `notFlags` · visited-node → `nodes`.
5. **Pick the mechanic.** Skill check → a `skill_check` bit (`stat` UPPERCASE, `skill`, `dc`).
   Passive/side → a declarative `completion` gate, `bits:[]`.
6. **`onPass` closure → an ordered bit chain**, statement by statement:
   `checkPassFlag` → `{kind:'mission_bit', flag}` — **not** a bare `flag_write`, which sets the flag
   and drops the inventory token · extra `S_story.x = true` → `flag_write` ·
   gold/xp/knowledge/item pushes → one `reward` · `storyMsg(text)` → `narrative`, pasted verbatim.
7. **`onFail` closure → `[{kind:'narrative', msg}]`.**
8. **`completeFn` → a `completion` gate** (`flags` AND-group; `flagsAny`/`battles` OR-group).
9. **Preserve display fields byte-for-byte**: `title, desc, hint, disposition, passText, failText,
   waypointNode, npc, retryable`; keep `type` for the badge.

> **Fail flags do not migrate themselves.** The legacy non-retryable fail path granted
> `checkFailFlag` through `_grantMissionBit`; `_resolveQuestUQF` does not. A quest with a
> `checkFailFlag` needs an explicit `onFail:[{kind:'mission_bit', …}]`. Safe because such quests are
> non-retryable, so the chain runs exactly once. `retryGateDays` needs no migration — the retry
> helpers read it directly and are schema-agnostic.

### 4.3 Generalise, never special-case

10. A missing mechanic becomes a **reusable** gate term or bit kind with a `BIT_CONTRACTS` entry —
    never a quest-specific branch. Every term in §6 was born this way and every one immediately
    served several quests.
11. **`_legacy_fn` is the sanctioned escape hatch**, not a failure. An imperative shared helper
    (`_addCroneMark()`, `_innKindness(1)`) rides as `{kind:'_legacy_fn', fn}` — byte-identical
    behaviour, and the quest still moves onto the `schema+gate+bits` shell. Do not invent a
    single-use bit kind for one helper. **Order matters:** emit `reward` before `_legacy_fn`, to
    mirror the legacy `xpAward`-then-`onPass()` sequence.

### 4.4 The codemod recipe (validated Wave 1g, industrialised Wave 2)

A one-shot script with an explicit per-quest `[oldStructural, newStructural]` spec, applied
**within each quest's brace-delimited block** — so each old-string need only be unique inside its
own block, not the whole 5 MB file. Touch **only structural fragments**; never the narrative prose,
whose apostrophes and quotes make escaping brittle. Recompute the section bound after each splice.
Then: vm-parse, structurally assert every target, run the suites, and **delete the one-shot script**
— *the transform lives in git and in this report.*

Wave 2 promoted this to `src/scripts/uqf-bulk-migrate.js`, which survives at HEAD. It is
safe-by-construction: it never re-serialises a narrative string; it deletes only scalar legacy
fields; it decomposes the trivial `()=>!!S_story.<flag>` gate and keeps any other `activateCond`
verbatim behind `gate:{_legacyFn:true}`; and it **throws** if an `activateCond` survives a
decompose. Two hardenings from Wave 2c are still verbatim in
`src/scripts/uqf-bulk-migrate.js:function trivialGateFlag(body) {@116`: the lookahead widened to
`(?=[,}])` so a trivial gate that is the literal's **last** field is not missed, and the optional
`"?` that strips the dead string-form duplicate.

### 4.5 Verification protocol

Three protocols, chosen by what the legacy path actually did:

- **Pure parity** (most families) — capture a **pre-migration golden** (legacy resolution + verbatim
  display fields), re-run post-migration, assert byte-for-byte. Where the legacy `checkStat` was
  UPPERCASE, seed the golden under **both** stat cases so a deterministic extreme drives either
  resolver.
- **Display + mapping** (§SKILLFIX-02 families) — the roll deliberately changes, so assert
  (a) display untouched, (b) structure, (c) `SKILL_TO_ABILITY[checkStat] === stat` with the skill
  preserved and the DC unchanged, (d) the new behaviour is deterministic. **Never** against the
  buggy `+0` roll.
- **Structure + new behaviour** (Waves 4–5) — there was no legacy behaviour to mirror; the resolver
  was unreachable.

**Five test shapes per migrated quest or arc:** validates as UQF · activation gate (unmet ⇒ no
activate, met ⇒ `'active'`) · PASS parity · FAIL behaviour (non-retryable ⇒ `'failed'` and grants
nothing; retryable ⇒ stays `'active'`, logs an attempt) · completion truth-table plus a real
`storyCheckQuests` `'active'`→`'complete'` flip.

**Techniques worth keeping.** Force an outcome by **ability score**, not by a merely-low one: `{wis:40}`
always passes, `{wis:-100}` (mod −55) always fails, but `{wis:1}` (mod −5) still clears a low DC on a
d20 of 16–20 and flakes ~25 % — Wave 1a shipped exactly that bug and 1b caught it. Suppress
level-up noise with `S_story.level = 20` and assert **deltas**. Drive the real entry points
(`_rollCeremonia`, `storyCheckQuests`), not just the VM. And **assert on the rendered container,
not `document.body`** — the body includes the inline `<script>`, so every quest's literal strings
"match" and the assertion means nothing (Wave 1d's render test hit exactly this).

---

## 5. As-built — the wave programme

### 5.1 Phases 1–3 and Wave 1 (hand-migrated: bespoke closures)

| Wave | Subject | n | Grammar added / note | Commit |
|---|---|---|---|---|
| P1 | Inert UQF runtime (`SCHEMA_VERSION`, `BIT_CONTRACTS`, `validateQuest`, `adaptLegacyQuest`, `QuestRuntime`) | — | — | `80bc1f4` |
| P2 | Dual-path dispatch; panel/sheet render UQF; gate-gated activation | — | — | `f5117ca` |
| P3a–c | §WISDOM-01 pilot → 100 % UQF | 8 | `mission_bit`; declarative `canComplete` | `d7505ff` `014fd00` `fcd1e37` |
| 1a | Wane's Crown | 6 | `gate.questsAttempted`, `gate.questsDone` | `24becb6` |
| 1b | Whisper's Crown | 6 | first `side`: `completeFn`→`completion`, `onComplete` kept | `7b69ce7` |
| 1c | Glut's Crown | 6 | flag-gated `side` + multi-effect `onComplete` | `ee58181` |
| 1d | Ceremonia: Yael | 5 | `gate.favorMin`; `checkFailFlag`→`onFail:[mission_bit]`; `vignetteTextAlt` parity fix | `c164fe2` |
| 1e | §1367 skill-checks (4 of 6) | 4 | clamped faction/faith counters via `_legacy_fn` | `e98feb7` |
| 1f | Ceremonia d0207 | 5 | `gate.battles`; first full d02xx arc — template for the other 8 | `e8f7d59` |
| 1g | d0201 + d0205 + d0209 | 15 | **first codemod batch** | `7583772` |
| 1h | d0204/06/08/10 → **d02xx 40/40** | 20 | `gate.shardsMin`, `notBattles`, `restedAtMin`, `completion.questsComplete`; deliberate bug-fix (dead `completeItems` → `reward.items`) | `58e598f` |
| 1i | Innmother | 3 | `gate.sleptAt` | `527692c` |
| — | **§SKILLFIX-01** — game-wide `+0` ability-mod fix at 4 read sites | 2,443 | see §2.2 | `662ee99` |
| 1j / 1k | Spark · Spark2 | 5 / 5 | first arcs on the pure-parity footing | `a06772d` `d9f2d1e` |
| 1l | Codex Inquisitor gauntlet | 3 | fully decomposed, no `onPass` `_legacy_fn` | `255060c` |
| 1m | Sea: The Warmth Calm | 3 | **`completion.atNode`** | `1c636ab` |
| 1n | Naval Intercept | 4 | **`gate.flagEquals`**; ⚠ latent +800 xp double-count preserved | `869dc09` |
| 1o / 1p | Hunt ×2 · Bilge | 8 / 4 | investigate→clear shape; ⚠ same double-count | `df36c93` `54e0130` |
| 1q | §ALCHEMY-01 Personal Legend | 7 | 5 structural waypoint sides | `23ba7b5` |
| 1r | §SCAR-01 The Scar | 4 | moral branch: both paths progress | `ac9ef23` |
| 1s | §SIREN-01 Four Courts | 5 | `checkFailFlag`→`onFail mission_bit`, same `bitLabel` | `a1b67db` |
| 1t | Biblical singletons | 2 | shared pass/fail flag; ordered `_legacy_fn` before the bit | `2c0359b` |
| 1u | §CROWN-01 iodine chain | 4 | rich closures kept whole, ordered after `reward` | `d84c87b` |
| 1v | **Wave-1 closeout** — Highland + folk | 4 | `lxvii67`'s `faith_folk>=1` inexpressible ⇒ `gate:{_legacyFn:true}` | `cdc788f` |

### 5.2 Wave 2 — bulk families

Every row below is verified at HEAD: quest count, gate split, pass-flag split and the
`skill→ability` mapping count. **All 54 are exact** (§7.1). *Gates* = `{flags}`/`{}`;
*Pass* = `mission_bit`/flagless; *Map* = §SKILLFIX-02 mappings.

| Wave | Family | n | Gates | Pass | Map | Commit |
|---|---|---|---|---|---|---|
| 2a | `hav_` The Articles | 30 | 24/6 | 30/0 | 0 | `ae4f6de` |
| 2b | `ada` (largest family) | 235 | 0/235 | 235/0 | 0 | `8cf47e9` |
| 2c | `ath` Trojan cycle | 113 | 41/72 | 113/0 | 0 | `10a0d05` |
| 2d | `lis` Lisbon / Camões | 89 | 18/71 | 89/0 | 0 | `2529bb0` |
| 2e | `zth` Zürich | 75 | 15/60 | 75/0 | 0 | `32b92b8` |
| 2f | `flr` Florence | 71 | 12/59 | 71/0 | 0 | `795cf2a` |
| 2g | `hft_` Hanseatic trade | 50 | 28/22 | 35/15 | 0 | `b689956` |
| 2h | `rkv_` Reykjavík | 50 | 28/22 | 35/15 | 0 | `fdf3e0f` |
| 2i | `ist_` Constantinople | 48 | 10/38 | 48/0 | **32** | `fc040cd` |
| 2j | `rix_` Egil's Saga | 47 | 26/21 | 33/14 | 0 | `b299595` |
| 2k | `ost_` Norse Dublin | 46 | 25/21 | 32/14 | 0 | `ccbf9de` |
| 2l | `arn_` Arnarstapi | 43 | 25/18 | 32/11 | 0 | `0262c68` |
| 2m | `vby_` Viby | 42 | 26/16 | 33/9 | 0 | `63830b2` |
| 2n | `kya_` Trebizond | 52 | 40/12 | 52/0 | 0 | `2d7c204` |
| 2o | `jrs` Jerusalem | 51 | 12/39 | 51/0 | 0 | `1113652` |
| 2p | `clj` (prefix `clj`, **not** `clj_`) | 42 | 33/9 | 33/9 | 0 | `ab34eca` |
| 2q | `nwi` (prefix `nwi`) | 42 | 41/1 | 42/0 | 0 | `a497b85` |
| 2r | `bey_` | 42 | 32/10 | 42/0 | 0 | `194bd8d` |
| 2s | `tbs_` Knight in the Panther's Skin | 41 | 32/9 | 41/0 | 0 | `2e814e2` |
| 2t | `crl` | 40 | 39/1 | 40/0 | 0 | `cc7f362` |
| 2u | `shk` | 40 | 18/22 | 27/13 | 0 | `38c2f40` |
| 2v | `kir_` | 35 | 28/7 | 35/0 | 0 | `12550c1` |
| 2w | `lcy_` White Company / Du Guesclin | 35 | 34/1 | 35/0 | 0 | `d0d9cc7` |
| 2x | `lgw_` Le Morte d'Arthur | 35 | 34/1 | 35/0 | 0 | `375d296` |
| 2y | `gci_` Toilers of the Sea | 35 | 34/1 | 35/0 | 0 | `671ce4b` |
| 2z | `waw` — **reclassified clean** | 38 | 30/8 | 38/0 | 0 | `d984179` |
| 2aa | `ams_` — **reclassified clean** | 35 | 28/7 | 35/0 | 0 | `4a867f1` |
| 2ab | `bgw_` Genie Contract | 37 | 0/37 | 37/0 | **37** | `189a995` |
| 2ac | `cai_` | 35 | 0/35 | 35/0 | **35** | `e04d490` |
| 2ad | `blq` — **split**: 29 migrated, 30 stubs left legacy | 29 | 23/6 | 29/0 | 0 | `2aa42b4` |
| 2ae–2ao | the clean 35-tier: `inv_` Ossian · `bhd_` · `sdq_` Rob Roy · `plw_` Piers Plowman · `gdn_` Njáls saga · `boo_` Prose Edda · `alf_` Kalevala · `ksu_` St Olaf · `cdg_` Three Musketeers · `vie_` Faust · `erf_` Grimm | 35 each | 34/1 each | 35/0 each | 0 | `080a2e5` `ad7764d` `9ec1368` `196156a` `92c801a` `a8503f0` `fadae2a` `86470f7` `bbadaf7` `329812e` `cbbdc46` |
| 2ap | `mla` | 34 | 33/1 | 34/0 | 0 | `0851d9a` |
| 2aq–2as | `mse_` · `lhr_` · `cid_` | 34 each | 27/7 each | 34/0 | 0 | `e9ff598` `d08b7b4` `094f9de` |
| 2at | `lbc_` | 33 | 26/7 | 33/0 | 0 | `3eedc7a` |
| 2au | `hty` (first mixed mid-tail) | 33 | 26/7 | 26/7 | 0 | `4b4ed0a` |
| 2av | `fro_` Völsunga saga | 32 | 25/7 | 32/0 | 0 | `1ef19ab` |
| 2aw | `mol` Laxdæla saga | 30 | 23/7 | 30/0 | 0 | `a3f358c` |
| 2ax | `cph` (narrowest stat set: WIS+CHA) | 29 | 22/7 | 29/0 | 0 | `13a794a` |
| 2ay | `clr_` — pre-migrated at authoring | 5 | 0/5 | 5/0 | 0 | `81dae11` |
| 2az | `man_` | 23 | 16/7 | 23/0 | **23** | `c6dbfad` |
| 2ba | `sen_` | 19 | 12/7 | 19/0 | **19** | `9cfe61d` |
| 2bb | `stn_` | 11 | 6/5 | 11/0 | **10** | `8a6257a` |
| 2bc | `quest_*` singletons — **closes Wave 2** | 11 | 3/1 + 7 `_legacyFn` | — | 0 | `e602d92` |

**Family-shape vocabulary** (worth naming once instead of restating 54 times): *uniform-flag* = every
act carries a `checkPassFlag`; *mixed* = some acts granted nothing on pass, faithfully reproduced as
`onPass:[]`; *type-gated sibling* = a `combat`/`hybrid`/`delivery` act inside a chapter that the
skill-check-only transform correctly skips, leaving an act-number gap that is the sibling's slot,
not a data hole; *prefix bleed* = ids matching the prefix that are not quests (mission-bit values,
monster keys). **Sequencing lesson, learned twice:** always `--dry` and read the id list first —
`--prefix clj_` matches nothing because that family uses `cljNN_actN`.

### 5.3 Waves 3–8

| Wave | Result | Commit |
|---|---|---|
| 3a | **61 sides** migrated. New **`completion.items`** OR-term reproducing the legacy fuzzy two-way substring rule byte-for-byte. 3 inexpressible gates kept behind `gate:{_legacyFn:true}` | `ea4f8d2` |
| 3b | **32 more sides → 93/99.** Three new AND-position terms: **`countMin`** (dot-path, number/array-length/key-count/missing→0; 17 uses) · **`itemsAll`** (exact-name, `'Name'` or `{name,min}`) · **`flagsPath`** (nested dot-path flags; also added to `canActivate`). Found and flagged three **suspected dead gates** (`guide_02/03/06` test `=== 'done'` on side quests that only ever reach `'complete'`) | `098e929` |
| 4 | **All 78 combat quests** → fight-roll resolver. Recon: all were dead (§2.2). Resolve through the existing skill-check machinery + a ⚔ FIGHT card; **zero new resolver code**. STR DC 12 default for the 21 placeholder/absent stats (user-approved). New `gate.countMin`. **Rode along:** the `guide_02/03/06` dead gates fixed → the Emmer arc chains | `1215651` |
| 5 | **106 other-type quests.** 99 were dead; `mq_1`–`7` were alive on `completeItems` ⇒ pure-parity `completion:{items}`. Typed default rolls (delivery CHA 12 📦 · escort STR 12 🛡 · dialogue mapped-skill 💬 · hybrid real stat 🎲). Zero new engine terms | `3460492` |
| 6 | **All 40 epic quests.** Recon overturned the predicted design pass: the epic lifecycle lives entirely *outside* the quest objects, so the quests are passive completion watchers — the Wave-3 side shape. Mapped onto existing `battles` / `flagsPath`. Zero engine changes | `ab996f1` |
| 7a | **Completion-bit execution point** — an array-valued `onComplete` executes as a bit chain via `execBits`; a function-valued one stays the byte-identical legacy call | `8e852a1` |
| 7b | All **27** `onComplete` closures → chains. Known xp double-counts preserved, not fixed | `478b5f2` |
| 7c | The **61**-id hardcoded effects block → per-quest chains; **the id-keyed block is deleted**. New **`favor`** bit kind over the monotonic `_setNpcFavor`. `_legacy_fn` handlers now receive `ctx`. Carriers → 88. Known presentation change: chain messages print *before* the `✓ title` line | `a79c76a` |
| 7d | **Legacy branches retired.** `_rollCeremonia`'s roll body deleted → UQF dispatch + a warned no-op; `completeFn`/`completeItems` completion terms deleted; `adaptLegacyQuest` → identity. The last `completeFn` (`quest_wm_01`) migrated via a new `itemsMinAny` OR-term | `f8691c1` |
| 8a | Dead-field sweep: **100** inert `completeItems:[]` + the last root `check*` residue; roll-card display reads the **bit** only | `b008cde` |
| 8b | **Worldbuilder UQF export (§EDITOR-03)** — Mission Builder, ✏ Editor and `serializeQuestLiteral` all emit UQF; legacy authoring retired (§2.3) | `11af1e5` |
| 8c | **storyRender audit — the engine is the sole completer; §ARCH-01 CLOSED.** Every per-node hook reads **zero** legacy quest-execution fields. Two redundant inline shortcuts (Yugurt tournament, free-rod coupon) deleted after proving `opp.xp === xpAward` for every act. `quest_la_riva_02` documented as the sole inline exception | `647e070` |

> **Wave 8c inverted its own approved direction on evidence.** The option text read *"strip the dead
> `xpAward` + completion mirror"*; the tests proved the engine path was the live and canonical one,
> so the redundant code was the **inline shortcut** and the fix was the inverse. Re-confirmed with
> the user before editing. *An approved plan is a hypothesis until the tests answer.*

---

## 6. The grammar as built

Every term below was produced by a quest that needed it, and every one is live at HEAD.
Host: `const SCHEMA_VERSION = 'UQF-1.0';@21966` · `const BIT_CONTRACTS = {@21970` ·
`function validateQuest(q) {@22004` · `canActivate(questId) {@22193` · `canComplete(questId) {@22205` ·
`*execBits(bits, ctx) {@22223` · `function _resolveQuestUQF(questId) {@6962`.

| Surface | Terms (HEAD carrier counts) | Born in |
|---|---|---|
| **`gate`** (mission listing) | `flags` 1624 · `questsAttempted` 24 · `questsDone` 21 · `notFlags` 7 · `battles` 5 · `flagsPath` 5 · `countMin` 4 · `favorMin` 4 · `sleptAt` 4 · `flagEquals` 3 · `flagsAny` 2 · `shardsMin` 1 · `notBattles` 1 · `restedAtMin` 1 · `_legacyFn` 14 · `nodes` (`src/js/quest.js:if (g.nodes    && !g.nodes.every@121`) | 1a · 1d · 1f · 1h · 1i · 1n · 4 |
| **`completion`** | `flags` 74 · `battles` 40 · `flagsPath` 28 · `countMin` 23 · `atNode` 19 · `itemsAll` 15 · `items` 9 · `flagsAny` 4 · `questsComplete` 1 · `any` 1 | 1f · 1h · 1m · 3a · 3b |
| **`bits`** | `skill_check` 2635 · `mission_bit` 2449 · `reward` 159 · `_legacy_fn` 124 · `narrative` 120 · `flag_write` 46 · `unlock` 18 · `favor` 16 · `item_remove` 7 | P3a · 7b · 7c |

**Post-report additions** (later tracks, listed so the grammar reads complete): `dayMin`/`dayMax`
gate terms (§BOARD-01 Void-tide windows), the `any`/`not` expression AST (§VM-01-F), and the
`cost`, `choice` and `combat` leaves used by `NODE_VERBS` rather than by `QUEST_DB`.

---

## 7. Verification at HEAD (2026-08-17, §DOC-02bu)

### 7.1 What re-measures exact

- **All 94 distinct commit hashes resolve.**
- **54 of 54 bulk families exact** — quest count, `{flags}`/`{}` gate split, pass-flag/flagless
  split, §SKILLFIX-02 mapping count and ability set, ~270 figures in all, 50 days on. The narrowest
  claims are the sharpest: `cph`'s "WIS + CHA only" holds; `gci_` is the first clean family spanning
  all six abilities; `tbs_` still excludes STR; the `blq` split is still 29 migrated / 30 stubs.
- **64 of 64 "Zero engine changes" claims exact.** Every hunk those 64 commits made to
  `roll2hit-v3.html` — additions and deletions both — lands **inside** the `const QUEST_DB = {@10615`
  literal. Not one strayed. The only non-test, non-doc file any of them touched is
  `src/scripts/uqf-bulk-migrate.js` in Wave 2a, where it was born. *A negative claim is normally the
  weakest thing in a report; this one is adjudicated by the diff and it holds 64 times.*
- **Waves 4–5 recon exact, 4 of 4.** 78 combat + 99 other-type with zero completion surface;
  `mq_1`–`7` alive on `completeItems`, 7 of 7. `if (q.type !== 'skill_check') return;` is verbatim
  in the archive.
- **Wave 7d is verbatim at HEAD.** `function _rollCeremonia(questId) {@7024` is the warned no-op;
  `function adaptLegacyQuest(id, q) {@22026` is the identity; `activateCond:"` string-duplicates = 0.
- **Wave 8a's field census holds as a property.** Root `completeItems`/`completeFn`/`check*`/
  `checkPassFlag`/`checkFailFlag`/`bitLabel`/`goldAward` = **0**. `activateCond` = **44**, still
  exactly 14 UQF `_legacyFn` gates + the 30 stubs — the same number, 51 days later. `xpAward` = **45**
  and still **100 % `type:'side'`** (the figure drifted from 50; the invariant did not).
- **Wave 8c's ordering claim holds.** `_runNodeHook('la-riva-row', node);@35119` runs before
  `const questMsgs = storyCheckQuests(node);@36041`, so inline hooks still precede the engine's
  completion pass — through an entire §VM-01 hook migration that rewrote the region around it.
- **The report's own acceptance suite: 303 passed / 0 failed** (`quest-runtime-uqf.test.js`, 4.1 min).
  It was 288 at close; §MATH-01 and §VM-01-F added the rest.
- **`check:anchors`** 0 dead · **`check:walk`** 16/16 (it was 6/6 during the migration).

### 7.2 What drifted, and one that never held

| Claim | At HEAD | Verdict |
|---|---|---|
| "all ~2,700 quests UQF-1.0" | 2,853 quests, **2,823 UQF** | figure drifted; property holds |
| Residuals "math ×5 + 30 blq stubs" | **30 blq stubs only** | ✅ half **retired** — §MATH-01 (`32d7bb0`) gave `quest_math_01`–`05` real `itemsAll`+`atNode` completions |
| "the 30 stubs are activate-only, zero completion surface" | 30/30, still true | ✔ pinned by test |
| W7d's new `itemsMinAny` term | **deleted** — §VM-01-F's `{any}` + `itemsAll` supersedes it | ✅ retired, and the suite pins the replacement's truth-table |
| §4 "finalize `item_check` as a completion term" | shipped as `completion.items`; a **separate `item_check` bit kind** also exists | ⚠ see §9 |
| "verified by 22 Playwright tests" | 288 at close, 303 now | stale by construction |
| "byte-for-byte unchanged for the other 276 quests" | derived from the void 284-entry survey; the real remainder was 2,825 | ✘ arithmetic on a wrong census |
| "`check:walk` 6/6" | 16/16 | stale |
| §3 "All tests live in `quest-runtime-uqf.test.js`" | true for §ARCH-01; the repo now carries 21 `uqf-*` specs | superseded |
| `_rollCeremonia, ~L6308` · `L6355` | the type guard sits at ~6271 in the archive | historical line hints — do not trust the numbers |

### 7.3 Internal contradictions found

1. **The header contradicts §3.** *"migrating all 284 QUEST_DB entries"* was left in the scope line
   after §3 voided that survey — and both figures are wrong. Corrected in this revision.
2. **Epics are Wave 5 in the prose and Wave 6 in the table.** The sequencing rule *"Defer epics
   (Wave 5)"* and the risk row *"Wave 5 is gated on a design pass"* both point at the wave that
   actually shipped the *other* types. HEAD sides with the table: epics were Wave 6, `ab996f1`.
3. **The wave table's tail was out of chronological order.** Rows 2av–2bb (2026-06-30) sat *below*
   Wave 8c (2026-07-05), so the table announced §ARCH-01 CLOSED and then continued for seven more
   rows. Reordered here.
4. **One transposed commit hash — and it is the invisible kind.** Wave 2j (`rix_`) cited
   `bbadaf7`, which is Wave **2am** (`cdg_`)'s commit. Both resolve, so *"does this hash exist?"*
   passes while the row is still wrong. The correct hash — `b299595` — **was** written by
   `1fc91c5` (*"backfill Wave 2j hash"*) and then **overwritten the same day** by `2831fc9`
   (*"backfill Wave **2am** hash"*), whose edit touched both rows. Corrected in §5.2.
   *A pointer that resolves to the wrong sibling is worse than a dead one: nothing can flag it.*

---

## 8. Registers

### 8.1 Risk register — 5 of 5 resolved, and one is still asserted

| Risk | Outcome |
|---|---|
| Long-string transcription drift | ✅ Held. Structural-fragments-only codemods; the Wave 2ag–2ak diff audits report 35 ins / 35 del with **zero non-structural lines touched**. |
| Hidden external consumer of a legacy field | ✅ Held. The §4.1 grep was mandatory; Wave 8c's audit found the root fields grep to **0** outside the engine. |
| Per-id hardcoded completion effects | ✅ Resolved in Wave 7c — inventoried (61, against a *"~80"* estimate), moved into chains, block deleted. |
| Epic lifecycle surprises | ✅ Dissolved by recon, not by a design pass — the lifecycle was never in the quest objects. |
| Silent reward/level-up timing change | ✅ Still exactly as documented: `src/js/quest.js:if (E.checkLevelUp) E.checkLevelUp();@337` fires inside the `reward` handler, benign, asserted by delta. The one risk that is **still true rather than retired** — and it now lives inside the `QUEST:CORE` parity fence. |

*Two of these were retired by measurement rather than by work, which is the honest and the cheap
outcome: the epic design pass and the "~80-id" block were both smaller than feared.*

### 8.2 Follow-up register — scored

| Follow-up | Outcome |
|---|---|
| `item_check` finalized as a completion term (Wave 3) | ✅ shipped as `completion.items` — **but see §9** |
| Combat resolver (Wave 4) | ✅ needed zero resolver code |
| Epic design pass | ✅ unnecessary |
| W4b "real battles for combat quests" | ⏸ never taken; combat quests still resolve as a roll |
| Known xp double-counts (`sb_fight`, `hunt_04`, `hunt2_04`, `bilge_04`, `sk_hull`) | ✅ **all five closed** — none carries `xpAward` at HEAD; each pays once from its `onComplete` chain |
| `quest_la_riva_02` → an `onComplete` chain (deferred §GR) | ❌ **still open** — §GR closed without it. §9 |
| Worldbuilder still authors legacy (`W8a` non-goal) | ✅ closed by Wave 8b the same day |

---

## 9. Defects filed

**§DX-02cm 🟢 — `quest_la_riva_02` is the one quest the engine can complete and cannot pay.**
Wave 8c named it the sole inline exception and deferred the fix to §GR; §GR closed without taking
it. At HEAD the quest carries `completion:{countMin, itemsAll}` and **no `onComplete`, no
`xpAward`**, while all six of its effects — +500 gp, the Old Tuna Account Book, Aldo's favour, the
activation of `quest_la_riva_03`, and two narration beats — live in an **AMS-only** hook
(`S_story.quests['quest_la_riva_02'] = 'complete';@31904`) guarded on `status === 'active'`. Ordering
saves it today: the hook runs before the engine's pass in the same render. But the completion gate
carries **no `atNode` term**, so any `storyCheckQuests` that fires while the two conditions hold and
the player is not rendering AMS flips the quest to `'complete'` and the hook's `'active'` test can
never be true again — silently stranding the arc. Fix: either fold the effects into an `onComplete`
chain (the §GR intent) or add `atNode:'AMS'` to the completion gate as a one-line fence. The
exception *is* test-pinned, so this is a design debt rather than a silent rot.

**Not filed — already open.** The `item_check` bit kind is **§DX-02as item (d)**, and that row
already credits this document: the contract at `item_check:  { required:['name'],@21989` carries the
comment *"lab Open-Q #3"*, and the handler `item_check(bit, ctx) {@22311` writes `ctx._itemCheck`,
which nothing in the file reads. **Zero authored uses across 2,853 quests.** It is the report's §4
follow-up landing twice — once correctly as `completion.items`, once as an opcode that evaluates a
predicate into a variable no one consumes. *A conditional in a language with no `if`.*

---

## 10. Limitations of this document

- **It is a method document, so its §5 tables are a ship record, not a specification.** Where a wave
  row and the live grammar disagree, §6 governs.
- **`_legacy_fn` was never eliminated and was never meant to be** — 124 chains still carry one.
  Wave 7c's design decision (hand `ctx` to the closure) made it a first-class member of the grammar
  rather than a wart. The honest reading is that ~4 % of quest behaviour resists declaration, and
  the format budgets for it.
- **The line numbers in the original prose (`~L6308`, `L6355`) are historical** and should not be
  trusted; the `symbol@line` anchors added in this revision are current as of 2026-08-17.
- **The 30 `blq_05`–`blq_10` book-stubs are deliberately unmigrated.** They are the Decameron
  "Falcon's Inventory" placeholders: `reward:NaN, activateCond:() => !!S_story.null,@14126` — thirty
  quests offering a reward that is not a number, gated on the falsiness of nothing. They would have
  crashed the migrator's well-formedness guard, so Wave 2ad used an explicit id-list and a permanent
  test pins them as legacy. They are the residue the format is allowed to have.

---

*§ARCH-01 — UQF Migration Playbook. Companion to `lab-report-quest-api-architecture.md`.
Author: World Builder — CodexOfConquest.com. Verified and rewritten 2026-08-17 under §DOC-02bu.*

*© 2026 Paul Richeson — MIT License. See [LICENSE](../LICENSE) for full text.*
