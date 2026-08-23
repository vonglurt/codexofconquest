#!/usr/bin/env python3
# SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson and Claude
# ═══════════════════════════════════════════════════════════════════════════
# ⚠️  ARCHAIC — OUT OF DATE.  Historical one-shot importer (POSTs to the
#     localhost:1367 WBAPI).  Content was long ago imported and lives in
#     roll2hit-v3.html.  This script likely NO LONGER RUNS against the current
#     server/schema.  Kept for reference only — do not run without review.
#     Import history: BACKLOG.md / plan-archive.md / 1367-sources/.
# ═══════════════════════════════════════════════════════════════════════════
"""§PASS4-EXTRA-CPH: Gesta Danorum cycles 3–7 (Pass 4 extra cycles)
   Source: archive.org/details/ninebooksdanish04saxogoog — Oliver Elton tr. 1905
   Seeds used: 3 (Horwendil's Victory Record), 4 (Gerutha's Testimony),
               5 (Rolf's Final Ring), 7 (Vikar Witness),
               + original: The Brávellir Champion Catalogue
"""

import requests, subprocess

BASE = "http://localhost:1367"
NPC  = "archivus_sweelinck"
BOOK = "CPH"

def api(method, path, **kwargs):
    r = getattr(requests, method)(BASE + path, **kwargs)
    r.raise_for_status()
    return r.json()

def say(msg):
    subprocess.run(["./say.sh", msg], capture_output=True)

def quest(id, title, desc, activateNode, passText, failText, checkStat, checkDC,
          checkPassFlag=None, activateCond=None, questComplete=False,
          monster=None, monsterHP=None, monsterAC=None):
    check = requests.get(BASE + f"/api/quest/{id}")
    if check.status_code == 200:
        print(f"  SKIP (exists): {id}")
        return
    nonce_r = api("post", "/api/nonce", json={"type": "quest", "id": id})
    nonce = nonce_r["nonce"]
    q_type = "combat" if monster else "skill_check"
    payload = {
        "id": id, "type": q_type, "book": BOOK, "npc": NPC,
        "title": title, "desc": desc, "activateNode": activateNode,
        "passText": passText, "failText": failText,
        "checkStat": checkStat, "checkDC": checkDC,
    }
    if checkPassFlag: payload["checkPassFlag"] = checkPassFlag
    if activateCond:  payload["activateCond"]  = activateCond
    if questComplete: payload["questComplete"]  = True
    if monster:
        payload["monster"]   = monster
        payload["monsterHP"] = monsterHP
        payload["monsterAC"] = monsterAC
    api("post", "/api/quest", json=payload, headers={"X-Nonce": nonce})
    tag = "[combat]" if monster else ""
    print(f"  OK: {id} — {title} {tag}")

