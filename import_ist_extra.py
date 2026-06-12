#!/usr/bin/env python3
"""§PASS4-EXTRA-IST: The Alexiad cycles 8–10 (Pass 4 extra cycles)
   Source: archive.org/details/alexiad-english-dawes-1928 — Elizabeth Dawes tr. 1928
   New angles: Eirene's diplomatic letters (c.8), People's Crusade inventory (c.9),
               Alexios-Bohemund secret channel (c.10)
"""

import requests, subprocess

BASE = "http://localhost:1367"
NPC  = "archivus_sweelinck"
BOOK = "IST"

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
        "IST pass 4 extra cycles. The Alexiad, Anna Komnene, Elizabeth Dawes translation. "
        "Cycles 8 through 10. Empress Eirene Letters, People Crusade Inventory, "
        "Alexios Bohemund Secret Channel."
    )

    # ── Cycle 8: Eirene's Letters ──────────────────────────────────────────────
    # Theme: The empress in the margins of the emperor's history;
    #        the parallel diplomatic track the historian was too close to see.
    # Route: CON → DBV → WM
    print("\n-- Cycle 8: Eirene's Letters --")

    quest(
        "ist_c8a1",
        "The Galata Family Archive",
        "The Katakalon family in the Galata Quarter maintained diplomatic "
        "correspondence for the imperial household during Alexios's reign. "
        "In their archive: seventeen letters in Eirene Doukaina's hand, "
        "dating from 1094 to 1096, addressed to Serbian and Bulgarian church "
        "hierarchs. They discuss relief provisions, ecclesiastical appointments, "
        "and — in three of the seventeen — specific arrangements for receiving "
        "refugee populations from the disrupted frontier districts. "
        "Alexios's official diplomatic posture with the Bulgarian church "
        "during these same years was formal and distant. "
        "The letters show a parallel channel his wife maintained independently. "
        "The current family head, Demetrios Katakalon, is willing to release them "
        "but uncertain — the Bulgarian church references could complicate "
        "current Byzantine church politics if read without context. "
        "He puts the letter-packet in your hands and says: "
        "'I need to know the archive will contextualize these. "
        "Not suppress the Bulgarian content. Contextualize it.'",
        "CON",
        "You tell him the archive's function is not simplification but "
        "accurate filing with full context — the letters will be categorized "
        "as Diplomatic Records — Imperial Consort, with annotation noting "
        "the parallel track and its relationship to Alexios's official "
        "church policy. The Bulgarian content will be legible as "
        "humanitarian in character. He releases the packet.",
        "He is uncertain and adds conditions: the archive must commit "
        "to a specific filing category in writing. You negotiate the terms "
        "and leave later than intended.",
        "INT", 12,
        checkPassFlag="ist_c8a1",
    )

    quest(
        "ist_c8a2",
        "The Phanar Intercept",
        "The Ecumenical Patriarchate's administrative office — the Phanar — "
        "has a standing interest in any documentation of Byzantine-Bulgarian "
        "church contacts. A functionary from the Phanar office has learned "
        "about the letters and has arrived at the Galata Quarter asking "
        "to review any Byzantine ecclesiastical correspondence leaving the district. "
        "He has not arrived at the Katakalon house specifically — "
        "he is conducting a general inquiry at the district notary's office "
        "two doors away. You need to leave the district before the inquiry "
        "reaches the right door.",
        "CON",
        "You carry the letter-packet through the district as ordinary "
        "household correspondence — the Katakalon seal on the outside, "
        "no visible Byzantine imperial cipher, nothing that reads as "
        "ecclesiastical in character to someone making a general inquiry. "
        "You are through the district gate before the functionary "
        "reaches the notary's office.",
        "The functionary has finished at the notary's office and is "
        "working his way down the street. He sees you leaving. "
        "He calls after you with a routine question about district residency. "
        "The answer takes five minutes and the letter-packet is "
        "in your hands during the conversation.",
        "DEX", 13,
        checkPassFlag="ist_c8a2",
        activateCond="ist_c8a1",
    )

    quest(
        "ist_c8a3",
        "The Thessaloniki Merchant",
        "At Ragusa, a Venetian merchant who trades the Constantinople-Thessaloniki "
        "route has recognized Eirene Doukaina's cipher on the letter-packet. "
        "He knows Byzantine diplomatic ciphers from twenty years of reading "
        "around the edges of court correspondence during his trade visits. "
        "He knows what empress-level correspondence is worth to a Genoese "
        "agent currently trying to renegotiate trade privileges with the "
        "Serbian church hierarchy. He is sitting at the Ragusa harbor tavern "
        "with the specific posture of someone who has already made his "
        "assessment and is now waiting to discuss it.",
        "DBV",
        "You tell him the letter-packet is en route to a scholarly archive "
        "with full documentation of provenance — which means its contents "
        "are already in the academic record; selling it or excerpting it "
        "would create a discoverable discrepancy between the private transaction "
        "and the archived version. It is a better object in a public archive "
        "than in a private negotiation. He thinks about this. "
        "He orders another drink. He says: 'The Genoese agent won't like that.' "
        "He means that he accepts it.",
        "He makes his pitch fully. You decline it. He doubles the offer. "
        "You decline again. He understands but he has now described "
        "the letter-packet's contents to the tavern keeper in detail "
        "while making his case.",
        "CHA", 14,
        checkPassFlag="ist_c8a3",
        activateCond="ist_c8a2",
    )

    quest(
        "ist_c8a4",
        "The Dominican Road Inquiry",
        "A Dominican inquisitor traveling the Ragusa-Weimar road has heard "
        "a description of the letter-packet from someone at the Ragusa harbor. "
        "He is concerned: Byzantine imperial correspondence with the Bulgarian "
        "and Serbian Orthodox churches — in 1367, both still in schism with Rome — "
        "may constitute evidence of schismatic contacts that fall within "
        "the inquisitorial remit. He is polite, systematic, and has a written "
        "authority from the Ragusan bishop to inspect suspicious ecclesiastical "
        "documentation moving through the diocese.",
        "DBV",
        "You tell him the letters are 13th-century Byzantine state correspondence "
        "concerning humanitarian relief provisions and church appointments — "
        "documentation of an imperial consort's administrative functions, "
        "not ecclesiastical contacts in the doctrinal sense his authority covers. "
        "You name the archive that is receiving them and their filing category. "
        "The humanitarian character of the relief provisions context "
        "makes this an administrative record, not a theological document. "
        "He considers. He says: 'I'll note the archive has received them.' "
        "He does not compel further.",
        "He wants to read one of the letters to confirm the humanitarian "
        "character himself. Reading one letter and closing the packet "
        "takes fifteen minutes and his notation now includes "
        "the specific Bulgarian church hierarchs named in it.",
        "CHA", 13,
        checkPassFlag="ist_c8a4",
        activateCond="ist_c8a3",
    )

    quest(
        "ist_c8a5",
        "Eirene's Parallel Track",
        "Archivus Sweelinck opens the letter-packet. He reads four of the seventeen "
        "letters — the ones most distinct from Alexios's official posture — "
        "and then sets them in order by date. He says: "
        "'While Alexios was managing the Crusader armies frontally, "
        "Eirene was maintaining the Orthodox frontier relationships from "
        "the other direction. The Alexiad mentions her at his bedside. "
        "It does not mention this.' He looks at the packet. "
        "'Anna knew. She chose the literary account of the devoted wife. "
        "This is the administrative account of the working diplomat.' "
        "He begins writing the intake record. "
        "'Diplomatic Records — Imperial Consort Parallel Track. "
        "Cross-reference: Alexiad, Alexios I's Bulgarian church policy, "
        "First Crusade diplomatic management. The official record "
        "and the parallel record are now both in the archive.'",
        "WM",
        "You let Sweelinck work. The cross-references are specific and "
        "the filing is accurate. Eirene's seventeen letters are in the archive. "
        "The parallel diplomatic track is documented. "
        "The Alexiad's account of the devoted wife at the bedside "
        "is not diminished by the letters — it is completed by them.",
        "You add something about Anna's choice not to mention the letters. "
        "Sweelinck looks up briefly. He says: 'She was writing about her father. "
        "She was not required to write everything about her mother.' "
        "He continues writing.",
        "WIS", 11,
        checkPassFlag="ist_c8a5",
        activateCond="ist_c8a4",
        questComplete=True,
    )

    # ── Cycle 9: The People's Crusade Inventory ────────────────────────────────
    # Theme: The provision ledger that contradicts the accusation;
    #        charity documented against ingratitude's claim;
    #        the Byzantine administrative record as diplomatic counter-evidence.
    # Route: CON → AOI → WM
    print("\n-- Cycle 9: The People's Crusade Inventory --")

    quest(
        "ist_c9a1",
        "The Quartermaster's Register",
        "The Byzantine imperial administrative archive in Constantinople "
        "holds the provisions inventory for what the court called "
        "'the barbarian pilgrimage host': Peter the Hermit's People's Crusade. "
        "The inventory records exactly what Alexios provided: "
        "twenty-three barges of grain, eight hundred cattle, "
        "seven hundred and forty horses for the mounted contingent, "
        "three hundred and twelve military escorts as far as the Bosphorus crossing, "
        "and a formal written guarantee of safe passage through Byzantine territory "
        "issued over Alexios's own seal. The Crusader account of this same period "
        "describes Byzantine 'treachery' and 'hostility' to the pilgrimage. "
        "The inventory is dated. The Crusader account is not. "
        "The senior archivist, Kōnstantinos Botaneiates, wants it in a Western "
        "archive before the diplomatic situation makes it impossible to transfer. "
        "Current Latin-Byzantine relations are fragile. The inventory "
        "is documentation of good faith that no longer has political use in Constantinople. "
        "It might have use in Weimar.",
        "CON",
        "You read the commission fully. The inventory is not a counterattack — "
        "Botaneiates is not asking you to publish it against the Crusader account. "
        "He is asking you to preserve the primary document in a location "
        "where it will be accessible when the historical record is eventually sorted. "
        "You take it.",
        "You ask what you should do if Crusader representatives intercept it. "
        "He says: 'Complete the commission.' He does not explain what that means "
        "in practical terms. You take the inventory.",
        "WIS", 12,
        checkPassFlag="ist_c9a1",
    )

    quest(
        "ist_c9a2",
        "The Latin Merchant's Report",
        "A Venetian merchant at the Galata Quarter docks — part of the permanent "
        "Venetian commercial presence in Constantinople — has seen "
        "the archivist's administrative preparations for document transfer. "
        "He does not know the contents but he knows the Byzantine imperial "
        "archive is preparing a document for Western transfer, and he knows "
        "the Hospitaller Archive in Rhodes has an active interest in any "
        "Byzantine documentation of the First Crusade period. "
        "He is writing a notification to his Hospitaller contact. "
        "He has not sent it yet. He is at the dock-side writing table "
        "completing it when you leave the archive district.",
        "CON",
        "You pass through the dock district without stopping. "
        "You take the eastern passage — the longer route — "
        "that avoids the Venetian commercial area. "
        "The merchant completes his notification and sends it, "
        "but his description of the document is based on what he observed "
        "from the archive district, not on knowledge of the contents. "
        "The notification will reach Rhodes after you do.",
        "You pass through the dock district at the direct route. "
        "The merchant sees you carrying the document case and his notification "
        "includes a description of its size and weight. "
        "The Rhodes contact will know exactly what to look for.",
        "DEX", 12,
        checkPassFlag="ist_c9a2",
        activateCond="ist_c9a1",
    )

    quest(
        "ist_c9a3",
        "The Authenticity Challenge",
        "At Ancona, a Crusader-sympathizer scholar, Brother Simone of Ferrara, "
        "has been alerted by the Venetian notification and is waiting at the "
        "port. He has a theory: Byzantine administrative records of the "
        "First Crusade period are systematically forged to shift historical blame. "
        "He has written a tract arguing this. He believes the inventory "
        "you are carrying is a 13th or 14th-century forgery created "
        "to counter the Crusader narrative. He is wrong. "
        "He is articulate and wrong.",
        "AOI",
        "You tell him forgery allegations require specific evidence of anachronism — "
        "vocabulary not attested before a certain date, administrative form "
        "inconsistent with the period's protocols, seal technology not available "
        "to the claimed date. You name three features of the inventory "
        "that are consistent with 1096 Byzantine administrative practice "
        "and inconsistent with any 13th or 14th-century forgery's likely method. "
        "He does not have specific evidence. He has a general theory. "
        "A general theory is not evidence of a specific document's inauthenticity. "
        "He is not satisfied but he cannot compel you.",
        "He makes his case with enough specific detail that you need time "
        "to address each point. You do address them. "
        "He is still not satisfied but he releases you. "
        "He has taken notes on your answers that he will include in his tract.",
        "INT", 14,
        checkPassFlag="ist_c9a3",
        activateCond="ist_c9a2",
    )

    quest(
        "ist_c9a4",
        "Brother Simone's Hired Man",
        "Brother Simone sent a hired man ahead while you were arguing. "
        "He is at the road gate out of Ancona. "
        "He has a written instruction from Brother Simone asserting "
        "that the document you carry is suspicious material requiring "
        "ecclesiastical review under the Ferrara diocese's inquisitorial "
        "authority. The written instruction has the Ferrara bishop's seal. "
        "The hired man is holding it out. He is also holding a sword. "
        "The bishop's seal does not extend to road interdiction. "
        "The hired man is not a lawyer.",
        "AOI",
        "You hear him shifting his weight when you are still thirty yards "
        "from the gate — the gravel speaks. He has positioned himself "
        "facing the direct road; you approach from the gate's blind side. "
        "He turns too late. The fight is brief and the written instruction "
        "lands in the road. You leave it there.",
        "He has the gate and the initiative. The fight takes longer. "
        "The gate-keeper at the Ancona city gate has heard enough "
        "to ask questions when you finally pass through.",
        "WIS", 12,
        checkPassFlag="ist_c9a4",
        activateCond="ist_c9a3",
        monster="hired_sword",
        monsterHP=22,
        monsterAC=13,
    )

    quest(
        "ist_c9a5",
        "What Alexios Provided",
        "Archivus Sweelinck reads the provisions inventory carefully. "
        "He reads it with the attention of a man who has spent a career "
        "understanding what numbers in primary documents mean. "
        "Twenty-three barges. Eight hundred cattle. Seven hundred and forty horses. "
        "Three hundred and twelve military escorts. "
        "He sets it down. He says: 'The Crusader account of this period says "
        "Alexios provided nothing and obstructed everything. "
        "This document lists what he provided.' He picks up his pen. "
        "'Diplomatic Records — First Crusade Period — Byzantine Provision Evidence. "
        "Cross-reference: the Nicaea Receipt, IST-02. The provision inventory "
        "predates the Nicaea negotiation by one year. Together they constitute "
        "the Byzantine primary record of what cooperation with the First Crusade "
        "actually consisted of, from the providing party's administrative record.' "
        "He closes the inventory. 'The Crusader account of Byzantine betrayal "
        "will be read differently when there is a shelf next to it labeled "
        "what Alexios actually sent.'",
        "WM",
        "You let Sweelinck finish the category. The cross-reference to IST-02 "
        "is correct — the Nicaea receipt and the provisions inventory "
        "together constitute a primary administrative record of Byzantine "
        "actions during the First Crusade. The Crusader narrative "
        "will have company on the shelf. The archive now holds both sides.",
        "You comment on Brother Simone's forgery theory. "
        "Sweelinck looks up. He says: 'He should examine the document "
        "before he theorizes about it.' He returns to his pen.",
        "WIS", 11,
        checkPassFlag="ist_c9a5",
        activateCond="ist_c9a4",
        questComplete=True,
    )

    # ── Cycle 10: The Alexios-Bohemund Secret Channel ─────────────────────────
    # Theme: The secret diplomatic channel preserved by the middleman;
    #        letters between enemies that prove cooperation;
    #        the private record that contradicts the public account of hostility.
    # Route: CON → RHD → WM
    print("\n-- Cycle 10: The Alexios-Bohemund Secret Channel --")

    quest(
        "ist_c10a1",
        "The Kinnamos Family Letters",
        "The Kinnamos family maintained a trading house in Constantinople "
        "and Antioch simultaneously during the early 12th century — "
        "one of the few Greco-Norman trading partnerships that survived "
        "the period's political turbulence. They were the intermediaries "
        "for a private diplomatic channel between Alexios I Komnenos "
        "and Bohemund of Taranto during the years 1102–1107. "
        "Five letters from this channel survive in the family archive: "
        "three with Alexios's personal cipher, two with Bohemund's. "
        "They discuss the Antioch question in terms that presuppose "
        "mutual interest in a negotiated resolution — "
        "not alliance, not friendship, but the specific pragmatism "
        "of two men who found permanent hostility too expensive. "
        "The current family representative, Marianna Kinnamos, "
        "wants them archived before her family's house faces legal questions "
        "about why they kept secret imperial correspondence. "
        "She gives you the sealed packet and says: "
        "'My grandmother kept them because she thought they would matter. "
        "I believe she was right. The archive will know what to do with "
        "letters between two men who were publicly enemies and privately negotiating.'",
        "CON",
        "You read the commission accurately. The letters will be categorized "
        "as what they are: primary diplomatic documents from a private channel "
        "between two parties who had every political reason for that channel "
        "to be private. The archive filing will protect the Kinnamos family "
        "by making the provenance formal rather than concealed. "
        "She releases the packet. She says: 'Tell the archive "
        "my grandmother's name. Euanthia Kinnamos. She kept them "
        "because she believed the truth was more important than the politics.'",
        "You tell her the archive will document provenance including "
        "the family's custodial role. She is satisfied but she adds "
        "one condition: the archive's intake record must note "
        "that the family kept them in good faith, not for political leverage. "
        "The condition is reasonable and accepted.",
        "WIS", 12,
        checkPassFlag="ist_c10a1",
    )

    quest(
        "ist_c10a2",
        "The Constantinople Harbor Inspection",
        "Port authority has a standing inspection requirement for "
        "sealed document cases departing on Western-bound vessels. "
        "The requirement was added after a Byzantine diplomatic incident "
        "involving Venetian commercial intelligence. "
        "Your vessel is departing for Ragusa. The harbor inspector "
        "is conducting his standard inspection. He opens cases, "
        "reads the external description, confirms contents are consistent. "
        "He is not corrupt. He is thorough. "
        "The packet is sealed with two ciphers — one Byzantine imperial, "
        "one Norman — which will require escalation if he notices them.",
        "CON",
        "You present the packet as archival correspondence from a private "
        "Byzantine family transferring documents to a scholarly repository — "
        "which it is. You open the case for inspection and position "
        "the packet so the external paper wrapping is visible "
        "but not the individual seals. He checks the case dimensions, "
        "the weight, and the external label. He marks it inspected. "
        "He does not notice the seals.",
        "He opens the packet's outer wrapping. He sees the dual cipher "
        "and flags it for his superior. The superior takes forty minutes "
        "to arrive, reads the Kinnamos provenance statement, "
        "and accepts private archival transfer. You leave late.",
        "DEX", 13,
        checkPassFlag="ist_c10a2",
        activateCond="ist_c10a1",
    )

    quest(
        "ist_c10a3",
        "The Crusader Genealogist",
        "At Rhodes, a scholar named Guy de Montserrat is working "
        "on a genealogical account of the Norman Crusader houses. "
        "He has been looking for the Alexios-Bohemund correspondence "
        "for seven years and has learned from the Venetian network "
        "that it is in transit through the eastern Mediterranean. "
        "He meets you at the Mandraki harbor with the specific composure "
        "of a man who has been waiting and has prepared his argument carefully. "
        "He believes the letters prove Byzantine collaboration with "
        "the Norman house against the interests of the Jerusalem Crusader states. "
        "He wants to publish this argument. "
        "He needs the letters to do it responsibly. "
        "He is not wrong that the letters are significant. "
        "He is wrong about what they prove.",
        "RHD",
        "You tell him the letters document pragmatic private negotiation "
        "between two parties with a specific territorial dispute — "
        "not Byzantine collaboration against the Crusader states, "
        "which would require evidence of communication with the "
        "Crusader states' enemies. The letters are about the Antioch question, "
        "not the Jerusalem question. His thesis requires a different document. "
        "You name what evidence would actually support his thesis. "
        "He does not have it. He knows you are correct. "
        "He is frustrated but he does not have grounds to compel access.",
        "He argues that the distinction between the Antioch question "
        "and the Jerusalem question is exactly what the letters "
        "will clarify. He wants to read them himself to confirm your analysis. "
        "You decline. He is persistent. The conversation takes time "
        "and he now knows the packet's dimensions exactly.",
        "INT", 14,
        checkPassFlag="ist_c10a3",
        activateCond="ist_c10a2",
    )

    quest(
        "ist_c10a4",
        "Guy de Montserrat's Associates",
        "Guy de Montserrat has colleagues at the Rhodes harbor. "
        "Two of them — fellow scholars, he would say; hired men, "
        "the Mandraki harbor-keeper would say — are at the harbor gate. "
        "They have been told to delay you long enough for "
        "Guy to apply for a formal inquisitorial review order "
        "from the Rhodes Hospitaller archive, which might take "
        "three hours or might not succeed but will definitely "
        "delay your departure. They are not going to attack you. "
        "They are going to ask questions and stand in the way.",
        "RHD",
        "You see the second man's position — around the corner "
        "of the harbor office, where he can see the gate "
        "without being seen from the dock. You understand "
        "the delay strategy before either of them speaks. "
        "You pass through the gate before they can establish "
        "their questioning position. One of them calls after you. "
        "You are already at the dock.",
        "They establish their position at the gate before you arrive. "
        "The questioning begins. Guy de Montserrat arrives "
        "with a preliminary review order at the fifty-minute mark. "
        "The order is reviewed and found insufficient. "
        "You leave at the ninety-minute mark.",
        "WIS", 12,
        checkPassFlag="ist_c10a4",
        activateCond="ist_c10a3",
        monster="hostile_scholars",
        monsterHP=18,
        monsterAC=12,
    )

    quest(
        "ist_c10a5",
        "Letters Between Enemies",
        "Archivus Sweelinck opens the packet. "
        "He reads the first letter — Alexios's, dated 1102, discussing "
        "the Antioch vassalage question in terms that presuppose "
        "Bohemund as a rational interlocutor rather than a conquered enemy. "
        "He reads the second letter — Bohemund's, dated 1103, "
        "using the same pragmatic register. He reads all five. "
        "He is quiet for a long time. "
        "'These men hated each other,' he says. "
        "'Anna Komnene hated Bohemund for both of them. "
        "She described him for eight pages because she could not stop looking. "
        "These letters show that Alexios could not stop negotiating with him "
        "because he was the most capable opponent Alexios had "
        "in the west for thirty years.' "
        "He sets them in order. "
        "'Diplomatic Records — Secret Channel — Byzantine-Norman Correspondence. "
        "Cross-reference: IST-01 (Bohemund's portrait), IST-04 (Devol Treaty). "
        "The portrait, the treaty, and the private letters — "
        "all three parts of the same relationship are in the archive now.' "
        "He writes Euanthia Kinnamos's name in the intake record. "
        "'She kept them because she believed the truth was more important "
        "than the politics. The archive agrees.'",
        "WM",
        "You let Sweelinck write the cross-reference. "
        "The three documents — Anna's eight-page portrait of Bohemund, "
        "the Treaty of Devol, and the five private letters — "
        "are now in the archive together. The public account "
        "of the Byzantine-Norman relationship is now beside "
        "its own private record. "
        "The truth was more important than the politics. "
        "Euanthia Kinnamos was right.",
        "You mention Guy de Montserrat's theory about collaboration "
        "against the Crusader states. Sweelinck looks up. "
        "He says: 'Tell him to come to the archive and read the letters. "
        "They will correct his theory for him.' "
        "He returns to writing.",
        "WIS", 11,
        checkPassFlag="ist_c10a5",
        activateCond="ist_c10a4",
        questComplete=True,
    )

    print("\n=== IST cycles 8–10 complete. 3 cycles, 15 acts. ===")

if __name__ == "__main__":
    main()
