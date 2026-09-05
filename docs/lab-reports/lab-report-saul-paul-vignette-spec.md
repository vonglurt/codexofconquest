<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->

# Lab Report: §FUTURE-01 Vignette Writing Spec — The Road to Kesra

**Filed:** 2026-05-27 06:46:50 (`7f2715a`) · **Track:** §FUTURE-01 · **Status:** SHIPPED, with deltas
**Verified:** 2026-08-12 (§DOC-02aj) against `play.html` @ 38,712 lines · 416 nodes · 2,853 quests
**Siblings:** `lab-report-saul-paul-travel-reference.md` (the source research, verified §DOC-02ai)
**Superseded reference:** `plan.md §FUTURE-01 Name Translation Table` — deleted by `5e48dd7`

| Verification | Date | Commit | Result |
|---|---|---|---|
| §DOC-02aj re-measure vs HEAD | 2026-08-12 | `f091e63` | 6/9 titles byte-exact · 5/9 quest ids exact · **0/13 node texts shipped as written** · POV inverted |

---

## Abstract

The **writing** half of §FUTURE-01 — eight voice rules, thirteen node texts, nine quest descriptions,
seven NPC lines, an object inventory and one status-effect spec — locked before any HTML edit. Its
sibling supplied the history; this supplied the prose. A genuine pre-implementation lock, and the
interval is measurable: committed **06:46:50**, the arc's first two nodes opened **10:01:51** the same
morning (`8f8dc2a`, *"Layer 98 §LIX: HR + KS — The Road to Kesra opens"*) — **3 h 15 m**.

The result at HEAD, 77 days later, is a clean split. **Everything minted as a token survived**: 6 of 9
quest titles byte-exact, 5 of 9 quest ids byte-exact, the beat structure shipped and then doubled
(9 quests specified → **18**). **Nothing specified as voice survived**: not one of the thirteen node
texts reached the file, and the point of view was inverted — the spec writes the player *as* Paul in
second person (88 second-person tokens, the name "Paul" **zero** times); HEAD narrates Paul in third
person and gives "you" to a **separate travelling companion** (113 third-person against 22
second-person, same thirteen nodes).

*A spec that enumerates names ships its names; a spec that specifies voice ships nothing but its
names.* Names are copied; voice must be re-enacted at every sentence, and re-enactment is where an
implementer's own instincts win.

---

## I. Purpose, Inspiration, and What It Buys the Player

**The problem.** §FUTURE-01 is a thirteen-stop Act 4 arc — Jerusalem to Rome — built from source
material every player half-remembers, and the failure mode for that material is **recap**: the player
skims node text they think they already know. Thirteen nodes of skimming is thirteen nodes of dead world.

**The intention: defeat recap with attention.** The inherited house rules are second person, present
tense, no named emotions, objects carry the weight (the Chrétien principle — you do not say a man is
grieving, you say what he does with his hands). To those §I adds eight rules specific to this
character, scored in §V.

**What it buys the player**, all three still visible at HEAD:

1. **Node text worth reading.** An arc this long is carried by its prose or not at all, and the lines
   that survived are the ones behaving like observation rather than summary — the altar inscription
   that is *"administrative, a hedge against omission"*, the staircase with
   `seven steps, then a landing, then five more@8493`, the request closing a letter from house arrest:
   `the cloak I left at the waypoint@8516`.
2. **The object inventory as a memory device.** One object recurring in both a node text and its quest
   is how a player tracks a thirteen-stop journey with no journal UI. Four of nine shipped that way.
3. **A consistency contract for future authoring.** With `plan.md` deleted, this file and its sibling
   are the **only surviving statement of what the arc is supposed to sound like** — which is what makes
   this document load-bearing rather than archival.

