<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson and Claude -->

# Story Arc — Birka NPC Dialogues
**Source:** Extracted from `story.md` — canonical NPC content
**Elaboration:** `lab-report-birka-beginner-arc.md` · `lab-report-npc-dialogue-system.md` · `lab-report-narrative-arcs-brynn-bruhns-yael.md` · `lab-report-web-of-connections.md`
**Intersection:** `LHR` (Yael), `TLL` (Brynn), `MHQ` (Quill), `LLA` (Pachelbel), `HKG` (Weckmann/Auros) — all Act I nodes persist to Act VIII  *(historical: `CI`=`LHR` · `IN`=`TLL` · `TV`=`MHQ` · `BA`=`LLA` · `CY`=`HKG`)*

> See `story-flowchart.md` for arc overlay showing NPC nodes on the quest map.

---

## BIRKA ARC SUMMARY (Layers 41–42)

Six Birka NPCs are fully interactive across all 8 acts. Each has a quest chain, 4 favorability states, and **19** dialogue quotes — 5 impartial / 5 questActive / 5 friendly / **4** dearFriend (measured §DOC-02ab; the long-standing *"20, 5 per state"* was never true of the dearFriend pool). Favorability persists through New Game+.

| NPC | Node | Intro Quest | Dear Friend Unlock |
|---|---|---|---|
| Yael Scheidemann | `LHR` (historical `CI`) | `quest_slums_cleanup` · `quest_city_watch_patrol` | Escort + 5+ visits |
| Brynn Clerambault | `TLL` (historical `IN`) | `quest_brynn_ledger` (Worn Ledger from `BMA` (historical `SL`)) | Maintenance + 5+ visits |
| Quill / Couperin | `MHQ` (historical `TV`) | `quest_couperin_lute` (Lute from Pachelbel) | Song received + 5+ visits |
| Pachelbel / Deacon | `LLA` (historical `BA`) | `quest_pachelbel_shipment` | 15gp tip + 5+ visits |
| Weckmann (`crov`) | `HKG` (historical `CY`) | `quest_pit_training` · `quest_drunk_fight` *(the latter is a dangling id — §DX-02o)* | Log + 5+ visits |
| Auros / Bruhns | `HKG` (historical `CY`) | `quest_void_below` | Depths report + Act V |

At **Dear Friend** (`npcFavorability` = **2**, not 3 — the ledger stores three values, `0 Impartial · 1 Friendly · 2 Dear Friend`, and derives Quest-Active from `_hasActiveQuestFor`), joint NPC moments unlock:
- Quill + Brynn at `MHQ` (historical `TV`): joint ambient moment
- Weckmann + Auros at `HKG` (historical `CY`): mid-conversation the player interrupts
- Froberger traces fire (one-time NPC memory of Froberger per Dear Friend NPC)
- Entry 41 reaction lines at `TLL` (historical `IN`) (Brynn) and `NUE` (historical `SQ`) (Sweelinck) after `frobergerLastEntryRead`

---

### NPC_DIALOGUES — Full Transcript

