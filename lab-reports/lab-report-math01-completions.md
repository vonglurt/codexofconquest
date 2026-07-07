# Lab Report — §MATH-01 Completion Design: Mathematical World Quest Completions

**Date:** 2026-07-07 · **Status:** DESIGN LOCKED → implementation same session
**Scope:** Make `quest_math_01–05` completable. Parent §MATH-01 was audited PARTIALLY SHIPPED
2026-07-07: all four nodes (EHZ/MONS/ZERO/CNTR) and all five quests live with full prose, but the
quests are legacy non-UQF **activate-only** — no `completion`/`gate`/`bits`, so they can never
complete, and quest.md does not register them.
**Trigger (plan.md Lab Report Policy):** design review locking data shapes before any HTML edit.

---

## 1. Audit findings (2026-07-07, this session)

1. **The collection mechanism already exists.** `storyCollectLoot` (roll2hit-v3.html ~L28628)
   grants every ` · `-separated `node.loot` entry into `S_story.inventory` by **exact name** on
   first visit. The four math nodes already carry exactly the five quest documents (+1 flavor
   item):
   | Node | `loot` |
   |---|---|
   | EHZ Event Horizon — Math Station | `Hamadani Failure Record` |
   | MONS The Monster's Manifold | `12-Symmetry Manuscript` |
   | ZERO The Zero Corridor | `Zero Treatise · Counting Document Bundle` |
   | CNTR Cantor's Attic | `Moonshine Memo · ∞-Fragment` |
2. **Evaluation order supports same-visit completion.** `storyRender` calls
   `storyCollectLoot(node)` (~L29803) before `storyCheckQuests(node)` (~L34066); inside
   `storyCheckQuests`, activation runs before the completion loop. So arriving at a collect node
   grants the loot, then a `completion:{ itemsAll:[…], atNode:<here> }` fires on the same visit.
3. **Three of the four nodes are unreachable.** EHZ/MONS/ZERO all sit at `(38,215)` — a
   copy-paste of Jerusalem's cell — where JRS is the CELL_GRID **primary** (NODE_MAP order), and
   the game client has no sub-location entry UI (`cellMove` always lands on `destCodes[0]`).
   Consequences today: `quest_math_02` (activates at EHZ) and `quest_math_05` (activates at MONS)
   can never activate; EHZ/MONS/ZERO loot can never be granted. CNTR alone at `(37,215)` is
   reachable.
4. **The prose already specifies the correct placement.** Hints/failTexts: EHZ entered "through
   the Neon Undercity east panel"; ZERO "north of the Event Horizon Station"; MONS "east of the
   station"; CNTR "northeast of the station" / "north of the Monster's Manifold". HKG "Neon
   Undercity" sits at `(29,246)` and its northeast quadrant — `(29,247)`, `(28,247)`, `(29,248)`,
   `(28,248)` — is entirely free land (not in SEA_RUNS/IMPASSABLE_CELLS, not road cells, no
   NODE_COORDS occupants).
5. **UQF collect shape is proven.** Template: `quest_brynn_ledger` / `quest_couperin_lute` —
   `schema:'UQF-1.0', gate:{}, bits:[], completion:{ itemsAll:[name], atNode:CODE }`, gold via
   `onComplete:[{kind:'reward',gold:N},{kind:'narrative',msg:…}]`; xp paid by `storyCheckQuests`
   from the existing `xpAward` field on side-quest completion.
6. **Test pins:** the activate-only status is pinned three times in
   `tests/integration/quest-runtime-uqf.test.js` (~L8175 W3B holdout list, ~L8328 HOLDOUTS,
   ~L9296 non-UQF census `35 = 5 math + 30 blq`). All three must move with the migration.
7. **Adventure-Time register check (open audit item): PASSES.** EHZ station voice (Noether
   conservation, "waiting five hundred and twelve years"), MONS walls complaining about being
   perceived in three dimensions, CNTR Cantor's shade — all live as designed in memory
   `math-world-plan`.

## 2. Design decisions

**D1 — Node placement (the Undercity pocket).** Move via `PUT /api/coords/{code}` (409-guarded):
| Code | From | To | Fiction |
|---|---|---|---|
| EHZ | (38,215) | **(29,247)** | east panel of the Neon Undercity (HKG 29,246) |
| ZERO | (38,215) | **(28,247)** | north of the station |
| MONS | (38,215) | **(29,248)** | east of the station |
| CNTR | (37,215) | **(28,248)** | northeast of the station, north of the Manifold |

Every hint becomes literally true on the grid. Each node gets its own cell (single-code locale →
reachable, `activateNode` checks work, loot collectable).