**What the implementation bought instead — a real trade, not a mistake.** Moving the player out of
Paul and into a travelling companion won the arc **verbs**: HEAD ships 18 quests split **9 narrative
(`type:'side'`) / 9 skill checks (`type:'skill_check'`)**, and every check is an action only a
companion could take — make the opening in the crowd at Lystra, reach the jailer before the sword,
lower the basket down the Damascus wall, get to shore with the 276, speak past Ezzir. A
protagonist-Paul arc could have had none of them; you cannot roll Athletics to rescue yourself from
your own stoning. **The arc traded interiority for agency.** §IV prices the cost.

---

## II. Method

Instruments applied (§DOC-02 program): batch census before reading; `git log -S` to separate RETIRED
from NEVER SHIPPED; archive reads at `8f8dc2a` / `c1d5a94`; cell-primacy reachability in **`NODE_MAP`
declaration order**; sibling cross-check against `lab-report-saul-paul-travel-reference.md`; all
`symbol@line` anchors validated through `node src/scripts/resolve-anchors.js`, not `grep`.

**Scored both ways.** A spec claim absent from HEAD is marked **NOT SHIPPED and kept** — never
deleted, because a silently removed claim reads as one that held. A HEAD behaviour the spec forbade
is scored as a *deviation*, not as the spec ageing.

**One recipe hazard recorded.** A `\b` word-boundary regex run over the raw HTML **under-counts every
word that begins a paragraph**, because `\n` is literal two-character text in a node's `text:` field
and `n` is a word character — so `\bPaul\b` does not match `…correctly.\n\nPaul has been here`. Three
of the thirteen node censuses came back silently short before this was caught. **Unescape `\\n` to a
space before any prose census.**

---

## III. Census

| Layer | Specified | Resolves at HEAD | Rate |
|---|---|---|---|
| Node codes (§II) | 13 | **2** — `CI2` exact, `EF` → `EF2` | 15 % |
| Quest ids (§III) | 9 | **5** byte-exact | 56 % |
| Quest titles (§III) | 9 | **6** byte-exact | 67 % |
| NPC keys (§IV) | 7 | **3** live as `npc:` values | 43 % |
| Objects (§V) | 9 | **4** shipped, 2 never existed | 44 % |
| Node texts (§II) | 13 | **0** shipped as written | 0 % |
| Node reachability | 13 | **12** primary in their cell | 92 % |

**`CI2` is the only node code that both survives and points at the right place.** It was minted with
a digit because `CI` was already taken — and `CI` is the §AUDIT-03m *worse-than-dead* code that now
resolves to Chancery Court. The collision that forced the ugly key is the reason the key is still
correct: `CI2:{ num:89, code:'CI2'@8466` is Cyprus, which is the Copper Isle.

**Instrument 4 result, and it refines §DOC-02ai's naming finding.** The fictionalisation was never
applied uniformly even at birth. `Herath` (4 commits), `Kesra` (3), `Tarsis` (3) and `Anthos` (4) are
**RETIRED** — they shipped and were reverted at `c1d5a94`. `Aethon`, `Phillam`, `Korath` and
`Ephrath` have **0 commits ever** — **NEVER SHIPPED**. Those four name the second- and third-journey
stops, authored *after* the 2026-05-29 reversion. So the policy did not fail halfway; it was
overtaken halfway, which is a different and more forgivable thing.

The twelfth reachable node is the exception that costs the most: `ATH:{ num:92, code:'ATH'@8500` is
**non-primary** in cell `32,203` behind `SEA:{ num:97, code:'SEA'@8490`, so Athens cannot be arrived
at and `quest_areopagus@11476` cannot activate. That is **§AUDIT-03x's cheapest instance** — a
declaration-order swap, ten lines apart, no design call — and it happens to strand the exact scene
this spec nominated as its model (Voice Rule 5: *"The Aethon speech is the model."*).

---

## IV. Finding 1 — The Point-of-View Inversion *(headline)*

