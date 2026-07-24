<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com -->
# Lab Report — §NPC-01-D: A Talk/Gift Verb to Make Favor Reachable at Scale

> **Status:** design-lock (pre-implementation). Locks the data shapes, the render surface, the
> favor progression, and the invariant analysis **before any HTML edit** (Lab Report Policy,
> CONTRIBUTING.md). One knob — *what talking costs* — is left as an explicit user decision (§6);
> the rest is locked here. Scoped from §NPC-01-D in BACKLOG.md; promotes `potential.md` §POT-P3.

---

## 1. The finding (measured live, 2026-07-23, `roll2hit-v3.html`)

§NPC-01-A/B/C + SF2/SF5/SF6 took the NPC relationship card from **~20 → ~203** card-bearing NPCs.
But favor — the state those cards key on — is authored at a tiny fraction of that:

- **`grep -c "kind:'favor'"` = 16** favor bits across the *entire* quest corpus, reaching **13** distinct NPCs.
- Only ~6 NPCs have a `dearFriendBits` auto-upgrade path (`_setNpcFavor`, `23146`) to reach fav 2.
- Favor is raised **only** by `{kind:'favor'}` quest bits + a handful of hardcoded spots (`crov` at `25039`).
  There is **no talk verb, no gift verb, no downtime hub** — `grep` for `onTalk|talkVerb|giftNpc|downtimeVerb` = 0.

So of the ~203 card-bearing NPCs, **~190 are permanently stuck at Impartial (fav 0)**. The card footers
gate on favor:

- **⚔ enemy footer** (`dlg.meta.enemy`) renders at **fav ≥ 1** (`_renderNpcCard`, `23417`) — **202** NPCs declare one.
- **✦ worldTruth footer** (`dlg.meta.worldTruth`) renders at **fav ≥ 2** (`23424`) — **219** NPCs declare one.

That is a large body of authored content (`meta.enemy` ×202, `meta.worldTruth` ×219) that **can never surface**
because there is no way to raise favor with the NPC it belongs to. §NPC-01-D closes that gap.

## 2. The design (locked): a Talk action on the NPC card

**Surface — the card, not the d-pad 🧙.** The d-pad "Talk to NPC" button (`btn-dpad-npc`, `37500`) calls
`storyShowNpc(node.code)`, gated on `NPC_DIALOGUE[node.code]` — a *separate*, node-keyed dialogue map (`22142`,
singular) that exists for only a small set of nodes. The ~203 relationship cards live in `_renderNpcCard`
(`23345`), keyed on **npcKey**, and currently carry **no interactive controls** (`cursor:default`). The Talk
action therefore belongs **on the card**, where all ~203 NPCs already are.

**What Talk does — reach Friendly, never Dear Friend.** `_setNpcFavor(key, level)` (`23146`) already does the
heavy lifting: it is monotonic (`level <= prev` returns), fires the "🤝 …looks at you differently now" message,
and runs the `dearFriendBits` auto-upgrade check. The Talk handler calls `_setNpcFavor(key, 1)` and **never
more**. This is the keystone that **preserves the §NPC-01-C reveal**:

- **Talk → Friendly (fav 1)** unlocks the **⚔ enemy footer** — *"what they're up against."*
- **Dear Friend (fav 2)** stays **quest / personal-act earned** (the existing `dearFriendBits` closures) —
  so the **✦ worldTruth footer** ("what they know") still requires a real deed, exactly as C shipped it.

**Earned, not a one-click dump.** Talking accumulates. It takes a few conversations, rate-limited so the card
can't be spammed to Friendly in one sitting. The scarcity model (the rate limit + whether it costs time) is the
one open decision — see §6.

## 3. Data shapes (locked)

**New persistent state — declared once in `_S_DEFAULTS()` (`22747`, single source of truth; §STATE-INIT):**

```js
npcTalk: {},   // §NPC-01-D — key → { count:int, lastDay:int }; talk progress toward Friendly.
               // count reaches TALK_TO_FRIENDLY → _setNpcFavor(key,1). Never raises above fav 1.
```

*Not* reusing `npcVisitCounts` (`22773`): that map increments on every passive card/dialogue view
(`_getNPCDialogue`, `23225`), so overloading it would let *looking* at a card raise favor. Talk must be a
deliberate act → its own map.

**New tunable constant (near the other favor helpers, ~`23144`):**

```js
const TALK_TO_FRIENDLY = 3;   // deliberate talks to reach Friendly (fav 1). Tunable; see §6.
```

**Handler (new, beside `_setNpcFavor`):**

```js
function _talkToNpc(key) {
  const p = BIRKA_NPC_PROFILES[key], dlg = _getNPCDialogue(key);
  if (!dlg) return;
  const name = (p && p.name) || (dlg.meta && dlg.meta.name) || key;
  if (_npcFavor(key) >= 1) { storyMsg('🤝 ' + name + ' already counts you a friend.'); return; }
  if (!S_story.npcTalk) S_story.npcTalk = {};
  const t = S_story.npcTalk[key] || { count: 0, lastDay: 0 };
  // ── cadence guard (the §6 decision fills this in) ──
  if (t.lastDay === S_story.day) { storyMsg('💬 You've said your piece with ' + name + ' today.'); return; }
  t.count += 1; t.lastDay = S_story.day;
  S_story.npcTalk[key] = t;
  if (t.count >= TALK_TO_FRIENDLY) _setNpcFavor(key, 1);   // fires the Friendly msg + dearFriendBits check
  else storyMsg('💬 ' + name + ' warms to you a little. (' + t.count + '/' + TALK_TO_FRIENDLY + ')');
  storyRender();   // re-render so the ⚔ footer / badge update
}
```

