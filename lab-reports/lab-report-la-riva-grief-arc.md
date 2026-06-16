<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com -->

# Lab Report — La Riva, Grief Architecture, and the Vignette Layer

**Project:** roll2hit.com — *The Shattered Codex*
**Report Designation:** GR-01 (Grief Arc Implementation — Layer 78)
**HTML Baseline:** `roll2hit-v3.html` — 18,324 lines at session close
**Session Date:** 2026-05-26
**Category:** Narrative Architecture · Grief-as-Mechanic · French Vignette Technique · Romance Layer · Literary Research Log

---

## Abstract

This report documents the design and implementation of the grief arc for *The Shattered Codex*, centered on Layer 78 ("La Riva") but extending through the full narrative as a distributed structural technique. The implementation draws from three bodies of research: (1) the French vignette tradition as practiced in Chrétien de Troyes's twelfth-century Arthurian romances; (2) grief transcript analysis — specifically, the characteristic compression and object-centering observable in how bereaved individuals describe loss; and (3) the existing HTML source, which already contained, prior to this pass, every causal and narrative element needed to construct the arc. The work was not invention. It was excavation.

The central thesis: grief in *The Shattered Codex* is not a decorative narrative layer. It is the human register of the same void corruption mechanism that drives the combat and exploration system. CY → Merchant Cats → Cat-King → Fishmonger's Row → Connie/Aldo → FR → CY again. The arc does not introduce new lore. It surfaces what was already there.

This report also documents the romance quest architecture (ROMANCE_QUOTES, NPC_ROMANCE_PREAMBLES, NPC_ROMANCE_VIGNETTES, INN_DREAMS), which uses the same compressed vignette technique applied to a different emotional register: attachment, recognition, and the domestic weight of a relationship in progress.

---

## I. Literary Research Background

### I-A. Sources Consulted

The vignette technique applied in this implementation draws from several converging traditions:

**Chrétien de Troyes (c. 1180–1191) — *Yvain*, *Erec et Enide*, *Cligès*, *Le Chevalier de la Charrette*.** Chrétien is the foundational reference for two techniques deployed throughout the arc:

1. **Encoding emotion in small observable actions.** In *Erec et Enide*, Erec's love for Enide is never declared; it is rendered through the prior act — he watched the gate long after she had passed through it. In *Yvain*, the knight's forgetting of his oath to Laudine is not described psychologically; it is narrated through the arrival of the ring-bearer and the return of the ring. The emotion is in the gap between the observable actions, not in any description of an internal state.

2. **The two-step hesitation as moral weight.** Lancelot's two-step delay before climbing into the cart (*Le Chevalier de la Charrette*) is the whole of the story's ethical charge. He hesitated for two steps. She saw the two steps. He had not thought about two steps. The reader has everything they need from those three sentences. This technique — where the full weight of a relationship is conveyed through one observed hesitation or prior act — is the direct ancestor of the NPC preamble system in *The Shattered Codex*: "She looks up before you reach the corner." "The cup is already on the table."

3. **Fenice and the refusal of the Iseut arc.** In *Cligès*, Fenice explicitly refuses to follow the Iseut pattern — she will not give her body to one man and her heart to another. She chooses her ending before the ending can choose her. This register informs the NPC quest disposition lines: each named NPC in Birka makes one irreversible choice in their associated quest, and the disposition line articulates the moral weight of that choice without editorial comment.

**Grief transcript analysis.** Real grief transcripts exhibit two consistent features that distinguish them from fictional grief representations: (1) extreme precision about peripheral facts — the sequence of events, the exact time, the spatial layout — as a containing structure around the central absence; (2) objects that survive the loss carrying the weight of the relationship. The mountain guide in Froberger Entry 12 does not describe the avalanche emotionally; he organizes the facts — snow depth, slope angle, party composition, the decisions made and their order — with the precision of someone who has not talked about it in a long time and has therefore had fourteen years to organize it. The grief is in the cracks between the facts. He sealed the cracks with accuracy.