The spec's thirteen node texts are written **as Paul**, in second person, throughout: 88
second-person tokens and the name "Paul" **zero times**. HEAD's thirteen are written **about** Paul,
with "you" reassigned to a companion who travels with him.

| | Spec §II | HEAD |
|---|---|---|
| Second-person tokens | 88 | 22 |
| Third-person (he/his/him/Paul/Saul) | 24 *(all other characters)* | **113** |
| Node texts pure 2nd person | **13 of 13** | **0 of 13** |
| Node texts pure 3rd person | 0 | 8 |
| Node texts mixing both | 0 | 5 |

The tell is unambiguous in the shipped prose: *"Paul takes the hit before you close the distance."*
The player is a witness with their own hit points.

**The transposition is visible word-for-word, and it explains the arc's known naming straggler.**
Voice Rule 3 asks for the stoning to be documented as a sequence. The spec's quest description reads:

> The road northeast runs out of Lythros past the south gate marker. **You** take it. **You** get up
> from the square first, and then **you** take it. The sequence is the documentation.

`runs out of Lythros@11432` at HEAD reads:

> The road northeast runs out of Lythros past the south gate marker. **He** takes it. **He** gets up
> from the square first, and then **he** takes it. The sequence matters.

Nineteen words identical, every pronoun swapped. *This is why `Lythros` survived a rename pass that
greped the whole world:* the sentence was **hand-transposed, not regenerated**, and a person-swap has
no reason to look at a proper noun. §DOC-02ai found the fossil; this is its mechanism.

**The cost, measured.** Across the arc's 18 quests, 99 prose fields, **21 fields mix both persons**
and **11 of 18 quests** do. Most of that mixing is legitimate — a companion narrating Paul's action
must use both. The genuine defect is narrow and sits in the worst possible place: the arc's **first
mission**, `quest_road_damascus@11325`, addresses the player *as Saul* in two adjacent lines —
*"The warrants are in your coat"*, and the completion line *"The warrants are still in your coat.
You will not use them again."* — while the sentence between them says *"He leaves at first light."*
Everywhere else in the arc, "you" is the companion. **The one place the spec's protagonist-Paul POV
survived is the one place it contradicts the arc's own frame, and it is the first thing a player
reads.** → **§FUTURE-01-FU2**, two lines, no design call.

---

## V. The Spec as Written — preserved, with deltas

*Almost none of §I–§VI's prose reached `play.html`, so this is not a second copy of live data
— the §DOC-02h "delete a transcribed data section" rule does not apply. Claims are scored in place and
kept; the long §II drafts are pointed at rather than reprinted.*

### §I — Voice Rules, scored

| # | Rule | At HEAD |
|---|---|---|
| 1 | **The body is specific.** Small, bald, beaten with rods three times, stoned once, shipwrecked three times, snake-bitten; a recurring condition, likely the eyes; weak bodily presence, unanswerable letters. *Do not resolve the paradox.* | **NOT SHIPPED.** The enumeration appears nowhere: *"beaten with rods"* and *"thrice beaten"* are 0 occurrences. |
| 2 | **Work is not suffering.** Goat-hair cloth, seams that hold in wind. The workshop is a rest from the argument. | **PARTIAL.** Tentmaking shipped (`They make tents. It is precise@8505`, `Tentmaking Tools` loot). *"goat-hair"*, *"seam"* in this arc, and *"rest from the argument"* are all 0. |
| 3 | **The suffering is enumerated, not dramatized.** *"After the stoning at Lythros: he gets up."* | **SHIPPED**, near-verbatim, transposed to third person — see §IV. |
| 4 | **He notices things.** Warrants in the inner pocket · the stairs at Phillam · the altar inscription · the loaf of bread in the blind days · the father's mark in the Tarsis lintel. | **3 of 5.** Warrants ✅ (*"inner pocket"* became *"your coat"*) · stairs ✅ `seven steps, then a landing, then five more@8493` · inscription ✅ `TO AN UNKNOWN ONE@8501` · **bread ❌** (replaced by *"The innkeeper brings food at noon"*) · **lintel ❌ — 0 occurrences and 0 commits ever, NEVER SHIPPED.** |
| 5 | **His rhetoric has a structure** — find the entry point, move, land. | **SHIPPED.** `quest_areopagus@11476` passText: *"He begins with the altar. He does not begin with a correction."* |
| 6 | **The conversion scene is external, not internal.** | **SHIPPED, exactly.** `quest_road_damascus@11325` passText: *"At noon a light struck the road. He fell. A voice said his name. When he rose, he could not see."* Four sentences, no interior. |
| 7 | **He argues with people he respects.** Herath visit 2, *"I opposed him to his face."* | **NOT SHIPPED.** No Cephas, no confrontation scene; the phrase is 0 occurrences. Barnach/Timael/Silar are warm, never contradicted. |
| 8 | **The letters are not secondary.** | **SHIPPED**, and it is the arc's ending — see §V's cloak row. |

