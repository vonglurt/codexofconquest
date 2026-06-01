# BOOKS DIRECTIVE

> **READ THIS SECTION BEFORE PROCESSING ANY BOOK.**
> These rules govern every pass through the list below. Write the file between each pass. add to end. 

---

## The Game We Are Writing For

**Roll2Hit — The Shattered Codex** is a single-file HTML RPG. The player is a
Level 1–20 Fighter Champion crossing over a hundred nodes across many acts to collect lots of Codex
Shards and seal the Void before Day 49. Towns: Birka (Act I + VIII), Tilbury
(Act II), Visby (Act V), Weimar (Act VI). Combat uses D&D 5e mechanics. Skill shecks to main Str,Dex,Cha,Wis,Con,Int and battles with AC and HP are common tests of skill and might. Quests are told in a Vinette french theater act describing the emotion of what is happening, we are a Fighter Human observing out campanions and their stories. We are ofen the hire for help in these stories.


The quests we write from these source books are **escort vignettes**: a silent
Fighter carries a TOKEN through a contested world and delivers or destroys it.
The vignettes are written in **French noir register** — precise, cool,
observational. The TOKEN is the grammatical subject. The Fighter witnesses.

These quests feed the game's world. Each one should feel as if it belongs in the
same city where the player already stands. Read `../story.md` and `quest-map.md`
before placing any quest act in a city. The API should be queried for Quest Related Map. Listing the cities. 

**The hero always succeeds in the end.** Fail text = delay + cost + witnessed
shame. Never permanent defeat. Friendship and loyalty are the tests. Combat is
how they are proven. Romance, tenderness, and moral weight are required.

---

## Rules

1. **READ BOTH FILES.** For each entry, open `{CODE}-{slug}.txt` (source text) AND
   `{CODE}-{slug}.md` (prior summary, if it exists). Both inform the current pass.
    Write the file at the end of each pass. Never summarize from memory alone when the .txt is ≤ 800 KB and readable. 

2. **SIZE GATE.** All source .txt files > 200 KB have been pre-split into 200 KB chunks by `split-sources.sh` (naming: `CODE-title.partKofN.txt`). Single newlines are collapsed to spaces; paragraph breaks (double newlines) are preserved. Read the original .txt file OR its split parts — both contain the same content.
   - Parts ≤ 200 KB: read directly and completely.
   - Multi-part books: read part by part, appending to the .md after each part. See Processing Protocol in plan.md for the full multi-pass procedure.

3. **ONE AT A TIME.** Process one book per working session. Take the first entry
   where Status is `[ ]`. Do not skip ahead.

3a. **MATERIAL GATE.** Before beginning any book, judge whether the source text is a
    short fragment, a single poem, or a thin anthology entry that is unlikely to
    contain enough distinct narrative for a 5-act quest. If in doubt, note the concern
    and ask the user: *"This text may not support a full distinct quest. Skip to the
    next book?"* Do not ask for works that are clearly long-form novels or epics.

