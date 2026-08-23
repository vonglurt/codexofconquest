#!/usr/bin/env python3
# SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson and Claude
# ═══════════════════════════════════════════════════════════════════════════
# ⚠️  ARCHAIC — OUT OF DATE.  Historical one-shot importer (POSTs to the
#     localhost:1367 WBAPI).  Content was long ago imported and lives in
#     index.html.  This script likely NO LONGER RUNS against the current
#     server/schema.  Kept for reference only — do not run without review.
#     Import history: BACKLOG.md / plan-archive.md / 1367-sources/.
# ═══════════════════════════════════════════════════════════════════════════
"""§PASS4-EXTRA-JRS: Jerusalem Delivered cycles 8–11 (Pass 4 extra cycles)"""

import requests, subprocess

BASE = "http://localhost:1367"
NPC  = "archivus_sweelinck"
BOOK = "JRS"

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
    say("JRS pass 4 extra cycles. Jerusalem Delivered, Tasso. Cycles 8 through 11. "
        "The Desertion Record, The Physician's Account, "
        "The Siege Engineer's Account, The Preaching Record.")

    # ── Cycle 8: The Desertion Record ─────────────────────────────────────────
    print("\n-- Cycle 8: The Desertion Record --")
    quest("jrs_08_act1", "The Clerk's Satchel",
        "The token sits in a harbor-side provisioner's storeroom in Acre, tucked inside a "
        "muster-roll satchel that arrived with the campaign baggage train. The provisioner "
        "doesn't know what it is. He knows it is paper with names on it and that no one has "
        "come to claim it in eleven months. He is mildly superstitious about it — it arrived "
        "with three sacks of spoiled grain and a broken whetstone and he associates the lot "
        "with bad luck. He would rather the satchel were somewhere else.",
        "PKR",
        "You tell him: it is a record of men who left a campaign and did not come back. He "
        "nods. 'I thought it was something like that,' he says, and hands it over without "
        "further question. You receive the Muster-Roll of Armida's Following.",
        "You give him a partial answer. He holds the satchel longer than you'd like, turning "
        "it over. When he finally hands it across, he asks you twice if you are sure. You "
        "leave with it, but his unease stays behind in the room.",
        "WIS", 12, checkPassFlag="jrs_08_act1")

    quest("jrs_08_act2", "The Unit Commander's Testimony",
        "At the Syrian Gate checkpoint, a retired unit commander is traveling south toward "
        "Damascus on personal business. He is one of the twelve men on the muster-roll whose "
        "column reads 'returned'. He does not know the muster-roll exists. When you show it "
        "to him, he goes still. He left Armida's following after three weeks. He will not "
        "say why in detail. What he will say is this: the men on the list were not weak men. "
        "They were not traitors. Something was done to them that he does not have a word for.",
        "SGA",
        "He gives you three sentences, carefully measured: 'These men left under an influence "
        "no standard-issue courage could hold against. I know because I was among them and I "
        "am not a weak man. Whatever the archive calls this, it is not desertion in the sense "
        "the word is used for soldiers who run from a fight.' He signs it.",
        "He closes the muster-roll and hands it back. 'I can't explain it to someone who "
        "hasn't seen it,' he says. He continues south. You have the document but not the "
        "testimony.",
        "CHA", 13, checkPassFlag="jrs_08_act2", activateCond="jrs_08_act1")

    quest("jrs_08_act3", "The Chaplain's Objection",
        "Near the Damascus approach, a campaign chaplain who administered last rites at the "
        "siege is traveling toward a posting in Antioch. He hears you have the muster-roll "
        "and seeks you out. His objection is theological: a man who abandoned the Crusade "
        "— regardless of circumstance — cannot be given a clean record. The Church has a "
        "category for this. He wants to add a notation to the document before it is archived. "
        "His notation would read: 'Absented themselves from sacred duty, circumstances "
        "unknown.' This is not false. But it is not the same as what Godfrey wrote at "
        "the bottom.",
        "JAR",
        "The chaplain reads the precedent argument twice. He does not agree with it, but he "
        "accepts it — a distinction he makes out loud, which you appreciate. He writes nothing "
        "on the document. He blesses you instead and continues toward Antioch.",
        "The chaplain adds his notation. The document now carries two competing assessments. "
        "The archive will have to decide which to treat as primary, and it will probably "
        "choose the one that fits its existing categories.",
        "INT", 14, checkPassFlag="jrs_08_act3", activateCond="jrs_08_act2")

    quest("jrs_08_act4", "The River Crossing",
        "The road north to Constantinople crosses a wide river at a bridge controlled by a "
        "Byzantine toll-collector who has standing instructions to inspect all campaign "
        "documents passing through. He has a list of papers that require verification before "
        "transit. Muster-rolls are on the list. He wants to hold this one for verification "
        "— three to five days. He is not corrupt. He is conscientious, which is the problem.",
        "CON",
        "He considers the argument, then stamps the document with a transit seal — which "
        "actually helps the archival case — and waves you through. The document is formally "
        "in transit to a permanent archive. This is now on record.",
        "He holds the document for two days. When you receive it back, it has been copied. "
        "There is now a Byzantine administrative copy of the muster-roll somewhere in a "
        "provincial archive. This may matter later.",
        "CHA", 13, checkPassFlag="jrs_08_act4", activateCond="jrs_08_act3")

    delivery("jrs_08_act5", "The Archive — The Desertion Record",
        "Sweelinck takes the muster-roll and reads it in full, including the testimony on "
        "the reverse. He reads Godfrey's note three times. The problem is classification. "
        "The archive has categories for deserters, for casualties, for prisoners, for the "
        "returned. It does not have a category for men who left under external magical "
        "compulsion, some of whom returned and some of whom did not, and whose commanding "
        "officer wrote on the record itself that they were not cowards.",
        "NUE",
        "You give him the category name: Personnel Records — Absence Under Magical "
        "Compulsion, Commander's Determination Appended, First Entry. Sweelinck writes it "
        "on a new tab. He files the muster-roll behind it. He notes: see also Godfrey's "
        "field note on reverse; see testimony of returned soldier, unnamed, dated. The gap "
        "in the system now has a shape, and the shape has a name. You receive the Archive "
        "Receipt.",
        "Sweelinck files the document in a miscellaneous drawer marked Contested Status — "
        "Crusade Personnel. It is technically accessible but practically invisible.",
        checkPassFlag="jrs_08_act5", activateCond="jrs_08_act4")

    # ── Cycle 9: The Physician's Account ──────────────────────────────────────
    print("\n-- Cycle 9: The Physician's Account --")
    quest("jrs_09_act1", "Erotimus's Effects",
        "Erotimus died eight months after Jerusalem fell, of fever contracted in a river "
        "crossing near Antioch. His notebook passed to his assistant, who carried it back "
        "to Acre, who sold it along with other campaign effects to a document-dealer in the "
        "Pilgrim's Quarter. The dealer believes it is a recipe collection with some personal "
        "notes. He is not wrong, exactly. He wants market value for what he thinks it is.",
        "PKR",
        "You pay the recipe price without comment. Outside, you open the notebook to the "
        "siege pages. Erotimus's mark is on every case entry. You receive the Case Notebook "
        "of Erotimus.",
        "You overpay slightly, or he notices your attention and raises his price slightly. "
        "You leave with the notebook but spent more than you needed to.",
        "WIS", 12, checkPassFlag="jrs_09_act1")

    quest("jrs_09_act2", "The Assistant's Memory",
        "Near the Jerusalem outskirts, the physician's assistant is still in the region — "
        "he stayed after the campaign as a field surgeon for the garrison. He was in "
        "Godfrey's tent when the arrow came out. He is the second witness. He has never "
        "written down what he saw. He is not resistant to speaking. He is cautious about "
        "what he says in public. He will talk if you can give him a place to be heard "
        "that is not the open road.",
        "OLN",
        "He tells you exactly what his hands did: he tried the instrument twice, tried his "
        "fingers twice, felt the arrowhead shift and then leave on its own without any "
        "motion he produced. He describes the bleeding stopping as though a hand — not his "
        "hand — had pressed the wound from inside. You write it on the notebook's inside "
        "cover as he speaks. He checks what you wrote and nods.",
        "He gives you a short, careful description that omits the critical moment. 'I was "
        "present,' he says. 'The Duke recovered.' You have his presence, not his testimony.",
        "CHA", 13, checkPassFlag="jrs_09_act2", activateCond="jrs_09_act1")

    quest("jrs_09_act3", "The Relics Office",
        "Inside Jerusalem, the newly established Christian administrative office includes a "
        "relics and miracles registry — a clerk whose function is to evaluate reported "
        "miraculous events and assign them to the appropriate devotional category. He has "
        "heard of the incident with Godfrey's wound. He wants the notebook. Not to archive "
        "it. To transfer it to the relics registry, where it will be classified as "
        "testimonial evidence of a battlefield miracle, associated with the campaign's "
        "religious mandate. Once the notebook enters the relics registry, its clinical "
        "character will be subsumed into devotional use.",
        "JAR",
        "He accepts the jurisdictional argument, visibly unhappy about it. 'If you change "
        "your mind,' he says, 'the registry would welcome it.' You keep the notebook.",
        "The clerk is persuasive and patient. He files a request for the notebook with the "
        "senior administrator. You leave before the request is acted on, but there is now "
        "a pending claim on the document.",
        "INT", 13, checkPassFlag="jrs_09_act3", activateCond="jrs_09_act2")

    quest("jrs_09_act4", "The Flooded Road",
        "The road north along the coast toward Venice, where the notebook will be entrusted "
        "to a Venetian medical archive before final transfer to Weimar, passes a river mouth "
        "that has been flooding with spring tides for a week. The ford is passable on foot "
        "at low tide — a two-hour window, twice daily — but the soft mud on both banks makes "
        "footing treacherous and the notebook must be kept dry.",
        "VEN",
        "You enter at a slight angle, feel the current's push, adjust your weight forward, "
        "and step out clean on the far bank. The notebook is dry. You continue north without "
        "stopping.",
        "Your footing breaks at the far bank. You go to one knee, catch yourself, keep the "
        "pouch out of the water. You are muddy and shaken but the notebook is dry. You reach "
        "the far side breathing hard.",
        "STR", 14, checkPassFlag="jrs_09_act4", activateCond="jrs_09_act3")

    delivery("jrs_09_act5", "The Archive — The Physician's Account",
        "Sweelinck reads the notebook from the beginning. He reads the siege pages twice. "
        "He reads the assistant's testimony on the inside cover. He sets the notebook down. "
        "'A physician's account of what his hands did and did not do,' he says. 'This is "
        "not a miracle account. This is a clinical record that contains an event the "
        "physician could not explain with his clinical vocabulary.'",
        "NUE",
        "You find the Po reference in the early pages. You find the technique notation. "
        "Sweelinck reads both, nods, and writes: 'Physician identity confirmed by internal "
        "evidence and witness statement.' He creates the archive category: Medical Records "
        "— The Clinical Account That Contains What the Physician's Vocabulary Could Not "
        "Name, First Entry. He files the notebook. He does not pray over it. You receive "
        "the Archive Receipt.",
        "You cannot find the internal confirmation quickly enough. Sweelinck marks the "
        "provenance note 'physician identity probable, not confirmed.' The notebook is "
        "filed, but with an open question.",
        checkPassFlag="jrs_09_act5", activateCond="jrs_09_act4")

    # ── Cycle 10: The Siege Engineer's Account ────────────────────────────────
    print("\n-- Cycle 10: The Siege Engineer's Account --")
    quest("jrs_10_act1", "The Engineer's Guild",
        "The siege engineer survived the campaign and returned to his guild post in Antioch. "
        "He is a precise man who filed his field reports carefully and kept copies. The copy "
        "of the forest report is in his guild archive in Antioch; the original was submitted "
        "to Godfrey's field headquarters and has not been seen since. The engineer is willing "
        "to provide the copy but needs the guild master's sign-off, which requires a formal "
        "request stating the intended use.",
        "SGA",
        "The guild master approves the release that afternoon. No notation is added. The "
        "copy is handed to you as a professional field document without qualification.",
        "The guild master approves after a one-day delay and a written statement that the "
        "guild does not endorse supernatural interpretation of the observations. This "
        "notation is added to the copy.",
        "CHA", 12, checkPassFlag="jrs_10_act1")

    quest("jrs_10_act2", "Alcasto's Statement",
        "Alcasto — the fearless Swiss captain who was the boldest man to attempt the forest "
        "and the only one who reached the fire-wall before retreating — is in Damascus on a "
        "mercenary contract. He fled the campaign in shame after his retreat and has been "
        "working in Syria. He will not give testimony willingly. He is not afraid of you. "
        "He is ashamed of what happened, and shame makes him hostile to anyone who reminds "
        "him of it.",
        "DAM",
        "He reads the engineer's language — 'no physical obstacles or military preparation "
        "that would account for the rout' — and goes quiet for a moment. 'That's accurate,' "
        "he says. He adds four sentences to the report's margin in his own hand: what he "
        "heard, what he saw at the fire-wall, how long he stood there before he ran. He "
        "does not sign it. He dates it and marks it with his company seal.",
        "He won't sign anything. He says, 'I don't need a piece of paper to tell me I'm "
        "not a coward.' He leaves before you finish. You have the report without his "
        "corroboration.",
        "WIS", 13, checkPassFlag="jrs_10_act2", activateCond="jrs_10_act1")

    quest("jrs_10_act3", "The Ismen Problem",
        "In Jerusalem, the newly installed Christian administration includes an ecclesiastical "
        "inquiry office processing claims related to the campaign's supernatural events. The "
        "minster in charge has heard of the forest incident and has a competing account: a "
        "captured Pagan soldier's confession that Ismen the sorcerer performed the "
        "enchantment. The minster wants to file this confession alongside the engineer's "
        "report, which would categorize the document as evidence of enemy sorcery rather "
        "than an engineer's report of inexplicable phenomenon.",
        "JAR",
        "The minster accepts the cross-reference argument. He files the confession in his "
        "own archive, notes the engineer's report reference on its cover, and writes the "
        "reference number on the engineer's report in return. Both documents remain in their "
        "proper archives; both point to the other. The engineer's report retains its civil "
        "character.",
        "The minster files them together. A note on the engineer's report now reads 'see "
        "also: enemy sorcery, Ismen enchantment, Book XII inquiry.' The document is "
        "accessible but framed.",
        "INT", 13, checkPassFlag="jrs_10_act3", activateCond="jrs_10_act2")

    quest("jrs_10_act4", "The Mountain Road",
        "The road north through Anatolia toward Constantinople passes a mountain section "
        "that has been hit by late-season rockfall. The alternate route climbs higher and "
        "crosses a narrow ridge where the wind is strong enough to make footing difficult "
        "for anyone carrying gear — or, in this case, a document folder. The vellum is "
        "water-resistant but not windproof. The outer sheet is charcoal sketches. Charcoal "
        "smears in damp wind.",
        "CON",
        "You feel the first gust start and lower your center of gravity before it arrives. "
        "You read the next three the same way. You cross the ridge in eleven minutes without "
        "losing your footing or your grip on the folder.",
        "A gust catches you at the path's narrowest point. You go to one knee, the folder "
        "stays sealed, but your knee is cut on the scree and you lose five minutes. You "
        "reach the far side of the ridge intact.",
        "DEX", 13, checkPassFlag="jrs_10_act4", activateCond="jrs_10_act3")

    delivery("jrs_10_act5", "The Archive — The Siege Engineer's Account",
        "Sweelinck reads the report, including Alcasto's margin annotations. He reads the "
        "engineer's final sentence twice: 'I cannot account for this by the principles of "
        "my science. I report it as I observed it.' 'This is the document I would most "
        "want in the archive,' he says, 'and the hardest to file correctly.' The problem "
        "is that the archive's engineering section files siege reports under successful "
        "operations and failed operations. This report describes an operation that failed "
        "for reasons outside the engineer's science.",
        "NUE",
        "You give him the phrase: Engineering Reports — Operation Halted at the Limit of "
        "the Science, Cause Outside Professional Domain, First Entry. Sweelinck writes it "
        "slowly, reads it back, nods. 'That's what he said,' he agrees. He files the report, "
        "adds Alcasto's annotations to the provenance note, and marks the cross-reference "
        "to the Ismen confession in Jerusalem. 'Both documents are right,' he says. 'They "
        "describe the same event from different positions. The archive needs both.' You "
        "receive the Archive Receipt.",
        "Sweelinck files the report in a miscellaneous engineering supplement with a note: "
        "'Cause of failure: undetermined.' The document is preserved but the engineer's "
        "precision is lost in the filing.",
        checkPassFlag="jrs_10_act5", activateCond="jrs_10_act4")

    # ── Cycle 11: The Preaching Record (questComplete) ────────────────────────
    print("\n-- Cycle 11: The Preaching Record --")
    quest("jrs_11_act1", "The Chaplain's Case",
        "The chaplain who took the notes is still alive, now old and posted to a small "
        "monastery near Jerusalem. He kept the wax tablet in a leather case under his bed "
        "for two years after the sermon, unable to transcribe it and unable to destroy it. "
        "He has never shown it to anyone. He took the notes for himself — not for the "
        "archive — and he is not certain anyone should have them.",
        "OLN",
        "His hands relax on the case. 'The gaps must stay gaps,' he says. 'What I didn't "
        "catch, I didn't catch. That is also the truth of what happened.' He opens the case "
        "and hands you the tablet. He does not watch you take it. You receive the Wax "
        "Tablet of Peter's Sermon.",
        "He keeps the tablet another day before handing it over. When he does, he asks you "
        "to promise to keep it as it is. You can promise that but cannot confirm it "
        "formally. He is not satisfied but he gives it to you anyway.",
        "CHA", 13, checkPassFlag="jrs_11_act1")

    quest("jrs_11_act2", "The Shorthand Reader",
        "In Jerusalem, a notary who worked in the campaign's administrative corps reads "
        "the ecclesiastical shorthand of the period. He is one of perhaps twenty people "
        "alive who can read this specific abbreviation system without guessing. You need "
        "a partial transcription — not for the archive's filing copy, but so the archivist "
        "can write an accurate description of what the tablet contains. The notary is "
        "available but his first reading will be quick — he will transcribe what he can "
        "read clearly and skip the gaps.",
        "JAR",
        "You explain that this is not a legal transcript — it is a description for an "
        "archive that needs to know the shape of the original, including its silences. He "
        "considers this, nods, and marks each gap with a bracket notation: [unclear — 3 "
        "words approx] or [extended passage — duration unknown]. The transcript now has a "
        "true shape.",
        "He gives you clean text with gaps unmarked. You have a transcript of what Peter "
        "said where the chaplain caught it clearly. The gaps are not recorded.",
        "WIS", 12, checkPassFlag="jrs_11_act2", activateCond="jrs_11_act1")

    quest("jrs_11_act3", "The Witness Who Was There",
        "In Acre, a former sergeant who was in the front rank of the assembled army when "
        "Peter preached is working as a harbor guard. He was twenty feet from Peter — "
        "closer than the chaplain. He remembers specific phrases. He is not literate. He "
        "has never told anyone what he remembers because no one asked. He will talk. The "
        "question is whether what he remembers can be added to the document as testimony "
        "without overwriting the chaplain's gaps.",
        "PKR",
        "You write his testimony on a separate sheet, mark it 'Witness account — sergeant, "
        "unnamed, front rank, 20 feet from the preacher,' with the date and your attestation. "
        "The tablet is the tablet. The testimony is the testimony. They will be filed "
        "together but they will be clearly distinct.",
        "You write his memory on the back of the transcript. This is imprecise — the "
        "transcript and the testimony are now on the same sheet, which blurs their different "
        "status. The archive will have to sort this out.",
        "INT", 13, checkPassFlag="jrs_11_act3", activateCond="jrs_11_act2")

    quest("jrs_11_act4", "The Heat and the Wax",
        "The road south of Damascus crosses a plateau that is notoriously hot in the "
        "afternoon — the kind of heat that does not declare itself but simply accumulates. "
        "The wax tablet in the leather case will begin to soften at sustained temperatures "
        "above what the late-afternoon plateau routinely achieves. A soft wax tablet in a "
        "leather case that is pressed against a warm body or left in direct sun will blur. "
        "Some of the shorthand is fine-stroked and will lose its form before heavy strokes.",
        "DAM",
        "You shift the case to the shaded side, fold your cloak over it, and slow your "
        "pace to reduce body heat. You reach the caravan stop in good time. The tablet is "
        "unchanged. You check every character in the fine-stroke sections before continuing.",
        "Three fine-stroke characters in the tablet's middle section soften slightly. When "
        "you check them at the caravan stop, you can still read two. The third is uncertain. "
        "You mark it in the transcript.",
        "WIS", 12, checkPassFlag="jrs_11_act4", activateCond="jrs_11_act3")

    delivery("jrs_11_act5", "The Archive — The Preaching Record",
        "Sweelinck reads the transcript, including the gap notations. He reads the sergeant's "
        "testimony. He reads the chaplain's note at the top of the tablet. He is quiet for "
        "a long time. 'This is the hardest thing to file,' he says at last. 'Not because "
        "the document is damaged. Because the document is honest. It shows what was caught "
        "and what was not caught, and both are true. The archive's instinct is to complete "
        "things. This one should not be completed.'",
        "NUE",
        "Sweelinck listens. He writes slowly: Sermon Record — Primary Document (wax tablet, "
        "chaplain's shorthand, gaps marked) and Secondary Document (witness testimony, "
        "front-rank sergeant) cross-referenced. The gap between them is evidence. Neither "
        "document completes the other. Both are filed whole. He creates the category: "
        "Preaching Records — The Sermon That Could Not Be Written Fast Enough, First Entry. "
        "He marks both with the same reference number and a note: See the other. He does "
        "not close the file. 'In case more witnesses come,' he says. You receive the Archive "
        "Receipt — JRS Complete.",
        "Sweelinck files them as a unit. The distinction between what was written in the "
        "moment and what was remembered after the fact is flattened. The archive is less "
        "honest than the chaplain was.",
        checkPassFlag="jrs_11_act5", activateCond="jrs_11_act4", questComplete=True)

    print("\n=== JRS extra cycles complete ===")
    say("JRS cycles 8 through 11 deployed. 20 acts. Jerusalem Delivered Pass 4 extra "
        "cycles complete. Weimar Archive. Archivus Sweelinck. "
        "The Desertion Record, The Physician's Account, "
        "The Siege Engineer's Account, The Preaching Record. Quest complete.")

    print("\n-- Audit --")
    audit = api("get", "/api/audit")
    errors = audit.get("errors", [])
    print(f"  {len(errors)} errors" if errors else "  0 errors")
    for e in errors[:5]:
        print(f"    {e}")

    api("post", "/api/save", json={})
    print("  Saved.")

if __name__ == "__main__":
    main()