**Internal contradiction, adjudicated by HEAD.** Rule 4 places the seven-stairs at **Phillam**; the
§II node text for **Kesra** places them there instead (*"Seven stairs, a landing, five more"*). HEAD
followed Rule 4 — the stairs are at `KVA` (Philippi) and the Damascus text drops them. *An
implementer reading two passages of the same document will follow the one stated as a rule over the
one stated as an example.*

### §II — Node Texts *(0 of 13 shipped as written; retained as the record of an unshipped design)*

The thirteen drafts were the bulk of the original file and none of them reached `play.html`.
**Full drafts: `git show "7f2715a:lab-report-saul-paul-vignette-spec.md"`** — note the **repo-root**
path: `7d3615a` later moved the file into `docs/lab-reports/`, so the `docs/lab-reports/` path returns nothing at
the birth commit, and the quotes are required (zsh reads `$c:r` as a modifier). Retained below: the
mapping, the sentence each node was built around, and what HEAD did with it.

| Spec | HEAD | The line the node was built on | Delta |
|---|---|---|---|
| **HR — Herath** *(the law-city)* | `JRS` Jerusalem | *"Fourteen warrants issued in the last quarter. Fourteen correctly processed."* | Desk and warrants kept (`has a desk in the lower court@8457`); ledger, corridor and second person gone. **Fourteen became three** (`loot:'Three Jerusalem Warrants'`) — and `quest_road_damascus` tests for that item by name, so a number in the fiction is now a number in a gate. |
| **KS — Kesra** *(the blind days)* | `DAM` Damascus | *"The bread on the table arrived on the first day. You know it is still there because you can smell it."* | Bread ❌. Stairs relocated to Philippi. Three blind days shipped as a **literal counter**, `blindDaysKS@22541`, one per sleep — §AUDIT-03aj's first exhibit. The man on the landing became `I was told to come@22542`. |
| **DR — The Dust Roads** | `RUH` Arabia | *"It has no opinion about what you believed four months ago… It is a clean surface."* | Argument kept, prose rewritten — *"The road to Damascus changed what he was. The desert changed what he does with it."* Three months → *"a season"*; `RUH` also gained a `Desert Wanderer ×2` battle nobody asked for. |
| **TS — Tarsis** *(home)* | `ADA` Tarsus | *"You look for your father's mark in the lintel as a reflex… It will be there next time."* | The arc's most-developed object: **`lintel` = 0 occurrences, 0 commits ever. NEVER SHIPPED.** `ADA` does the same work in four words — `He does not knock@8477`. |
| **AO — Anthos** *(the commissioning)* | `HTY` Antioch | *"Someone outside the community named them first… The name travels."* | Naming beat kept and moved onto the protagonist: *"He is called Paul here for the first time in this record."* Grain merchant, fire, breaking of bread ❌. |
| **CI2 — The Copper Isle** | **`CI2`** Cyprus | *"The governor watches the way a man watches who has already decided to act on the outcome but does not want to be seen deciding."* | **Highest-fidelity node in the arc** — copper, seat, title and that posture survive almost sentence-for-sentence (`CI2:{ num:89, code:'CI2'@8466`). Only the closing certainty is gone: HEAD makes it a `WIS/Insight DC 14` roll that can fail. |
| **LT — Lythros** *(the lame man)* | `KYA` Lystra | *"The road out of Lythros runs northeast. You take it. You get up from the square first, then you take it. The order matters."* | The document's **closest survival** — nineteen words, every pronoun swapped (§IV). *"You see him"* became *"He is watching Paul specifically"*, which reverses the gaze and is the whole POV change in five words. |
| **PL — Phillam** *(Lyra; the prison)* | `KVA` Philippi | *"Seven stairs, a landing, five more… The stairs are reliable."* | **Best-served node.** Bridge, two days of watching, earthquake, singing, the citizenship invocation and the magistrates walking them out all shipped — plus the stairs, promoted to a quest title: `quest_prison_phillam@11464` *"Seven Stairs, Then Five"* (`seven steps, then a landing, then five more@8493`). Two naming fossils live here (§VII). |
| **AE — Aethon** *(the altars)* | `ATH` Athens | *"The hedge covers everything unaccounted for. It is the most honest thing in the city."* | Argument shipped intact — *"if you maintain all the altars you have covered all your bases"* — altar moved to the east end of the market as `TO AN UNKNOWN ONE@8501`. **And the node is unreachable** (§III). The one scene this spec named as its model is the one a player cannot reach. |
| **KR — Korath** *(the workshop)* | `ZTH` Corinth | *"The seam has to hold in wind — this is a real problem with a correct answer, and working on it is a rest from the argument."* | Prisca, Akil, eighteen months and the letters ✅; the **entire craft layer** ❌ — no looms, no bench, no `goat-hair`, no seam. Voice Rule 2 survives as a claim (`They make tents. It is precise@8505`) and not as an observation. |
| **EF — Ephrath** *(the hall; Demetrios)* | `EF2` Ephesus | *"He is correct about what your presence costs him. He is very effective at translating a business problem into a street."* | Economics kept exactly — *"He is not wrong about the numbers"*. Hall of Tyrannus and the north gate ❌. *Demetrios* reverted to **Demetrius**; the *Threaded Lady* survives in a quest disposition, not in the node. |
| **MT — Melta** *(276; the snake)* | `MLA` Malta | *"They watch the window. The window passes. You continue. The crowd revises its theory about who you are."* | Number shipped and became a quest title (`Two Hundred and Seventy-Six@11546`); `MLA` counts it three times. Two-wrong-theories structure shipped — *"first: murderer. Then: god. He corrects them."* HEAD's heaviest person-mixing node (9 vs 12), because the player is now the one distributing bread. |
| **ST — The Seat** *(house arrest)* | `FCO` Rome | *"The record ends here. This is not an error… The text does not close. The apartment door is open."* | Open ending shipped, reworded to the arc's best closing line: *"The arc does not end here. It stops here."* Guards, Luke, the third floor and Rule 1's enumeration ❌. **The only thing that shipped verbatim came from §V, not from here** — see the cloak row. |