def main():
    say(
        "CPH pass 4 extra cycles. Gesta Danorum, Saxo Grammaticus, Oliver Elton translation. "
        "Cycles 3 through 7. Horwendil Victory Record, Gerutha Testimony, "
        "Rolf Final Ring, Vikar Witness, Bravellir Champion Catalogue."
    )

    # ── Cycle 3: Horwendil's Victory Record ───────────────────────────────────
    # Theme: The lawful act must be documented before the usurper can rewrite the history
    #        that preceded it; every founding crime begins with erasing what was done lawfully.
    # Route: DNS → DAN → HEO
    print("\n-- Cycle 3: Horwendil's Victory Record --")

    quest(
        "cph003_act1",
        "Horwendil's Archive",
        "Fengo has been king for three weeks. Horwendil is dead. "
        "The formal record of Horwendil's single-combat victory over King Koll of Norway "
        "— the legal basis for his marriage to Gerutha and his right to the kingdom — "
        "sits in the scribal room off Fengo's departure dock. "
        "Fengo's clerk has not touched it yet, but he has a list. "
        "An older scribe, Óttarr, who served Horwendil for twenty years, "
        "has put the combat record in your hands and is looking at you "
        "with the expression of a man who understands that the document's "
        "next twelve hours will determine whether it exists in a year. "
        "The clerk's list is on the desk in the scribal room. "
        "The clerk is at dinner. You have perhaps an hour.",
        "DNS",
        "You read the full situation. Fengo's claim to legitimacy depends on "
        "the story of Horwendil as an abuser — and that story only holds "
        "if no one remembers that Horwendil won the kingship in formal lawful combat, "
        "witnessed, recorded, and archived at Lejre. "
        "You take the combat record. You leave through the service passage "
        "before the clerk returns from dinner.",
        "You understand the logistics but not the sequence. "
        "By the time you move, the clerk has come back early. "
        "He sees you at the door but not what you are carrying. "
        "The departure is unclean. Someone knows you were in the scribal room.",
        "WIS", 12,
        checkPassFlag="cph003_act1",
    )

    quest(
        "cph003_act2",
        "Fengo's Road Agent",
        "The road between Fengo's dock and the Lejre highway is watched. "
        "Fengo's road agent — not a soldier; a man who manages information — "
        "is at the junction between the dock road and the coastal path. "
        "He stops everyone moving from the dock district toward Lejre "
        "and asks what they are carrying. He has a list of documents "
        "authorized for transit. He is polite and specific. "
        "He has been doing this for Fengo for many years, in various capacities, "
        "which is why Fengo trusts him with the junction.",
        "DNS",
        "You tell him you carry personal correspondence for a household "
        "in the Lejre district — private, not political, nothing of "
        "court significance. You name a specific family in the Lejre district "
        "that has routine personal correspondence passing through this junction. "
        "He checks his list. The family is not on it. He waves you through. "
        "Personal correspondence below the threshold. You are onto the highway.",
        "He is methodical rather than stupid. He keeps you at the junction "
        "while he crosschecks the family name against a second list. "
        "By the time he releases you, Fengo's clerk has sent a rider ahead. "
        "The highway is less safe than it was.",
        "CHA", 13,
        checkPassFlag="cph003_act2",
        activateCond="cph003_act1",
    )

    quest(
        "cph003_act3",
        "Two Men on the Coastal Highway",
        "They are not wearing court colors — that would be too legible. "
        "They are wearing traveling clothes and they are standing in the road "
        "where the coastal highway narrows between two reed-beds. "
        "They have seen you come from the dock direction. "
        "One of them has his hand on his sword-hilt in the casual way "
        "of men who have been told: get it back, don't make a scene. "
        "The reed-beds are deep on both sides. The road is one cart-width.",
        "DAN",
        "You hear the second man shifting position in the reeds "
        "before the first one speaks — footstep on wet clay. "
        "You know where both of them are. The first man has not "
        "committed to anything yet. You take the initiative before he does.",
        "The first man speaks before you locate the second. "
        "The fight happens in the road while the second man comes through the reeds. "
        "The document survives but the margin is smaller afterward.",
        "WIS", 12,
        checkPassFlag="cph003_act3",
        activateCond="cph003_act2",
        monster="road_agent",
        monsterHP=24,
        monsterAC=13,
    )

    quest(
        "cph003_act4",
        "The Archive Gate",
        "The archive gate at Lejre is open during the day but the senior archivist "
        "has a standing instruction from the current steward: all court documents "
        "arriving without the steward's transit seal must be held for assessment. "
        "This instruction was added three weeks ago. "
        "The archivist at the gate is a young man doing his job "
        "who knows the instruction is new and has noticed it is new. "
        "He has the instruction in writing on his table. He is holding out "
        "his hand for your transit seal. You do not have a transit seal. "
        "The old archivist — Óttarr's counterpart at Lejre — is "
        "visible through the gate, forty yards away at the permanent record table.",
        "HEO",
        "You tell the young archivist that this document predates the transit "
        "seal instruction by twenty-two years — it is not a court document in "
        "transit; it is a return of an original historical record to its original "
        "archive, which is a different category than documents requiring a "
        "steward's seal. You name the original archivist. You name the year. "
        "He does not have a category for this. He lets you through "
        "while he finds one.",
        "He escalates. The senior archivist at the permanent record table "
        "must be consulted. The consultation takes time. During the time, "
        "Fengo's clerk arrives at the outer gate with a counter-instruction "
        "from the steward. The document is eventually received but under protest.",
        "CHA", 13,
        checkPassFlag="cph003_act4",
        activateCond="cph003_act3",
    )

    quest(
        "cph003_act5",
        "The Combat Record Filed",
        "The old archivist at the permanent record table takes the combat record "
        "from your hands. He reads it. He does not read it quickly. "
        "He has been at this table for thirty years and he has held "
        "documents that mattered before. He reads Horwendil's name. "
        "He reads the names of the witnesses to the combat. "
        "He reads the date of Koll's death — eleven years before Fengo became king. "
        "He reads the Gerutha marriage clause — the formal award of the queen "
        "to the victor in lawful combat, witnessed and sealed. "
        "He sets the document on the registration table. "
        "He says: 'This was already ours. We simply did not have the original.' "
        "He begins to write the receipt. "
        "Outside the gate, Fengo's clerk is arguing with the young archivist.",
        "HEO",
        "You wait without adding anything. The archivist is doing his work. "
        "The combat record is being entered into the permanent register "
        "under Horwendil's name, under the year of the battle, "
        "under the category: Witnessed Combat, Lawful Outcome. "
        "Whatever Fengo tells the court about Horwendil now, "
        "this record exists. It will be read when it needs to be read.",
        "You say something — about the urgency, or about what is happening "
        "at the gate, or about Fengo. The archivist looks up briefly. "
        "He says: 'I know.' He continues writing.",
        "WIS", 11,
        checkPassFlag="cph003_act5",
        activateCond="cph003_act4",
        questComplete=True,
    )

    # ── Cycle 4: Gerutha's Testimony ──────────────────────────────────────────
    # Theme: The witness who kept silence to survive can finally speak;
    #        what could not be said during the reign becomes the necessary document at its end.
    # Route: DNS → DAN → HEO
    print("\n-- Cycle 4: Gerutha's Testimony --")

    quest(
        "cph004_act1",
        "The Queen's Statement",
        "Fengo is dead. Amleth is king. Gerutha is in the room that was "
        "Fengo's room for twelve years and hers before that. "
        "She has written the statement herself — not asked, not directed. "
        "She wrote it because Amleth told her what he was going to do "
        "that night in her chamber when he killed the spy in the straw, "
        "and she promised to keep his secret, and keeping his secret "
        "meant silence, and silence during the reign meant Fengo's story "
        "stood unchallenged. The reign is over. "
        "Her sworn statement confirms: Fengo murdered Horwendil by ambush "
        "and treachery. The marriage was coerced. The story Fengo told — "
        "that Horwendil abused her and Fengo killed him to save her — "
        "is false. She watched Fengo construct it. She could not speak. "
        "She can speak now. She gives the sealed statement to you "
        "without explanation. The lawspeaker at Lejre needs it "
        "before Fengo's kinsmen file a counter-claim.",
        "DNS",
        "You read the urgency. Fengo's kinsmen are already in motion. "
        "In dynastic disputes, the first sworn statement received by the "
        "lawspeaker sets the baseline of fact. "
        "You take the statement and leave before dawn.",
        "She sees you calculating the logistics and adds one sentence: "
        "'They sent two men north this morning.' She does not say which direction "
        "you should go or how fast. She does not need to.",
        "WIS", 12,
        checkPassFlag="cph004_act1",
    )

    quest(
        "cph004_act2",
        "Fengo's Kinsmen — The First Party",
        "The first party of Fengo's kinsmen is on the coastal road. "
        "Three men, traveling fast, heading for Lejre. "
        "They are not looking for you specifically — they are racing "
        "to file their claim before any counter-evidence arrives. "
        "One of them recognizes you as someone who came from the direction "
        "of the dock district, which is Gerutha's district, and pulls up. "
        "He says: 'If you carry anything from the late king's widow, "
        "you are required to surrender it to the court's interim steward "
        "for assessment.' He does not have a court interim steward with him. "
        "He has invented this role on the road.",
        "DAN",
        "You tell him you carry private correspondence not addressed to "
        "the court, and that the late king's widow is now simply a widow "
        "with all a widow's rights regarding her own private correspondence. "
        "The invented role of interim steward has no standing in Danish law "
        "regarding a widow's personal papers. "
        "He has no response to this. You continue.",
        "He is not deterred by the legal argument and calls the other two over. "
        "There is a confrontation. You get through it but the document "
        "is in your hands during the confrontation and he has seen its seal.",
        "CHA", 14,
        checkPassFlag="cph004_act2",
        activateCond="cph004_act1",
    )

    quest(
        "cph004_act3",
        "The Hired Rider",
        "The second party sent by Fengo's kinsmen is faster: a single rider "
        "who went ahead on the inland road, looped back, and is now "
        "ahead of you on the Lejre approach. He is not blocking the road. "
        "He is riding alongside you at a matching pace, talking. "
        "He has a proposition: the kinsmen are reasonable men; "
        "this is a dynastic matter; documents of this kind are best handled "
        "through proper mediation; he has been authorized to offer a settlement "
        "that would make further legal proceedings unnecessary. "
        "He names a sum. It is large. He says it is for your inconvenience.",
        "DAN",
        "You tell him you carry correspondence commissioned by another party "
        "and your obligation is to deliver it as commissioned. "
        "You cannot redirect the commission's destination for a payment "
        "from a third party. This is a basic principle of carrier's law. "
        "He looks at you. He says: 'Carrier's law.' "
        "He sounds like he is going to laugh, then does not. He falls behind.",
        "He makes a second offer, substantially larger. You feel the weight "
        "of it. You say no again but you have given him time "
        "to evaluate your resolve and he now knows the weakness in it.",
        "CHA", 13,
        checkPassFlag="cph004_act3",
        activateCond="cph004_act2",
    )

    quest(
        "cph004_act4",
        "The Lawspeaker's Hall",
        "The lawspeaker's hall at Lejre is adjacent to the main court. "
        "The lawspeaker has been in session since morning. "
        "His clerk at the door tells you: matters requiring sworn testimony "
        "from principals must be filed before the third bell. "
        "It is currently before the third bell by perhaps fifteen minutes. "
        "Fengo's kinsmen's representative is already in the hall — "
        "he arrived while you were on the road. He has already spoken. "
        "The lawspeaker's clerk is making a notation. "
        "You need to be inside before the third bell.",
        "HEO",
        "You tell the clerk at the door that you carry a sworn statement "
        "from Gerutha Horwendilsdottir, widow of Horwendil, sealed and witnessed, "
        "relevant to the same matter already filed by the parties inside. "
        "It must be received before the bell. "
        "He looks at the seal. He looks at the time. He opens the door.",
        "The clerk wants to confirm the filing category before admitting you. "
        "The category discussion takes six minutes. "
        "You are admitted after the bell. The lawspeaker receives the statement "
        "but notes it arrived late. The timing will matter.",
        "CHA", 13,
        checkPassFlag="cph004_act4",
        activateCond="cph004_act3",
    )

    quest(
        "cph004_act5",
        "Received Under Oath",
        "The lawspeaker reads Gerutha's statement in the silence of the hall. "
        "Fengo's kinsmen's representative is still present — he is required "
        "to be, by procedure. He cannot leave while the lawspeaker is reading. "
        "The lawspeaker reads slowly. He reads the description of Horwendil's murder. "
        "He reads the coerced marriage clause. He reads the twelve years "
        "of mandatory silence that followed. He reads the final sentence: "
        "'I could not speak while he was king. I can speak now.' "
        "He sets the document down. He makes a notation. "
        "He says to his clerk: 'Received under oath. To be read alongside "
        "the filing made this morning.' He does not look at the kinsmen's representative. "
        "He closes the session. You walk out through the hall "
        "where Starkad's name is somewhere in the carved wood "
        "and now Gerutha's name is in the register.",
        "HEO",
        "You let the session close without adding anything. "
        "The statement is received. It is in the register. "
        "It will be read alongside the kinsmen's filing, which means "
        "the lawspeaker will have both versions when he rules. "
        "The weight of twelve years of silence has found its proper form.",
        "You say something to the kinsmen's representative as you leave. "
        "He looks at you with the professional composure of a man "
        "who has just had a case complicated and is already thinking "
        "about the next filing. He does not respond.",
        "WIS", 11,
        checkPassFlag="cph004_act5",
        activateCond="cph004_act4",
        questComplete=True,
    )

    # ── Cycle 5: Rolf's Final Ring ─────────────────────────────────────────────
    # Theme: The king who knows he will die tonight sends the record of what he built;
    #        the ring is the seal on a farewell the battle will not allow in person.
    # Route: HEO → DAN → BRK
    print("\n-- Cycle 5: Rolf's Final Ring --")

    quest(
        "cph005_act1",
        "Rolf's Commission",
        "Rolf Krake's hall at Lejre is being prepared for the battle tomorrow. "
        "His twelve champions — Bjarki, Hjalti, Svipdag and the others — "
        "are sharpening weapons and checking armor with the "
        "specific calm of men who have done this many times. "
        "Rolf is in the inner room. He gives you a ring — not one of the gold rings "
        "he distributes to his men, though he distributes many; this one "
        "is a twisted silver ring with a Norse knot-pattern, the ring he "
        "was given by his father Helgi, which he has worn on his right hand "
        "for forty years. He gives it to you with a sealed message. "
        "The message is for the Anglo-Saxon king Æthelric, two days' ride south. "
        "'This is not a request for help,' he says. 'I am not asking Æthelric to come. "
        "I am telling him what we built here and what happens to it tomorrow. "
        "I want someone to know who was not here.' He holds out the ring. "
        "He is completely calm. Skuld's forces are a day away.",
        "HEO",
        "You read the commission correctly. Not hope. Not a signal for reinforcement. "
        "A record, carried by someone who will not be in the hall tomorrow. "
        "You take the ring and the sealed message. "
        "You leave before Bjarki can see what Rolf has given away.",
        "You ask if you should bring Æthelric back — if the message calls "
        "for an ally to ride. Rolf looks at you once and says: "
        "'It does not.' He closes the conversation.",
        "WIS", 12,
        checkPassFlag="cph005_act1",
    )

    quest(
        "cph005_act2",
        "Skuld's Forward Scouts",
        "Skuld has scouts on the south road, watching who leaves Lejre "
        "before the battle. She does not want messengers reaching allies. "
        "Two of her men are at the road junction half a mile south of Lejre, "
        "stopping travelers. They see you come from the direction of the hall. "
        "They see the ring. Rolf Krake's twisted silver ring is not unknown — "
        "anyone who has been at the Danish court knows it. "
        "One of them reaches for it.",
        "DAN",
        "You see the reach before it arrives and step back with "
        "the specific body language of a courier who has dealt with "
        "road agents before and is not impressed. You tell them "
        "you carry a merchant's commission, ordinary goods, nothing of the court. "
        "The ring is a family piece not worth their attention. "
        "You say it with enough boredom that both of them "
        "look at each other instead of at you. You are through the junction.",
        "They insist on inspecting your pack. The ring is there. "
        "The fight happens at the junction with one of them running for "
        "the main camp afterward. The road south is less safe.",
        "CHA", 13,
        checkPassFlag="cph005_act2",
        activateCond="cph005_act1",
    )

    quest(
        "cph005_act3",
        "The Skuld Camp's Outer Rider",
        "A rider from Skuld's main camp has been sent ahead on the south road "
        "after the scouts' report. He is faster than you and he caught up. "
        "He is not a scout — he is a capable warrior in Skuld's service "
        "with specific authority to retrieve items of value moving away "
        "from Lejre before the battle. He is very clear about his authority. "
        "He is also very clear that he intends to use it.",
        "DAN",
        "You hear his horse before he rounds the bend. "
        "You are off the road and into the tree-line before he commits "
        "to the approach. He rides past your position. "
        "He has to turn. You do not wait for him to turn.",
        "He arrives with the road and the initiative. "
        "The ring survives but the message case is damaged in the fall. "
        "The seal is intact but the case is cracked. "
        "At Æthelric's gate this will require explanation.",
        "WIS", 12,
        checkPassFlag="cph005_act3",
        activateCond="cph005_act2",
        monster="elite_scout",
        monsterHP=28,
        monsterAC=15,
    )

    quest(
        "cph005_act4",
        "Æthelric's Gate",
        "The Anglo-Saxon king's hall is two days south. "
        "His gate-captain has a standing instruction about strangers arriving "
        "without embassy credentials and claiming to carry messages "
        "from foreign kings. The instruction is: hold for questioning. "
        "You are being held at the outer gate. The ring is visible "
        "in your hand — you showed it as evidence of the commission. "
        "The gate-captain is looking at the ring. He has seen twisted silver "
        "Norse knot-rings before. He knows what they mean "
        "and he is not sure he wants the responsibility of what this one means.",
        "BRK",
        "You tell him directly: this is Rolf Krake's ring, this is a sealed "
        "message from Rolf Krake to King Æthelric, and the message "
        "was given to you yesterday, which means whatever has happened "
        "at Lejre has either happened or is happening now. "
        "You name three things the gate-captain can verify about the ring "
        "— the specific knot-pattern, the weight, the inscription on the inside "
        "of the band — that Æthelric will confirm. "
        "He opens the gate.",
        "He wants written credentials. You do not have written credentials — "
        "Rolf's sealed message is for the king, not the gate-captain. "
        "The protocol argument takes time that makes the ring's news older.",
        "CHA", 13,
        checkPassFlag="cph005_act4",
        activateCond="cph005_act3",
    )

    quest(
        "cph005_act5",
        "What Rolf Built",
        "Æthelric is in his hall. He is not a great king — not by the standard "
        "of Rolf Krake, not by any standard that Lejre sets. He knows this. "
        "He takes the ring. He reads the sealed message. "
        "He reads it twice. He is quiet for a long time. "
        "He says: 'He is not asking for help.' "
        "Not a question. He says it again, quietly: 'He is not asking for help.' "
        "He holds the ring on his palm. "
        "He closes his hand around it. He says to his steward: "
        "'Have the Danish trading party at the dock held in courtesy "
        "until we know what has happened at Lejre.' "
        "He looks at you. He says: 'Stay tonight. "
        "Tell me about the hall and the champions.' "
        "He wants the record that Rolf sent. He is going to be "
        "someone who knows what was built and what happened to it. "
        "Rolf asked for exactly one person to know. Here is that person.",
        "BRK",
        "You stay. You tell him about the hall. You tell him about "
        "the twelve champions and their names and what they were. "
        "You tell him about the night Rolf gave you the ring. "
        "He listens without speaking. He is being the witness "
        "that Rolf needed. The ring stays in his hand. "
        "In the morning you leave and the road back to Denmark is a different road.",
        "You keep it brief — summary only, the key facts. "
        "Æthelric nods and releases you. The record exists "
        "but without the texture Rolf's message implied it needed.",
        "WIS", 11,
        checkPassFlag="cph005_act5",
        activateCond="cph005_act4",
        questComplete=True,
    )

    # ── Cycle 6: The Vikar Witness ─────────────────────────────────────────────
    # Theme: The exonerating document is also the damning one; divine compulsion and
    #        human action are both in the same sworn statement; the archive files them together.
    # Route: STK → DAN → HEO
    print("\n-- Cycle 6: The Vikar Witness --")

    quest(
        "cph006_act1",
        "Þórir Ironside's Last Statement",
        "Þórir Ironside is very old and very specific. "
        "He was at Vikar's court when the ritual went wrong — "
        "one of perhaps six men still alive who saw it. "
        "He has lived near Starkad's coast for sixty years, "
        "long enough that the two very old men have something "
        "like a territorial arrangement: Starkad's holding on one headland, "
        "Þórir's on the other, the distance between them "
        "the exact width of comfortable non-contact. "
        "Þórir has written down what he saw: the ritual was supposed to be symbolic. "
        "The rope was a soft reed. The spear was a reed-stalk. "
        "Odin made them real. Starkad did not choose this. "
        "But Starkad also did not stop. Both are in the statement. "
        "He wants it in Starkad's family records at the Lejre archive "
        "before he dies — which is, by his estimate, not long. "
        "He gives you the sealed statement and says: "
        "'This says it was Odin and it also says Starkad did it. "
        "Those are both true. The archive can decide what to do with two truths.'",
        "STK",
        "You read what he is actually asking. Not absolution — he is not "
        "pretending one truth cancels the other. A record that holds "
        "both without resolving them. The archive can contain two truths "
        "in the same document if someone actually delivers it. "
        "You take the statement.",
        "You ask which truth he wants to emphasize. He looks at you "
        "with the particular patience of someone who has had this conversation "
        "before. 'Both. That is the point.' You take the statement.",
        "WIS", 12,
        checkPassFlag="cph006_act1",
    )

    quest(
        "cph006_act2",
        "The Vikar Loyalists",
        "Vikar's remaining household — his descendants, two generations on — "
        "have been watching the roads near Starkad's coast for sixty years "
        "for exactly this kind of document. A sworn witness statement "
        "exonerating Starkad is, in their accounting, a re-injury: "
        "it reduces Vikar's murder to divine accident, removes Starkad's guilt, "
        "and diminishes the basis of the grudge they have maintained. "
        "Three of them are on the coastal road. They are not professional soldiers. "
        "They are farmers who remember correctly and have been waiting.",
        "STK",
        "You tell them the statement does not exonerate Starkad — "
        "it holds both truths simultaneously. Odin made the rope real "
        "and Starkad did not stop. Those are both in the document. "
        "The statement is not a verdict in Starkad's favor; "
        "it is the record of what the only living non-participant witness saw. "
        "They look at each other. The eldest says: 'Both are in it?' "
        "You confirm. He steps aside. He says: 'File it under both names.'",
        "They do not believe a document can hold two truths "
        "without choosing between them. The argument is sincere and goes on "
        "longer than the road can afford. You get through but arrive "
        "at the harbor settlement with the afternoon advanced.",
        "CHA", 13,
        checkPassFlag="cph006_act2",
        activateCond="cph006_act1",
    )

    quest(
        "cph006_act3",
        "The Revisionist Scholar",
        "A Frankish scholar traveling the coastal road has heard about the "
        "statement from someone at the harbor settlement. He is writing "
        "a comparative account of Norse heroic figures for a Latin audience. "
        "He has read Saxo. He has a version of Starkad's story "
        "that emphasizes the divine compulsion and removes the human failure. "
        "He wants to see the witness statement — not to suppress it, "
        "he says, but to reconcile it with the literary tradition "
        "he is working within. He says the word reconcile "
        "with the specific confidence of someone who has reconciled "
        "several documents before and found it congenial work.",
        "DAN",
        "You ask him what he does when two truths are both in the document "
        "and cannot be reconciled without removing one. "
        "He says the literary tradition requires coherence. "
        "You tell him the archive does not require coherence — it requires accuracy. "
        "He finds this a lower standard than he expected from an archive. "
        "You leave him with that assessment and continue.",
        "He is persuasive about the literary tradition and makes you feel "
        "briefly that accuracy without coherence is a lesser virtue. "
        "You recover but he has seen the document case long enough "
        "to describe it to someone at the next tavern.",
        "CHA", 14,
        checkPassFlag="cph006_act3",
        activateCond="cph006_act2",
    )

    quest(
        "cph006_act4",
        "Starkad's Family Archivist",
        "Starkad has no living descendants. His family archive at Lejre "
        "is maintained by a junior archivist who handles the accounts "
        "of several extinct or attenuated noble lines. "
        "He receives the statement, reads the cover, and says: "
        "'Starkad Áludrengr. He's been dead — what, fifteen years? "
        "We do receive late testimony occasionally but the family archive "
        "is technically closed for active filings.' "
        "He does not want to decide this himself. "
        "He is going to refer it to the senior archivist, "
        "who may refer it to the lawspeaker's category committee, "
        "which meets on alternate Thursdays.",
        "HEO",
        "You tell him Þórir Ironside specified the family archive "
        "because it is the record that will be consulted when Starkad's "
        "name appears in future legal or historical filings — "
        "which it does, regularly, because Starkad was involved in three "
        "major dynastic events across three lifetimes. "
        "The statement belongs in the file most likely to be read "
        "when his name comes up. The junior archivist considers this. "
        "He accepts the filing on a provisional basis.",
        "He escalates to the senior archivist as planned. "
        "The senior archivist wants written authorization from "
        "a living family representative. There are no living family representatives. "
        "This takes time to establish.",
        "CHA", 13,
        checkPassFlag="cph006_act4",
        activateCond="cph006_act3",
    )

    quest(
        "cph006_act5",
        "Filed Under Both Names",
        "The senior archivist reads the statement. He is a thorough man. "
        "He reads it in the way of someone who has spent a career "
        "determining which shelf a document belongs on. "
        "He reads: Odin made the rope real. He reads: Starkad did not stop. "
        "He is quiet for a moment. He says: 'We don't have a category "
        "for documents that contain exoneration and condemnation simultaneously.' "
        "He looks at the junior archivist. He says: 'Create one.' "
        "He turns back to the statement. He says: "
        "'File it under Starkad. File it under Vikar. "
        "File it under Divine Compulsion as a cross-reference. "
        "Þórir Ironside witnessed something that deserves to be in all three places.' "
        "He receives the statement. He writes the cross-reference notation. "
        "The statement is in the archive. Both truths are there.",
        "HEO",
        "You let the archivist work. Both truths are in the archive now. "
        "Þórir Ironside will be told, if he is still alive to hear it, "
        "that the document was received and filed under both names "
        "with a new category the senior archivist created on the spot. "
        "That is exactly what Þórir asked for.",
        "You comment on the new category — whether it is a good thing "
        "or a difficult thing. The senior archivist looks at you "
        "with the specific patience of a man who has made the decision "
        "and moved on. He is already writing the cross-reference.",
        "WIS", 11,
        checkPassFlag="cph006_act5",
        activateCond="cph006_act4",
        questComplete=True,
    )

    # ── Cycle 7: The Brávellir Champion Catalogue ──────────────────────────────
    # Theme: The record that belongs to everyone disturbs everyone;
    #        carrying a catalogue that names both victors and losers
    #        through the survivors of both sides.
    # Route: HEO → DAN → STK
    print("\n-- Cycle 7: The Brávellir Champion Catalogue --")

    quest(
        "cph007_act1",
        "The Catalogue",
        "The Battle of Brávellir was the greatest battle of the age. "
        "Harald Wartooth against Ring. The champion catalogue — "
        "the formal record of every named warrior on both sides, "
        "their lineages, their fighting styles, their fates — "
        "was compiled afterward by the court scald from survivors' accounts. "
        "It runs to forty-seven names. Twenty-nine of them are dead. "
        "Eighteen are alive. Both sides are in it equally: "
        "Harald's champions and Ring's champions, treated with the same care. "
        "The families of the dead need the catalogue for inheritance claims. "
        "Eighteen of the surviving warriors want their entries reviewed. "
        "Three of Ring's men want Harald's men's entries reduced. "
        "Two of Harald's surviving kin want Ring's men removed entirely. "
        "The archivist who holds it at Lejre gives it to you "
        "with the specific expression of someone relieved to pass a problem "
        "to another pair of hands.",
        "HEO",
        "You read what the archivist is actually saying: "
        "the catalogue belongs to everyone named in it, "
        "which means everyone named in it believes they have authority "
        "over its contents, which means it belongs to no one safely. "
        "The coastal families need it for legal filings. "
        "The only way to serve both sides equally is to carry it "
        "without showing it to anyone. You take it.",
        "You ask which families are most urgent. He gives you a list "
        "of four names. By the time you leave, one of Ring's surviving champions "
        "is at the outer gate asking about the catalogue. "
        "He has been there since morning.",
        "WIS", 12,
        checkPassFlag="cph007_act1",
    )

    quest(
        "cph007_act2",
        "Ring's Champion at the Gate",
        "Svípur Hákonsson is one of Ring's surviving champions. "
        "He was at Brávellir. His name is in the catalogue. "
        "He also believes that three names in Harald's section "
        "were exaggerated by the scald who compiled them — "
        "men given credit for things they did not do — "
        "and he has been trying for two years to have those entries revised. "
        "He has a written correction he wants inserted. "
        "He is at the gate because he heard the catalogue was moving. "
        "He wants to walk with you and explain the corrections "
        "so you understand their importance.",
        "DAN",
        "You tell him the catalogue is sealed for transit — "
        "no corrections can be inserted in transit, only at the destination archive "
        "through the proper review process, which involves submitting "
        "a written challenge with witness signatures. "
        "You can tell him the process. He can follow the process. "
        "The catalogue moves sealed. He does not like this answer. "
        "He accepts it. He writes down the process as you explain it.",
        "He insists the correction is small and will take one minute. "
        "You decline and he escalates. The conversation "
        "becomes a confrontation. You hold the position but he has now "
        "described the catalogue's route to several people in earshot.",
        "CHA", 13,
        checkPassFlag="cph007_act2",
        activateCond="cph007_act1",
    )

    quest(
        "cph007_act3",
        "Harald's Kinsmen",
        "Two of Harald's surviving kinsmen have heard the catalogue is "
        "in transit and have decided that Ring's champions do not deserve "
        "to appear in the same document as Harald's champions. "
        "They have a simple proposal: the catalogue should be split. "
        "Harald's men in one document. Ring's men in a separate document. "
        "They are prepared to take Ring's section themselves "
        "and deliver it separately to a different archive. "
        "They are also prepared to fight about this. "
        "They are blocking the road at the reed-bed narrows.",
        "DAN",
        "You hear the second man before you see him — "
        "the reeds on the east side shifting against the current. "
        "You take the road edge before he commits to his position. "
        "The first man realizes you heard his partner and overcommits. "
        "The fight is brief. The catalogue stays whole.",
        "Both men arrive from the front. The fight happens in the road. "
        "The catalogue survives but the case is opened in the scuffle "
        "and three of the forty-seven entries are visible to anyone "
        "looking from the bank.",
        "WIS", 12,
        checkPassFlag="cph007_act3",
        activateCond="cph007_act2",
        monster="veteran_warrior",
        monsterHP=26,
        monsterAC=14,
    )

    quest(
        "cph007_act4",
        "The Coastal Family",
        "The families most urgently needing the catalogue for inheritance claims "
        "are clustered at the coastal settlement near Starkad's headland — "
        "the families of two of Harald's men and one of Ring's men who died "
        "at Brávellir. The settlement has been waiting. "
        "The families' legal representative — a local lawman — "
        "has been told the catalogue is in transit. "
        "He is organized. He has the inheritance claim documents ready. "
        "He has a witness prepared. He wants to copy three entries "
        "from the catalogue — just the three relevant names — "
        "before you continue to the regional archive. "
        "He says it will take twenty minutes. His witness agrees it will "
        "take twenty minutes. This will take longer than twenty minutes.",
        "STK",
        "You allow the copies to be made under your supervision, "
        "the catalogue open only to the three relevant entries, "
        "the lawman's witness confirming the transcription of each entry. "
        "Twenty-six minutes. The catalogue is closed and sealed again "
        "with the lawman's own counter-seal beside the archivist's original seal. "
        "This is actually better than what you started with.",
        "The copies take forty minutes and two entries are copied out of order. "
        "The lawman wants to redo the second one. You wait. "
        "The coastal settlement knows the catalogue's full contents "
        "by the time you leave because his witness is talking in the yard.",
        "CHA", 13,
        checkPassFlag="cph007_act4",
        activateCond="cph007_act3",
    )

    quest(
        "cph007_act5",
        "The Regional Archive — Forty-Seven Names",
        "The regional archive at the Starkad headland is a small room "
        "in the settlement's administrative building, managed by an elderly woman, "
        "Þóra Gunnlaugsdóttir, who has been copying legal documents into vellum "
        "for forty years and has the handwriting of someone who takes accuracy "
        "as a personal commitment. She receives the catalogue. "
        "She reads the archivist's seal. She reads the counter-seal. "
        "She opens the catalogue. She reads all forty-seven names "
        "in order, both sides, Harald's champions and Ring's champions, "
        "without pausing at the boundary between them. "
        "She says: 'Forty-seven. Good.' "
        "She begins copying. She will copy them in order, "
        "both sides, the same handwriting throughout. "
        "The families can file their inheritance claims. "
        "The catalogue belongs to everyone named in it, "
        "and everyone named in it is in the permanent record.",
        "STK",
        "You watch her begin the first entry — Bjarki, "
        "Rolf's champion, who was also at Brávellir — "
        "and understand that she will copy every name with the same care "
        "whether the family is waiting outside or not. "
        "You leave before she reaches the twenty-third name. "
        "The work will be done. Both sides will be in the vellum "
        "in the same handwriting.",
        "You stay to see if she will stop at the boundary between the sides. "
        "She does not stop. She looks up and says: "
        "'Did you think I would?' You say no. She continues writing.",
        "WIS", 11,
        checkPassFlag="cph007_act5",
        activateCond="cph007_act4",
        questComplete=True,
    )

    print("\n=== CPH cycles 3–7 complete. 5 cycles, 25 acts. ===")

if __name__ == "__main__":
    main()
