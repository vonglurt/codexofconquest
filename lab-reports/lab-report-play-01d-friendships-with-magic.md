<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com -->
# Lab Report — §PLAY-01-D *Friendships With Magic*: signpost the magic path through a person

**Parent:** `lab-reports/lab-report-play-review.md` §PLAY-01-D · **Track:** BACKLOG.md §PLAY-01
**Date:** 2026-07-12 · **User decisions:** **(1) Signpost only** — pure honesty fix, fishing stays the SOLE source of magic gear (preserve §FC06 "fishing = permanent edge", zero balance change) · **(2) Yael in Birka** delivers it (start-city, turn-one, unmissable).

## 1. The say/do gap (verified in code)

- By design (§FC06), monster kills drop **base-tier only** — `_rollMonsterWeaponDrop` (`23883`) filters `magicBonus === 0` and applies a `−4..0` degrade prefix. The unified d100 table (`_D100_TABLE`, `23818`) carries **no** `mainweapon`/`dagger` rows anymore. **The only positive-magic vector is the Yugurt Lake fishing subsystem** (catch-battles → `lake_magic` gear via §DROP-03 grant at `6900`; big-catch gold; the whole Fisherman arc).
- A player who never discovers fishing is **permanently capped at base gear**, including the final fight vs Auros (AC 22 / HP 300).
- **The first touch of that path is impersonal:** `quest_no_fishing_sign` (`13634`) — a handwritten pull-tab on a **lamppost** — is what hands you the free rod. The *person* who owns the theme (the Fisherman at Yugurt Cabin, `the_fisherman` `22358`) only enters **after** you've already found the lake on your own.
- **The Curse of Knowledge, at the character level:** Yael Scheidemann's turn-one onboarding monologue (`yael.impartial[0]`, `10216`) — reliably shown on first meeting (`pool[count % len]`, first visit `count===0` → index 0, `23012`) — **already mentions fishing**, but buries it as a throwaway stat-grind aside: *"Dexterity is built slowly — there is a fishing dock, if you have patience for a hook and a slow river."* The one person everyone meets first **knows** where the edge comes from and fails to transmit it. (It's also geographically loose — "dock"/"river" vs the actual **Yugurt Lake**, which `the_fisherman` places **north**.)

**Conclusion:** the magic-gear vector must reach the player *through a person* (theme: "magic that is the byproduct of choosing people over efficiency"). The soft-lock is a transmission failure. The honest, minimal fix is to make Yael's existing line **actually signpost the Fisherman/lake as the source of the edge** — turning the game's most-seen NPC from someone who *withholds* what matters into someone who *chooses to hand it to you*, and pointing onward to a second person (the Fisherman) who gives the rod free.

## 2. Scope — one string, in Yael's voice (no state/mechanic/balance change)

**Change:** rewrite the single fishing sentence inside `yael.impartial[0]` (`10216`).

- **From:** `Dexterity is built slowly — there is a fishing dock, if you have patience for a hook and a slow river.`
- **To** (understated-care register; names the lake, the Fisherman, the free rod, and *why it matters*):
  > `Dexterity is built slowly — and so is the only edge that will hold against what is actually coming for you. The smiths in this city cannot sell it; the lake can. Go north to Yugurt, to the cabin, and find the old man who keeps it — they call him the Fisherman. He hands the rod to anyone who will use it, free, and asks nothing back. The water gives up what no shop stocks. I tell you plainly because the last three who came through, I met once and after that only read their reports. Go to the lake early. Bring patience for the hook.`

**Why this satisfies both decisions:**
- **Signpost only** — pure dialogue. No new quest, item, flag, or drop; fishing remains the sole magic source; §FC06 intact; zero balance change.
- **Yael / start-city** — edits the turn-one, index-0, always-shown monologue → the magic path's *first touch* is now a person deliberately steering you, enacting "someone chose to help you." Yael stops committing the Curse of Knowledge; she transmits the thing that killed "the last three."
- **Two people, not a menu** — Yael points to the Fisherman; the Fisherman gives freely. The vector now reads as a chain of people, matching the prose.

**Explicitly NOT changed (honest, not a silent half-fix):**
- `quest_no_fishing_sign` (the lamppost coupon) **stays** as an alternate discovery — removing existing content is destructive and unnecessary; Yael simply becomes the *primary, first, person-delivered* touch. ("Replacing the first touch" = Yael is now what you hit on turn one, not the lamppost.)
- No change to `_rollMonsterWeaponDrop`, `_D100_TABLE`, `LAKE_MAGIC_DB`, the §DROP-03 grant, the Fisherman arc, or any weapon/dagger tier. No generic magic drops re-opened.

## 2b. Two blockers found during verification (both required for the signpost to actually reach the player)

Editing the string alone did **not** work — verification exposed two pre-existing defects that shadowed/suppressed the monologue. Both are the same class as §PLAY-01-G's "map ≠ territory" drift.

1. **The monologue was being shadowed by an auto-active quest.** `_getNPCDialogue` picks the pool by relationship state (`22950`): if `_hasActiveQuestFor('yael')` is true it uses the `questActive` pool, not `impartial`. `quest_slums_cleanup` (gate `{}`) is **active from turn one**, so a fresh player's first Yael line was a mid-Slums line — the onboarding welcome speech (`impartial[0]`) was never delivered. **Fix:** a one-time guaranteed delivery at the top of `_getNPCDialogue` (matching the existing one-time-injection patterns there — Froberger trace, act-three, Weckmann): first meeting with Yael on a **fresh run** returns `impartial[0]` and sets `S_story.yaelOnboardingSeen`. NG+ excluded (own greeting path; already knows the world). New flag defaulted in `_S_DEFAULTS()` (§STATE-INIT).
2. **Yael's card never rendered at the start node.** `birkaNpcs` (`31825`) keyed her card to `CI:['yael']` — a **dead pre-§WALK code** (no `NODE_MAP` node `CI`; `CI` is only a geo-grid coordinate `9369`). The real start node is `LHR`, where **all** her quests `activateNode:'LHR'` and the node's NPC *is* the City Guard Captain. So `birkaNpcs['LHR']` was undefined and the card (thus the monologue, thus the signpost) never rendered. **Fix:** `CI` → `LHR`. **Scope-honest note:** the siblings `IN/TV/BA/CY` (brynn/quill/pachelbel/crov+auros) are the **same dead-code class** — flagged in-code + BACKLOG as the pending §PLAY-01-G remap pass, not guess-remapped here (only `LHR` was task-required and quest-confirmable).

## 3. Verification (all green)
1. Whole-file inline-script parse — 0 errors after each edit (5.08 MB block).
2. `tests/integration/friendships-with-magic.smoke.test.js` **1/1** — asserts: old `"fishing dock"`/`"slow river"` phrasing gone; line names **Yugurt** + **Fisherman** + **free**; keeps the Dexterity onboarding thread; the Slums quest **is** auto-active (the shadow condition); `yaelOnboardingSeen` defaults false then sets true; the **first** `_getNPCDialogue('yael')` returns `impartial[0]` (the signpost), the **second** does not (fires exactly once); no cross-contamination to another NPC's line.
3. Regression: `courier-map` 1/1 · `enemy-ai` 4/4 (touch `storyNewGame`/`_getNPCDialogue`) — green.
4. Full render path (DOM + screenshot `test-results/play01d-yael-signpost.png`): fresh game at **LHR** → Yael's card renders with the complete onboarding monologue, the signpost woven in verbatim; the old lamppost `NO FISHING` path still present as an alternate discovery.
