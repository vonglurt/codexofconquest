#!/usr/bin/env python3
"""§PASS4-EXTRA-TBS: Knight in the Panther's Skin cycles 8–9 (Pass 4 extra cycles)
   Source: Rustaveli, c.1225 — memory-processed (source text not acquired)
   Angles: The Poet's Dedication (c.8), The Kajeti Ledger (c.9)
"""

import requests, subprocess

BASE = "http://localhost:1367"
NPC  = "archivus_sweelinck"
BOOK = "TBS"

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
        "TBS pass 4 extra cycles. Knight in the Panther's Skin, Rustaveli. "
        "Cycles 8 and 9. The Poet Dedication, The Kajeti Ledger."
    )

    # ── Cycle 8: The Poet's Dedication ────────────────────────────────────────
    # Theme: The dedication as political document; what the poet meant as tribute
    #        becomes what others read as power-claim; the preface is more
    #        dangerous than the poem.
    # Route: TIF → DAM → WM
    print("\n-- Cycle 8: The Poet's Dedication --")

    quest(
        "tbs_c8a1",
        "The Dedication Copy",
        "Giorgi Tsereteli, a scholar in Tbilisi's Georgian literary quarter, "
        "holds the oldest manuscript copy of Rustaveli's dedication to Queen Tamar — "
        "the preface to the Knight in the Panther's Skin, written in Rustaveli's "
        "own name, declaring that he composed the poem in the queen's service "
        "and with her court's active participation. The dedication names "
        "specific courtiers, names specific occasions, and contains a phrase "
        "that a local lord's legal team has identified as confirmation "
        "of an alliance between Queen Tamar's court and the lord's ancestor. "
        "They have sent a representative to the scholarly quarter "
        "to 'review' the manuscript. Tsereteli wants it out of Tbilisi "
        "and in a Western archive before the review arrives. "
        "'It is a literary dedication,' he says. 'Not a political instrument. "
        "But explaining that to a lord's legal team requires time "
        "I do not have.' He wraps the manuscript copy and gives it to you. "
        "'The Weimar archive will know what it is.'",
        "TIF",
        "You read the full situation. The dedication will be misread "
        "as political because the legal team needs it to be political. "
        "Getting it to an archive that will receive it correctly "
        "is the only way to prevent it being entered into evidence "
        "as a deed of political alliance. You take it. "
        "You leave the scholarly quarter before the representative arrives.",
        "You ask Tsereteli what the lord's specific claim is. "
        "He explains. The explanation takes time. "
        "By the time you leave, the representative is already "
        "in the scholarly quarter asking questions.",
        "WIS", 12,
        checkPassFlag="tbs_c8a1",
    )

    quest(
        "tbs_c8a2",
        "The Lord's Representative",
        "The legal representative found the scholarly quarter faster "
        "than Tsereteli expected — he had a different entry point. "
        "He has learned that a document matching the dedication's description "
        "has left the building. He has posted a man at the southern road "
        "out of the quarter and is working his way north. "
        "He is not going to confront you directly — he would rather establish "
        "a legal basis for retrieval. He is looking for your position. "
        "He is also sending a message to Tbilisi's municipal court "
        "for a provisional custody order on the document "
        "while the legal question of its classification is determined.",
        "TIF",
        "You take the Monastery Quarter route — longer but completely "
        "outside the area the representative is covering. "
        "You exit Tbilisi's southern gate through the trade district "
        "where document carriers are common enough to be unremarkable. "
        "The provisional custody order is granted at the municipal court "
        "thirty minutes after you are on the road south.",
        "You take the direct route. You cross the representative's "
        "search path at the southern quarter junction. "
        "He does not see your face but he sees the document case's shape "
        "and sends a description ahead by fast rider.",
        "DEX", 13,
        checkPassFlag="tbs_c8a2",
        activateCond="tbs_c8a1",
    )

    quest(
        "tbs_c8a3",
        "The Persian Translator",
        "At Damascus, a Persian scholar named Amin al-Tabriz has heard "
        "about the Rustaveli dedication manuscript from the Tbilisi scholarly "
        "network. He has been working on a comparative study of "
        "Persian and Georgian royal panegyric forms — the dedication "
        "is exactly the kind of document he needs. He does not want to "
        "take it. He wants to copy it. He wants to publish his "
        "analysis with a full translation into Arabic. "
        "He has good reasons. His analysis would be good scholarship. "
        "His publication would also establish, in academic form, "
        "the specific phrase the Georgian lord's legal team is "
        "relying on — in a published scholarly context, "
        "which gives it more weight than a private claim.",
        "DAM",
        "You tell him the document is in legal transit to a specific archive "
        "and cannot be copied or studied en route — this is the standard "
        "condition for archival transfer of disputed documents. "
        "You offer him the archive's address and tell him he may apply "
        "for formal access once the document is received and catalogued. "
        "His analysis will have stronger scholarly standing citing "
        "an archived primary document than citing a manuscript "
        "seen in a courier's possession. He is not satisfied but "
        "he understands the argument.",
        "He wants to copy just the dedication's opening stanza. "
        "You decline. He wants to copy the poem's title page only. "
        "You decline. The negotiation takes time and he has noted "
        "every item visible on the document case's exterior.",
        "CHA", 14,
        checkPassFlag="tbs_c8a3",
        activateCond="tbs_c8a2",
    )

    quest(
        "tbs_c8a4",
        "The Hired Interceptor",
        "The Georgian lord's legal team, having failed to retrieve "
        "the dedication in Tbilisi, has sent a faster man by a different route "
        "who has arrived on the Damascus-Weimar road ahead of you. "
        "He is at the waystation junction north of Damascus. "
        "He has a provisional custody document in Georgian "
        "that has been counter-stamped by a Tbilisi municipal officer. "
        "The document may or may not have legal standing in the "
        "jurisdiction you are currently traveling through. "
        "He is not going to debate this. He is going to take "
        "the dedication by whatever means the situation requires.",
        "DAM",
        "You see his position at the junction before you commit to "
        "the main waystation approach. He has placed himself "
        "on the direct route. There is a secondary livestock track "
        "on the eastern side that connects to the same northern road "
        "two miles ahead. He has not covered the secondary track. "
        "You are through before he realizes which road you took.",
        "He has covered both approach routes. The fight happens "
        "at the junction. The custody document lands in the road. "
        "You continue north without it.",
        "WIS", 12,
        checkPassFlag="tbs_c8a4",
        activateCond="tbs_c8a3",
        monster="hired_sword",
        monsterHP=24,
        monsterAC=14,
    )

    quest(
        "tbs_c8a5",
        "The Dedication Filed",
        "Archivus Sweelinck reads Rustaveli's dedication to Queen Tamar. "
        "He reads it carefully and slowly, as he reads everything. "
        "He sets it down. He says: 'This is the oldest copy of the "
        "dedication in any Western collection. Possibly in any collection "
        "outside Georgia.' He looks at you. 'And a local lord wants it "
        "as a property deed.' He does not phrase this as a question. "
        "He picks up his pen. "
        "'Literary Records — Medieval Georgian — Royal Panegyric. "
        "Rustaveli's dedication to Queen Tamar, c.1207. "
        "A literary tribute in the Persian qasida tradition adapted "
        "for Georgian court poetry — not a political deed, not a statement "
        "of alliance, not an instrument of any kind other than literary. "
        "Filed under the poet's name and the patron's name. "
        "Cross-reference: TBS cycles 1-7, which derive from the poem "
        "the dedication introduces.' He writes the notation "
        "in the margin of the intake record: 'A dedication is a literary act. "
        "It does not transfer property, create alliances, or bind successors.' "
        "He closes the manuscript. 'The lord can read that notation "
        "when he applies for access.'",
        "WM",
        "You let Sweelinck write the notation. The dedication is filed "
        "correctly. The lord's legal claim has lost its documentary basis. "
        "Tsereteli's scholarship is in the archive where it belongs. "
        "The poem's preface is more dangerous than the poem — "
        "but the archive knows how to file both.",
        "You add something about the poet's intention. "
        "Sweelinck looks up. 'Intent is for the literary scholars. "
        "I file what the document is.' He returns to his pen.",
        "WIS", 11,
        checkPassFlag="tbs_c8a5",
        activateCond="tbs_c8a4",
        questComplete=True,
    )

    # ── Cycle 9: The Kajeti Ledger ─────────────────────────────────────────────
    # Theme: The document of captivity used as a property instrument;
    #        what the archive must refuse to be complicit in;
    #        the historical record that cannot also be a legal deed.
    # Route: TIF → CAF → WM
    print("\n-- Cycle 9: The Kajeti Ledger --")

    quest(
        "tbs_c9a1",
        "The Transaction Record",
        "An Armenian trader in Tbilisi, Hakob Mkhitaryan, has inherited "
        "a fragment of a merchant family ledger from the early 13th century. "
        "The ledger fragment records, among routine trading transactions, "
        "one extraordinary entry: the sale of a Georgian noble prisoner "
        "to the lord of the Kajeti sea-fortress for a specified price. "
        "The description of the prisoner — a noblewoman of royal Georgian "
        "blood, unnamed, taken by the western merchant — "
        "is consistent with the story of Nestan-Darejan's captivity "
        "as told in the Knight in the Panther's Skin. "
        "A succession claimant in the territories east of Tbilisi "
        "has discovered the ledger through Mkhitaryan's family records "
        "and is claiming it as documentary proof of ownership "
        "of assets including the Kajeti sea-routes and fortress sites "
        "that passed through the transaction chain. "
        "Mkhitaryan wants the ledger archived to neutralize the claim — "
        "an archive receipt is a scholarly receipt, not a legal one. "
        "'If the archive receives it as a historical document,' he says, "
        "'the claimant cannot also enter it as a deed of property.' "
        "He gives you the ledger fragment and says: "
        "'This records a crime. Not a sale.'",
        "TIF",
        "You read the commission fully. Mkhitaryan is right: "
        "a Weimar archive receipt would classify the ledger "
        "as a historical document — evidence of a historical act "
        "of captivity, not a live property claim. "
        "The archive cannot be complicit in a property claim "
        "based on captivity records. You take the ledger. "
        "You tell him the archive will note: historical document of "
        "captivity, not a legal instrument.",
        "You ask what the claimant's specific legal theory is. "
        "Mkhitaryan explains. The explanation takes time. "
        "A man you saw in the street while you were talking "
        "is now walking in the same direction you will be walking.",
        "WIS", 12,
        checkPassFlag="tbs_c9a1",
    )

    quest(
        "tbs_c9a2",
        "The Claimant's Legal Agents",
        "Two men from the succession claimant's legal team "
        "are in Tbilisi's trade district between the Mkhitaryan "
        "family house and the northern road out of the city. "
        "They have a written authority from the regional court "
        "to retrieve documents belonging to the Mkhitaryan family "
        "that may be relevant to pending property proceedings. "
        "The authority has been issued in good faith by a court "
        "that does not yet know the document is a ledger entry "
        "recording an act of captivity. "
        "The legal team knows exactly what they are retrieving and why.",
        "TIF",
        "You tell them the ledger fragment is already in archival transit — "
        "a commitment to scholarly archive transfer made before "
        "the court authority was issued, which takes precedence "
        "under standard documentation transfer protocols. "
        "The court authority covers documents in Mkhitaryan's possession, "
        "not documents already committed to archival transit. "
        "They look at each other. The argument is correct. "
        "They do not have a response to it. You continue.",
        "They insist the court authority applies regardless of "
        "any informal transit commitment. You argue the protocol. "
        "The argument takes forty minutes and they send a rider "
        "to the court for clarification. You leave while the rider is riding.",
        "CHA", 13,
        checkPassFlag="tbs_c9a2",
        activateCond="tbs_c9a1",
    )

    quest(
        "tbs_c9a3",
        "The Genoese Notary",
        "At Caffa, the succession claimant has applied for a Genoese "
        "notarial certification of the ledger fragment as a property document. "
        "The Genoese factor quarter maintains a notarial office "
        "that certifies commercial documents from the eastern trade routes. "
        "The claimant's agent has presented the notary with an argument: "
        "the ledger records a commercial transaction; commercial transactions "
        "create chains of legal title; the Genoese notary certifying "
        "the transaction as valid would give the claimant's title "
        "standing in Genoese commercial law. "
        "The notary is a careful man. He has not yet certified it. "
        "He is holding both documents — the ledger fragment and the "
        "claimant's title application — and he is uncertain. "
        "He has heard that an archival transfer is also in progress. "
        "He wants to understand the conflict before he certifies anything.",
        "CAF",
        "You tell him the ledger records an act of captivity "
        "under Georgian medieval law, which classified such captivity "
        "as illegal seizure rather than commercial transaction. "
        "A Genoese notarial certification of an illegal seizure "
        "as a commercial transaction would make the notary complicit "
        "in converting a crime into a deed of property. "
        "The notary looks at you. He looks at the ledger. "
        "He says: 'Illegal seizure.' He sets down his pen. "
        "'I will not certify this.' He returns both documents "
        "to the claimant's agent. 'Find a different document.'",
        "He is not certain about the Georgian law classification. "
        "You argue the point in detail. He is persuaded eventually "
        "but it takes long enough that the claimant's agent has "
        "sent word to his principal that the certification is delayed.",
        "INT", 14,
        checkPassFlag="tbs_c9a3",
        activateCond="tbs_c9a2",
    )

    quest(
        "tbs_c9a4",
        "The Claimant's Last Option",
        "The claimant's agent, having lost the notarial certification, "
        "has resorted to direct action. A hired man is at the Caffa "
        "harbor gate — the only exit toward the western routes "
        "to Weimar — with a straightforward instruction: "
        "take the ledger fragment by force. "
        "He is large and he is angry on behalf of his employer "
        "and he has been standing at the gate since morning "
        "with the specific patience of someone who has been paid "
        "to wait for exactly one thing to happen.",
        "CAF",
        "You see him before he sees you — he is watching "
        "the main harbor road and you approach from the "
        "factor quarter's internal passage. "
        "He commits before he has the right position. "
        "The fight happens at the gate with the harbor behind you.",
        "He has the gate and the direct road. The fight happens "
        "in the gate opening. The harbor-keeper sees it and "
        "will have questions when you board.",
        "WIS", 12,
        checkPassFlag="tbs_c9a4",
        activateCond="tbs_c9a3",
        monster="hired_enforcer",
        monsterHP=30,
        monsterAC=15,
    )

    quest(
        "tbs_c9a5",
        "Historical Record — Not a Deed",
        "Archivus Sweelinck reads the ledger fragment. "
        "He reads the transaction entry: the specific date, the description "
        "of the prisoner, the price, the destination. "
        "He is quiet for a long time. "
        "'This is a crime,' he says. 'Documented in a commercial ledger "
        "by the person who profited from it. "
        "And someone wants to use it as a deed of property.' "
        "He sets it on the table. "
        "'Historical Records — Documents of Captivity. "
        "The archive receives this as a primary document "
        "of a specific illegal act of captivity, c.1200s, "
        "recording the forced transfer of a Georgian noblewoman. "
        "Cross-reference: TBS cycles 1-7, the Knight in the Panther's Skin — "
        "the events this ledger documents, and the rescue that followed, "
        "are the subject of Rustaveli's poem. The poem is in the archive. "
        "The crime the poem describes is now in the archive too.' "
        "He writes one more line in the intake record: "
        "'Receipt by this archive does not constitute evidence of "
        "property title. A record of illegal captivity is not a deed. "
        "Any legal claim based on this document should cite "
        "this notation alongside the document itself.' "
        "He closes the ledger. "
        "'The claimant can read that when he applies for access.'",
        "WM",
        "You let Sweelinck write the notation. "
        "The crime is documented. The archive knows what it is. "
        "The claimant's property claim has lost its instrument — "
        "the archive has received the ledger, but the receipt "
        "includes its own refusal to be complicit. "
        "Hakob Mkhitaryan's family is protected. "
        "The historical record is filed correctly.",
        "You mention the claimant's legal team and what they tried. "
        "Sweelinck writes a second notation: "
        "'This document was subject to suppression and conversion attempts "
        "during archival transfer. Both attempts failed.' "
        "He looks at you. 'The archive records its own provenance.' "
        "He closes the intake file.",
        "WIS", 11,
        checkPassFlag="tbs_c9a5",
        activateCond="tbs_c9a4",
        questComplete=True,
    )

    print("\n=== TBS cycles 8–9 complete. 2 cycles, 10 acts. ===")

if __name__ == "__main__":
    main()