> Source: `const NPC_DIALOGUES = {@10396`. **This transcript covers the six Birka NPCs — 114 lines of the table's 1,614, across 6 of its 213 entries (2.8 %).** The rest are authored per-arc and live only in the HTML (§DX-02ad's class: a register that is accurate about everything it names and names a fraction of the set). Each NPC entry also has a `meta` block with `worldTruth`, `enemy`, and `missionBit`. Dialogue state selection order: `dearFriend` (fav ≥ 2) → `questActive` (active quest) → `friendly` (fav ≥ 1) → `impartial`.
>
> **Card footers (`_renderNpcCard`).** The `meta` block surfaces as two stacked card footers, each unlocking a tier apart so the relationship deepens from *what they're up against* to *what they know*: **`enemy` (⚔) at Friendly** (fav ≥ 1, §NPC-01-C) sits above **`worldTruth` (✦) at Dear Friend** (fav ≥ 2). Same italic 10px treatment, differentiated only by the icon; both use `textContent` (authored strings never inject HTML).
>
> **Talk action (§NPC-01-D).** While an NPC is Impartial the card shows a **💬 Talk** button. Talking accumulates `S_story.npcTalk[key] = {count, lastDay}`, and **`TALK_TO_FRIENDLY` (=3) talks on distinct game-days** raise favor to **Friendly (fav 1)** via `_setNpcFavor(key, 1)` — so the **⚔ enemy footer becomes reachable by talking** for all ~203 card-bearing NPCs. It is limited to **once per game-day per NPC** (no day is spent — cost model B) and **never raises favor above 1**, so **Dear Friend (the ✦ worldTruth footer) stays quest / personal-act earned** — the reveal in the row above is preserved. The button retires once Friendly. Talking is a card action, not a movement step (Free-Movement untouched). Handler: `_talkToNpc(key)`; the click re-renders via `storyRender(NODE_MAP[S_story.currentCode])`.
>
> **Profile-less fallback (§NPC-01-SF2).** `_renderNpcCard` normally reads name/occupation from the `BIRKA_NPC_PROFILES[key]` entry, but some NPCs are wired into the card map (`birkaNpcs` / the derived map) with *only* an `NPC_DIALOGUES` entry and no profile. These used to hit `if(!p) return` and render nothing; now the card synthesizes a lean profile from `dlg.meta` (`name` + `occupation`), so they show name + occupation + quote + the ⚔/✦ footers. The per-tier greeting object is absent for these, so §NPC-01-A's greeting-omit path applies.
>
> **Curated-node merge (§NPC-01-SF6).** The card map picks NPCs one of two ways: a **curated `birkaNpcs` literal** for the ~14 legacy / state-gated nodes, and the map **derived** from `BIRKA_NPC_PROFILES.node` everywhere else (§NPC-01-B). The two are no longer exclusive — at a curated node the render **merges** the derived list *on top of* the curated one (curated order first, deduped) instead of the literal fully shadowing it. So a profile whose `.node` points at a curated node but that the literal never listed (`long_john_silver_sen`@TL, `archivus_sweelinck` / `ulrich_von_gessert`@NUE) finally gets a card. The literal keeps authority over the NPCs it **governs** — a maximal, flag-independent key set (`_curatedGoverned`) — so a conditionally-hidden NPC (`connie_tuna` before `connieMet`, `pier` before `pierFalkWarm`, `vonn` before `tlLedgerRead`) is **never** un-gated by the always-on derived map. This generalizes the one-off §NPC-01-SF5 fix (which hand-added `the_fisherman` to the SSJ literal): any future rich profile authored at a curated node now surfaces automatically.
>
> **Dead-code remap (§NPC-01-SF4).** The last three dead pre-§WALK codes in the `birkaNpcs` literal — `CQ`/`SQ`/`GC`, none ever in `NODE_MAP`, so their six NPCs rendered nowhere — are remapped to the nodes their arcs actually render at, each proved by the arc's own `node.code` render gate *and* by the NPCs' own `NPC_DIALOGUES.meta.node`: **CQ→CDG** (The Cat Quarter — Layer 44 Ally Cat Arc; `jimmy`, plus `sandy_cat` after `quest_cat_02` and `kenickie` after `quest_cat_05`), **SQ→NUE** (Scholar's Quarter — Weimar — Layer 51 Scholar Gate; `isolde_voss`, plus `benedikt_rasp` after `wmArchiveComplete`; merged into the existing curated NUE entry), **GC→TRD** (Goblin Warrens — Layer 55; `yva` while `vsDebtProbed && !vsWeaponsFound`). All state-gating preserved verbatim — a pure key remap, same standard as the §PLAY-01-G `CI/IN/TV/BA/CY` remaps.

#### Yael Scheidemann — City Guard Captain (`LHR` (historical `CI`))
- **worldTruth:** "Every riot that gets suppressed becomes three quiet riots."
- **enemy:** Commissioners who scrub evidence of unrest.
- **missionBit:** `yaelEscortUsed`

**Impartial:**
1. "You — yes, you. Don't walk past me. You're new to Birka and it shows. Stand still for a moment and listen, because I am only going to say this once. Check your MAP. The known world has forty-two nodes and you can get lost in it, badly, fast. Open your QUEST LOG when you arrive somewhere new — quests are not optional, they are how the city tells you what actually matters. Watch your HP. Sleep at the Inn or any rest node before you are desperate; buy potions before you need them, not during. The First Inn is your Hearth — go there when the world gets loud. Pull up your CHARACTER SHEET. You are Level 1. Fighter. Strength carries you into the fight; Constitution keeps you upright afterward. Dexterity is built slowly — there is a fishing dock, if you have patience for a hook and a slow river. Your Charisma is not decoration: half this city speaks coin but listens to character, so talk to vendors, barter, negotiate. You came here to fight demons. You will. Real ones, with claws. But the ones behind your own eyes are older and meaner, and that is the real fight. The friends you make in these streets will not appear in your inventory. They will not show on a score screen because there is no score screen worth reading. There is only the loop — the same day, the same city, the same courier dying at the same crossroads — until you learn what you came here to learn. The loop ends when you decide it does. That is what it means to be a proud adventurer: you do not grind for points. You walk forward for the people beside you. Now get moving. I have a city to keep."
2. "If you see anything that shouldn't be in the Slums, you didn't see me not seeing it either."
3. "Patrol routes don't change without reason. The route changed twice this week."
4. "Skalder's been on that corner eleven years. Nivers, twenty-three. They're the city's memory. I'm the one who reads it."
5. "Three reports filed in the last month. The same report. The commissioners stamp it 'Noted.' Then they note nothing."

**Quest Active:**
1. "Three encounters cleared means the Slums are safe for another week. Possibly two. Thank you."
2. "I can't go in there officially. But you can. Whatever you find — I don't need details."
3. "The vermin aren't the problem. The vermin are a symptom. Clear them anyway."
4. "Four children live on the third alley. Their mother knows your name now. I told her you were reliable."
5. "You're making progress. Skalder noticed. That's the closest to a commendation you'll get around here."

**Friendly:**
1. "Nivers hasn't called in sick in twenty-three years. I asked her once why not. She said: 'The city doesn't get sick days.' I've been thinking about that for four years."
2. "There was a riot in the Lower Crypt district three months ago. I filed the report. The report disappeared. I filed a second one. Still have the copy."
3. "Varga — the information broker near the market — changed his pigeon route again. That's the third time this season. Coins are moving somewhere."
4. "The city talks if you know the language. Most people pass through and hear noise. The noise has a grammar."
5. "I've been here long enough to know which cracks in the wall are load-bearing. The one near the crypt entrance has been growing for two years. Nobody has asked me about it."

**Dear Friend:**
1. "I filed the second report. The one about the Void encroachment in the lower crypt district. The commissioners don't read second reports. I kept a copy. Someone should know it existed."
2. "The grammar of the city includes what people don't say. Skalder hasn't said anything about the eastern alley in three weeks. That alley talks constantly. Something changed."
3. "You know what the hardest part of this job is? The people who leave. You learn the city's grammar through the people in it. Every time someone goes, a word disappears."
4. "I walk the same route every morning. It used to be to see what changed. Now it's also to see what stayed. That's different. I didn't notice when it changed."

---

#### Brynn Clerambault — Innkeeper (`TLL` (historical `IN`))
- **worldTruth:** "Safety is a thing people carry in, not a thing rooms provide."
- **enemy:** Merchants who disappear without settling the account — not for the gold, for the not knowing.
- **missionBit:** `brynnsJournalRead`

**Impartial:**
1. "He left this in the room. Paid three nights ahead, didn't sleep the third one."
2. "Two merchants gone last week. Harbormaster Tula would know — she tracks the manifests."
3. "The good room is available. It has a window. Some guests prefer no window. I keep both."
4. "Breakfast is included. The innkeeper before me said breakfast was separate. He had fewer repeat customers."
5. "The journal was in the room. I kept it because it felt like something someone would come asking for."

**Quest Active:**
1. "The ledger has a crease on the third page — that's how I know it's mine. Worn spine, brown cover."
2. "If you find it in the Slums, bring it here first. Before you do anything else with it."
3. "I lent it to a merchant named Rove. He had good credit and bad judgment. The judgment was the problem."
4. "You don't have to explain how you got it. I don't need the story. I just need the ledger."
5. "The pages that matter are 23 through 31. The rest is routine. Those eight pages are not routine."

**Friendly:**
1. "My daughter wrote 'expedition' in her notebook last week. Very hard pencil. She means it."
2. "The inn has been in this building for forty years. The building has been here longer. The stories go with the walls, not the owners."
3. "I know which guests are running from something and which are running toward it. The ones toward something eat better."
4. "She asked about the Void. My daughter. I said: there are people who know more than me, and you should find them. She said: you know one. I said: yes."
5. "Rove came back once, months later. Didn't have the ledger. Didn't explain. Paid his tab in full and left. I appreciated that."

**Dear Friend:**
1. "She came back. My daughter. Three cities in six weeks. She had a notebook full of expedition notes and she asked me to read them." Brynn refills the cup. "I read them twice."
2. "The good room has had forty-seven guests in the last three years. I remember each one. You're the only one who came back more than twice without needing something specific."
3. "Safety is a thing people carry in. I've known that since the first week. Some guests arrive already safe. Some arrive carrying the absence of it. I can't fix the absence but I can make sure the room doesn't add to it."
4. "She asked me if you'd come back. My daughter. I said: I don't know. She said: I think they will. She's been right about these things before."

---

#### Quill (Tomas Couperin) — Unlicensed Bard (`MHQ` (historical `TV`))
- **worldTruth:** "The best songs are the ones that take three listenings to understand."
- **enemy:** Licensed guild bards who play the same five songs on rotation and call it craft.
- **missionBit:** `couperiSongReceived`

**Impartial:**
1. "Song's old. Older than the city. The words are a lock waiting for a key. Yours for a drink and a silver."
2. "I don't have a guild license. The guild has standards. My standards are different from their standards."
3. "Three chords are sufficient for most human experience. The fourth chord is for the parts most people pretend aren't there."
4. "The bard before me played the same five songs for eleven years. People kept requesting them. I stopped playing requests."
5. "The cipher in the song is real. I didn't put it there. I just learned to play it."

**Quest Active:**
1. "Pachelbel has the lute because I owed him for a bottle. The bottle was poor value. The lute is not. Please retrieve it."
2. "It's tuned to a specific pitch. Don't let him retune it. He will try."
3. "I've been writing something without the lute. It's not the same. You can hear the absence of the right instrument in the silence."
4. "Tell him the tab is settled. I'll get him the coin by end of week. Tell him that specifically."
5. "The lute has a notch on the fourth fret. That's how you'll know it's mine. Pachelbel will claim otherwise."

**Friendly:**
1. "I've been working on something. Not the cipher song. Something I don't have a title for yet. It's about someone who keeps returning."
2. "The guild plays what people already know they like. I play what they'd like if they'd heard it before. It's a distinction that mostly matters to me."
3. "The cipher in the Scholar King's song is a navigational tool. The notes correspond to compass headings. I've been mapping it for six months."
4. "There's a woman who comes in on Tuesdays and cries quietly at the third verse. She has never explained why. I have never asked. Some responses are sufficient."
5. "I play better when someone is listening. Not because I perform differently — I play the same. But the listening makes it real in a different way."

**Dear Friend:**
1. "It's called The Returning Kind. I finished it last Friday. I play it every Friday now." He sets the instrument down. "It's about you. In the sense that the person in the song comes back and the city is still there and that turns out to matter."
2. "The first three listenings to a song are the surface. The fourth is where you hear what the composer didn't know they were saying. I'm on my fourteenth listen of mine. Still finding things."
3. "The guild sent someone to review my license status last month. He stayed for four songs, tipped well, and wrote 'non-compliant but substantial' in his report. I've framed it."
4. "The cipher song ends on a note that resolves to nothing. I used to think that was a flaw. Now I think it's the point. The resolution is something the listener has to supply."

**QUILL_UNFINISHED_SONGS** — 7 ambient snippets visible at `MHQ` (historical `TV`) (S45). Cycle index: `Math.floor(gameDay / 2) % 7`. Click "Ask about it." triggers a full Quill interaction.

| Index | Ambient text |
|-------|-------------|
| 0 | "A strange mode — augmented something. He keeps stopping and restarting." |
| 1 | "Something slow in a minor key. He mouths words but doesn't sing them." |
| 2 | "A quick pattern in a high register. He looks frustrated. Then plays it again." |
| 3 | "A single chord, held. Then a different chord, held. He writes something down." |
| 4 | "Something that sounds almost familiar, then doesn't." |
| 5 | "A two-bar phrase, repeated. He changes one note each time. Very slowly getting somewhere." |
| 6 | "Nothing he'd call a song yet. More like an argument between two intervals." |

---

#### Pachelbel (Deacon) — Fence / Information Broker (`LLA` (historical `BA`))
- **worldTruth:** "The difference between a loan and a gift is whether anyone admits which it was."
- **enemy:** Merchants who use credit as a weapon — the kind who extend it to people they know can't repay, then collect the debt as leverage.
- **missionBit:** `pachelbelPaidBack`

**Impartial:**
1. "No names, no receipts, no regrets. Show coin first."
2. "The crypt entrance is in the wall behind the bar. The information is five copper. The location is free because it's not information anymore."
3. "I know what's in most of the packs that come through this district. Knowledge is inventory."
4. "The Conclave Pass is fifteen gold. You could find one cheaper. The cheaper ones get flagged at the second gate."
5. "Three things I don't deal in: people, debts I didn't originate, and that box in the back corner. Ask about it again and we have a problem."

**Quest Active:**
1. "The box is sealed. Don't open it. I haven't opened it. That's the extent of my expertise on its contents."
2. "It came from the crypt district. A scholar courier, two years ago. He said 'hold this' and didn't come back. I've been holding it."
3. "I'm not asking questions about what it is. I'm asking you to take it out of my inventory. Those are different requests."
4. "The seal on it is Ivory Circle. Don't ask me how I know that. I know a lot of seals."
5. "When you find it at the crypt, it will be exactly where I described. I have good sources."

**Friendly:**
1. "Conclave Pass, second inspection gate — half price. You're not carrying anything that would flag it. Direct travel is faster."
2. "I know three people who owe the Conclave significant debts and don't know it yet. That's not a threat. That's context."
3. "The difference between a loan and a gift is whether anyone admits which it was. Most of the transactions in this district are loans that became gifts when nobody was watching."
4. "The lute situation was a miscommunication. Couperin's credit is good. I kept the lute because I thought he'd forgotten. He hadn't."
5. "I don't deal in people. Most fences do, eventually. I decided the margin wasn't worth it about ten years ago. Some decisions make themselves cleaner in retrospect."

**Dear Friend:**
1. "You're going north next, then west — the mountain road. The last person with your expression went the same way. They're in the county records now. I don't keep records. I keep observations."
2. "Rove — the merchant who took Brynn's ledger — owes me a debt that's become a gift at this point. I stopped expecting it. What I didn't stop is remembering the amount. Some things you hold without planning to collect."
3. "The box is with Auros now. Whatever was in it, it was meant for someone who could use it. That's a better outcome than it staying in my back corner for another year."
4. "The difference between knowing things and hoarding things is whether you ever let any of it move. I've been a fence for twenty years. I'm still figuring out which category I'm in."

---

#### Weckmann (Crov) — Pit Master (`HKG` (historical `CY`))
- **worldTruth:** "The body tells the truth about who you are when you're tired. Everything else is performance."
- **enemy:** Pit promoters who run fixed fights — not for the money, for the fact that they corrupt the one place where honesty is mandatory.
- **missionBit:** `crovPitTrainingWins`

**Impartial:**
1. "You can train here. First three rounds free. After that I charge for the floor."
2. "The pit is honest. Everything else in this district lies. The pit doesn't know how."
3. "I've seen five hundred fighters. The ones who get good share one thing: they don't argue with the floor when it comes up."
4. "Entry on your own risk. I don't mean that as a disclaimer. I mean it as a description."
5. "If you can't handle losing, the pit will teach you. That's a mercy, not a threat."

**Quest Active:**
1. "Three wins. That's the standard. Not because three is a significant number — because two is too few to see a pattern and four is too many to fake."
2. "Your footwork is the problem. You're treating the pit like a floor you're trying not to fall on. It's a floor you're trying to move across. Different posture."
3. "Win or lose, come back. That's the training. The winning is how you measure the training."
4. "I'm watching the left shoulder. Stop telegraphing. You know you're doing it. Stop."
5. "Two wins. One more. Take your time. The floor will be here."

**Friendly:**
1. "Your footwork is better. Still telegraphing the left shoulder but better. Three more rounds and you'll stop doing that without thinking about it."
2. "I had forty-six fighters. Three of them lasted a decade. You know what they had? They came back when they didn't have to."
3. "The honest version of a fight is one where both people are actually trying. Most fights aren't honest. The pit makes them honest."
4. "Auros came down here twice last month. She doesn't train — she watches. She's looking for something in the way people move when they think no one's measuring them."
5. "The promoters tried to run a fixed fight here last year. I closed the pit for a week rather than host it. Some costs are worth paying to keep the floor honest."

**Dear Friend:**
1. "I've trained forty-six fighters. Three lasted a decade. You know what they had in common? They came back to train when they didn't have to. When the quest was done. When there was no reason except wanting to know if they were still improving." He looks at you. "You're here."
2. "The body tells the truth about who you are when you're tired. Everything else is performance. I've watched you tired. You're better than you think you are when it matters."
3. "You fought drunk once. You still won." He says this without ceremony. "That's not a recommendation. That's an observation. The body knows things the strategy forgets."
4. "Come back when you're done with whatever comes next. The floor will still be honest. That's the thing about the pit — it doesn't care where you've been. It only asks if you're here now."

---

#### Auros (Commander Seraphine Bruhns) — Commander / Scholar King Archivist (`HKG` (historical `CY`))
- **worldTruth:** "The infrastructure that keeps cities standing is invisible until it fails."
- **enemy:** The Void — not as metaphor, as specific engineering problem. The Scholar King relay is degrading and no one alive knows the maintenance protocol.
- **missionBit:** `bruhnsDepthsReported`

**Impartial:**
1. "That's a Warrant suppressor. Forty-foot radius. Keep it."
2. "The Scholar Kings built this undercity as a failsafe three hundred years ago. It has been running unattended since."
3. "I've been tracking the Void's encroachment in the lower crypt district for eight months. The Council calls it 'ambient degradation.' They are not correct."
4. "Commander is a title. The work is archivist. I found that out three years ago when I opened the right wall panel."
5. "The signal relay is losing coherence. I don't know the maintenance protocol. The Scholar Kings didn't document it for people who didn't already know."

**Quest Active:**
1. "The corruption node is below the fourth chamber. I can't send anyone down there officially. You're not official."
2. "Two void walkers, possibly three. The node is the problem — clear that and the manifestations stop."
3. "Don't touch the relay architecture. Clear the corruption. Come back."
4. "I'll be at the terminal. When it's done, the relay readings will change. I'll know."
5. "The Council approved my maintenance request six months ago. They approved it in principle. The implementation is still 'under review.' Don't wait for the Council."

**Friendly:**
1. "The undercity predates Birka by three hundred years. The Scholar Kings built it as a secondary relay in case the Cosmic Realm signal degraded." She traces the map. "Someone needs to know this."
2. "I filed a report about the undercity last year. The commissioners don't read infrastructure reports. I filed a second one. I have both copies."
3. "The void intrusion in the lower crypt isn't random. It's finding the gaps in the relay coverage. Whatever built the coverage knew what it was covering against."
4. "Weckmann knows what he's doing. I sent three fighters from the security detail to train with him. They came back better and more honest about what they didn't know. That's the useful outcome."
5. "The relay needs maintenance I'm not qualified to perform. You have to understand something from the Scholar Kings to do it. That's not a metaphor."

**Dear Friend:**
1. "The depth readings are consistent now. Whatever you've been doing in the outer nodes is working." She turns from the terminal. "I filed a report. Included your name in the field observation section. Someone should know it happened."
2. "The Scholar Kings built infrastructure that outlasted them by three centuries. They didn't document the maintenance because they planned to be around to do it. That's the problem with making things that last — you have to also plan for not being there."
3. "I've been here three years. In that time I've filed fourteen reports and received twelve 'Noted' stamps and two genuine responses." She looks at the terminal. "You're the third genuine response."
4. "The relay will hold now. Not indefinitely — nothing holds indefinitely. But long enough. That's all infrastructure ever does: hold long enough for the next person to figure out the rest."

---
*© 2026 Paul Richeson — MIT License. See [LICENSE](LICENSE) for full text.*