**Render — one button appended in `_renderNpcCard` (`23345`), below the quote, above the footers:**

- Shown only while `_npcFavor(key) < 1` (once Friendly, the ⚔ footer *is* the reward; no button needed).
- Styled to the card (a small `#8B4A2A`-bordered chip button), `onclick` → `_talkToNpc(key)`.
- Because a card can be re-rendered many times, wire the handler by `addEventListener` on the created
  element (not an inline `onclick=` string that would re-inject on every render), consistent with the
  card's existing DOM-node construction (`document.createElement`, `23383`).

## 4. Invariant analysis (all clear)

- **Free-Movement (#1):** untouched. Talk is a card-button action — it makes **no mover call** and refuses
  **no step**. Like resting, talking is not movement, so no quest/flag/favor ever gates a step. ✅
- **Mission gating ≠ movement gating (#2):** N/A — no gate touched. ✅
- **Host/Script separation (#4):** N/A — this is host UI/state, not a QUEST_DB opcode. No new bit kind, no
  `_legacy_fn`. (It *consumes* favor state the same way the existing render does.) ✅
- **Parity fences (#5):** `_renderNpcCard` / `_setNpcFavor` are **outside** all four fences
  (MOVER/ROOMS/DUEL/QUEST CORE), as established across §NPC-01-A/B/C. No `js/*.js` twin to re-inline. ✅
- **Seeded RNG (#6):** the favor state change is **deterministic** (a counter). Escalating talk lines are
  read from `dlg.impartial[]` **in order by `count`** (no RNG) — so nothing random touches game state. ✅
- **Hazard #1 (server reverts CSS/JS on next write):** this is an inline-JS hand-edit → **stop the WBAPI
  server first**, commit early. ✅

## 5. Verify plan

Extend `tests/integration/npc-card-map.test.js` (already the §NPC-01 harness):

1. **Talk button renders** on a lean card at fav 0; **absent** once fav ≥ 1.
2. **Progression:** `TALK_TO_FRIENDLY` talks across distinct game-days reach Friendly and the **⚔ footer
   appears** (was blank before).
3. **Ceiling:** talk **never** raises favor above 1 — the **✦ worldTruth footer stays hidden** (Dear Friend
   remains quest-earned). This is the design-preservation guard.
4. **Cadence:** a second talk **on the same `S_story.day`** does not advance `count` (per §6's chosen model).
5. **Regression:** a state-gated curated NPC (e.g. `connie_tuna` before `connieMet`) is unaffected — no
   un-gating (guards the SF6 invariant).

Plus: **eyeball the running game** (§7½) — talk an NPC to Friendly, confirm the ⚔ footer lights up.
`check:walk` sub-checks stay green (render-only); the pre-existing J14/J15 + TGS/SPB baseline reds unchanged.

**Docs to sync (same increment):** `mechanics.md` (new Talk verb + favor-earning), `docs/story/story-arc-npc-dialogues.md`
(card gains a Talk action; Friendly is now talk-reachable, Dear Friend still deed-earned), `index.md` State
Fields (`npcTalk`), and the §NPC-01-D BACKLOG row.

## 6. The one open decision — what does talking *cost*? (present to the user; do NOT default)

The mechanic above is locked except the **cadence guard** — how scarce a friend is. Three models, each a
distinct *feel*. Time is the doom-clock resource (`S_story.day`, 1→49; there is also an hour counter
`hoursElapsed`/`hoursSinceSlept` that ticks per step and drives 24h fatigue).

- **(B) Accumulate, once per game-day, no day burned — *recommended.*** `TALK_TO_FRIENDLY` (≈3) talks, each
  on a distinct `S_story.day`, reach Friendly. No day is *spent* — the cost is the days that pass naturally
  as you travel/rest near an NPC. Gentlest, reaches the most NPCs, reuses `S_story.day`, and best fits what
  the ⚔ footer *is* (they opened up after you kept coming back). Con: an NPC whose node you visit only once
  never reaches Friendly — thematically fine (you befriend where you spend time), but inert for pass-through
  1367 NPCs. *This is what the handler in §3 encodes.*
- **(A) One day per friend — scarcity via the doom clock.** A single talk sets Friendly but **advances a day**
  (like a short rest). One decisive act, no grind, maximal thematic weight ("you spent the day with them").
  Con: burns a precious day *and* fires the day-tick side effects (hireling wage, sentry upkeep, day-windowed
  content) — so you befriend only a handful in a 49-day run; most ⚔ content stays locked.
- **(C) Gift — scarcity via gold.** Talk is free flavor; a **Gift** button spends gold (≈50g, once per NPC)
  to reach Friendly. Decisive, no grind, no day burned, and gives the gold economy a non-combat sink. Con:
  makes friendship transactional (a rich player buys every ⚔ footer). Would need a per-NPC once-cap.

A hybrid (B's patient path **plus** C's paid path) is possible later; lock **one** for this increment.