### §III — Quest Descriptions, scored

| Spec id / title | HEAD | Title | Prose |
|---|---|---|---|
| `quest_road_kesra` — *The Light at Noon* | `quest_road_damascus@11325` | ✅ **byte-exact** | rewritten |
| `quest_anath` — *The House on the Lower Road* | `quest_anath` ✅ id exact | ✅ **byte-exact** | rewritten; `hint` opens *"Wait."* as specified |
| `quest_barnach_vouches` — *Vouched For* | — | ❌ **NOT SHIPPED** | beat shipped as the state flag `barnachVouchedHR` + an NPC dialogue branch, never as a quest |
| `quest_ezzir` — *The Sorcerer's Opposition* | `quest_ezzir@11372` ✅ | ✅ **byte-exact** | rewritten, argument preserved |
| `quest_stoning_lythros` — *Left for Dead* | `quest_stoning_lystra@11422` | ✅ **byte-exact** | **desc → passText, transposed** (§IV) |
| `quest_unknown_altar` — *The Unknown Altar* | `quest_areopagus@11476` | ❌ *To An Unknown One* | rewritten; retitled to match the shipped inscription |
| `quest_temple_riot` — *Riot in the Marketplace* | `quest_ephesus_riot` | ❌ *The Silversmith's Meeting* | rewritten |
| `quest_shipwreck_melta` — *Two Hundred and Seventy-Six* | `quest_shipwreck_melta@11546` ✅ | ✅ **byte-exact** | rewritten |
| `quest_snake_melta` — *It Did Nothing* | `quest_snake_melta@11558` ✅ | ✅ **byte-exact** | rewritten |