This transcript-accuracy is what distinguishes Connie Tuna's dialogue from conventional game NPC grief writing. Connie does not say she misses Vincenzo. She says: *"I went back once. Two weeks after. I counted everything I could still name by shape: the Sardino stall, the ice box, the hook rack where the morning catch went up."* This is the documented behavior of bereaved people accounting for what remains. The taxonomy is the grief.

**The French vignette structure as five-act object-naming.** In the vignette tradition, the governing form is: five acts, each act named for one surviving object, two perspectives per act compressed into present-tense prose, the gap between perspectives carrying the emotional charge. The object does not symbolize anything — it is the record of the relationship. The net is not a symbol of Vincenzo. The net is the net he said to hang at dawn so it would be ready by the second tide, and it was hanging to dry when the Cat-King came, and then it was on the floor, and then Aldo found it in the rubble and folded it and has been carrying it ever since. This is not symbolism. This is what happened to the net.

---

### I-B. Design Principle — Derived

From the above research, the following design principle was established for all grief writing in *The Shattered Codex*:

> **Never declare the emotion. Name the object. Name what the person does with it. The gap between two people doing different things with the same object is the emotion.**

This principle applies at every scale:
- The arc level: net / key / account book travel through all five acts of La Riva.
- The NPC level: Brynn's cup, Yael's corner-watch, Aldo's folded coat.
- The journal level: Froberger's entry stops mid-page; the blank line is the grief.
- The quest level: Kenickie goes quiet. He says "Yeah. Okay. I'll hold onto this." That is the end. The Row does not rebuild.

---

## II. The Corruption-Grief Chain

The arc is not externally imposed on the existing lore. The following causal chain was already present in the HTML prior to this pass:

```
Void pressure (CY node, Neon Undercity)
    ↓
Merchant Cat faction uses Corrupted Cat enforcers across CY/CQ boundary
    ↓
Void-accelerated merges produce Taz Devils (combat mechanic, CQ)
    ↓
Taz Devils merge under Cat-King (boss, CQ)
    ↓
Cat-King destroys Fishmonger's Row: three city blocks (referenced in Cat-King dialogue)
    ↓
Vincenzo "Vinnie" Tuna dies (already named: HTML lines 7857, 15265 — Kenickie, "my guy Vinnie")
    ↓
Connie Tuna + Aldo Sardino grieve unwitnessed at FR
    ↓
Corrupted Cats colonize rubble (void + grief: same vector)
    ↓
FR becomes second void pressure node adjacent to CQ
    ↓
Cycle continues upward toward Birka surface
```

The Vincenzo retrofit is the key structural insight. Kenickie already said "my guy Vinnie" twice, in two unrelated dialogue lines, before this arc was designed. The name was already in the HTML. The retroactive interpretation — that Kenickie's trailing "maybe" and his supply-chain silences are grief, not just flavor — required no dialogue changes. The reader connects the names. The writer only had to make it possible to connect them.

---

## III. The Five-Act Vignette Structure — La Riva

**Status: Confirmed correct.** The five-act structure was reviewed, approved ("i like."), and implemented in full in `story.md §GRIEF AND CORRUPTION`. The following is the design record.

Each act is named for the object that survives. Two perspectives per act, compressed present-tense prose, one paragraph each. The gap between perspectives is the emotion. The objects travel and accumulate weight: net → crate → account book → key → market.

---

### Act I — The Net

**Object function:** The net is what was hanging when the catastrophe happened. It is the record of the last moment before the before. Connie hung it at dawn — Vincenzo's instruction — and it was there when she came to the door and he was not.

**Perspective 1 — Connie:** She put the net out before sunrise. She was inside when the noise started. She came to the door. The net was down and Vincenzo was not standing next to it. That is the complete record of what she saw at that moment. She went back inside. She did not yet understand that she would need a plan for what to do after.

**Perspective 2 — Aldo:** He found the net three days later in the rubble of his stall, draped over the broken counter as if someone had set it down on their way somewhere else. He folded it. He is still carrying it inside his coat. He has not told Connie he found it because she has not asked where the net went, which means she is not ready to hear it, which means he keeps carrying it until she is.

**Gap:** The same net. Two people. Neither has told the other. The logic Aldo is using — "she hasn't asked, therefore she isn't ready" — is not wrong, but it is the kind of logic that protects the carrier more than the person being protected. The reader sees this. Neither character does.

