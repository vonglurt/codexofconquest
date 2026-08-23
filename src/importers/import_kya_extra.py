#!/usr/bin/env python3
# SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
# ═══════════════════════════════════════════════════════════════════════════
# ⚠️  ARCHAIC — OUT OF DATE.  Historical one-shot importer (POSTs to the
#     localhost:1367 WBAPI).  Content was long ago imported and lives in
#     play.html.  This script likely NO LONGER RUNS against the current
#     server/schema.  Kept for reference only — do not run without review.
#     Import history: BACKLOG.md / plan-archive.md / 1367-sources/.
# ═══════════════════════════════════════════════════════════════════════════
"""§PASS4-EXTRA-KYA: Shah-Nameh cycles 26–30 (Pass 4 extra cycles)"""

import requests, subprocess

BASE = "http://localhost:1367"
NPC  = "archivus_sweelinck"
BOOK = "KYA"

def api(method, path, **kwargs):
    r = getattr(requests, method)(BASE + path, **kwargs)
    r.raise_for_status()
    return r.json()

def say(msg):
    subprocess.run(["./say.sh", msg], capture_output=True)

def quest(id, title, desc, activateNode, passText, failText, checkStat, checkDC,
          checkPassFlag=None, activateCond=None, questComplete=False):
    check = requests.get(BASE + f"/api/quest/{id}")
    if check.status_code == 200:
        print(f"  SKIP (exists): {id}")
        return
    nonce_r = api("post", "/api/nonce", json={"type": "quest", "id": id})
    nonce = nonce_r["nonce"]
    payload = {
        "id": id, "type": "skill_check", "book": BOOK, "npc": NPC,
        "title": title, "desc": desc, "activateNode": activateNode,
        "passText": passText, "failText": failText,
        "checkStat": checkStat, "checkDC": checkDC,
    }
    if checkPassFlag: payload["checkPassFlag"] = checkPassFlag
    if activateCond:  payload["activateCond"]  = activateCond
    if questComplete: payload["questComplete"] = True
    api("post", "/api/quest", json=payload, headers={"X-Nonce": nonce})
    print(f"  OK: {id} — {title}")

def delivery(id, title, desc, activateNode, passText, failText,
             checkPassFlag=None, activateCond=None, questComplete=False):
    check = requests.get(BASE + f"/api/quest/{id}")
    if check.status_code == 200:
        print(f"  SKIP (exists): {id}")
        return
    nonce_r = api("post", "/api/nonce", json={"type": "quest", "id": id})
    nonce = nonce_r["nonce"]
    payload = {
        "id": id, "type": "delivery", "book": BOOK, "npc": NPC,
        "title": title, "desc": desc, "activateNode": activateNode,
        "passText": passText, "failText": failText,
    }
    if checkPassFlag: payload["checkPassFlag"] = checkPassFlag
    if activateCond:  payload["activateCond"]  = activateCond
    if questComplete: payload["questComplete"] = True
    api("post", "/api/quest", json=payload, headers={"X-Nonce": nonce})
    print(f"  OK: {id} — {title} [delivery]")