**6 of 9 titles byte-exact across 77 days and the §ARCH-01 UQF migration; 0 of 9 descriptions.** The
spec's `disposition` lines — original, oblique, no scripture — were replaced almost uniformly by
**direct quotation**: `quest_anath`'s *"Brother," he said. You had not been called that in this city.*
became Acts 9:17 in full; `quest_areopagus` carries Acts 17:23; `quest_prison_phillam` carries Acts
16:25. *The house style for a disposition is now a citation, and this document is where the
alternative was last argued for.*

### §IV — NPC Voice Lines, scored

| Key | Line as specified | At HEAD |
|---|---|---|
| `anath` | *"I was told to come. I am here. That is the extent of what I can tell you about why I am here."* | **partial** — `I was told to come@22542` survives inside a rebuilt sentence; the reluctance did not |
| `barnach` | *"He will stay with me. I am not asking for a discussion about this."* | rewritten — *"I have been looking for you for a year. It's time."* |
| `silar` | *"You realize that singing in a prison cell is unusual behavior."* | ❌ NOT SHIPPED — and `silarJoined` is write-only (§DOC-02ai, §DX-02n) |
| `timael` | *"I will go where you go…"* | rewritten — *"He got up. Everyone else left. I decided to stay."* |
| `lyra` | *"The guest room is yours. The stairs are reliable…"* | rewritten — *"I decided before I spoke. The speaking was the confirmation."* |
| `prisca_akil` | *"We make tents. The argument can continue at dinner, where it belongs."* | ❌ NOT SHIPPED; Prisca and Akil ship as a node NPC pair, unvoiced |
| `the_governors` | *"I find nothing in this that falls under my jurisdiction."* | rewritten into `ZTH`'s node text — *"He declines to rule on internal religious disputes."* |

**0 of 7 lines shipped verbatim; 3 of 7 keys shipped** as `npc:` values (`barnach`, `lyra`, `timael`).
`quest_anath` is stamped `npc:"ibrahim_al_tawil_cai"` — authoring metadata only, the §AUDIT-03b class,
analysed and closed; recorded, not re-filed.

### §V — Object Inventory, scored

| Object | Node(s) | What it carries | At HEAD |
|---|---|---|---|
| The warrant letters (×14) | HR, KS | authority before, past after | ✅ as **three**, and as an activation condition |
| The bread on the table | KS | the only sensory anchor in blindness | ❌ replaced by *"food at noon"* |
| The father's mark in the lintel | TS | what remains when everything changed | ❌ **0 commits ever** |
| The seam on the tent | KR | skilled work; the standard Prisca sets | ❌ **0 commits ever** |
| The Aethon altar inscription | AE | their hedge becomes his entry point | ✅ `TO AN UNKNOWN ONE@8501` |
| The cloak at the waypoint inn | *(letter)* | *"Bring the cloak I left at the waypoint with Carpus." — the most human line he writes* | ✅ **and then some** — see below |
| The ship's log number (276) | MT | 276 specific people, documented | ✅ node text + quest title |
| The snake on the fire | MT | the crowd's theory, wrong twice | ✅ `quest_snake_melta@11558` |
| The letters from the apartment | ST | they reach where he cannot walk | ✅ `FCO` + `quest_rome_arrest` |