---

### Act II — The Crate

**Object function:** The crate is the object that registers the Corrupted Cats as grief-colonizers, not just combat. They moved into the broken furniture. The void settled in the same place the grief settled.

**Perspective 1 — Connie:** She went back once, two weeks after. The Corrupted Cats were already settled into the broken wood. She stood at the edge and counted everything she could still name by shape. Then she left, because she had finished what she came to do, which was to confirm that it was all still there in the shape of absence.

**Perspective 2 — Sandy Scratchpad Mewlino (secondhand, via Jimmy Two-Tails):** "There's something wrong with that block. Wrong the way the DF strays are wrong. They're not just feral — they're HOLDING something." Jimmy said: "That's above our pay grade." Sandy said: "Above everyone's, apparently."

**Gap:** The neighborhood has a working theory. The grief is nobody's problem in particular, which is how it stays everyone's ambient condition. Connie's counting-ritual is invisible to Sandy; Sandy's observation is invisible to Connie. The cats are the only thing in both perspectives at once.

---

### Act III — The Account Book

**Object function:** The account book is the material record of the Row's existence. Aldo's one completed act of preservation. Vincenzo's page is the last completed entry.

**Perspective 1 — Aldo:** He walked away with the book under his arm because it was the only thing he could carry that would tell anyone what had existed there. The entries are neat and squared, one vendor per page. Vincenzo's page is the last completed entry. The pages after it are blank.

**Perspective 2 — Kenickie:** He heard about the account book from Sandy. He said: "What are they gonna do with it — rebuild?" Then he went quiet. He said: "Vinnie had the whole south block operation in his head. Nobody knew the supply chain like him. Not even me." He said "maybe" once about more stock being available next week. Then nothing. He has not asked to see the book. This is the form his grief takes: accurate information about supply chains delivered with a trailing silence where the person who held the supply chain used to be.

**Gap:** Aldo has the record. Kenickie knows what the record means. Neither has moved. The account book is in Aldo's possession. It has Kenickie's grief in it. They are not in the same room.

---

### Act IV — The Key

**Object function:** The key is Connie's private persistence ritual. It no longer opens anything useful. She keeps handling it because the habit is older than the catastrophe.

**Perspective 1 — Connie:** A bronze key with a fish stamp on the head — Vincenzo had it made as a joke, the kind of joke that becomes unbearable once the thing it opens no longer exists. She carries it on her house key ring. She takes it off the ring sometimes and puts it in her pocket separately, then returns it to the ring when she leaves the house. She has not examined this habit or tried to stop it.

**Perspective 2 — Aldo:** He has been watching her do this since the first week. He sees the key come off the ring, get turned over, go back. He says nothing because he is carrying the net and that is worse and he knows it. Grief in this neighborhood is not discussed by people who are still inside it — not because they are incapable, but because the neighborhood's only remaining dignity is in not requiring each other to perform it.

**Gap:** Two objects. Two carriers. One shared understanding that neither will name. The dignity of not requiring the other to perform grief is also a form of isolation. The reader is permitted to hold both interpretations.

---

### Act V — The Market

**Object function:** The market is the act of witnessing. Nothing rebuilds. The player's arrival is the change.

**Perspective 1 — Present state:** After the Cat-King falls, the void pressure at FR drops. The Corrupted Cats there grow thin. Nothing rebuilds. Connie is still there. Aldo still goes every two weeks.

**Perspective 2 — What the player's arrival changes:** Someone came. That is the whole of it. The market does not reopen. Aldo does not stop carrying the net. Kenickie receives the account book and holds it and does not say the name that is in it. But someone came, and the grief that had been occurring in private gets a witness. The Covenant Keeper ending names each person helped by name. This is why. Not to celebrate them. To confirm that the things they were carrying were seen.

---

## IV. Quest Chain Implementation Record — "La Riva"

### Quest Table