4. **THREE-PASS SUMMARY** (written inside the book's .md file):
   - **Pass 1 — Full Telling:** A full-spoiler account written as if by someone who
     finished the book last night and cannot quite shake it — direct, warm, a little
     raw. Tell the whole story with names, deaths, and outcomes included. Do not
     compress; do not spare the reader the ending. Target roughly double the length
     of a standard one-paragraph summary. Include: the **historical moment** (what
     century, what the author was working through, what real events or politics
     shaped the narrative); the **themes and morals** (what the book argues about
     power, loyalty, love, justice, class, or religion); and the **compelling stories**
     inside it — the scenes that stay with you. Written in a personal, exact register:
     not academic, not detached. Spoil everything.

     After the prose telling, append a **Chapter Notes** section: one or two sentences
     per chapter (or per major section for un-chaptered works), in order. Name the key
     event and its narrative function. These are structural notes, not summaries —
     written for someone who needs to navigate the book quickly, not re-read it.

   - **Pass 2 — Slower:** Key named characters, pivotal choices, tone of the world.
   - **Pass 3 — Elaborate ONE scene:** The juiciest moment — romance, a critical
     skill-or-die choice, or a battle's turning point. Specific dialogue, physical
     texture, the full emotional weight. Does NOT retell the whole book. Zooms in.

5. **SEVEN STORYLINE IDEAS.** After the three passes, list seven distinct quest seeds
   drawn from the book. Format: `Title — two sentence hook.`
   Every quest follows the book's theme and storylines. We add skill checks and
   combat — we never replace the source material's spirit.

6. **5-ACT VIGNETTE PLAY.** From the seven, choose the one that best fits the game.
   **THEME CHECK FIRST:** Before choosing, read quest-map.md's Theme Threads Active
   section. Select the storyline that introduces a theme **not already present** in
   that list. Name the existing themes you are avoiding and write one sentence
   explaining how the chosen quest is distinct. If all seven ideas duplicate existing
   themes, revise the list before choosing. No two quests in the map may share the
   same core theme — the quest-map accumulates variety, not repetition.
   Write it as a five-act French play vignette with these rules:

   **PERSPECTIVE:** Always a **Fighter on a silent escort quest.** The Fighter's
   job is to move the TOKEN from origin to destination — guard it, carry it, hand
   it off. The TOKEN is the object of the quest. The Fighter is its guardian.
   Drama unfolds around the Fighter; they observe, protect, rarely speak.

   **TOKEN:** Introduced in Act I. Physically passed or changed state at each act
   boundary. **Consumed, destroyed, or fulfilled** at the end of Act V.

   **STAGE DIRECTIONS:** Each act opens with — *The Thing · its current state ·
   who holds it · where the scene takes place.*

   **DIALOGUE:** Overheard or brief. Fighter's internal reaction = one italicised
   line per act, no more. The Fighter witnesses; they do not narrate.

   **REQUIRED across the five acts:**
   - Romance or tenderness (at least one act)
   - Moral weight — a character faces an agonizing choice
   - Physical danger — the TOKEN or the Fighter is at risk

7. **QUEST API STUB.** After the play, write the 5-act story as a quest-chain outline.
   Every act must have a SKILL CHECK — the crucial present-tense decision point.
   **Prefer `skill_check` even for speech and social acts.** A persuasion, deception,
   or intimidation roll is a skill check; never use `type: dialogue` to avoid setting
   a DC. Every skill check must name the stat, the action, and a DC of **at least 12**
   (average difficulty). Pure combat is permitted when the narrative demands it.
   Every act includes FAIL TEXT (try-again) and SUCCESS TEXT.

   Format per act:
   ```
   Act N — {title}
   activateNode: {CODE}
   type: escort | combat | skill_check
   scene: "{2–3 sentences. Where the player stands. What they see and hear.
            The emotional atmosphere — grief, urgency, dread, tenderness, awe.
            Written in second person, present tense, as if the player just arrived.}"
   prompt: "{player prompt — name the skill, the DC, and what is at stake}"
   failText:    "{try-again text — something harder, a cost, or witnessed shame;
                  never a dead end}"
   successText: "{what the player sees on passing — end with: You receive [Item].}"
   grantItem:   "{item name — emotionally resonant object from the scene}"
   takeItem:    "{item name — only on the final act, when the quest token is spent}"
   checkPassFlag: {camelCaseFlagName}
   ```

   **SCENE doctrine:** The `scene` field is the player's first read. It must do three
   things in two or three sentences: orient the player in space (where are they, what
   does it look, smell, or sound like), establish who else is present and what they
   are feeling, and land the emotional register — so the player knows whether this
   moment is tender, dangerous, solemn, or desperate before they read the prompt.

   **ITEM doctrine:** No doors or gates are opened as side effects. Progress is
   shown through items only.
   - **grantItem** — every successful act gives the player a concrete object drawn
     from the scene. Name it as a thing, not an abstraction: "Wealhtheow's mead-horn"
     not "Quest Progress Token." The item should carry the emotional weight of the
     moment — a necklace given in trust, a broken shield, an arrow that missed.
   - **takeItem** — the final act (Act V) takes the quest token from the player as
     the price of completion. The token is consumed, handed off, or destroyed.
     Name exactly what is removed.
   - The successText must name the item the player receives, in plain text at the end:
     *"You receive [Item]."*
   - `bitLabel` is retired. Items replace it entirely.

   **SKILL CHECK doctrine:** Every roll has a name (Persuasion, Perception, Athletics,
   Deception, Courage, etc.) and a DC (12 minimum, 14–16 for hard moments). No act
   skips its check by hiding behind narration.

   **FAIL TEXT doctrine:** Failure = delay with weight. The world does not end.
   Something costs more. A witness sees it. You wait and try again.

8. **CREATE THE .md FILE.** Write everything — intro sentences, three passes, seven
   storylines, 5-act play, quest stub — into `{CODE}-{slug}.md` beside the .txt.

9. **MARK IMPLEMENTED.** After writing the .md, change `[ ]` to `[x]` in this file.

10. **REFILL WHEN EMPTY.** When every entry below shows `[x]`, reset all to `[ ]`
    and begin again. Each new pass through the list must choose a **different**
    scene or storyline from the book than was used in the previous cycle — no
    repeating the same 5-act play twice.

11. **ANGLE FIRST.** Before beginning any cycle on a book, ask the user:
    *"What angle should this reading take?"* The angle determines which character
    drives the summary, which moral weight the 5-act play centers on, and which
    scene receives the elaborate treatment. Record the angle in the cycle header:
    `## Cycle N — Angle: {angle}`. Every cycle must take a different angle than
    the previous. First cycles may proceed without asking if the user has not yet
    established a preference.

12. **INCREMENTAL CYCLES.** Each new cycle of a book appends to the .md file
    under a new cycle header — prior cycles are never overwritten. Before beginning,
    re-read every prior cycle summary AND every prior quest stub in the file, then
    name one thing the new angle reveals that all prior angles missed. The summary
    accumulates. Each pass adds to the discussion, it does not replace it.

13. **CITY ANCHOR.** Every quest stub must name the in-world city or node where
    each act takes place. **Read `../story.md` before placing any quest** — it
    defines the aesthetic of each actual game city. Preferred city mapping:
    - **Birka** (BK/CI/IN/CY): Nordic timber and frost, merchants, void undercity
      below — Act I and VIII home. Birka Six NPCs available.
    - **Tilbury** (TL/DK/SF): Harbor, rope-and-salt, sea-access — Act II.
    - **Visby** (VS/GC/VC/BK): Underground markets, colder register — Act V.
    - **Weimar** (WM/SQ/MT): Archive-haunted, scholarly, high-church — Act VI.
    For source-specific geography with no clear city match (a Scottish highland
    moor, an Athenian tournament field), propose a new node with a one-line
    terrain description. The `scene:` field must root each act in that city's
    physical texture — smells, sounds, architecture, social register, danger.
    After writing each quest stub, append one line to `quest-map.md`:
    ```
    {CODE} | {quest title} | Cycle N | {node/city} | {core theme in 5 words}
    ```

14. **VIGNETTE VOICE.** The token is the grammatical subject of all stage
    directions. Lead each act header with the token: its temperature, its weight,
    who holds it, what it carries. The voice is French noir — precise, cool,
    observational. The camera rests on the object, not the face. The Fighter
    witnesses; the token moves. Every pass/fail chain ends in eventual triumph:
    fail text = delay + cost + witnessed shame, never permanent defeat. The
    fundamental tests are friendship and loyalty; combat is how they are proven.
    We write heroes. They win — not easily, not without cost, but they win.

15. When done, remind the user to clear agent memory. because these are big cycles.


---

## Token Doctrine

The TOKEN is the physical heart of the escort-quest vignette. It must be:
- **Concrete:** A real object the Fighter can hold, lose, or defend.
- **Meaningful:** Its existence or condition signals something about the quest's state.
- **Mortal:** It ends. It is spent, burned, handed off permanently, or broken by Act V.

Tokens give the quest its rhythm. Each time the token changes hands, the story
advances. Each time it is at risk, the player feels the stakes.

---

## Token Lifecycle — The Screenwriting Frame

We write directly for the mission system. No intermediate step. The scene IS
the quest. The token is the camera subject in every scene.

**Think in these four moments every time:**

```
ACCEPT  →  Player receives the quest token.
            Named object from the scene. This is the Mission Bit made physical.
            missionAccept text names it. grantItem in Act I delivers it.

CARRY   →  Each act: token changes state, temperature, or hands.
            The scene describes its current condition. It is always present.
            grantItem each act = the token in its current scene-form.

RETURN  →  Act V: token is spent. One of three endings:
            a. Returned to giver  → takeItem removes it; player receives reward object.
            b. Destroyed          → takeItem removes it; new object is born from the act.
            c. Transformed        → old object changes identity; same item, new name.

RECORD  →  Two flags close the quest:
            missionBit       = quest is active (set on accept)
            missionSuccessBit = quest is complete (set on Act V pass)
```

**Naming law:** The token object's name must be the same name used in the
vignette's stage directions. If the play says "the scarf," the item is named
"Lady Mary's Scarf" — not "Fortune Token" or "Quest Item 3." The player reads
the vignette and then sees the exact object in their inventory. The object in
inventory IS the proof the scene happened.

**Transformation example:**
> The sealed letter is carried intact. In Act V the factor burns it.
> takeItem: "Diana's Sealed Letter"
> grantItem: "Heron-Seal Receipt"  ← the letter's ash, reborn as proof of delivery.

**The test:** Read the five act headers in order. The token's name should tell
the whole story by itself — who held it, what happened to it, where it ended.

---

## Hybrid Quest Format — `type: hybrid`

Use when an act requires **both persuasion and violence** in sequence.
The skill check runs first. Pass → combat unlocks. Fail → retry at cost.
The player must clear **both** to advance. Combat pass/fail is shown only
after the skill check succeeds.

The `missionAccept` text appears in the mission panel when the quest activates.
`activateMissionBit` names the bit that opens the quest in the game system.
Each `grantItem` is the mission-bit token made tangible — named for the scene,
carried forward in the vignette's logic, taken back only at Act V.

```
Act N — {title}
activateNode: {CODE}
type: hybrid
missionAccept: "{1–2 sentences shown in mission panel. Who gives the quest,
                 what the token is, what the destination is.}"
scene: "{2–3 sentences, 2nd person present. Space + who + emotional register.}"

skillCheck:
  skill:    "{Persuasion | Deception | Perception | Courage | etc.}"
  dc:       {12–16}
  failText: "{cost + delay — try again; never dead end}"
  passText: "{bridge sentence: skill worked, now the fight begins}"

combat:
  enemy:    "{enemy name or type}"
  failText: "{wounded, pushed back — try again; the token survives}"
  passText: "{victory — ends with: You receive [Item].}"

grantItem:          "{scene object — emotionally resonant, named from the vignette}"
takeItem:           "{quest token — Act V only, when it is spent}"
activateMissionBit: {missionBitName}
checkPassFlag:      {camelCaseFlagName}
```

**Rules:**
- `skillCheck.passText` is a one-sentence bridge — it ends the social moment and
  opens the fight. Never resolve the combat in it.
- `combat.passText` closes the act. It names what the player receives.
- The `grantItem` object must appear in the `scene` or `passText` by name —
  it is the token the player carries into the next act.
- `activateMissionBit` is the flag the game checks to show this quest as active.
  Name it `{CODE}_{actN}Active` (e.g. `LCY_act2Active`).
- Every act's `grantItem` doubles as the narrative proof that the scene happened.
  Token names must read naturally in the vignette: "the scarf," "the sealed
  letter," "the gauntlet" — not "Quest Progress Token."

---

## City Travel Log

A running reserve of city and location names mentioned in source books. Not a map — a list of places the books take us, for use when placing quest acts and proposing new nodes.

Each row: `| Code | City/Location | Region | Notes |`

| Code | City / Location | Region | Source Notes |
|------|----------------|--------|--------------|
| LHR | Heorot (mead-hall) | Northern coast (Denmark) | Beowulf's hall; monster-mere nearby |
| LHR | Geatland | Southern Scandinavia | Beowulf's homeland |
| LCY | Tilford, Surrey | Southern England | Alleyne Edricson's village |
| LCY | Bordeaux | Gascony, France | English garrison city |
| LCY | Najera | Castile, Spain | Battle of Najera site |
| LGW | Camelot | Britain (Arthurian) | Arthur's court |
| LGW | Astolat | England river town | Elaine of Astolat |
| LGW | Joyous Gard | Northumbria coast | Lancelot's castle |
| LGW | Benwick | France (Arthurian) | Lancelot's French domain |
| LGW | Camlann | Western Britain | Arthur's last battle |
| MAN | Ashby-de-la-Zouche | Midlands, England | Ivanhoe tournament |
| MAN | Rotherwood | Yorkshire, England | Cedric's hall |
| MAN | Torquilstone Castle | Yorkshire, England | Front-de-Boeuf's stronghold |
| STN | Sherwood Forest | Nottinghamshire, England | Robin Hood's range |
| STN | Nottingham | Midlands, England | Sheriff's seat |
| STN | Doncaster | Yorkshire, England | Church at the story's close |
| SEN | Bristol | Southwest England | Jim's origin |
| SEN | Treasure Island | Atlantic (fictional) | Flint's burial site |
| GCI | St. Peter Port, Guernsey | Channel Islands | Gilliatt's harbor |
| GCI | Torteval coast | Guernsey, Channel Islands | Sea-cave and reef |
| KIR | Welsh mountain valleys | Wales, Celtic Britain | Mabinogion territories |
| KIR | Caer Arianrhod | Welsh coast | Lleu's fortress |
| FCO | Cumae | Bay of Naples, Italy | Sibyl's cave |
| FCO | Lavinium | Latium, Italy | Aeneas's founding city |
| FCO | Carthage | North Africa | Dido's city |
| FCO | Pallanteum / Rome | Central Italy | Evander's city, future Rome |
| FLR | Florence | Tuscany, Italy | Dante's city |
| FLR | Hell / Purgatory / Paradise | Allegorical | Dante's journey map |
| JRS | Jerusalem | Levant | Crusade target |
| JRS | Armida's garden | Damascus hinterland | Armida's enchanted realm |
| ATH | Troy / Ilium | Troad, Northwest Anatolia | Homer's city |
| ATH | Sparta | Peloponnese, Greece | Menelaos's home |
| ATH | Mycenae | Peloponnese, Greece | Agamemnon's seat |
| ZTH | Ithaca | Ionian Islands, Greece | Odysseus's home |
| ZTH | Phaeacia | Mythological island | Nausicaa's kingdom |
| ZTH | Scheria | Mythological | Alcinous's court |
| NWI | Babylon/Cunaxa | Mesopotamia (Iraq) | Battle site |
| NWI | Trapezus (Trebizond) | Black Sea coast, Anatolia | Army's arrival point |
| NWI | Sinope | Black Sea coast, Anatolia | Coastal city |
| NWI | Constantinople | Bosphorus | Army's goal |
| WAW | Rome | Italy | Nero's court and arena |
| WAW | Antium | Latium coast | Nero's retreat |
| WAW | Puteoli | Bay of Naples | Paul's landing point |
| MLA | Athens | Attica, Greece | Democratic city-state |
| MLA | Alexandria | Egypt | Caesar's meeting with Cleopatra |
| MLA | Sparta | Peloponnese | Lycurgus's city |
| BGW | Baghdad | Iraq (Abbasid caliphate) | Harun al-Rashid's city |
| BGW | Cairo | Egypt | Many tales' setting |
| BGW | Basra | Southern Iraq | Sinbad's home port |
| CAI | Baghdad | Iraq | Scheherazade's frame story |
| BEY | Jerusalem | Levant | Mandeville's goal |
| BEY | Constantinople | Bosphorus | First stop on eastern journey |
| BEY | Alexandria | Egypt | Red Sea access point |
| BEY | India (various cities) | South Asia | Dog-headed men etc. |
| KYA | Balkh | Khorasan (Afghanistan) | Persian mythic capital |
| KYA | Isfahan | Persia | Zal and Rudaba |
| KYA | Kabul | Hindu Kush | Zal's kingdom |
| KYA | Turan (Transoxiana) | Central Asia | Afrasiyab's realm |
| HTY | Kurukshetra | Northern India | Mahabharata battlefield |
| HTY | Hastinapur | North India | Kuru capital |
| ADA | Ayodhya | North India | Rama's kingdom |
| ADA | Lanka | Sri Lanka | Ravana's citadel |
| ADA | Kishkindha | South India forest | Sugriva's monkey realm |
| AMS | Kyoto / Heianjo | Japan (Heian period) | Genji's court city |
| AMS | Akashi | Western Japan coast | Genji's exile |
| AMS | Suma | Western Japan coast | Genji's retreat |
| HAV | Tortuga | Caribbean | Buccaneers' base |
| HAV | Maracaibo | Venezuela | Morgan's raid target |
| HAV | Puerto Bello (Portobelo) | Panama | Morgan's hostage assault |
| HAV | Chios | Aegean | Articles delivery commission |
| HAV | Rhodes | Aegean | Hospitaller commandery |
| CLJ | Bistritz (Bistrita) | Transylvania, Romania | Harker's first stop |
| CLJ | Borgo Pass | Carpathians | Mountain entry point |
| CLJ | Klausenburg (Cluj) | Transylvania | Archdeacon's court |
| CLJ | Sibiu (Hermannstadt) | Transylvania | Saxon fortified city |
| CLJ | Buda | Hungary | Capital |
| CLJ | London | England | Harker's home, Mina's diary |
| CLJ | Whitby | Yorkshire coast | Lucy's decline |
| BLQ | Florence (Firenze) | Tuscany, Italy | Frame story city; guild counting house |
| BLQ | Naples (Napoli) | Southern Italy | Andreuccio's disaster city; ecclesiastical court |
| BLQ | Rome | Central Italy | Checkpoint on the road south |
| BLQ | Genoa (Genova) | Ligurian coast, Italy | Three-rings delivery origin |
| BLQ | Bologna | Emilia-Romagna, Italy | University road junction; Fra Cipolla coals destination |
| BLQ | Venice (Venezia) | Veneto, Italy | Federigo's falcon deed delivery |
| BLQ | Ravenna | Emilia-Romagna, Italy | Nastagio's infernal pine grove |
| BLQ | Pavia | Lombardy, Italy | Torello's home city; magic arrival point |
| BLQ | Certaldo | Tuscany, Italy | Fra Cipolla's home village |
| BLQ | Alexandria | Egypt | Saladin's court; Torello's transport origin |
| BLQ | Burgundy (Dijon area) | Eastern France | Ciappelletto's death city |
| BLQ | Palermo | Sicily, Italy | Sicilian woman's scam city |
| LIL | Bordeaux (Bordeaux/BDX) | Gascony, France (English-held 1367) | Black Prince's capital; Free Companies staging for Spain; main port of English Aquitaine |
| LIL | Libourne | Garonne valley, Gascony | River crossing checkpoint between Bordeaux and Périgord |
| LIL | Beaulieu-en-Périgord (SRL) | Périgord, Dordogne valley | Limestone valley town; routier safe-conduct delivery destination |
| LIL | Nájera | Castile, Spain | Battle of Nájera April 3 1367; du Guesclin captured; Black Prince wins; Don Pedro defaults |

---

## Book Index

Books ≤ 400 KB can be read directly. Sizes shown in KB.

### British Isles

| Status | Code | Slug | Title — Author | Period | Category | KB |
|--------|------|------|----------------|--------|----------|----|
| [x] | LHR | beowulf | Beowulf — Anon (Gummere transl.) | ~700–1000 AD | Old English Epic | 166 |
| [x] | LCY | white-company | The White Company — Arthur Conan Doyle | 1366 AD (pub. 1891) | Historical Adventure | 625 |
| [x] | LGW | morte-darthur | Le Morte d'Arthur — Sir Thomas Malory | pub. 1485 | Arthurian Romance | 896 |
| [x] | STN | robin-hood | Merry Adventures of Robin Hood — Howard Pyle | c.1883 (medieval) | Outlaw Hero | 621 |
| [x] | MAN | ivanhoe | Ivanhoe — Sir Walter Scott | 1819 (Norman Eng.) | Historical Novel | 1140 |
| [x] | SEN | treasure-island | Treasure Island — Robert Louis Stevenson | 1883 | Pirate Adventure | 390 |
| [x] | GCI | toilers-of-the-sea | Toilers of the Sea — Victor Hugo | 1866 | Sea Epic | 5506 |
| [x] | KIR | mabinogion | Mabinogion — Anon (Welsh medieval) | ~12th–13th C | Celtic Myth | 365 |
| [x] | INV | ossian | Fragments of Ancient Poetry — James Macpherson | 1760 (ancient) | Highland Bard Epic | 87 |
| [x] | BHD | cuchulain | Cuchulain of Muirthemne — Lady Gregory | 1902 (Iron Age) | Irish Hero Epic | 132 |
| [x] | MSE | canterbury-tales | The Canterbury Tales — Geoffrey Chaucer | c.1390 | Medieval Stories | 1688 |
| [x] | SDQ | rob-roy | Rob Roy — Sir Walter Scott | 1817 (1715 setting) | Scottish Adventure | 370 |
| [x] | FCO | vision-of-piers-plowman | Piers Plowman — William Langland | c.1370–1386 | Allegorical Poem | 265 |

### Norse & Scandinavian

| Status | Code | Slug | Title — Author | Period | Category | KB |
|--------|------|------|----------------|--------|----------|----|
| [x] | FRO | volsunga-saga | Volsunga Saga — Anon | ~13th C (legendary) | Norse Legend | 342 |
| [x] | VBY | grettir-saga | Grettir's Saga — Anon | ~14th C | Icelandic Saga | 373 |
| [x] | LBC | nibelungenlied | Nibelungenlied — Anon | c.1200 | German Epic | 660 |
| [x] | GDN | njal-saga | Njal's Saga — Anon (Dasent transl.) | ~13th C | Icelandic Saga | 787 |
| [x] | RIX | egil-saga | Egil's Saga — Anon (attr. Snorri) | ~13th C | Icelandic Saga | 869 |
| [x] | BOO | prose-edda | Prose Edda — Snorri Sturluson | c.1220 | Norse Mythology | 514 |
| [x] | ALF | kalevala | Kalevala — Elias Lönnrot | 1835/1849 | Finnish Epic | 642 |
| [x] | KSU | heimskringla | Heimskringla — Snorri Sturluson | c.1230 | Norse Kings History | 1707 |
| [x] | RKV | poetic-edda | Poetic Edda — Anon | ~10th–13th C | Norse Poetry | 1924 |
| [x] | HFT | frithiof-saga | Frithiof's Saga — Esaias Tegnér | 1825 (Old Norse) | Romantic Epic | 403 |
| [x] | MOL | laxdaela-saga | Laxdaela Saga — Anon | ~13th C | Icelandic Saga | 347 |
| [x] | CPH | gesta-danorum | Gesta Danorum — Saxo Grammaticus | c.1200 | Danish Chronicles | 689 |
| [x] | ARN | knights-of-the-cross | Knights of the Cross — Henryk Sienkiewicz | 1900 (1399 setting) | Polish Historical Epic | 324 |

### French & Continental

| Status | Code | Slug | Title — Author | Period | Category | KB |
|--------|------|------|----------------|--------|----------|----|
| [x] | OST | song-of-roland | Song of Roland — Anon | c.1100 | French Chanson | 195 |
| [x] | CDG | three-musketeers | The Three Musketeers — Alexandre Dumas | 1844 (1625 setting) | Swashbuckler | 1356 |
| [x] | VIE | faust | Faust — Johann Wolfgang von Goethe | 1808–1832 | Philosophical Drama | 213 |
| [x] | ERF | grimm-fairy-tales | Grimm's Fairy Tales — Brothers Grimm | 1812 | Folk Tales | 547 |
| [x] | BRU | amadis-of-gaul | Amadis of Gaul — Garci Rodríguez de Montalvo | pub. 1508 | Chivalric Romance | 134 |
| [x] | LIL | froissart-berners | Chronicles — Jean Froissart (Berners transl.) | 14th–15th C | Medieval History | 861 |
| [x] | CRL | froissart-boys | Chronicles — Jean Froissart (Boys transl.) | 14th–15th C | Medieval History | 802 |

### Iberian & Portuguese

| Status | Code | Slug | Title — Author | Period | Category | KB |
|--------|------|------|----------------|--------|----------|----|
| [ ] | MAD | don-quixote | Don Quixote — Miguel de Cervantes | 1605–1615 | Comic Epic | 2335 |
| [ ] | MAD | chronicle-cid | Chronicle of the Cid — Anon (Southey transl.) | 12th C source | Spanish Epic | 664 |
| [ ] | LIS | lusiad | The Lusiads — Luís de Camões | 1572 | Portuguese Epic | 207 |

### Italian

| Status | Code | Slug | Title — Author | Period | Category | KB |
|--------|------|------|----------------|--------|----------|----|
| [ ] | FLR | divine-comedy-inferno | Divine Comedy: Inferno — Dante Alighieri | c.1320 | Allegorical Epic | 641 |
| [ ] | JRS | jerusalem-delivered | Jerusalem Delivered — Torquato Tasso | 1581 | Renaissance Epic | 237 |

### Classical Mediterranean

| Status | Code | Slug | Title — Author | Period | Category | KB |
|--------|------|------|----------------|--------|----------|----|
| [ ] | ATH | iliad | Iliad — Homer (Lang transl.) | ~750 BC | Greek Epic | 907 |
| [ ] | ZTH | odyssey | Odyssey — Homer (Butler transl.) | ~725 BC | Greek Epic | 700 |
| [ ] | FCO | aeneid | Aeneid — Virgil (Latin original — Gutenberg #227) | ~19 BC | Roman Epic | 484 |
| [ ] | MLA | plutarch-lives | Plutarch's Lives — Plutarch (Dryden/Clough tr.) | c. 95–110 AD | Biography | 4222 |
| [ ] | NWI | anabasis | Anabasis — Xenophon (Dakyns tr. — Gutenberg #1170) | c. 401 BC | Greek Military | 545 |
| [ ] | IST | alexiad | The Alexiad — Anna Komnene | c.1148 | Byzantine History | 165 | Processed 2026-06-01 — IST-01 spec complete (The Enemy's Portrait, CON→RGS→WM); IST-02–07 seeds. Processed from memory (no txt file). See IST-alexiad.md. |
| [ ] | WAW | quo-vadis | Quo Vadis — Henryk Sienkiewicz (Curtin tr. — 1895) | c. 64–68 AD (Nero's Rome) | Historical Novel | 1201 |

### Byzantine & Eastern European

| Status | Code | Slug | Title — Author | Period | Category | KB |
|--------|------|------|----------------|--------|----------|----|
| [ ] | CLJ | dracula | Dracula — Bram Stoker | 1897 | Gothic Horror | 869 | Processed 2026-05-31/06-01 — CLJ-01 spec (The Compiled Account, Bistritz→Klausenburg); CLJ-02–09 seeds. All 5 parts fully read (Chapters I–XXVII + epilogue). New seeds from Parts 2–5: CLJ-07 (The Haarlem Garlic, SIB→BOR), CLJ-08 (Van Helsing's Contingency, KLZ→KLZ), CLJ-09 (The Transcript, BIS). See CLJ-dracula.md. |

### Middle Eastern

| Status | Code | Slug | Title — Author | Period | Category | KB |
|--------|------|------|----------------|--------|----------|----|
| [ ] | BGW | arabian-nights-burton | Arabian Nights — Alf Layla wa-Layla (Burton tr., 1885 — Calcutta II ms.) | c. 9th–14th century | Arabic Frame-Tale | 983 |
| [ ] | CAI | arabian-nights-lang | Arabian Nights — Alf Layla wa-Layla (Lang adaptation, 1898 — Galland/Syrian tradition) | c. 9th–14th century | Arabic Frame-Tale | 629 |
| [ ] | BEY | mandeville | Mandeville's Travels — attr. Sir John Mandeville | c. 1357 | Travel/Compilation | 472 |
| [ ] | KYA | shah-nameh | Shah-Nameh — Ferdowsi (Atkinson transl.) | c.1010 | Persian Epic | 863 | Processed 2026-05-31 — KYA-01 spec complete; KYA-02–25 seeds; Shah-Nameh narrative fully covered. Volume also contains Rubaiyat/Divan/Gulistan (separate works, separate codes if processed). |

### South Asian

| Status | Code | Slug | Title — Author | Period | Category | KB |
|--------|------|------|----------------|--------|----------|----|
| [ ] | HTY | mahabharata | Mahabharata — Dutt verse condensation | Ancient (pub. 1899) | Hindu Epic | 83 | Processed 2026-05-31 — HTY-01 spec (Savitri's Three Bargains); HTY-02–06 seeds. See HTY-mahabharata.md. |
| [ ] | ADA | ramayana | Ramayana — Valmiki (Griffith transl.) | Ancient (pub. 1870) | Hindu Epic | 2339 | Processed 2026-05-31 — ADA-01 spec (The Curlew's Grief, Sultaniya→Tabriz); ADA-02–06 seeds. Part 1 of 12 fully read; story arc recovered from Narad's synopsis (Canto I). Parts 2–12 pending detailed pass. See ADA-ramayana.md. |

### East Asian & Caucasus

| Status | Code | Slug | Title — Author | Period | Category | KB |
|--------|------|------|----------------|--------|----------|----|
| [ ] | AMS | tale-of-genji | Tale of Genji — Murasaki Shikibu | c.1010 | Japanese Novel | 435 | Processed 2026-05-31/06-01 — AMS-01 spec (The Scarlet Fence Poem, NIS→TBZ); AMS-02–06 seeds. ALL 3 PARTS FULLY READ (Chapters I–IX + Appendices). New seed from Parts 2–3: AMS-07 (The Exchanged Fans, TBZ→MRG→TBZ). See AMS-tale-of-genji.md. |
| [ ] | TBS | knight-panther-skin | Knight in the Panther's Skin — Shota Rustaveli | c.1225 | Georgian Epic | mem |

### Caribbean & Americas

| Status | Code | Slug | Title — Author | Period | Category | KB |
|--------|------|------|----------------|--------|----------|----|
| [ ] | HAV | buccaneers-of-america | Buccaneers of America — Alexandre Exquemelin | 1678 | Pirate History | 247 | Processed 2026-05-31 — HAV-01 spec (The Articles, Chios→Rhodes); HAV-02–06 seeds. Both parts read; full arc recovered (Pierre le Grand, Lolonois, Morgan). See HAV-buccaneers-of-america.md. |

### Supplementary 1367 AD Sources

| Status | Code | Slug | Title — Author | Period | Category | KB |
|--------|------|------|----------------|--------|----------|----|
| [x] | LIL | froissart-berners | Chronicles (Berners transl.) | 1360s–1400 | Medieval History | 861 | Processed 2026-05-31 — LIL-02 spec complete (The Company's Letter, Bordeaux→Beaulieu-en-Périgord); routier economy/1367 angle. Pass 1: Brétigny aftermath, Free Companies, Black Prince at Bordeaux. Pass 3: Black Prince's dinner at Poitiers (source line ~498). New nodes: BDX, PER, SRL. See LIL-froissart-berners.md Supplementary Cycle. |
| [x] | CRL | froissart-boys | Chronicles (Boys transl.) | 1360s–1400 | Medieval History | 802 | Processed 2026-05-31 — CRL-02 spec complete (The Archpriest's Certificate, PER→BDX); routier economy/purchased grace angle. Parts 1–3 read; full Archpriest chapter (LXXXV–LXXXVI) + Jacquerie (LXXXVII–LXXXIX). New angle: the papal absolution as institutional transaction, 1367 Free Company precedent. See CRL-froissart-boys.md Cycle 2. |
| [ ] | BEY | mandeville | Travels of Mandeville | c.1357 | Travel | 461 | Processed 2026-05-31 — BEY-S08 spec complete (The Sultan's Commission, FAM→RHD→WM); Sultan's letters/military service angle. Parts 1–2 read; Chapter VI (soldier service) + Chapter XI (letters with great seal) + Chapter XV (Sultan dialogue). New angle: the document that authenticated a prior Mamluk-Christian relationship now inconvenient to all parties in 1367. New node: FAM (Famagusta). See BEY-mandeville.md Cycle 2. |
| [ ] | BGW | arabian-nights-burton | Arabian Nights (Burton) | Medieval | Stories | 959 | Processed 2026-05-31 — BGW-S08 spec complete (The Caliph's Own Copy, CAI→ALE→WM); shadow caliphate/marginalia angle. Source drawn from memory (size gate: ~983 KB). Harun al-Rashid section as primary focus: the idealized Caliph who walks his streets at night, annotated by al-Mutawakkil I (r. 1362–1363) who holds the same title with none of the power. New angle: the margin as the only honest speech space available to the diminished heir of a great institution. Nodes used: CAI (Cairo Sufi hospice), ALE (Alexandria Genoese factor's house). See BGW-arabian-nights-burton.md Cycle 2. |
| [ ] | CAI | arabian-nights-lang | Arabian Nights (Lang) | Medieval | Stories | 614 | Processed 2026-05-31 — CAI-S08 spec complete (The Collector's Codicil, ALP→LAT→WM); oral tradition / first inscription angle. Source part 1 of 4 read; Preface + frame narrative + opening stories confirmed. Aladdin present in this tradition (from Galland/Diyab oral tradition, not in Burton). New angle: the codicil that names the oral tradition's families as the text's true holders; the gap in the archive's classification system as evidence that no one has received this before. New nodes: ALP (Aleppo storytellers' quarter), LAT (Latakia Syrian port). See CAI-arabian-nights-lang.md Cycle 2. |
| [ ] | MSE | canterbury-tales | Canterbury Tales | c.1390 | Stories | 1688 |
| [ ] | BLQ | decameron | Decameron — Giovanni Boccaccio | 1353 | Italian Stories | 1709 | Processed 2026-05-31/06-01 — BLQ-01 spec (The Saint's Attestation, FLR→NAP); BLQ-02–07 seeds (parts 1 of 9). All 9 parts fully read (Days 1–10, all 100 stories + Author's Conclusion). New seeds from Parts 2–9: BLQ-S08 (The Jewel Chest, BRI→BAR), BLQ-S09 (The Soldier's Testimony, ALE→FAM), BLQ-S10 (The Impossible Conditions, FLR→AVG→MTP→MAR), BLQ-S11 (The Court Defense, PIS→PRA), BLQ-S12 (The Two Friends' Debt, ROM→ROM). See BLQ-decameron.md. |

---

*When all entries show `[x]`, reset to `[ ]` and begin a new cycle with different scene choices.*
