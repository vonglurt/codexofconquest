#!/usr/bin/env python3
# SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
# ═══════════════════════════════════════════════════════════════════════════
# ⚠️  ARCHAIC — OUT OF DATE.  Historical one-shot importer (POSTs to the
#     localhost:1367 WBAPI).  Content was long ago imported and lives in
#     play.html.  This script likely NO LONGER RUNS against the current
#     server/schema.  Kept for reference only — do not run without review.
#     Import history: BACKLOG.md / plan-archive.md / 1367-sources/.
# ═══════════════════════════════════════════════════════════════════════════
"""§IMPORT-99 OST: La Chanson de Roland (Anon, c.1100 AD) — 35 acts, 7 cycles"""

import requests, subprocess

BASE = "http://localhost:1367"

def api(method, path, **kwargs):
    r = getattr(requests, method)(BASE + path, **kwargs)
    r.raise_for_status()
    return r.json()

def say(msg):
    subprocess.run(["./say.sh", msg], capture_output=True)

def create_node(code, name, label, act, r, c, desc):
    check = requests.get(BASE + f"/api/node/{code}")
    if check.status_code == 200:
        print(f"  NODE (exists): {code} — {label}")
        return check.json()
    result = api("post", "/api/node", json={
        "code": code, "name": name, "label": label,
        "act": act, "r": r, "c": c, "desc": desc,
    })
    print(f"  NODE: {code} — {label}")
    return result

def quest(id, title, desc, activateNode, passText, failText, checkStat, checkDC,
          checkPassFlag=None, activateCond=None,
          activateMissionBit=None, questComplete=False,
          monster=None, monsterHP=None, monsterAC=None,
          grantItem=None, takeItem=None):
    check = requests.get(BASE + f"/api/quest/{id}")
    if check.status_code == 200:
        print(f"  SKIP (exists): {id}")
        return
    nonce_r = api("post", "/api/nonce", json={"type": "quest", "id": id})
    nonce = nonce_r["nonce"]
    quest_type = "combat" if monster and not checkStat else "skill_check"
    payload = {
        "id": id, "type": quest_type, "title": title, "desc": desc,
        "activateNode": activateNode,
        "passText": passText, "failText": failText,
        "checkStat": checkStat, "checkDC": checkDC,
    }
    if checkPassFlag:      payload["checkPassFlag"]      = checkPassFlag
    if activateCond:       payload["activateCond"]       = activateCond
    if activateMissionBit: payload["activateMissionBit"] = activateMissionBit
    if questComplete:      payload["questComplete"]      = True
    if monster:            payload["monster"]            = monster
    if monsterHP:          payload["monsterHP"]          = monsterHP
    if monsterAC:          payload["monsterAC"]          = monsterAC
    if grantItem:          payload["grantItem"]          = grantItem
    if takeItem:           payload["takeItem"]           = takeItem
    api("post", "/api/quest", json=payload, headers={"X-Nonce": nonce})
    print(f"  OK: {id} — {title}")