| Quest ID | Title | Completion Condition | Reward |
|----------|-------|---------------------|--------|
| `quest_la_riva_01` | "What Remains" | `connieMet: true` (visit FR) | 0gp — activation only |
| `quest_la_riva_02` | "The Weight of a Net" | `frCatKillCount ≥ 5` + Vincenzo's Net in inventory | 500gp + Aldo Friendly |
| `quest_la_riva_03` | "The Account Book" | Deliver Old Tuna Account Book to Kenickie at CQ | 0gp + Kenickie fav→3 |

### Activation Sequence

1. Player defeats Cat-King at CQ.
2. 2.5-second delay → Kenickie dialogue activates `quest_la_riva_01`: *"You should go see what's left of the Row. Fishmonger's Row, one block east. Connie's still there."*
3. Player navigates CQ→FR (FR is one node east of CQ; no node existed prior to Layer 78; `CQ.E = 'FR'` added).
4. First FR visit: `connieMet = true`, `quest_la_riva_01 = 'complete'`, `quest_la_riva_02 = 'active'`.
5. Player clears FR corrupted cats via repeatable button (5 required total; `corridor:true` prevents `defeatedBattles['FR']` from being set).
6. At 5 kills, Vincenzo's Net drops to inventory: *"A fishing net with a bronze fish-stamp tag on the corner. It was left hanging to dry the morning the Cat-King came. Found in the rubble, folded."*
7. `quest_la_riva_02 = 'complete'`. Aldo gives Old Tuna Account Book. `quest_la_riva_03 = 'active'`.
8. Player returns to CQ, delivers book to Kenickie. Kenickie says: *"Yeah. Okay. I'll hold onto this."* `laRivaComplete = true`, `fishmongerRowRestored = true`, `npcFavorability['kenickie'] = 3`.

### Key Implementation Notes

- **Repeatable FR battle:** The standard system records `defeatedBattles[nodeCode] = true` after first win, removing the battle button. FR requires 5 kills, so `corridor:true` bypasses this. The button shows a count: "⚡ Clear Corrupted Cats (N/5)".
- **Vincenzo's Net is a key item:** `sell: 0`. It cannot be sold. The player carries it until they receive the account book, which is itself delivered to Kenickie. Neither item stays in inventory.
- **The account book transfer:** `aldo_sardino`'s `dearFriend` dialogue delivers the book: *"Here. The account book. You take it to Kenickie. Everything that was on the Row is in there. Every name."*
- **Kenickie's final line:** *"Yeah. Okay. I'll hold onto this."* The Row does not rebuild. Kenickie does not name Vincenzo. The resolution is witnessing, not restoration.

### New State Fields (`_S_DEFAULTS()`)

```js
connieMet: false,
fishmongerRowRestored: false,
laRivaComplete: false,
frCatKillCount: 0,
```

---

## V. The Distributed Grief — Subplot Architecture

The La Riva arc is the concentrated form. The same grief technique runs through the full narrative in a lower register. In each case: one domestic action, one surviving object, the weight held without declaration.

### V-A. Froberger's Journal — Epistemic Grief

Froberger's grief is the grief of someone who understood everything except how to give that understanding to another person. His journal is the record of that inability in 41 entries.

**Entry 12 (MT — mountain pass):**
> *My guide through the pass was efficient and quiet and knew the mountain the way you know something you have stopped needing to look at. On the second night, at a fire, he talked for two hours about an avalanche that had happened fourteen years ago — with the precision of someone who had not talked about it in a long time and had therefore had fourteen years to organize it. He was not organizing grief. He was organizing the facts of it: snow depth, slope angle, party composition, the decisions made and their order. The grief was in the cracks between the facts. He had sealed the cracks with accuracy.*

This is the transcript-accuracy principle in direct application. The entry does not describe the guide's grief; it describes a bereaved person's organizational behavior. The model: precision as container. The cracks as the thing precision cannot contain. The phrase "I don't know if that was the right thing" is Froberger's own version of the same uncertainty — he named the avalanche. Did that help? He cannot know.

**Entry 17 (MI — archive):**
> *The woman at the archive disagreed with my taxonomy of the eastern wards. She was right. I did not tell her she was right until she had already left the city. I wrote it in a letter I addressed to the archive's general post, not to her name, because I did not know if she would want to hear from me. I do not know if she received it. The taxonomy stands corrected in any case.*