**The cloak row is the finding.** The table's third column is *design rationale* — a note **about** the
line, written for the implementer. It shipped as **narration**, at two sites:
`the cloak I left at the waypoint@8516` (node text) and `most human line he writes@11517` (quest
passText). HEAD tells the player, in the game, that this is the most human line he writes.

***A spec's analysis column is not inert. If it is well phrased, it will be transcribed along with the
thing it analyses.*** Two consequences: it is the **only verbatim survival** in the whole document, and
it carried *"the waypoint"* — the spec's genericisation of Troas — into player-facing prose that the
2026-05-29 reversion never restored. **A second `Lythros`, in the arc's last scene.**

### §VI — The Thorn

The thorn (the recurring physical condition, most likely an eye condition) is a mechanical debuff that
cannot be removed. He asks three times for its removal and is told no. The answer is: *"My strength is
made perfect in weakness."*

In-game implementation: a permanent status effect visible in the character sheet — `Thorn (Permanent)`.
No mechanical penalty (he functions at full capacity). One cosmetic effect: when the player examines
their character at a rest node, the thorn is listed. No tooltip. No explanation. If the player has found
the Fishing Guide, they will know how to read a stat line and will notice it.

This is not a puzzle. There is no quest to remove it. The answer has already been given.

> **Δ — 4 of 5 details exact, and the section corrects a sibling report.**
> ✅ `Thorn (Permanent)@37873` renders under `S_story.saulConverted`, on the character sheet, with the
> specified label byte-exact · ✅ **no mechanical penalty** · ✅ no tooltip · ✅ `Fishing Guide@13844`
> exists (Q-BAIT-00), so the cross-reference still holds 77 days on · ❌ **HEAD supplies the
> explanation the spec forbade** — a 2 Cor 12:9 subtitle under the label, in a modern rendering
> (*"my power is made perfect in weakness"*) against the spec's KJV *"my strength"*.
>
> **This section is the arc's most faithful implementation, and §DOC-02ai scored it as a defect.**
> That pass read the *travel reference's* Design Index — *"a mechanical debuff that cannot be
> removed"* — found a caption with no modifier, and filed it in the §AUDIT-03v/w/y(b) cluster as its
> first unapplied **penalty**. But the arc has **two specs for the Thorn, written the same day by the
> same hand, and they disagree**: the design index states the *intent*, this document states the
> *implementation*, and it says **"No mechanical penalty"** in as many words. HEAD followed this one.
> **Correction: the Thorn is not an unpaid promise and should not be counted in that cluster.**

---

## VI. Finding 2 — Five completion narratives that cannot execute

Census across all **2,824** UQF quests: **2,454** are `type:'skill_check'`, and **all 2,454 carry no
`completion` block**. That is by design — `S_story.quests[questId] = 'done'@7001` is the skill-check
terminal state, written on the pass path, while `q.completion && QuestRuntime.canComplete@30343` inside
`function storyCheckQuests@30322` is the *only* route to `'complete'`.

The residue: **exactly 8 skill-check quests in the file carry an `onComplete[]` chain that can
therefore never run**, and the migration author flagged all eight in place (*"⚠ dead in legacy too"*).
**Five are in this arc** — `quest_ezzir`, `quest_governor_cyprus`, `quest_lame_lystra`,
`quest_stoning_lystra`, `quest_basket_damascus` — and three are in the §DUNGEON-01 d02xx arcs.