def main():
    say("§IMPORT-99 OST La Chanson de Roland, anonymous, circa 1100 AD. Creating nodes Roncevaux Pass, Pyrenean High Road, Aix-la-Chapelle, Frankish Road-Town.")

    print("=== §IMPORT-99 OST: La Chanson de Roland ===")

    # --- Nodes ---
    print("\n-- Nodes --")
    create_node("RON", "highlands", "Roncevaux Pass — the burial ground",
                "act1", 110, 128,
                "A high mountain pass in the Pyrenees: cold grey rock, wind that does not stop, "
                "the smell of old blood in the shale; twenty thousand burial mounds visible from "
                "the road; the place where the sound of a horn was heard thirty miles away and "
                "was not heard soon enough.")
    create_node("PYR", "highlands", "Pyrenean High Road — the mountain road north",
                "act1", 110, 130,
                "The mountain road north from Roncevaux: exposed ridgeline, cold even in summer, "
                "a pass above treeline where anyone on the road can see anyone else from a long "
                "distance; the road that survivors took, and that pursuers know to watch.")
    create_node("AIX", "camelot", "Aix-la-Chapelle — Charlemagne's Chapel",
                "act1", 110, 132,
                "Charlemagne's palatine chapel at his capital: octagonal stone, high ceiling, "
                "the reliquary space adjacent to the altar where the great gifts are kept, "
                "the smell of incense and old wax; the institutional memory of the Frankish "
                "empire in architectural form.")
    create_node("FRS", "city", "Frankish Road-Town — the families' gathering point",
                "act1", 110, 134,
                "A Frankish lowland road-town below the Pyrenean pass: market square, an inn "
                "where families from across the realm have gathered to receive the official count "
                "of the Roncevaux dead; the place where two different lists will be read aloud "
                "before the king's messengers close the record.")

    say("Nodes created. Beginning cycle 1: The Horn of Roncevaux. Song of Roland, source La Chanson de Roland anonymous circa 1100. Node route RON PYR AIX. Token: The Olifant of Roland.")

    # --- Cycle 1: The Horn of Roncevaux ---
    print("\n-- Cycle 1: The Horn of Roncevaux --")
    quest("ost_01_act1", "The Recovery",
          "Charlemagne stands at the place where Roland's body was found — arranged facing Spain, "
          "the glove already taken, the sword and horn recovered. He gives you the olifant himself. "
          "He says: take this to the chapel at Aix. It belongs on the altar there. He does not "
          "explain why he is not carrying it himself. You understand: he is not done counting the dead.",
          "RON",
          "The crack is visible along the lower bell, like a line of dried blood. He is not giving "
          "you a symbol of pure glory. He is giving you the whole object, damage and all. You take it.",
          "You take the horn without fully reading why Charlemagne does not carry it himself. "
          "On the road you will understand: he cannot carry it yet. He is not finished with the grief.",
          "WIS", 12,
          checkPassFlag="ostC1A1Done",
          activateMissionBit="OST_questActive",
          grantItem="The Olifant of Roland — ivory war-horn, cracked at the bell from Roland's final blowing; wrapped in a dead paladin's cloak; smells faintly of blood from the pass")

    quest("ost_01_act2", "Ganelon's Kin",
          "Three men on the high road. They are Ganelon's kinsmen — two of the thirty who took "
          "the oath at the trial, who survived the executions by being absent at the wrong moment. "
          "A horn in the royal chapel at Aix is a permanent accusation in ivory. "
          "They would prefer it lost on the Pyrenean road.",
          "PYR",
          "They are down on the high road. The olifant is still in your pack. You keep moving north.",
          "They search you. Church courier, they decide — the horn passes as memorial cargo. "
          "They let you through, but their report of your passage will precede you.",
          None, None,
          checkPassFlag="ostC1A2Done",
          activateCond="() => !!S_story.ostC1A1Done",
          monster="Ganelon's Surviving Kinsmen", monsterHP=20, monsterAC=14,
          grantItem="A Frankish knight's silver cloak-brooch — engraved family device, taken from the leader of the three")

    quest("ost_01_act3", "The Lord's Hall",
          "Lord Bertrand de Ventoux received his knighthood at Roland's hand fifteen years ago. "
          "He heard the horn at Roncevaux from thirty miles away and wept. He wants the olifant. "
          "Not to suppress it — he wants to display it in his own hall, where he will describe "
          "Roland to every visitor for the rest of his life.",
          "PYR",
          "Charlemagne gave it for Aix, where it will be seen by everyone who comes to the chapel — "
          "not only the visitors to one lord's hall. His claim is real. The chapel's claim is larger. "
          "He lets you go, unhappy and honest about it.",
          "He is not satisfied. You find a side route before he formally orders you stopped. "
          "His honor prevents pursuit of a royal courier on an open road.",
          "CHA", 14,
          checkPassFlag="ostC1A3Done",
          activateCond="() => !!S_story.ostC1A2Done",
          grantItem="Bertrand's road-blessing — a small wax seal acknowledging your mission; marks you as a legitimately-traveling royal courier")

    quest("ost_01_act4", "The Cleric's Question",
          "The head cleric of the chapel has been preparing the reliquary space for two days. "
          "He has heard two versions of Roland's death: the martyr's version and the soldiers' version. "
          "He wants to know which horn he is receiving. He asks, carefully: what is the crack from?",
          "AIX",
          "You tell him the truth completely: the crack is from the blowing; Roland's temples burst; "
          "the crack is when he finally decided. The cleric thinks for a long time. "
          "He says: then it is the true relic, not a cleaned one. He opens the porch.",
          "You give him the simpler version first. He does not quite believe it. "
          "He asks again. You tell him the truth. He takes longer, but he opens the porch.",
          "CHA", 14,
          checkPassFlag="ostC1A4Done",
          activateCond="() => !!S_story.ostC1A3Done",
          grantItem="The chapel door-token — a small carved wood key-charm hung on the inner door; indicates authorized entry to the reliquary")

    quest("ost_01_act5", "The Altar",
          "The chapel is small and high and very still. The altar holds the other relics of the "
          "campaign — Charlemagne's gifts over decades. The cleric places the olifant in the prepared "
          "space. The crack is visible from the nave. He does not turn it so the crack faces inward. "
          "He leaves it facing out, toward whoever walks through the door.",
          "AIX",
          "The crack says: here is when he finally decided. The ivory says: here is how far the sound "
          "carried. Neither fact cancels the other. Anyone who comes to this altar gets both, "
          "whether they want both or not.",
          "The horn is on the altar. The mission is done. What it means in twenty years "
          "when pilgrims touch it is not something you were hired to consider.",
          "WIS", 12,
          checkPassFlag="ostC1A5Done",
          activateCond="() => !!S_story.ostC1A4Done",
          takeItem="The Olifant of Roland",
          grantItem="The chapel's pilgrim token — a small pressed-tin medallion with the Aix chapel mark; given to authenticated relic-donors; opens gates in Charlemagne's royal circuit")

    say("Cycle 1 complete. Beginning cycle 2: Turpin's Blessing List. Token: Turpin's Blessing Roll. Node route RON PYR FRS.")

    # --- Cycle 2: Turpin's Blessing List ---
    print("\n-- Cycle 2: Turpin's Blessing List --")
    quest("ost_02_act1", "The Monk's Charge",
          "The monk followed Turpin and wrote names while standing over bodies in the mountain pass. "
          "He has been sitting with the roll for two days. He cannot travel. He lays it on the table "
          "between you — rolled tight, sealed at both ends with his mark and a loop of ribbon. "
          "The official count being compiled at court will not include every name. "
          "The families need the complete list before the king's messengers arrive.",
          "RON",
          "The deadline is the arrival of the king's messengers. After that the official count is "
          "the only count. You take the roll and move immediately.",
          "You understand the task but not the stakes. You move at the pace of an administrative errand, "
          "not a deadline.",
          "WIS", 12,
          checkPassFlag="ostC2A1Done",
          grantItem="Turpin's Blessing Roll — long parchment sealed with the monastery monk's mark; every name of every man who fell at Roncevaux, in the order Archbishop Turpin blessed them")

    quest("ost_02_act2", "The Pyrenean Road Watch",
          "Two men at the road-post below the first descent. Ganelon's kin watching for documents "
          "from the pass — some names on a complete blessing list extend the conspiracy's documentation "
          "beyond the trial record. They are not looking for a blessing list specifically. "
          "They are looking for documents from the pass. A narrow sheep-track to the left "
          "bypasses the post but adds an hour.",
          "PYR",
          "The track holds. The road-post is below you on the descent. "
          "You reach the main road with no one noting your passage.",
          "They see you. They search the wallet. Church document — they let it through. "
          "But their report of your descent from the pass will precede you.",
          "DEX", 12,
          checkPassFlag="ostC2A2Done",
          activateCond="() => !!S_story.ostC2A1Done")

    quest("ost_02_act3", "The Crown's Official",
          "A crown official on a fast horse, with the official count in his courier-wallet, "
          "instructed to collect unofficial rolls before distribution. He recognizes the type: "
          "someone traveling from the direction of the pass with a document-wallet. He rides alongside. "
          "His argument: the king's count supersedes any battlefield document. "
          "He is courteous. He believes in what he is doing. He has no right to your document.",
          "PYR",
          "The church argument holds. He cannot escalate without authorization. "
          "He rides ahead to warn Arnaut that an unofficial roll is coming. Arnaut will be ready.",
          "He gets the roll. It goes into the court archive where it will be filed "
          "under ecclesiastical records and not distributed to the families.",
          "CHA", 13,
          checkPassFlag="ostC2A3Done",
          activateCond="() => !!S_story.ostC2A2Done")

    quest("ost_02_act4", "The Interceptor",
          "A hired man watching the northern road since morning. Private commission from the same "
          "general direction as Ganelon's kin. He has watched the crown official ride through "
          "and he is watching you now. He moves when you enter the square.",
          "FRS",
          "He is down in the market square. Arnaut of Troyes' inn is three streets away. "
          "You have approximately ten minutes before the commotion draws attention.",
          "He gets the wallet. The roll disappears into a Frankish storeroom somewhere. "
          "The families receive only the official count.",
          None, None,
          checkPassFlag="ostC2A4Done",
          activateCond="() => !!S_story.ostC2A3Done",
          monster="Hired Interceptor", monsterHP=24, monsterAC=13)

    quest("ost_02_act5", "The Gathering Point",
          "The common room is full of people who have come to find out whether their person's name "
          "is on the official count. The crown official's letter is on the table, unopened. "
          "Arnaut examines the monk's seal. He nods. He looks at the room: 'There are two accounts. "
          "I will read both.' He looks at you. 'Begin.' You unroll the parchment. "
          "The first three names are there — the first bodies Turpin reached.",
          "FRS",
          "Three names, clear, into the silence. Arnaut takes the roll and continues. "
          "He will read every name. The king's messengers will arrive two hours later. "
          "The families will know by then what was on both lists and what the difference means.",
          "Your voice hesitates on the third name. The hesitation breaks the room's attention. "
          "Arnaut takes the roll from you and continues himself.",
          "CON", 11,
          checkPassFlag="ostC2A5Done",
          activateCond="() => !!S_story.ostC2A4Done",
          takeItem="Turpin's Blessing Roll",
          grantItem="Arnaut's Token — a small pressed lead disc Arnaut presses into your hand; the families' mark of thanks; given without words")

    say("Cycle 2 complete. Beginning cycle 3: Ganelon's Prior Declaration. Node route AIX BK WM. Source: Song of Roland, trial record of Ganelon's declared enmity against Roland.")

    # --- Cycle 3: Ganelon's Prior Declaration ---
    print("\n-- Cycle 3: Ganelon's Prior Declaration --")
    quest("ost_03_act1", "The Court Scribe's Copy",
          "The court scribe has two copies of Ganelon's formal declaration of personal enmity "
          "against Roland — spoken before the assembled Frankish army, witnessed, authenticated. "
          "Ganelon used it at trial as the pivot of his defense. Ganelon's heirs have notified "
          "the court they intend to file an appeal on those grounds. "
          "The document must reach the archive before the appeal paperwork gives them cause to detain it.",
          "AIX",
          "The document is simultaneously a formal legal instrument and evidence of premeditation. "
          "Both things are in the same parchment. You understand why the archive wants both, not one. "
          "You take it.",
          "You understand the task. The legal distinction between the document's two functions "
          "settles on the road north.",
          "WIS", 12,
          checkPassFlag="ostC3A1Done",
          grantItem="Ganelon's Prior Declaration — authenticated court parchment: formal declaration of personal enmity against Roland, witnessed and signed by the court scribe; Ganelon's trial defense pivot")

    quest("ost_03_act2", "The Grieving Knight",
          "A knight who lost his brother at Roncevaux intercepts you on the northern road. "
          "He has been watching the court archive for a month. He wants the parchment to burn it. "
          "His argument: Ganelon used it to half-justify himself; burning it removes the half-justification. "
          "Your argument: burning it helps Ganelon's name by erasing the evidence of what the "
          "declaration was actually for.",
          "AIX",
          "The argument lands. Burning it serves Ganelon more than it serves his brother. "
          "He stands aside. He does not look satisfied; he looks correct.",
          "He is not persuaded. You find an alternate route before he escalates. "
          "His grief is genuine and it has not changed what the document is.",
          "CHA", 13,
          checkPassFlag="ostC3A2Done",
          activateCond="() => !!S_story.ostC3A1Done")

    quest("ost_03_act3", "The Legal Agent",
          "A Frankish legal agent at the Birka market wants the parchment for a proceeding "
          "on behalf of Ganelon's heirs — an appeal based on the declaration's legal standing. "
          "He believes Ganelon's kinsmen have a right to the authenticated copy. "
          "His argument has merit. The parchment is not going to the heirs.",
          "BK",
          "He is down in the market. The document wallet is intact. You keep moving east.",
          "He gets the wallet reviewed before you can clear the market square. "
          "The authentication is checked and returned — he cannot legally detain it without a writ "
          "he does not have. You lose an hour.",
          None, None,
          checkPassFlag="ostC3A3Done",
          activateCond="() => !!S_story.ostC3A2Done",
          monster="Frankish Legal Agent", monsterHP=20, monsterAC=12)

    quest("ost_03_act4", "The Road Gate",
          "A watcher at the road gate east of Birka. He has been told to watch for court documents "
          "heading east. The document-wallet looks like a merchant's letter packet. Keep it that way "
          "through the gate.",
          "BK",
          "The gate official notes your departure time and waves you through. "
          "The wallet passed as merchant correspondence.",
          "He flags the wallet for inspection. The archive seal is visible. "
          "He logs it and passes it — the seal is the exemption, but the log entry exists.",
          "DEX", 11,
          checkPassFlag="ostC3A4Done",
          activateCond="() => !!S_story.ostC3A3Done")

    quest("ost_03_act5", "Prior Declaration Records",
          "Sweelinck reads the authentication note and the declaration's text. "
          "He notes the trial's use of the document and the heirs' pending appeal. "
          "He marks the category and sets it in the archive space.",
          "WM",
          "He opens Prior Declaration Records. The declaration that was simultaneously a legal defense "
          "and a confession now sits in the archive where both functions are preserved. "
          "The appeal will find the original in archive custody, not in transit.",
          "Sweelinck receives the document. He notes the appeal proceeding. "
          "The archive will respond to the heirs' counsel in due course.",
          "WIS", 10,
          checkPassFlag="ostC3A5Done",
          activateCond="() => !!S_story.ostC3A4Done",
          takeItem="Ganelon's Prior Declaration")

    say("Cycle 3 complete. Beginning cycle 4: Aude's Ring. Node route AIX VEN WM. Source: Song of Roland, Aude's death and the betrothal ring with no dissolution.")

    # --- Cycle 4: Aude's Ring ---
    print("\n-- Cycle 4: Aude's Ring --")
    quest("ost_04_act1", "The Steward's Problem",
          "The steward has been holding it for three days. He doesn't know what to do with it. "
          "The estate lawyers want it classified before the probate closes. "
          "Aude wore it when she died in Charlemagne's hall. Roland died at Roncevaux in possession "
          "of nothing except his sword and his horn. The betrothal was dissolved by death but "
          "has no formal instrument of dissolution. The archive is the right destination — "
          "it closes what probate cannot categorize.",
          "AIX",
          "The ring is not a wedding ring and it is not a returned ring. "
          "You understand why the archive holds the category the estate cannot find. "
          "You take it before the lawyers return with a classification notice.",
          "You take the ring. The distinction between 'unclosed betrothal property' and "
          "'archive holding' settles as you leave the palace grounds.",
          "WIS", 11,
          checkPassFlag="ostC4A1Done",
          grantItem="Aude's Betrothal Ring — gold ring exchanged with Roland before the Spanish campaign; Aude wore it when she died; legally unclassified: not a wedding ring, not a returned ring; the betrothal has no formal dissolution")

    quest("ost_04_act2", "The Estate Official",
          "A Frankish estate official on the road south. He claims the ring should accompany "
          "Roland's estate papers as unclosed betrothal property — the heirs need it to close probate. "
          "His argument: the archive closes what probate cannot categorize. "
          "Your argument is the same. The destination is the same. "
          "The question is which proceeding holds it.",
          "AIX",
          "The archive closes this category; estate probate for a betrothal with no survivor "
          "and no dissolution ceremony has no mechanism. He acknowledges the distinction. "
          "You continue south.",
          "He is not satisfied by the distinction. He notes your route and continues north. "
          "You will see a second official south of the Alpine pass.",
          "CHA", 12,
          checkPassFlag="ostC4A2Done",
          activateCond="() => !!S_story.ostC4A1Done")

    quest("ost_04_act3", "The Merchant's Offer",
          "A Venetian merchant's wife in the harbor district recognizes the ring as Frankish "
          "betrothal-work. She has heard of Aude's death, which has traveled ahead of you as a story. "
          "She wants to buy it as a memorial piece — she knows exactly what it is. "
          "Her offer is genuine. The ring is not for sale.",
          "VEN",
          "You decline clearly. She receives the refusal with the seriousness it deserves. "
          "She says: I understand. She does not press further.",
          "The negotiation extends into the harbor afternoon. You leave without selling it, "
          "but the delay has been noted by someone at the harbor gate.",
          "CHA", 11,
          checkPassFlag="ostC4A3Done",
          activateCond="() => !!S_story.ostC4A2Done")

    quest("ost_04_act4", "The Alpine Search",
          "Road search outside the Alpine pass. The officer is checking for gold. "
          "The ring is in the document-wallet, wrapped in the estate classification papers. "
          "Keep it there while the search moves through the pack.",
          "VEN",
          "The wallet passes as correspondence. The ring is inside the paper fold. "
          "He marks your pack as searched and waves you through.",
          "He finds the wallet and opens it. The ring is visible. He logs it as undeclared gold. "
          "The archive exemption letter clears it, but the log exists and the delay costs you a day.",
          "DEX", 12,
          checkPassFlag="ostC4A4Done",
          activateCond="() => !!S_story.ostC4A3Done")

    quest("ost_04_act5", "Betrothal Records",
          "Sweelinck examines the ring. He notes the estate classification problem — "
          "both parties dead, no dissolution ceremony, no estate proceeding with a category "
          "for an unexecuted betrothal contract. He sets it in the archive space.",
          "WM",
          "He opens Betrothal Records. The ring that had no dissolution now has its record closed. "
          "Both parties dead, both intentions recorded, one ring. The archive holds the category "
          "the estate could not find.",
          "Sweelinck receives the ring. He notes the legal gap. The archive classification "
          "will take several days to formalize, but the ring is in custody.",
          "WIS", 10,
          checkPassFlag="ostC4A5Done",
          activateCond="() => !!S_story.ostC4A4Done",
          takeItem="Aude's Betrothal Ring")

    say("Cycle 4 complete. Beginning cycle 5: The Judicial Combat Record. Node route AIX CON WM. Source: Song of Roland, Thierry versus Pinabel, divine verdict.")

    # --- Cycle 5: The Judicial Combat Record ---
    print("\n-- Cycle 5: The Judicial Combat Record --")
    quest("ost_05_act1", "The Court Recorder's Sealed Copy",
          "The court recorder made two copies of the complete judicial combat record — "
          "every oath, every blow struck in sequence, the moment Pinabel fell, "
          "the judges' formal declaration of divine verdict. "
          "The trial archive holds one. This is the other. "
          "Ganelon's heirs have filed notice of appeal on grounds that the combat outcome "
          "is ambiguous. The record must reach Weimar before the appeal creates cause to detain it.",
          "AIX",
          "Divine verdict is not subject to technical examination. The record travels sealed. "
          "You understand the document's function in the appeal proceeding before you take it.",
          "You take the record. The distinction between 'technically ambiguous' and "
          "'divinely adjudicated' settles as you clear the court district.",
          "WIS", 12,
          checkPassFlag="ostC5A1Done",
          grantItem="Judicial Combat Record — Thierry v. Pinabel — sealed court parchment: complete record of the judicial combat, blow by blow; judges' declaration of divine verdict; the only document establishing God's ruling as Frankish legal fact")

    quest("ost_05_act2", "Ganelon's Heir's Representative",
          "A Frankish knight on the road east. He represents Ganelon's heirs. "
          "He wants to detain the record while an appeal is drafted — thirty days is all he needs. "
          "His argument: the combat was technically close; the outcome requires examination. "
          "Your argument: the judges declared divine verdict; divine verdicts are not subject "
          "to technical examination. The argument must land before he escalates.",
          "AIX",
          "Divine verdict is the judges' formal finding. Technical examination of a divinely "
          "adjudicated outcome is not a recognized proceeding. He does not have grounds. "
          "He does not escalate. You continue east.",
          "He requests a formal delay. You cite the archive transit exemption. "
          "He notes your route and lets you continue. He will file the delay request separately.",
          "CHA", 13,
          checkPassFlag="ostC5A2Done",
          activateCond="() => !!S_story.ostC5A1Done")

    quest("ost_05_act3", "The Byzantine Scholar",
          "A Byzantine legal scholar at the Constantinople harbor district wants to use the "
          "combat record as a case study in Western judicial procedure — specifically the mechanism "
          "by which divine judgment is translated into court verdict. He wants to read the original. "
          "His interest is legitimate scholarship.",
          "CON",
          "The original is sealed and travels sealed. After it arrives at the archive, "
          "a copy of the combat narrative can be arranged through the archive's copying service. "
          "He accepts this. He gives you a letter of introduction to the archive's copying clerk.",
          "He requests the record remain in Constantinople for one month while he works. "
          "You decline. He is disappointed but professionally correct about it.",
          "CHA", 12,
          checkPassFlag="ostC5A3Done",
          activateCond="() => !!S_story.ostC5A2Done")

    quest("ost_05_act4", "The Western Checkpoint",
          "A checkpoint on the road west of Constantinople. The official claims authority "
          "to inspect all court documents from Frankish jurisdictions. "
          "He has seen the seal. He knows what it is. "
          "He is giving you time to think of a reason to deny him.",
          "CON",
          "The archive seal is the exemption from inspection for documents in transit. "
          "You state it and hold. He examines the outer seal, confirms the archive mark, "
          "and waves you through.",
          "He presses the inspection claim. You hold the archive exemption clearly. "
          "He backs down, but he logs the encounter. The delay costs you half a day.",
          "CON", 11,
          checkPassFlag="ostC5A4Done",
          activateCond="() => !!S_story.ostC5A3Done")

    quest("ost_05_act5", "Divine Judgment Records",
          "Sweelinck breaks the outer seal. He reads the judges' declaration paragraph — "
          "the formal finding of divine verdict. He closes it and marks it for permanent archive. "
          "He sets it in the archive space.",
          "WM",
          "He opens Divine Judgment Records. Thierry was the smaller man. The poem says God "
          "intervened. The judges wrote it into the record. The archive holds the record, "
          "not an opinion about the mechanism.",
          "Sweelinck receives the document. He notes the heirs' appeal proceeding. "
          "The archive will be in contact with the court.",
          "WIS", 10,
          checkPassFlag="ostC5A5Done",
          activateCond="() => !!S_story.ostC5A4Done",
          takeItem="Judicial Combat Record — Thierry v. Pinabel")

    say("Cycle 5 complete. Beginning cycle 6: Durendal's Relic Inventory. Node route RON ROM WM. Source: Song of Roland, Roland names the four relics inside Durendal's hilt before hiding the sword.")

    # --- Cycle 6: Durendal's Relic Inventory ---
    print("\n-- Cycle 6: Durendal's Relic Inventory --")
    quest("ost_06_act1", "The Gauntlet Document",
          "The monk who prepared Roland's body found it folded inside the gauntlet: "
          "a scrap of oak-bark tablet in Roland's own handwriting. "
          "Tooth of Saint Peter. Blood of Saint Basil. Hair of the Virgin. "
          "Cloth of Saint Denis. Positions in the hilt noted. Roland's name at the bottom. "
          "He has been holding it for two days, uncertain whether it is a relic or a document.",
          "RON",
          "It is not a prayer. It is an inventory. Roland named the contents before hiding the sword — "
          "the correct order of operations. You take it as a document and file it as such.",
          "You take it. On the road south you settle the classification: "
          "not a relic, not a prayer. An inventory. It records what was inside an object "
          "that cannot now be opened.",
          "WIS", 12,
          checkPassFlag="ostC6A1Done",
          grantItem="Durendal's Relic Inventory — oak-bark tablet in Roland's handwriting: four relics in order, positions in the hilt noted, Roland's name below; found in his gauntlet; not a prayer; an inventory")

    quest("ost_06_act2", "The Benedictine Pilgrim",
          "A Benedictine pilgrim on the road south wants to use the inventory to locate Durendal. "
          "He has read the text already — someone showed him the monk's description. "
          "The inventory lists what is inside the hilt. It contains no information about "
          "where the sword is now. The distinction between those two things must land "
          "before he accompanies you to Rome.",
          "RON",
          "What is in the hilt is not where the hilt is. Those are two different searches. "
          "The archive holds the first. He understands, and turns back toward the monastery.",
          "He is not deterred by the distinction. He accompanies you as far as the pass descent, "
          "asking questions about the sword's weight and the direction Roland fell. "
          "He turns back at the treeline.",
          "CHA", 12,
          checkPassFlag="ostC6A2Done",
          activateCond="() => !!S_story.ostC6A1Done")

    quest("ost_06_act3", "The Church Authentication Inquiry",
          "A church official at Rome wants to open a formal authentication inquiry for all four "
          "relics named in the inventory. The inquiry would require the relics present. "
          "The sword is not present. The inventory names what was claimed at the moment of "
          "the sword's hiding. The archive holds claims, not authentication. "
          "Authentication requires the relics. The relics require finding the sword. "
          "Those are two different proceedings.",
          "ROM",
          "The archive holds claims. The inquiry requires the relics. The relics require "
          "finding the sword. He understands the sequence. He opens the door to the road north.",
          "He wants to hold the inventory pending an inquiry authorization from the "
          "relevant diocese. You cite the archive transit exemption. He lets you continue, "
          "but the inquiry authorization has been filed.",
          "WIS", 13,
          checkPassFlag="ostC6A3Done",
          activateCond="() => !!S_story.ostC6A2Done")

    quest("ost_06_act4", "The Man on the Northern Road",
          "A man on the northern road carrying what he says is a church authentication letter, "
          "wanting to attach it to the inventory before it reaches Weimar. "
          "He knows the inventory's contents in detail. He has not seen it. "
          "Read the hesitation before he gets closer.",
          "ROM",
          "The hesitation is in the third item: he names the hair of the Virgin before "
          "the blood of Saint Basil. The inventory has it the other way. "
          "He knows the inventory from a description, not from reading it. "
          "You keep moving without letting him attach anything.",
          "He is plausible enough that you allow the attachment. "
          "The letter he adds is a diocese hold-notice. You spend half a day getting it "
          "formally removed at the next waystation.",
          "WIS", 12,
          checkPassFlag="ostC6A4Done",
          activateCond="() => !!S_story.ostC6A3Done")

    quest("ost_06_act5", "Sacred Inventory Records",
          "Sweelinck reads the inventory. He notes it is Roland's handwriting — "
          "not a scribe's copy, not a monk's transcription. He reads the four names "
          "and the hilt positions. He marks it: not a relic, not a prayer.",
          "WM",
          "He opens Sacred Inventory Records. The sword is under a body somewhere in the Pyrenees. "
          "The body was moved. The sword was not found. The names are here because someone "
          "wrote them down before hiding the sword, which was the correct order of operations.",
          "Sweelinck receives the document. He notes the church inquiry proceeding from Rome. "
          "The archive will respond to the diocese in due course.",
          "WIS", 10,
          checkPassFlag="ostC6A5Done",
          activateCond="() => !!S_story.ostC6A4Done",
          takeItem="Durendal's Relic Inventory")

    say("Cycle 6 complete. Beginning cycle 7: Gabriel's Command. Node route AIX LDN WM. Source: Song of Roland, final image — Charlemagne wakes from Gabriel's dream command and buckles on his armor.")

    # --- Cycle 7: Gabriel's Command ---
    print("\n-- Cycle 7: Gabriel's Command --")
    quest("ost_07_act1", "The Chaplain's Sealed Tablet",
          "The chaplain hands it over before the morning assembly. He has not opened it since sealing. "
          "Dictated before anyone else was in the room: the angel's appearance, the form of the command, "
          "the city named, the instruction to march. One line at the bottom in the emperor's own hand, "
          "added before the seal: Dieu, si penuse est ma vie. God, how hard is my life. "
          "Then the armor was buckled. The chaplain sealed it and brought it here.",
          "AIX",
          "The tablet is a commission document, not a personal record. "
          "The final line is in it because the emperor wrote it before sealing. "
          "You understand why the archive wants it complete — shakier line and all. You take it.",
          "You take the tablet. The distinction between commission document and personal record "
          "settles before you reach the city gate.",
          "WIS", 12,
          checkPassFlag="ostC7A1Done",
          grantItem="Gabriel's Command Tablet — sealed wax tablet: Charlemagne's dictation of Gabriel's dream command to march to Imphe; one line in a shakier hand before sealing: Dieu si penuse est ma vie; sealed before the armor was buckled")

    quest("ost_07_act2", "The English Emissary",
          "An English emissary on the road west. He wants to read the tablet to understand "
          "if Charlemagne's next campaign will require permission for military passage "
          "through English border territories. His concern is legitimate. "
          "His authority to receive that information from this document is not.",
          "AIX",
          "The record is sealed. Campaign orders are a separate document that does not exist yet. "
          "Border passage permissions are filed through the diplomatic office, not through "
          "dream command records. He rides on.",
          "He requests a brief inspection before continuing west. The seal holds him. "
          "He notes your route and continues. A second inquiry will meet you at the coast.",
          "CHA", 12,
          checkPassFlag="ostC7A2Done",
          activateCond="() => !!S_story.ostC7A1Done")

    quest("ost_07_act3", "The Manuscript Collector",
          "An English cleric collecting accounts of prophetic dreams wants to copy the Gabriel "
          "narrative for a manuscript on divine command. His collection is genuine scholarship. "
          "He has three other dream-command accounts already. This one is the most recent.",
          "LDN",
          "The tablet travels sealed to the archive. After it arrives, a copy of the dream "
          "narrative can be arranged through the archive's copying service. "
          "The shakier line at the bottom is not part of the prophetic record and is not for copying. "
          "He agrees to these terms. He gives you his address for the copy request.",
          "He wants the shakier line specifically — it is, he argues, the most theologically "
          "interesting part. You decline to open the seal for it. He lets you leave, "
          "disappointed and scholarly about it.",
          "CHA", 13,
          checkPassFlag="ostC7A3Done",
          activateCond="() => !!S_story.ostC7A2Done")

    quest("ost_07_act4", "The Toll Official",
          "A toll official on the eastern road who has been told to inspect all sealed documents "
          "from Frankish court origins. He has seen the seal. He knows what it is. "
          "He is giving you time to think of a reason to deny him.",
          "LDN",
          "The archive seal is the exemption from inspection for documents in transit. "
          "You state it and hold the tablet. He examines the outer seal, confirms the archive mark, "
          "and waves you through without creating grounds for delay.",
          "He presses the inspection claim twice. You hold the archive exemption. "
          "He backs down, but the encounter is logged and the delay costs you an afternoon.",
          "CON", 11,
          checkPassFlag="ostC7A4Done",
          activateCond="() => !!S_story.ostC7A3Done")

    quest("ost_07_act5", "Dream Command Records",
          "Sweelinck takes the tablet. He breaks the outer seal. He reads the dictation text — "
          "the angel's appearance, the form of the command, the city named, the instruction to march. "
          "He reads the shakier line. He closes it and marks the category. "
          "He sets it in the archive space.",
          "WM",
          "He opens Dream Command Records. Charlemagne had been fighting for decades. "
          "He had just buried Aude and executed Ganelon. He was old. The angel came anyway. "
          "He said what anyone would say. Then he buckled on his armor. "
          "The archive holds the night before the armor.",
          "Sweelinck receives the tablet. He notes the shakier line. The archive will hold it "
          "complete — the command and the man who received it, in the same document.",
          "WIS", 10,
          checkPassFlag="ostC7A5Done",
          activateCond="() => !!S_story.ostC7A4Done",
          questComplete=True,
          takeItem="Gabriel's Command Tablet")

    say("All 35 quests imported for OST La Chanson de Roland. Checking audit counts.")

    # --- Audit ---
    print("\n-- Audit --")
    r = requests.get(BASE + "/api/audit").json()
    p = {x["section"]: x["count"] for x in r["parse"]}
    print(f"  NODE_MAP: {p.get('NODE_MAP')}")
    print(f"  QUEST_DB: {p.get('QUEST_DB')}")

if __name__ == "__main__":
    main()