The correction was made. The letter was sent. The relationship is unrecorded. "The taxonomy stands corrected in any case" is one of the most precisely grief-accurate lines in the journal — the intellectual resolution substituting for the human one, stated as if that substitution is satisfactory, with the entire weight of its insufficiency in the phrase "in any case."

**Entry 29 (IS — Oracle):**
> *There is a question I should have asked before she left. I have been composing an answer to it for eleven months in case she asks it, which she will not, because I never asked the question. This is the kind of error that only gets worse with additional documentation.*

Two layers: the documented regret, and the meta-commentary that documenting it makes it worse. Froberger knows he is doing the thing he has diagnosed. He is doing it anyway. This is the character's arc in miniature.

**Entry 41 (CO — must-read, readAloud:true):**
> *You walked it. So you know now. I am sorry for that. I am also grateful. The covenant needed someone who knew.*
>
> *Come back, when it's done. To the people. They need the person who knows, not just the knowledge. That is what I failed to understand. I kept the knowledge and gave them the outcomes. They needed the person who was willing to stay uncertain with them while the outcomes were still unknown.*
>
> *Come back.*

Entry 41 is where Froberger's grief becomes addressed grief — addressed to the player directly. "Come back." The line that precedes it is his self-diagnosis: *I kept the knowledge and gave them the outcomes.* The Curse of Knowledge as personal failure, stated as clearly as Froberger ever states anything. The blank line below Entry 41 is the invitation to write Entry 42.

---

### V-B. Brynn Clerambault — The Cup

The cup is the domestic-action version of the net. Both are objects that survive. Both encode a relationship through a habitual prior act.

**NPC preamble (fav ≥ 2):** "The cup is already on the table."

**Inn vignette (post-sleep, fav ≥ 2):**
> *The inn is warm because you brought wood. You know this in a way that has no words. Brynn set a cup on the table before you asked, and you watched her hands — careful with small things, decisive with heavy ones. You think: a person who is precise with cups knows what they are doing with everything. You think: that is not a small thing to know about someone.*

**Quest disposition (quest_brynn_ledger):**
> *"Rove had good credit. That's the part I keep coming back to. Good credit and bad judgment and I trusted the credit." — Brynn Clerambault*

The ledger that Rove took and kept without paying is the account book's counterpart for Brynn — an object that encoded a relationship and was taken. The quest returns it. Brynn's response when the ledger comes back is the cup: she refills it before you ask. The domestic act is the grief resolution. Not the explanation. Not the gratitude. The cup.

---

### V-C. Yael Scheidemann — The Corner

**NPC preamble (fav ≥ 2):** "She looks up before you reach the corner."

**Inn vignette (post-sleep, fav ≥ 2):**
> *You slept poorly. Before dawn the city makes a sound like breathing — the docks, the cart-wheels not yet moving, one dog somewhere two streets over. You have been to Yael's corner more than once now, and she always looks up before you arrive, as if she heard your step from farther away than makes sense. You have not spoken of this. Neither has she. Some things are more useful left as questions.*

Yael filed the report on the courier. She was correct to file it. She was standing two blocks from where Froberger collapsed. The corner where she watches is the corner nearest the event. She has been there since. The preamble — "she looks up before you reach the corner" — carries the whole of the Chrétien technique: the prior act is the emotion. She was already looking. You were already expected. The gap between "she looks up" and "before you reach" is the attachment.

---

### V-D. Commander Seraphine Bruhns — The Manifold

**NPC preamble (fav ≥ 2):** "She closes the manifold. That is the acknowledgment."

**Inn vignette (post-sleep, fav ≥ 2):**
> *Bruhns reviews her manifests each morning before the city wakes. You have seen it three times now from the street: the candle, the papers, the absolute stillness of someone who is used to carrying things alone. You are going to have to fight her. She is going to have to let you. You do not know, and have stopped pretending to know, whether you are the right person for what comes after.*