def main():
    say("KYA pass 4 extra cycles. Shah-Nameh, Ferdowsi. Cycles 26 through 30. "
        "The Portrait in the Gallery, Gúrd-afríd's Broken Lance, "
        "The Khakán's Collar, The Merchant Kherád, The Cup of Three Kings.")

    # ── Cycle 26: The Portrait in the Gallery ─────────────────────────────────
    print("\n-- Cycle 26: The Portrait in the Gallery --")
    quest("kya_26_act1", "The Comparison",
        "A minor Timurid official, Mahmud ibn Yusuf al-Haravi, keeps the Zábulistán "
        "Gallery Portrait in a locked cabinet behind his writing desk. He acquired it "
        "from an estate dispersal in Herat and has not shown it to anyone. He is not "
        "certain what it is. He places it on the table without comment and watches your "
        "face. The painted face is a man in a blue robe, crown, the eyes direct and sad. "
        "On the verso, in a later hand: 'This is the face she compared.'",
        "HRT",
        "He is quiet. 'The notation says the face she compared. That is the whole story.' "
        "He wraps it in felt and ties it with a cord. You receive the Zábulistán Gallery "
        "Portrait.",
        "He is uncertain. He wants a written appraisal of the Zábulistán provenance "
        "before releasing it. You must return in two days.",
        "CHA", 12, checkPassFlag="kya_26_act1")

    quest("kya_26_act2", "The Road from Herat",
        "The road from Herat northwest to Merv runs through a stretch of open steppe "
        "where Timurid outriders patrol for undeclared luxury goods. A panel portrait "
        "on gessoed board is technically a luxury object. The patrol commander is young, "
        "bored, and looking for a reason to confiscate something interesting. He holds "
        "the portrait up to the afternoon light. The painted face catches it. He stares.",
        "MRV",
        "He hands it back. 'Carry it in front, then, where I can see you praying.' He "
        "waves you through. The Portrait passes without a mark.",
        "He is skeptical. He taxes it at ten percent of declared value and marks the "
        "outer felt with a confiscation seal. The seal will complicate things at the "
        "next checkpoint.",
        "CHA", 12, checkPassFlag="kya_26_act2", activateCond="kya_26_act1")

    quest("kya_26_act3", "The Scholar's Recognition",
        "Yusuf al-Ansari at the Nishapur madrasa has spent thirty years cataloguing "
        "portraits of legendary kings. He unwraps the felt. He does not speak for several "
        "minutes. He reads the Pahlavi border inscription and the verso notation twice. "
        "Then: 'I have seen four portraits identified as Jemshíd. Three are clearly later "
        "inventions — too formal, too gold. This one is different. The sadness is right. "
        "A man who knows he is being recognized but will not admit who he is.' He pauses. "
        "'Where did the notation come from?'",
        "NIS",
        "He writes in the margin of the authentication paper: 'Portrait used in a "
        "comparison that did not produce a confession — evidence of presence without "
        "admission.' He dates it and hands the portrait back.",
        "Al-Ansari adds only a neutral authentication stamp. The scene does not make it "
        "into the archive record.",
        "INT", 13, checkPassFlag="kya_26_act3", activateCond="kya_26_act2")

    quest("kya_26_act4", "The Collector Who Wants a Set",
        "At the Trebizond waterfront a Genoese collector named Bartolomeo Spinola has "
        "been waiting for you. His agent traced the portrait from Herat through Nishapur. "
        "He wants it for a set of four legendary king portraits he is assembling for a "
        "Venetian patron. He has two armed porters with him. He is not interested in "
        "negotiation. The porters move to flank you.",
        "TBZ",
        "The porters go down. Spinola walks away without a word. You still have the "
        "Portrait. Fighter adjusts his grip and does not look at the painted face.",
        "You lose the portrait for three days while Spinola holds it as leverage. He "
        "eventually releases it when an Ottoman harbor official intervenes — not on your "
        "behalf, but because Spinola has no bill of sale.",
        "STR", 14, checkPassFlag="kya_26_act4", activateCond="kya_26_act3")

    delivery("kya_26_act5", "The Archive Receives the Comparison",
        "Archivus Sweelinck unwraps the felt. He reads the Pahlavi border. He reads the "
        "verso notation. He holds the portrait at arm's length, then closer. He sets it "
        "down. 'The notation says: this is the face she compared. Not: this is a portrait "
        "of Jemshíd. Not: this is the king. She compared this face to the face at the "
        "garden gate, and the man at the gate denied being himself. The portrait is "
        "evidence of an identification act that produced no confession and ended in "
        "betrayal and flight and death by poison.' He writes in the master ledger: "
        "Identification Records — Images Used in Acts of Recognition That Did Not Resolve; "
        "the Zábulistán Gallery Portrait, face of Jemshíd, used in a comparison that the "
        "subject refused to confirm. First entry.",
        "NUE",
        "He adds to the ledger: 'The identification was correct. The subject denied it. "
        "Both facts are in the record.' He places the portrait face-up in a new case. "
        "You receive the Archive Receipt for the Zábulistán Gallery Portrait.",
        "Sweelinck records only the portrait. The denial is left out of the category "
        "description.",
        checkPassFlag="kya_26_act5", activateCond="kya_26_act4")

    # ── Cycle 27: Gúrd-afríd's Broken Lance ───────────────────────────────────
    print("\n-- Cycle 27: Gúrd-afríd's Broken Lance --")
    quest("kya_27_act1", "The Garrison's Memory",
        "The Sistan military archive occupies two rooms in a disused caravanserai. The "
        "archivist, Yaqub al-Sistani, a retired Khorasani cavalry officer, has kept the "
        "garrison records of the Barrier Fort for twenty years. The Lance Remnant sits "
        "in a corner, wrapped in oilcloth. He does not treat it as important. 'It is "
        "from the fort. From the time of the Sohráb invasion. That is all I know.' "
        "Outside, a dry October wind pushes grit under the door.",
        "SIS",
        "He stops. 'She cut it free herself?' He reads the garrison notation again. 'I "
        "had not understood that.' He wraps it more carefully and hands it to you. 'Then "
        "it should go somewhere that understands what it is.' You receive Gúrd-afríd's "
        "Lance Remnant.",
        "He shrugs. He will give it to you if you want it — it is just wood. But without "
        "the identification, the archive intake record will be incomplete.",
        "INT", 12, checkPassFlag="kya_27_act1")

    quest("kya_27_act2", "The Road West",
        "Three days west of Sistan, at the Yazd caravanserai, you share a courtyard fire "
        "with a Zoroastrian family — a mother, her two daughters, and an old man who says "
        "nothing all evening. The mother asks what you are carrying. You show her the "
        "lance fragment. She holds it for a long time. 'My grandmother told me of "
        "Gúrd-afríd,' she says. 'She was not a myth to us. She was a woman who dressed "
        "as a man and fought and bargained her way free. We tell the story at the new "
        "year.' Her daughters are listening. The fire crackles.",
        "YAZ",
        "She nods slowly. 'Then tell the archivist this: the story says she laughed when "
        "she got back inside the walls. Not relief — she laughed.' She hands back the "
        "lance. You carry a detail that is not in any written record.",
        "She is hurt. The old man says nothing. You leave the courtyard feeling you have "
        "taken something from a community it belonged to.",
        "CHA", 12, checkPassFlag="kya_27_act2", activateCond="kya_27_act1")

    quest("kya_27_act3", "The Scholar's Provocation",
        "The Nishapur madrasa scholar Farid al-Din Khorasani has spent years arguing "
        "that Gúrd-afríd is a poetic invention — no historical Persian military record "
        "names a warrior-woman at the Barrier Fort. He sees the lance fragment and the "
        "garrison record and immediately identifies both as likely forgeries produced to "
        "support a mythological tradition. He is not hostile. He is rigorous. His "
        "argument is: the garrison record is too clean, the lance too whole.",
        "NIS",
        "He pauses. 'You are not claiming she was historical.' 'No.' He sets down his "
        "pen. 'Then I have nothing to object to. The garrison believed this was hers. "
        "That belief is itself a historical fact.' He writes a neutral authentication.",
        "He annotates the garrison record with his objections. The annotation is added "
        "to the TOKEN's chain of custody file. Sweelinck will note it.",
        "INT", 13, checkPassFlag="kya_27_act3", activateCond="kya_27_act2")

    quest("kya_27_act4", "The Night Road",
        "North of Tabriz, on the mountain road toward the Black Sea coast, three riders "
        "come up behind you fast. They are not bandits — their equipment is too good. "
        "One of them calls: 'The lance. We have a buyer. Fair price, right now.' They "
        "are collectors' agents. The buyer is a Venetian interested in Persian military "
        "relics. They are armed and they will not take no for an answer. Fighter steps "
        "into the road.",
        "TBZ",
        "The road is clear. The lance is intact. Fighter wipes the blade and doesn't "
        "look back. The Trebizond harbor is two days ahead.",
        "They take the lance for one hour while you recover, but leave you the garrison "
        "record. You catch up to them at the next junction when their horse throws a "
        "shoe.",
        "STR", 14, checkPassFlag="kya_27_act4", activateCond="kya_27_act3")

    delivery("kya_27_act5", "The Archive Receives the Broken Weapon",
        "Archivus Sweelinck holds the lance remnant horizontally, reads the break. He "
        "reads the garrison record. He sets the lance across two brackets on the shelf. "
        "He reads the break again. 'She cut it free from her own body. In the middle of "
        "the combat, with Sohráb watching, she cut the spear that had gone through her "
        "belt and pulled the piece out of her own side and rode away.' He is quiet. 'The "
        "weapons we receive in this archive have mostly been instruments of documents. "
        "This is a weapon that ended a combat without killing anyone. She bargained her "
        "way free and laughed when she got inside.' He writes in the master ledger: "
        "Combat Records — Weapons Recovered After Inconclusive Engagements. The broken "
        "lance of Gúrd-afríd, cut free from her own body. The combat ended without a "
        "death. She laughed.",
        "NUE",
        "He adds to the ledger: 'Oral tradition, Yazd: she laughed when she got inside "
        "the walls.' He dates the addition. The Lance Remnant is received. You receive "
        "the Archive Receipt.",
        "Sweelinck records the garrison record only. The laugh is not in the archive.",
        checkPassFlag="kya_27_act5", activateCond="kya_27_act4")

    # ── Cycle 28: The Khakán's Collar ─────────────────────────────────────────
    print("\n-- Cycle 28: The Khakán's Collar --")
    quest("kya_28_act1", "The Dispersal Inventory",
        "A Timurid cultural official named Khwaja Ahmad Samarqandi oversees the "
        "redistribution of objects from the Ilkhanid treasury dispersal records. He has "
        "a list. The collar appears as Item 47: 'gold torque, dragon terminals, "
        "inscription claims Rustem trophy, condition excellent.' He does not believe the "
        "inscription. He is about to assign it to a metalworker for remelting as raw "
        "bullion — the gold is valuable; the object is not, to him. The office smells "
        "of dust and old paper. He has forty items to process before evening.",
        "SAM",
        "He stamps Item 47 RELEASED FOR SCHOLARLY TRANSFER and hands you the collar. "
        "'If Weimar can use it, it is more useful there than as bullion.' You receive "
        "the Khakán's Golden Collar.",
        "He is unpersuaded. He issues a three-day review stay while you document the "
        "provenance claim. The metalworker is already scheduled.",
        "CHA", 12, checkPassFlag="kya_28_act1")

    quest("kya_28_act2", "The Silk Road Checkpoint",
        "The Merv checkpoint on the Khurasan road collects a gold-weight tax on all "
        "metal objects leaving the eastern provinces. The torque is heavy — the inspector "
        "places it on a scale. His assistant is writing numbers. The dragon terminals "
        "gleam in the afternoon sun. Outside, camels move in a slow column toward "
        "Nishapur. The torque bears a Mongolian inscription added in the 14th century: "
        "'Taken from the treasury of the Khakán of Chín by the champion Rustem of "
        "Sistan — this is recorded in the Book of Kings.'",
        "MRV",
        "He waves you through. 'Historical, you say. The inscription then. Rustem.' "
        "He makes a note for his own file. The collar passes without charge.",
        "He taxes it at four percent of gold weight. You pay. The receipt is now part "
        "of the TOKEN's documentation — evidence that even a famous trophy can be "
        "treated as commodity.",
        "CHA", 12, checkPassFlag="kya_28_act2", activateCond="kya_28_act1")

    quest("kya_28_act3", "The Chinese Scholar's Objection",
        "At the Constantinople Byzantine court, a visiting scholar from the Mongol court "
        "at Dadu — Zhao Wenru, on a cultural exchange visit — examines the collar. He is "
        "a specialist in Sino-Mongolian goldwork. He identifies the alloy as consistent "
        "with Tang dynasty production, not Seleucid or Achaemenid. The dragon terminals "
        "are Chinese, not Persian. His conclusion: the inscription and the Ilkhanid "
        "attribution are secondary — someone attached the Rustem-story to a genuine "
        "Chinese collar, probably in the 11th century. 'This torque was never near "
        "Rustem,' he says.",
        "CON",
        "He is quiet for a moment. 'The incorporation is documented. That is rare.' He "
        "writes in his own hand a note on Chinese academic paper: 'This collar is Chinese "
        "work. It was claimed as a Persian trophy. The claim is now part of its history.' "
        "He attaches the note to the terminal seal.",
        "Zhao Wenru adds a dissent to the provenance file. The archive note will record "
        "the dispute without resolution.",
        "INT", 13, checkPassFlag="kya_28_act3", activateCond="kya_28_act2")

    quest("kya_28_act4", "The Market at the Gate",
        "At the Trebizond harbor market a Genoese gold dealer has heard about the collar. "
        "He offers twice what the Samarkand official would have charged the metalworker. "
        "He is polite, well-dressed, and his offer is genuinely fair. He sits across "
        "from you at a harbor-side table with a glass of wine. 'I will have it melted "
        "and the inscription recorded before the melt. The record will be kept.' He "
        "slides the contract across the table.",
        "TBZ",
        "He nods. 'You are right, of course. A copy is not evidence.' He pockets the "
        "contract. 'Tell Weimar I would have paid well.' He finishes his wine.",
        "He is frustrated but not hostile. He follows you to the harbor exit and makes "
        "one more offer. You decline again. He raises his glass as you board.",
        "CHA", 13, checkPassFlag="kya_28_act4", activateCond="kya_28_act3")

    delivery("kya_28_act5", "The Archive Receives the Tribute",
        "Archivus Sweelinck lifts the collar with both hands. He reads the Mongolian "
        "inscription. He reads Zhao Wenru's note. He reads the Ilkhanid seal. He sets "
        "it down on the table and looks at it from a distance. 'A Chinese torque. Made "
        "in Chín. Then someone attached the Rustem story to it, and the Ilkhanid "
        "treasury sealed it as authentic in 1320. And now it is here.' He writes: "
        "Tribute Records and Their Displacements — Objects Claimed by Epic Tradition "
        "That Predate the Claim; the Khakán's Golden Collar, Tang dynasty Sino-Persian "
        "alloy, dragon terminals, inscription claiming it as the tribute-trophy taken "
        "by Rustem from the Khakán of Chín. The archive holds the collar, the claim, "
        "the doubt, and the documentation of the incorporation.",
        "NUE",
        "'The demand is in the text.' He adds: 'Rustem named the collar. Whether or not "
        "this is the collar he named, someone named it in return.' He closes the ledger. "
        "The collar is placed in the archive's east case. You receive the Archive "
        "Receipt.",
        "He records the Chinese provenance and the claim dispute. The connection to the "
        "poem's specific demand is not entered.",
        checkPassFlag="kya_28_act5", activateCond="kya_28_act4")

    # ── Cycle 29: The Merchant Kherád ─────────────────────────────────────────
    print("\n-- Cycle 29: The Merchant Kherád --")
    quest("kya_29_act1", "The Gate-Keeper's Testimony",
        "The Herat manuscript room holds the tablet in a cedar box with the notation "
        "on the lid. The current custodian, Ahmad ibn Jafar al-Haravi — knows what it "
        "is and is proud of it. He is not certain it should leave Herat. 'This is part "
        "of our history,' he says. 'The gate-keeper who kept this was from this region. "
        "His family kept it for two hundred years.' The afternoon light through the "
        "latticed window marks the wall in a grid of gold and shadow. The tablet: a "
        "small clay tablet impressed with a merchant's seal — scales and double-fish — "
        "and the name 'Kherád of Persia, trader in embroideries and gems.' The gate-"
        "seal of Arjásp's fortress compound is at the lower left.",
        "HRT",
        "He opens the cedar box himself. 'The gate-keeper's name was Barzin,' he says. "
        "'That is not in any text. His family told us.' He writes the name on a slip and "
        "tucks it inside the box. You receive the Kherád Trade Permit with Barzin's "
        "name attached.",
        "He is unconvinced by the argument of completeness. He will release the tablet "
        "only if the scholar Ahmad al-Farghani in Tabriz writes a letter of authentication. "
        "You must travel to Tabriz and return.",
        "CHA", 13, checkPassFlag="kya_29_act1")

    quest("kya_29_act2", "The Caravan Road",
        "The road from Herat to Maragha passes through the upland plateau in late "
        "autumn — thin air, bright cold sun, the distant mountains still white from the "
        "first snow. At the Maragha caravanserai you are approached by a scribe employed "
        "by the Mongol court historians. He has heard of the tablet and wants a rubbing. "
        "His court history is being compiled — the Ilkhanid court was assembling a "
        "universal history, and the Kherád episode is in it. He has legitimate scholarly "
        "credentials. He asks politely.",
        "MRG",
        "You recognize that the court history attribution would preempt the archive's "
        "own assessment. You politely decline. 'The archive will make a rubbing available "
        "through its normal process.' The scribe notes your refusal in his own records "
        "— which means the tablet is now mentioned in Mongol court historiography as "
        "being in transit to Weimar.",
        "You allow the rubbing. The court history will reference the Maragha rubbing, "
        "not the Weimar original — a minor complication but not a disaster.",
        "WIS", 12, checkPassFlag="kya_29_act2", activateCond="kya_29_act1")

    quest("kya_29_act3", "Ahmad al-Farghani's Final Note",
        "Ahmad al-Farghani appears for the last time in the KYA cycle. He reads the "
        "Pahlavi on the tablet with his loupe. He reads the gate-seal. He reads the "
        "gate-keeper's name on the slip. He sets the tablet down and is quiet for a "
        "long time. 'Kherád means wisdom in Persian,' he says. 'Isfendiyár chose the "
        "name. The seal device is a fabrication — plausible, but not in any Persian "
        "guild register I have seen. He made a plausible lie.' He pauses. 'The gate-"
        "keeper kept it. That is what I cannot stop thinking about. The man who was "
        "deceived kept the evidence of his deception.'",
        "TBZ",
        "He writes it: 'Barzin the gate-keeper preserved the evidence of his own "
        "deception. This is the most honest thing in the document.' He dates the "
        "authentication. It is his last act in the KYA cycle.",
        "He writes a neutral authentication. His observation about the gate-keeper "
        "stays in the room.",
        "CHA", 11, checkPassFlag="kya_29_act3", activateCond="kya_29_act2")

    quest("kya_29_act4", "The Border and the Name",
        "At the Trebizond harbor-side customs station the official opens the cedar box "
        "and reads the notation. He knows enough Persian to recognize 'merchant' and "
        "'fortress.' He wants to understand what it is. He is not trying to confiscate "
        "it — he is simply curious in the way of a man who spends his days looking at "
        "what passes through the world. 'A false merchant's permit,' you say. He looks "
        "at it again. 'And it worked?' 'Yes.' He holds it for another moment.",
        "TBZ",
        "He closes the box. 'Then it is a more interesting document than most of what "
        "I see.' He stamps it through under scholarly import and waves you on. Fighter "
        "has not spoken in two days.",
        "He decides it needs a scholarly import review — three-day hold. He is not "
        "being difficult; he simply wants everything properly documented.",
        "INT", 11, checkPassFlag="kya_29_act4", activateCond="kya_29_act3")

    delivery("kya_29_act5", "The Archive Receives the Forgery",
        "Archivus Sweelinck reads the Pahlavi. He reads the gate-seal. He reads "
        "al-Farghani's authentication with its final note. He reads Barzin's name on "
        "the slip. He sets the tablet down and taps the scales-and-fish motif with one "
        "finger. 'Kherád means wisdom,' he says. 'He named himself the merchant who "
        "is wise, and then he killed his host.' He is quiet. 'The gate-keeper kept the "
        "permit. The man who was deceived kept the evidence. That is not recorded in "
        "any text — it is in the authentication.' He writes: False Documents That "
        "Enabled Entry — Forgeries Preserved by Their Victims; the Kherád Trade Permit, "
        "clay tablet, gate-seal of the Brazen Fortress, name of Barzin the gate-keeper "
        "who preserved it. The archive opens a new category for documents that worked "
        "by being false.",
        "NUE",
        "'The gate-keeper kept it.' He rewrites the ledger entry: 'Preserved by the "
        "victim of the deception. First entry in the category — False Documents That "
        "Enabled Entry, Preserved by Those They Deceived.' He closes the ledger. You "
        "receive the Archive Receipt for the Kherád Trade Permit.",
        "Sweelinck creates the category without the specification about the victim's "
        "preservation. The archive holds the tablet but the category misses the "
        "key distinction.",
        checkPassFlag="kya_29_act5", activateCond="kya_29_act4")

    # ── Cycle 30: The Cup of Three Kings (questComplete) ──────────────────────
    print("\n-- Cycle 30: The Cup of Three Kings --")
    quest("kya_30_act1", "Kashani's Study",
        "Nasir al-Din Kashani is seventy years old and knows he is dying. He has been "
        "a scholar in the Tabriz Jalayirid court his entire life — compiler of anthologies, "
        "corrector of manuscripts. His study is warm. The folio is on his desk, face-up. "
        "He has been looking at it. 'I wrote this two months ago,' he says. 'I was "
        "reading the new KYA volume — the Shah-Nameh and the Hafiz together in one "
        "binding — and I saw the chain. I do not think anyone has written it down before.' "
        "The recto: the Hafiz ghazal verse about Sikander's mirror, with Kashani's "
        "annotation tracing it back to the Cup of Jemshíd and then to Sikander's four "
        "goblets. The verso: 'There are three cups in Persian literature that see "
        "everything... The man who pours the wine is the archivist. He does not drink; "
        "he shows.'",
        "TBZ",
        "He is quiet for a moment. 'Then give it to someone who can hold all three.' "
        "He folds the folio once along an existing crease. 'Tell the archivist: the "
        "man who pours the wine does not drink.' He gives you the Three-Cup Folio.",
        "He is uncertain. 'An archive is an institution. I am a person. What I saw may "
        "not be what they see.' He gives you the folio but without conviction. Sweelinck "
        "will note the hesitation.",
        "CHA", 11, checkPassFlag="kya_30_act1")

    quest("kya_30_act2", "The Hafiz Manuscript Parallel",
        "At Nishapur you find Yaqub ibn Ibrahim — still in his study, still careful "
        "with paper — who has a Hafiz manuscript that contains the same ghazal Kashani "
        "cited. He has never noticed the Shah-Nameh connection. You show him the "
        "Three-Cup Folio. He reads it twice. He looks at his own manuscript, open to "
        "the relevant ghazal. The two texts are in front of him simultaneously — "
        "Kashani's chain and the Hafiz verse it annotates. Outside, rain moves across "
        "Nishapur for the first time in a month.",
        "NIS",
        "He reaches for a pen. 'May I add a note on the verso of the Nishapur "
        "confirmation?' He writes in the margin: 'Confirmed by comparison with Nishapur "
        "Hafiz MS. Chain complete. Y. ibn I.' He dates it. The folio now carries two "
        "hands.",
        "Yaqub nods but does not add to the folio's documentation. The chain remains "
        "Kashani's alone.",
        "INT", 12, checkPassFlag="kya_30_act2", activateCond="kya_30_act1")

    quest("kya_30_act3", "The Wine-Cup Question",
        "At the Baghdad Sufi lodge — the tekke of Sheikh Ahmad ibn Musa al-Baghdadi "
        "— you present the Three-Cup Folio to a small gathering of Sufi scholars who "
        "have been debating the Hafiz ghazal for years. They receive Kashani's "
        "annotation with the careful intensity of men who have been arguing about this "
        "specific verse. Sheikh Ahmad reads it aloud. The debate stops. He says: 'The "
        "man who pours the wine does not drink. Kashani wrote that.' He sets the folio "
        "down. 'He is correct. The archivist and the Saki are the same figure.' The "
        "lodge wants to retain the folio as a teaching document.",
        "BGD",
        "The sheikh is quiet. He looks at the folio, then at you. 'Tell the archivist: "
        "the Saki is grateful.' He releases the folio without making a copy. He trusts "
        "the connection you have described.",
        "The sheikh makes a copy before releasing it. The copy will circulate in the "
        "Sufi teaching tradition — not a harm, but it means the folio will be referenced "
        "before Sweelinck has assessed it.",
        "CHA", 13, checkPassFlag="kya_30_act3", activateCond="kya_30_act2")

    quest("kya_30_act4", "The Final Road",
        "Constantinople. The last checkpoint before Weimar. You have carried the "
        "Three-Cup Folio from Tabriz through Nishapur and Baghdad. Nikephoros Katakalon's "
        "door is open when you pass; he sees you through the window and calls out. He "
        "is working on his Byzantine Alexander-cycle commentary. He wants one look at "
        "the folio — he has heard about it through the scholars' network. He reads "
        "Kashani's note standing up, folio in hand. He wants to add a note connecting "
        "the Byzantine Alexander tradition to the Persian cup-chain.",
        "CON",
        "He pauses. 'You are protecting the margins.' 'Yes.' He hands it back. 'I will "
        "write to Sweelinck directly.' He goes back to his desk. Fighter waits in the "
        "doorway until you are ready to leave.",
        "He adds a brief note in Greek in the upper right margin. It is not wrong but "
        "it changes the folio's scholarly register.",
        "CHA", 12, checkPassFlag="kya_30_act4", activateCond="kya_30_act3")

    delivery("kya_30_act5", "The Archive Completes the Cycle",
        "Archivus Sweelinck reads the Three-Cup Folio recto and verso. He reads Yaqub "
        "ibn Ibrahim's margin note. He sets it down and looks at it for a long time. "
        "The archive is quiet. Outside, snow has begun — the first of the season. He "
        "says: 'Kashani saw that all three cups in the Persian tradition are one cup. "
        "The Cup of Jemshíd sees the seven climes. Sikander's mirror sees Dárá's realm. "
        "Hafiz's wine-cup holds both. And the man who pours does not drink.' He is "
        "quiet. 'The Shah-Nameh cycle opened with Kavah the blacksmith raising his "
        "apron. It closes with a scholar in Tabriz who read the whole volume and saw "
        "the cup that runs through it.' He writes: Acts of Reading That Produced the "
        "Archive — Connections Made by a Single Reader Across Multiple Works; the "
        "Three-Cup Folio of Nasir al-Din Kashani, Tabriz, c. 1367. The Shah-Nameh "
        "cycle — thirty vignettes, from the first fire to the last cup — is complete.",
        "NUE",
        "Sweelinck places the Three-Cup Folio in the archive's west case, at the end "
        "of the Shah-Nameh sequence. He writes a final note: 'The KYA cycle: thirty "
        "documents. The fire and the anger, the first night and the last cup. The man "
        "who pours the wine does not drink. The archive is the man who pours.' He "
        "closes the ledger. You receive the Archive Receipt for the Three-Cup Folio "
        "— KYA Complete.",
        "Sweelinck records the three cups and the reading chain without the final "
        "formulation. The category description is accurate but incomplete.",
        checkPassFlag="kya_30_act5", activateCond="kya_30_act4", questComplete=True)

    print("\n=== KYA extra cycles complete ===")
    say("KYA cycles 26 through 30 deployed. 25 acts. Shah-Nameh Pass 4 extra cycles "
        "complete. Weimar Archive. Archivus Sweelinck. "
        "The Portrait in the Gallery, Gúrd-afríd's Broken Lance, "
        "The Khakán's Collar, The Merchant Kherád, The Cup of Three Kings. "
        "Quest complete. Group G Pass 4 extra cycle import complete.")

    print("\n-- Audit --")
    audit = api("get", "/api/audit")
    errors = audit.get("errors", [])
    print(f"  {len(errors)} errors" if errors else "  0 errors")
    for e in errors[:5]:
        print(f"    {e}")

    total = api("get", "/api/list/quest")
    quest_count = len([q for q in total if not q.get("_hint")])
    print(f"  Total quests: {quest_count}")

    api("post", "/api/save", json={})
    print("  Saved.")

if __name__ == "__main__":
    main()