**D2 — Free-Movement invariant upheld.** The original design memory's "EHZ accessible after
carrying 3 math documents" is **REJECTED** — that is a movement gate, forbidden by plan.md
§Free-Movement. The pocket is plain walkable land; the panel/rope/infinite-ladder remain fiction
in the node text. No mover, terrain, or IMPASSABLE change of any kind.

**D3 — UQF completion shapes** (`PUT /api/quest/{id}`; prose fields untouched):
| Quest | gate | completion | onComplete |
|---|---|---|---|
| quest_math_01 | `{}` | `{ itemsAll:['Zero Treatise'], atNode:'ZERO' }` | reward gold:300 + narrative |
| quest_math_02 | `{}` | `{ itemsAll:['12-Symmetry Manuscript'], atNode:'MONS' }` | reward gold:350 + narrative |
| quest_math_03 | `{}` | `{ itemsAll:['Hamadani Failure Record'], atNode:'EHZ' }` | reward gold:350 + narrative |
| quest_math_04 | `{}` | `{ itemsAll:['Counting Document Bundle'], atNode:'ZERO' }` | reward gold:500 + narrative |
| quest_math_05 | `{}` | `{ itemsAll:['Moonshine Memo'], atNode:'CNTR' }` | reward gold:600 + narrative |

All five also gain `schema:'UQF-1.0'` and `bits:[]`. Gold amounts mirror the authored legacy
`reward` field (kept for display parity, per couperin/pachelbel precedent). `xpAward`
(350/400/400/500/600) stays — paid by the engine on side-quest completion. **No `itemChain`** —
the documents are keepsakes; no recipient NPC exists ("Collect it" is the whole contract).

**D4 — `gate:{}` everywhere (no sequencing).** Spatial activation already sequences the arc
naturally (02 activates at EHZ, 05 at MONS — you must find the pocket first). Independent side
quests; a listing gate would add nothing.

**D5 — `atNode` = collect node, uniformly.** Completion fires where the prose says "collected".
Known edge (accepted): both ZERO documents are granted on ZERO's first visit, so if
`quest_math_04` is activated after that visit, it completes on a **re-visit** to ZERO. Consistent
with the atNode rule everywhere else in QUEST_DB.

**D6 — onComplete narrative lines** (recited before writing, per the incremental-recitation
rule):
- 01: `💰 +300gp — tucked into the treatise, a copyist's fee from the Liber Abaci ledger, uncollected since 1202.`
- 02: `💰 +350gp — the north wall, grudgingly: "You perceived three of them correctly. That deserves something."`
- 03: `💰 +350gp — the station: "Conservation law. Hamadani's effort is conserved. You carry it now."`
- 04: `💰 +500gp — three surveyors' wages, three civilizations, one settlement — compounded.`
- 05: `💰 +600gp — the difference between 196,883 and 196,884 is 1. The gold, however, is real.`

**D7 — no new state fields.** No S_story additions, no flags, no mission bits. A possible
`mathArcComplete` capstone flag is out of scope (onComplete bits are unconditional; a
five-quest-AND needs a check the bit language reserves for `completion`). Noted as an optional
future nicety, not planned work.

## 3. Out of scope / noted

- PKR/JAR/OLN/JER remain sub-locations of JRS at (38,215) — pre-existing, not math-related.
- `∞-Fragment` (CNTR flavor loot) stays quest-less flavor.
- The 30 dead `blq_05–10` stubs remain the only non-UQF holdouts after this ships (census 35→30).

## 4. Test plan

1. **Pin updates** (quest-runtime-uqf.test.js): remove quest_math_* from both holdout lists;
   census expectations 35→30 non-UQF, math filter count 5→0; add a §MATH-01 describe asserting
   the five completion shapes validate.
2. **Hermetic functional smoke** (scratch Playwright, `:1367` route-firewalled): five quests
   UQF + validate; four nodes at the new coords, each the sole code on its cell, cells passable;
   activation at JRS lists 01+04; seeded arrival at ZERO grants both documents and completes 01
   (and 04 when active) same visit with xp+gold; 02 activates at EHZ and completes at MONS; 05 at
   MONS→CNTR; zero pageerrors.
3. **Gates:** quest-runtime-uqf suite green (server STOPPED, no piped exit codes — plan.md
   Test-Run Rules); navigation+autosave Playwright; mud-harness 270/270 (node moves touch the
   world the MUD reads).

## 5. Docs plan

quest.md: five §MATH rows (`[✅ LIVE]`, live ids, HKG-pocket nodes) + summary count. index.md:
§MATH-01 registry row → this report; test row. plan.md: §MATH-01 → `[x]` closed with ship
record; §RESUME updated. Memory `math-world-plan` → shipped status.