Bruhns is the grief of command: you protect people from the weight so successfully that they cannot know you are carrying it. The manifold closing is the only visible acknowledgment she will give. The player is watching from the street. They are watching someone who is watched by nobody. The sentence "you are going to have to fight her" is there because the arc requires it — the Codex forge is at CO, and Bruhns holds the line — but the sentence that follows it carries the full weight of the vignette: *neither of you knows whether you are the right person for what comes after.*

---

### V-E. The Blank Page — NG+ Void Archaeology

At CO in NG+, with `vaArchitectureKnown` and `entry42Written` and `ngPlusRun ≥ 1`, the fifth ending adds:
> *"Froberger wrote 41 entries. You wrote one. She wrote 7."*

Entry 42 is the blank page Froberger left. To fill it is not to finish it. It is to add your weight to the ongoing project of carrying what cannot be set down. The grief arc's final structural point: the blank page is not empty. It is an invitation that was waiting.

---

## VI. The Romance Layer — Same Technique, Different Register

The ROMANCE_QUOTES, NPC_ROMANCE_PREAMBLES, NPC_ROMANCE_VIGNETTES, and INN_DREAMS systems use the same compressed vignette technique as the grief layer but in the register of attachment — the recognition that a relationship is occurring, without naming it.

### VI-A. ROMANCE_QUOTES — Source and Register

The 21 quotes in `ROMANCE_QUOTES` were selected from Chrétien de Troyes across four registers, each performing a distinct narrative function:

**Erec/Enide register (6 quotes) — mutual regard:**
> *"She passed before him on a white palfrey and he watched until she was past the gate, and then watched the gate."*

This is the preamble technique's literary ancestor. He watched the gate. The gate is the cup on the table; it is the corner before you reach it. The action after the action, encoding the attachment. The quote fires in inn sequences after Act III, during the 15%-per-sleep romance quote delivery.

> *"Long he gazed at her fair hair, her laughing eyes — and yet she looked at him with equal steadiness, as if they were in competition."*

The "as if they were in competition" does what the French vignette gap does: it provides a second observation that is not an explanation but a clarification of the first, making the charge between the two observable without naming it.

**Yvain/Lion register (4 quotes) — forgetting and loyalty:**
> *"He forgot. That is the whole of it. He forgot, and when he remembered, it was already the wrong kind of late."*

One sentence, three beats, and the full moral weight of the *Yvain* arc. This quote is available from Act III forward. In context — when the player has been spending hours in combat and exploration and perhaps has not returned to their Birka NPCs — the quote lands differently than it does in literary analysis.

**Cligès register (3 quotes) — the refusal of the inherited pattern:**
> *"She said: I will not be Iseut. I will not give what I do not give freely. That is not the same story."*

Fenice's refusal to follow the Iseut arc is structurally parallel to how each Birka NPC is written: they have irreversible choices, and those choices are their own. Brynn does not wait to be rescued from the ledger debt. Yael files the second report because of you, not because she was told to. The Cligès register names this as an active stance.

**Lancelot register (3 quotes) — the two-step:**
> *"He hesitated for two steps before climbing in. She saw the two steps. He had not thought about two steps."*

The Lancelot cart scene is the extreme case of the prior-act technique: an action so compressed that the hesitation, not the action, is the content. *He had not thought about two steps* is the line that makes this more than a romantic observation — it adds Lancelot's unawareness of what he revealed, which is the full emotional charge. This quote is the direct ancestor of "She looks up before you reach the corner."

**Yvain search register (5 quotes) — quest/search:**
> *"She continued in prayer until she heard a horn, at which she greatly rejoiced; for she thought now she would find shelter, if she could only reach the place. So she turned in the direction of the sound."*

These quotes give the player's movement through the node map a romantic quest grammar — the turning toward a sound, the following of tracks, the "my wayward heart leads me on inside." They fire in transit, not at rest. They encode the journey as its own form of attention.

---

### VI-B. NPC_ROMANCE_PREAMBLES — Six Lines

The preamble system delivers one line per NPC at fav ≥ 2, in italics, before the NPC's dialogue renders. The line describes one prior act — something the NPC did before you arrived, that demonstrates they already knew you were coming.