Impact is small and worth stating precisely: XP and mission bits are granted by the `bits` chain at
roll time, so **nothing is unpaid**. What is lost is the closing narrative line — *"🪨 +100 XP. He got
up. Everyone else left. Timael decided to stay."* — the best sentence attached to the arc's best scene,
which no player has ever seen. That line also **misstates its own reward**: `quest_stoning_lystra`
grants `xp:150`. → **§DX-02av**, 🟢, no design call.

---

## VII. Defects filed

| Row | Severity | Summary |
|---|---|---|
| **§FUTURE-01-FU2** *(new)* | 🟢 no design call | `quest_road_damascus@11325` addressed the player *as Saul* at what is now `The warrants are in his coat@11327` and in its completion line, one sentence away from *"He leaves at first light."* Two lines; the arc's first mission card. **✅ SHIPPED 2026-08-25 — both repointed to the companion.** |
| **§DX-02av** *(new)* | 🟢 no design call | 8 skill-check quests file-wide carry an unreachable `onComplete[]`; 5 in this arc; one misstates its own XP. Move the narrative into `onPass` or delete it. |
| **§FUTURE-01-FU** *(extended)* | 🟡 design call | Two naming fossils added: `quest_prison_phillam@11464` and `phillippiJailerConverted@11464` — the latter a **blend** of fictional *Phillam* and historical *Philippi*, not a straggler of either. Plus a second player-facing straggler: *"the waypoint"* for Troas, at `@8503` and `@11502`. |
| **§AUDIT-03x** | 🟡 design call *(cheapest instance needs none)* | `ATH`←`SEA` strands `quest_areopagus@11476` — this spec's own nominated model scene. |
| **§AUDIT-03aj** | 🟡 design call | `blindDaysKS@22541` / `hrHellenistDays@23208` — this document is where the three days and the fifteen days were first written as scene beats. |
| **§DOC-02ai** *(corrected)* | — | The Thorn is not an §AUDIT-03v/w-cluster member; see §V. |

---

## VIII. Method note for the program

**28th instrument — when an arc has both a DESIGN INDEX and an IMPLEMENTATION SPEC, score HEAD
against the one that specifies BEHAVIOUR.** A design index states what a feature *means*; an
implementation spec states what it *does*. §DOC-02ai scored the Thorn against the index and
manufactured a defect out of a faithful implementation. **Before filing an unapplied-promise row,
check whether a sibling document specifies the mechanic and says something narrower.**

**Corollary on report shape.** This document scored 67 % on titles and 0 % on prose, and the split is
not about accuracy — nothing here was *wrong*. It is about what an implementer can carry. **A token is
copied; a voice is re-enacted.** A spec that wants its voice to ship must attach the voice to
something copyable: a title, an id, a quoted line in a table. The one passage of this document that
reached the game verbatim did so because it was sitting in a table cell.

---

## IX. Verification record

**Gates:** `check:anchors` 0 dead (all `symbol@line` anchors above validated through
`node src/scripts/resolve-anchors.js`, not `grep -cF` — the §DOC-02ai lesson); `check:legacycodes` /
`check:nodeindex` / `check:dupkeys` / `check:noderegs` / `check:npcregs` run individually, exit 0.
**No HTML touched — documentation only.**

**Not measured, and stated rather than left silent:** the scriptural fidelity of any line here is
outside this program's competence and was not adjudicated; the 21 mixed-person prose fields other than
`quest_road_damascus`'s were read but not individually re-authored; and the file-wide prevalence of
person-mixing *outside* the §FUTURE-01 arc was not censused.

**Filed:** 2026-05-27 · **Source material:** `lab-report-saul-paul-travel-reference.md`
**Plan reference:** `plan.md §FUTURE-01` *(deleted `5e48dd7`; this file and its sibling are the record)*

---
*© 2026 Paul Richeson — MIT License. See [LICENSE](../LICENSE) for full text.*
