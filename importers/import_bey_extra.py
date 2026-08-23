#!/usr/bin/env python3
# SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson and Claude
# ═══════════════════════════════════════════════════════════════════════════
# ⚠️  ARCHAIC — OUT OF DATE.  Historical one-shot importer (POSTs to the
#     localhost:1367 WBAPI).  Content was long ago imported and lives in
#     roll2hit-v3.html.  This script likely NO LONGER RUNS against the current
#     server/schema.  Kept for reference only — do not run without review.
#     Import history: BACKLOG.md / plan-archive.md / 1367-sources/.
# ═══════════════════════════════════════════════════════════════════════════
"""§PASS4-EXTRA-BEY: Mandeville's Travels cycles 14–16 (Pass 4 extra cycles)"""

import requests, subprocess

BASE = "http://localhost:1367"
NPC  = "archivus_sweelinck"
BOOK = "BEY"

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
    say("BEY pass 4 extra cycles. Mandeville's Travels. Cycles 14 through 16. "
        "The Balm Test, The Great Khan's Seal Formula, The Skull Cup of Rybothe.")

    # ── Cycle 14: The Balm Test ────────────────────────────────────────────────
    print("\n-- Cycle 14: The Balm Test --")
    quest("bey_14_act1", "The Apothecary's Shelf",
        "The back room of Yusuf al-Rashid's apothecary in Cairo, late afternoon. Yusuf "
        "is an old man surrounded by labeled jars. He has spent forty years as the most "
        "trusted balm-authenticator between Alexandria and Aleppo, and he is dying. His "
        "nephew will inherit the shop but not the knowledge. He holds up his proving vial "
        "— the reference specimen he has used to calibrate every test — and tells you it "
        "needs to go somewhere it will not be lost, stolen, or misused. There is a Genoese "
        "merchant in the next room who has already offered twice what it is worth and "
        "been refused twice.",
        "KHR",
        "Yusuf nods slowly. 'The merchant wants to sell it. You want to use it to teach.' "
        "He gives you the proving vial. You receive The Balm Proving Vial.",
        "Yusuf gives the vial to the Genoese merchant. You learn the test procedures "
        "from Yusuf's notes but leave without the specimen.",
        "WIS", 12, checkPassFlag="bey_14_act1")

    quest("bey_14_act2", "The Merchant's Challenge",
        "The harbor at Alexandria. A Venetian factor named Ser Giacomo intercepts you at "
        "the quay. He represents a consortium of Levantine spice merchants who have been "
        "defrauded by false balm for twenty years. He does not want the vial for profit "
        "— he wants to use it to expose a specific Damascene supplier. His method is "
        "wrong: he wants to run a single public test on the docks that will destroy half "
        "the specimen.",
        "ALE",
        "Ser Giacomo stares at you. Then: 'All right. But the archive must be accessible "
        "to commercial agents.' You agree. He lets you pass. The vial is intact.",
        "Ser Giacomo runs his dock test on a portion of the vial's contents, removing a "
        "third of the specimen. The vial still functions but is diminished.",
        "CHA", 13, checkPassFlag="bey_14_act2", activateCond="bey_14_act1")

    quest("bey_14_act3", "The Hermit's Counter-Claim",
        "Outside Jerusalem, in a hermitage near the Church of the Holy Sepulchre. A "
        "Franciscan brother named Fra Domenico has heard of the proving vial and is "
        "waiting for you. He believes the balm of Matarea is sacred — grown from the "
        "wells Our Lord made with his foot, harvested from the field where the Holy "
        "Family rested. He is not aggressive, but he is entirely serious: this specimen "
        "belongs in a church treasury, not a lay archive.",
        "JER",
        "Fra Domenico is quiet for a long time. 'The archive will record that it is holy "
        "ground?' You say yes. 'Then it goes with you.' He makes the sign of the cross "
        "over the vial.",
        "Fra Domenico's friends delay your departure by two days. You leave without "
        "incident but arrive late at the next port.",
        "INT", 12, checkPassFlag="bey_14_act3", activateCond="bey_14_act2")

    quest("bey_14_act4", "The Valley Ambush",
        "The road to Famagusta, through the hills inland from the coast. Bedouin raiders "
        "— three men who have followed you from the Acre waystation — overtake you at a "
        "narrow pass. They are not after the vial specifically; they saw the pack and the "
        "Venetian escort and assumed merchants. The Fighter moves to your left. The vial "
        "is in the inner pack, not the outer. Keep the outer pack between yourself and "
        "the raiders while the Fighter holds the pass.",
        "FAM",
        "The Fighter's position holds. You press the pack against the rock wall. When "
        "the raiders break and run, everything is intact. The Fighter says nothing. The "
        "Fighter never says anything.",
        "The pack is seized and torn open before the Fighter drives them back. The outer "
        "items are scattered. The vial is intact but you lose Yusuf's written notes.",
        "STR", 14, checkPassFlag="bey_14_act4", activateCond="bey_14_act3")

    delivery("bey_14_act5", "The Archive — The Balm Test",
        "Weimar archive, Archivus Sweelinck. He receives the proving vial and reads "
        "Yusuf's notes with the attention of a man who has received forty years of "
        "documents and knows immediately which ones matter. He uncorks the vial, passes "
        "it under his nose once, re-seals it. Then he looks at the four test procedures. "
        "'This is a working instrument,' he says. 'Not a relic and not a curiosity.' He "
        "pauses. 'Classification matters here. If it goes in the relic section it will "
        "be reverenced and never used. If it goes in the material evidence section it "
        "can be tested against, but then every merchant who passes through will want a "
        "portion.' He looks at you.",
        "NUE",
        "Sweelinck writes: Material Evidence — Calibration Standard: balm of Matarea, "
        "single proving specimen; sacred provenance noted; test procedures companion-"
        "filed; access by appointment to qualified commercial agents and physicians; "
        "not to be subdivided. He looks up. 'Yusuf al-Rashid.' He writes the name "
        "carefully. 'The archive will remember who kept it.' You receive the Balm "
        "Standard Archive Record.",
        "Filed under Devotional Materials — Eastern Relics. The test procedures are "
        "shelved separately and the connection is not made.",
        checkPassFlag="bey_14_act5", activateCond="bey_14_act4")

    # ── Cycle 15: The Great Khan's Seal Formula ────────────────────────────────
    print("\n-- Cycle 15: The Great Khan's Seal Formula --")
    quest("bey_15_act1", "The Merchant's Cedar Chest",
        "A Genoese factor's warehouse in Constantinople, near the Galata shore. "
        "Bartolomeo di Negroni is seventy years old, sharp-eyed, and does not give "
        "things away. He has kept the transcription in a cedar chest for twenty years "
        "because he was afraid of it — a document that copies a ruling emperor's seal "
        "formula can get a man killed in several jurisdictions. He is willing to sell "
        "or give it away now, because he is old and his son does not speak Latin and "
        "does not understand what the document is.",
        "CON",
        "Bartolomeo is quiet for a long time. Then: 'I never told anyone what I copied. "
        "Twenty years.' He opens the cedar chest. The vellum sheet is folded inside an "
        "account book, page torn out clean. 'Tell them it smells of camphor. That is how "
        "they will know it is mine.' You receive The Khan's Seal Transcription.",
        "Bartolomeo sells it to a Venetian diplomatic agent for twelve ducats. You see "
        "it change hands on the Galata quay.",
        "CHA", 13, checkPassFlag="bey_15_act1")

    quest("bey_15_act2", "The Byzantine Clerk's Objection",
        "The imperial chancery district of Constantinople, the same afternoon. A Byzantine "
        "administrative clerk named Konstantinos Palaiologos has learned, through the "
        "Galata factor network, that someone is carrying a document containing the Khan's "
        "seal formula. He represents a minor imperial bureau that maintains records of "
        "foreign sovereign claims. His position: any document claiming Omnium hominum "
        "imperatoris — emperor of all the people of the earth — is a potential insult to "
        "the Byzantine Emperor and should be reviewed before leaving Byzantine territory.",
        "CON",
        "Konstantinos considers the distinction between historical transcription and "
        "present diplomatic assertion. He lets you pass. 'The Khan is dead anyway,' he "
        "says. 'All his seal claims with him.' You continue toward the harbor.",
        "Konstantinos requires a two-day review and writes a notation on the document's "
        "wrapper that it has been reviewed by the imperial chancery. The notation is "
        "accurate but slightly compromises the document's status as a private scholarly "
        "item.",
        "INT", 12, checkPassFlag="bey_15_act2", activateCond="bey_15_act1")

    quest("bey_15_act3", "The Franciscan's Alarm",
        "The Franciscan house at Ragusa. A friar named Fra Bonaventura has read "
        "Mandeville's chapter on the Great Khan — Mango Khan was baptized, Cobyla Khan "
        "was Christian, and then the line lapsed. He is troubled by the formula Deus in "
        "coelo — God in heaven, the Khan on earth, his strength. This is close to "
        "Christian formulation, very close. He wants to know if Bartolomeo's transcription "
        "confirms or alters the text Mandeville gives. He is asking in good faith but the "
        "implication worries him: if the Great Khan's seal invokes the Christian God, is "
        "the Khan's paganism a lapse from a nominally Christian empire?",
        "DBV",
        "Fra Bonaventura rubs his tonsure. 'Nestorian vocabulary in a Mongol seal.' He "
        "nods slowly. 'That is not the same as Christian profession.' He lets the matter "
        "go. 'Tell the archive: the formula requires a theological note.'",
        "Fra Bonaventura writes a letter to his provincial superior about the document "
        "and asks you to wait two days. The letter goes; you depart before the reply "
        "comes.",
        "INT", 12, checkPassFlag="bey_15_act3", activateCond="bey_15_act2")

    quest("bey_15_act4", "The Storm at Ancona",
        "At sea between Ragusa and Ancona, a three-day crossing turned violent on the "
        "second night. The storm is not hostile — it is simply weather — but the ship is "
        "taking water and the captain has ordered all heavy cargo to the deck for "
        "jettisoning if needed. The pack containing the Khan's Seal Transcription is not "
        "heavy. But it is in the same dry-storage chest as the copper ballast ingots, and "
        "the sailors are not reading the labels.",
        "DBV",
        "You get the pack clear of the hold before the sailors reach the chest. The copper "
        "ingots go overboard. The document is dry. The Fighter holds the mast and watches. "
        "The storm passes by dawn.",
        "The chest takes water when a wave breaks over the rail. The Khan's Seal "
        "Transcription survives but the ink runs slightly on one corner. Sweelinck will "
        "note the water damage on intake.",
        "STR", 13, checkPassFlag="bey_15_act4", activateCond="bey_15_act3")

    delivery("bey_15_act5", "The Archive — The Great Khan's Seal Formula",
        "Weimar archive, Sweelinck's intake desk. He reads the Khan's Seal Transcription "
        "alongside the Sultan's Commission, which he retrieves from the cedar section. "
        "Two great seals. One claims: In the name of God, the Compassionate, the Merciful "
        "— the Sultan's authority by divine right. The other: Deus in coelo, Chan super "
        "terram, ejus fortitudo — God in heaven, the Khan on earth, his strength; seal "
        "of the emperor of all the people of the world. Sweelinck looks up. 'No one has "
        "filed these together before.'",
        "NUE",
        "Sweelinck writes: Comparative Sovereignty Records — Claims of Universal "
        "Authority: two instruments invoking divine sanction for total earthly power; "
        "the Sultan's Commission under the great seal of Egypt and the transcription of "
        "the Great Khan's seal formula of Cathay; neither Christian; both invoking God "
        "by name; both claiming universal obedience; filed together as the only such "
        "pair in this archive. He pauses. 'Bartolomeo di Negroni. Genoa, 1348. Copied "
        "from memory at Trebizond.' He closes the ledger.",
        "Filed separately — Sultan's Commission in Islamic Administrative Records, "
        "Khan's Seal in Cathay — Eastern Empires. No cross-reference. The comparative "
        "claim is lost.",
        checkPassFlag="bey_15_act5", activateCond="bey_15_act4")

    # ── Cycle 16: The Skull Cup of Rybothe (questComplete) ────────────────────
    print("\n-- Cycle 16: The Skull Cup of Rybothe --")
    quest("bey_16_act1", "The Estate Inventory",
        "A Ragusan notary's office, late November. The estate of Nikola Držić is being "
        "probated. The skull cup appears in the inventory as 'one cup, carved bone, "
        "silver mount, foreign make' — assessed at four ducats. His heirs want to sell "
        "it at the estate auction in three days. You have examined it and recognized the "
        "brain-pan shape and lacquer treatment from Mandeville's description of the "
        "Rybothe custom. No one else in the room knows what it is.",
        "DBV",
        "The notary studies you. 'Foreign make.' He looks at the cup again. 'Carved "
        "bone.' He agrees to a sealed pre-auction evaluation. The heirs accept six "
        "ducats — more than auction estimate. You receive The Skull Cup of Rybothe.",
        "The notary schedules the auction as planned. At auction, a Venetian curiosity "
        "dealer outbids you. The cup leaves Ragusa in a crate of oddities.",
        "INT", 12, checkPassFlag="bey_16_act1")

    quest("bey_16_act2", "The Physician's Question",
        "The port physician's office, Ragusa. Dr. Marin Lukarević has heard that you "
        "acquired the cup and has requested an examination — not for quarantine purposes, "
        "but because he studies materials from the Eastern trade and wants to know if the "
        "lacquer treatment is the same as the preservation lacquer described in Cathay "
        "trade accounts. He is genuinely curious and professionally competent. But his "
        "examination would require him to handle the cup at length, and his methods "
        "involve scraping a small sample of the lacquer.",
        "DBV",
        "Dr. Lukarević examines the cup visually and makes notes. 'Cathay borderlands, "
        "certainly. The lacquer formula is consistent with accounts from the Trebizond "
        "traders.' He hands it back without sampling. 'Tell the archive I would like a "
        "copy of its provenance notes when they are written.'",
        "Dr. Lukarević takes a small lacquer scraping before you can stop him. The cup "
        "is intact but the funerary treatment is technically compromised.",
        "WIS", 12, checkPassFlag="bey_16_act2", activateCond="bey_16_act1")

    quest("bey_16_act3", "Dorje's Daughter",
        "Constantinople, a Ragusan trading house near the Galata shore. A woman named "
        "Fatima, daughter of a Trebizond silk merchant, recognizes the cup when you show "
        "it to a trader acquaintance. She is the granddaughter of a Ragusan merchant who "
        "bought goods from Dorje in 1355 — she has a family letter that names Dorje and "
        "describes the cup. She is not claiming ownership. She is crying quietly, which "
        "she tries to conceal, because she remembers her grandmother describing Dorje's "
        "grief when he spoke of his father and the cup.",
        "CON",
        "Fatima takes the family letter from her belt purse and gives it to you. 'My "
        "grandmother kept it because she said Dorje had no one to remember his father "
        "for him when he died away from home.' She does not look at the cup again. "
        "'Tell them his father's name was Tenzin.' You receive Fatima's Family Letter.",
        "Fatima nods and does not give you the family letter. She says she will keep it.",
        "CHA", 12, checkPassFlag="bey_16_act3", activateCond="bey_16_act2")

    quest("bey_16_act4", "The Overland Crossing",
        "The road between Frankfurt and Erfurt, midwinter, two days from Weimar. A "
        "company of men-at-arms in the livery of a minor count has been following your "
        "party since the Thuringian gate. They are not bandits — they have a writ, "
        "apparently from a Cologne collector who believes the cup is a stolen relic from "
        "an Eastern monastery. The writ is false but it is a real writ with a real seal. "
        "They intend to take the pack. The Fighter engages the lead man-at-arms.",
        "KOL",
        "The Fighter breaks their formation at the first contact. You move left, up the "
        "bank, past the ditch. When two of the men-at-arms turn back to deal with the "
        "Fighter, you are already past them. They do not follow into the treeline. The "
        "cup is intact. Fatima's letter is intact.",
        "The men-at-arms detain you for six hours before the writ's provenance falls "
        "apart under questioning. The cup is examined and returned. Fatima's Family "
        "Letter is slightly crumpled.",
        "STR", 14, checkPassFlag="bey_16_act4", activateCond="bey_16_act3")

    delivery("bey_16_act5", "The Archive — The Skull Cup of Rybothe",
        "Weimar archive, Archivus Sweelinck. He receives the skull cup. He holds it "
        "for a long time, turning it over. He reads Fatima's Family Letter. He reads the "
        "provenance notes. He sets it on the desk carefully. 'The archive has received "
        "administrative instruments. It has received calibration tools. It has received "
        "documents of sovereignty.' He pauses. 'This is a memorial.' He looks at you. "
        "'The question is whether a memorial belongs in an archive. The question is "
        "whether what belongs in an archive is only what has institutional significance, "
        "or whether the archive can hold what is simply irreplaceable.'",
        "NUE",
        "Sweelinck is quiet for a long time. Then he writes: Memorial Object with "
        "Documentary Provenance: skull cup of Rybothe, fashioned by Dorje, son of "
        "Tenzin, c. 1340, in the tradition described by Mandeville in Chapter XXXIV; "
        "provenance chain complete from maker to archive through five hands across thirty "
        "years; filed not as curiosity but as primary memorial evidence of a specific "
        "human practice at the edge of the documented world; Dorje had no archive; this "
        "archive holds what he could not. He looks up. 'The archive can hold what is "
        "irreplaceable.' He closes the ledger. It is the last entry of the year. You "
        "receive the Rybothe Memorial Archive Record — BEY Complete.",
        "Filed under Eastern Curiosities — Funerary Objects. The provenance chain is "
        "recorded but the memorial context is not.",
        checkPassFlag="bey_16_act5", activateCond="bey_16_act4", questComplete=True)

    print("\n=== BEY extra cycles complete ===")
    say("BEY cycles 14 through 16 deployed. 15 acts. Mandeville's Travels Pass 4 extra "
        "cycles complete. Weimar Archive. Archivus Sweelinck. "
        "The Balm Test, The Great Khan's Seal Formula, The Skull Cup of Rybothe. "
        "Quest complete.")

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