| NPC | Preamble |
|-----|---------|
| Yael | "She looks up before you reach the corner." |
| Brynn | "The cup is already on the table." |
| Quill (Couperin) | "He is mid-phrase and does not stop playing, but he nods." |
| Pachelbel | "He slides it across without being asked." |
| Weckmann (crov) | "He does not look up, but he knew you were there." |
| Bruhns (auros) | "She closes the manifold. That is the acknowledgment." |

All six are Chrétien-derived: the prior act as the emotion. The reader fills the gap. Nothing is declared. The technique is consistent across all six precisely because the six relationships are at different positions in the arc — Quill/Couperin's relationship is lighter, Bruhns's is heavier, and the shared form is what lets the reader calibrate the weight rather than being told it.

---

### VI-C. NPC_ROMANCE_VIGNETTES — Six Inn Vignettes

The vignettes fire once per NPC per run, post-sleep, when the NPC's home node was in the last three moves and fav ≥ 2. They are not read when the player is at the NPC. They are read after. The delay is structural: the vignette is what you think about when you've left.

**Quill vignette (full text for example):**
> *Couperin played something last night that he said had no name. You woke at the third hour with the melody still in your head, which is strange because you cannot usually remember music. The song was about waiting, or about distance — you could not tell which. He never finishes anything. You are beginning to think that is not an accident.*

Three things are happening: the melody that persisted against normal capacity; the ambiguity about what the song was about (waiting or distance — the player notices they cannot distinguish these); the observation that the incompleteness is not carelessness. The vignette does not say "Couperin is falling in love with you." It says: "you woke at the third hour with his melody still in your head." The reader does the rest.

**Pachelbel vignette:**
> *Pachelbel does not say farewell. He slides things across the counter and you take them. That is the transaction. But this morning you passed the City Fence before it opened and saw him through the grating, tallying something, and he was talking quietly to himself the way people do when they have been alone a long time and have made peace with it. You walked past. You came back. You went past again. You did not go in. Some things are not for daylight.*

The three-pass walk (past / back / past again / did not go in) is the Lancelot two-step amplified. The hesitation is the content. "Some things are not for daylight" is the player's recognition of something they are not yet ready to name.

---

### VI-D. INN_DREAMS — Conditional Dream Text

`INN_DREAMS` (HTML line ~12034) delivers conditional dream text at IN and SQ nodes, keyed on story flags. The dreams are not romantic or grief-themed uniformly — they shift based on which flags are set. The mechanic is: you sleep at the inn, and what you dream is a function of what you know. If `catKingDefeated` is set, the CQ-adjacent dreams are different. If a romance vignette has fired, the subsequent sleep at IN may reflect it.

The INN_DREAMS system is the third tier of the vignette stack: ROMANCE_QUOTES (ambient, 15% per sleep), NPC_ROMANCE_VIGNETTES (once-per-run, post-sleep, triggered), INN_DREAMS (conditional, flag-gated). Together they produce a sleep sequence that is never exactly the same twice, and that shifts in register as the player's relationships and knowledge shift.

---

## VII. Modification of Quest Dispositions — The Vignette Concept Applied

Prior to the grief arc design pass, quest disposition lines in `QUEST_DB` were written as conventional quest flavor: plot summary, hint about where to go, reward framing. The vignette research pass rewrote all Birka NPC quest dispositions in the compressed character-voice form.

### Before/After Pattern

The design shift: from plot-summary to *one revealing statement the NPC makes about themselves that incidentally describes the quest's emotional weight.* The statement should be one they would only make to someone they have decided to trust. It should not be a full explanation. It should be the kind of thing a person says when they have been carrying something long enough that they stop explaining it and start just saying it.

**`quest_brynn_ledger`:**
> *"Rove had good credit. That's the part I keep coming back to. Good credit and bad judgment and I trusted the credit." — Brynn Clerambault*

This is not a plot summary of the quest. It is the exact thought Brynn has been circling for months. "Good credit and bad judgment" — she has split the judgment correctly but it does not help. The credit is what she trusted. This is true of how trust works. The disposition does not say "the ledger was taken"; it gives you the exact cognitive loop of the person the ledger was taken from.

**`quest_pit_training`:**
> *"The promoters tried to fix a fight here last year. I shut the pit rather than host it. Some things cost more to keep than to lose." — Weckmann*

This tells you who Weckmann is. Not what the quest is. You go train at CY because you want to know the person who said "some things cost more to keep than to lose." The quest is the occasion; the disposition is the character.

**`quest_couperin_lute`:**
> *"The guild licenses five songs. Five. For the whole of human experience. I don't know if that's arrogance or optimism." — Tomas Couperin*

The lute is pawned. The lute is the quest item. The disposition does not say the lute is pawned. It says: here is the particular quality of mind of the person whose lute is pawned. You know, from this line, that Couperin notices the same category of absurdity that the player notices. The quest is not about the lute. It is about whether Couperin can ask for help, which he cannot, which is why the lute is still pawned. The disposition shows you why he cannot ask.

---

## VIII. Hour Counter Wiring — Implementation Record

The `hoursElapsed` and `hoursSinceSlept` state fields existed in `_S_DEFAULTS()` and were displayed in the stats panel (`s-hours`, `s-awake`) but were never incremented. Layer 78 wired all five action types.

| Action | hoursElapsed | hoursSinceSlept |
|--------|-------------|-----------------|
| `storyMove` | +1 | +1 |
| Battle victory | +1 | +1 |
| `storyShortRest` | +1 | +1 |
| `storyQuestHunt` | +2 | +2 |
| `storyConfirmSleep` | +8 | reset to 0 |

Display thresholds (existing CSS, now active): 16h awake → `warn` class; 24h awake → `danger` class on `s-awake` element.

---

## IX. Summary Statistics

| Item | Count / Status |
|------|---------------|
| New nodes implemented | 1 (FR — Fishmonger's Row) |
| New NPCs | 2 (connie_tuna, aldo_sardino) |
| New quests | 3 (quest_la_riva_01/02/03) |
| New items | 2 (Vincenzo's Net, Old Tuna Account Book) |
| New state fields | 4 (connieMet, fishmongerRowRestored, laRivaComplete, frCatKillCount) |
| NPC fav changes | 1 (kenickie → 3 on quest_la_riva_03 complete) |
| Hour counter action types wired | 5 |
| New story.md sections | 2 (§GRIEF AND CORRUPTION prepend, §NODE 79) |
| plan.md sections | 1 (§GR prepended before §0) |
| HTML lines at session close | 18,324 |
| Five-act vignette structure | ✅ Confirmed correct, implemented in full |
| Literary research base | Chrétien de Troyes (4 romances), grief transcript analysis |

---

## X. What Was Not Changed

- Kenickie's existing dialogue at lines 7857 and 15265 ("my guy Vinnie") was not modified. The retrofit works by making those lines legible in retrospect.
- The CQ node text was not changed. Kenickie's "maybe" 🤌 was not changed. The grief layer is in the interpretation, not the declaration.
- The Corrupted Cat combat mechanic was not changed. FR uses the existing `corrupted_cat` enemy pool with `count:1` per repeatable encounter (for vignette pacing, not challenge).
- No existing NPC favorability values were altered for non-La-Riva NPCs.

---

## XI. Residual and Deferred Items

- **Froberger Entries 17 and 29** are implemented in the journal and documented here. The "⚠️ PLANNED" markers in story.md for these as *separate* subplots were replaced by the understanding that the entries themselves carry the subplot. No additional quest hooks are needed.
- **NG+ Entry 42** remains at `entry42Written` state flag, wired to the void archaeology ending. Full implementation deferred to Layer 78+ NG+ pass.
- **`fishmongerRowRestored: true`** is set on quest completion but does not currently trigger any visual change at FR. A potential Layer 79+ extension: if `fishmongerRowRestored`, FR terrain changes from `ruins` to `partial_market` with modified node text. Not implemented; deferred.
- **Kenickie fav 3 naming line** for the Covenant Keeper ending (`SWEELINCK_NAMING_LINES`) was not added in this pass. Suggested: *"Kenickie, who kept the account book. Who knows every name in it."* Deferred to NG+ pass.

---
*© 2026 Paul Richeson — MIT License. See [LICENSE](LICENSE) for full text.*
