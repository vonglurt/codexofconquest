#!/usr/bin/env python3
"""§IMPORT-CID: Chronicle of the Cid (Anon, Southey tr.) — 7 cycles, 35 acts
   Nodes: BGZ (Burgos), TOL (Toledo), CDN (Cardeña), VLC (Valencia)
   Uses existing: CON, VEN, NUE
"""

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

def ensure_npc(key, name, occupation, node):
    check = requests.get(BASE + f"/api/npc/{key}")
    if check.status_code == 200:
        print(f"  NPC (exists): {key} — {name}")
        return
    api("post", "/api/npc", json={"key": key, "name": name, "occupation": occupation, "node": node})
    print(f"  NPC: {key} — {name} @ {node}")

def quest(id, title, desc, activateNode, passText, failText, checkStat, checkDC,
          npc=None, checkPassFlag=None, activateCond=None, questComplete=False,
          monster=None, monsterHP=None, monsterAC=None, quest_type=None):
    check = requests.get(BASE + f"/api/quest/{id}")
    if check.status_code == 200:
        print(f"  SKIP (exists): {id}")
        return
    nonce_r = api("post", "/api/nonce", json={"type": "quest", "id": id})
    nonce = nonce_r["nonce"]
    if quest_type:
        q_type = quest_type
    elif monster and not checkStat:
        q_type = "combat"
    else:
        q_type = "skill_check"
    payload = {
        "id": id, "type": q_type, "title": title, "desc": desc,
        "activateNode": activateNode,
        "passText": passText, "failText": failText,
        "checkStat": checkStat, "checkDC": checkDC,
    }
    if npc:            payload["npc"]           = npc
    if checkPassFlag:  payload["checkPassFlag"]  = checkPassFlag
    if activateCond:   payload["activateCond"]   = activateCond
    if questComplete:  payload["questComplete"]  = True
    if monster:        payload["monster"]        = monster
    if monsterHP:      payload["monsterHP"]      = monsterHP
    if monsterAC:      payload["monsterAC"]      = monsterAC
    api("post", "/api/quest", json=payload, headers={"X-Nonce": nonce})
    print(f"  OK: {id} — {title}")

def main():
    say("§IMPORT CID. Chronicle of the Cid. Seven cycles. Thirty-five acts. Burgos, Toledo, Valencia, Weimar.")

    print("=== §IMPORT-CID: Chronicle of the Cid — 7 cycles, 35 acts ===\n")

    # ─── Nodes ───────────────────────────────────────────────────────────────
    print("-- Nodes --")
    create_node("BGZ", "city", "Burgos — Castilian Royal City",
        act=1, r=154, c=127,
        desc="The Castilian royal court city; starting point of the Cid's first exile. "
             "Inn yards, counting houses, moneylenders, and the road south through Rioja.")
    create_node("TOL", "city", "Toledo — Castilian Royal Capital",
        act=1, r=161, c=130,
        desc="The royal capital of Castile where Alfonso VI holds his Cortes. "
             "Court buildings, the archive district, and the great hall of assembly.")
    create_node("CDN", "camelot", "Cardeña — San Pedro de Cardeña Monastery",
        act=1, r=153, c=129,
        desc="The Benedictine monastery of San Pedro de Cardeña outside Burgos, "
             "where the Cid left his wife and daughters at the start of his exile "
             "and where his body came to rest at the end of his life.")
    create_node("VLC", "city", "Valencia — El Cid's Captured City",
        act=1, r=158, c=185,
        desc="The great eastern city the Cid took after a months-long siege. "
             "Palace district, the lionkeeper's quarters, harbor, and the high tower "
             "from which Rodrigo showed Ximena her inheritance.")

    # ─── NPCs ─────────────────────────────────────────────────────────────────
    print("\n-- NPCs --")
    ensure_npc("martin_antolinez_cid", "Martin Antolinez",
        "The good Burgalese; the one man in the city willing to help on the first night of exile",
        "BGZ")
    ensure_npc("salim_lionkeeper", "Salim",
        "Valencia palace lionkeeper; wrote the incident record the morning after the lion escaped",
        "VLC")
    ensure_npc("toledo_court_archivist", "The Court Archivist",
        "King's senior clerk at Toledo; has held the Santa Gadea middle copy for three years without declaring it",
        "TOL")
    ensure_npc("felez_munoz_cid", "Felez Muñoz",
        "The Cid's nephew; turned back at the road junction and found his cousins in the oak forest",
        "CDN")
    ensure_npc("kings_senior_clerk_cid", "The King's Senior Clerk",
        "Court clerk who recorded the Toledo Cortes three demands in real time and added a note afterward",
        "TOL")
    ensure_npc("gil_diaz_cid", "Gil Díaz",
        "Valencia's converted Moorish Alcalde; built the frame that carried the Cid's body nine stages to Cardeña",
        "VLC")
    ensure_npc("unnamed_nobleman_cid", "The Nobleman",
        "An unnamed Castilian nobleman traveling from Burgos to Toledo with a sealed deposition and a vow-cord in his beard",
        "BGZ")

    # ─── Cycle 1: The Cord and the Beard ─────────────────────────────────────
    say("Cycle one. The Cord and the Beard. Burgos to Toledo. Five acts.")
    print("\n-- Cycle 1: The Cord and the Beard (BGZ→TOL) --")

    quest(
        id="cid_c1a1", npc="unnamed_nobleman_cid",
        title="Three Riders on the Ridge",
        desc=(
            "Morning. The inn yard at Burgos. The Nobleman's servants load three mules. "
            "The Nobleman comes out and binds a cord of plaited black horsehair in his beard — "
            "a vow-cord, worn until the vow is discharged. Three riders appear on the ridge "
            "above the road and hold position, matching your pace. Your employer will not leave "
            "the road or change his bearing."
        ),
        activateNode="BGZ",
        checkStat="WIS", checkDC=12,
        passText=(
            "You read the riders' pattern before they close — they are watching the deposition "
            "packet, not looking for a fight. You find a track east of the ridge before they can "
            "react. By nightfall the Nobleman eats his first full meal in a week."
        ),
        failText=(
            "The riders close at dusk and demand the deposition packet in their Count's name. "
            "The servants scatter. You find the packet at a riverside waystation, soaked but legible. "
            "The ferryman returns it for silver. You have until the riders come back."
        ),
        checkPassFlag="cidC1A1Done",
    )

    quest(
        id="cid_c1a2", npc="unnamed_nobleman_cid",
        title="The Vow-Cord at Nájera",
        desc=(
            "The road passes through Riojan country — the valley where three centuries earlier "
            "the Cid burned and raided in defiance of his king. At the waystation inn a local knight "
            "recognizes the vow-cord and takes offense. He demands the Nobleman remove it publicly "
            "or answer for it. The Nobleman stands perfectly still and will not speak."
        ),
        activateNode="BGZ",
        checkStat="CHA", checkDC=13,
        passText=(
            "You cite the law protecting court-dress under the King's protection. The knight hadn't "
            "known the vow-cord was recognized as legitimate. He backs down. In the morning "
            "he and his men are gone."
        ),
        failText=(
            "The knight draws and you interpose in time, but his men surround you. Your employer "
            "is held in a private room. You have until morning — the innkeeper is uncommitted, and "
            "one of the knight's own men looks ashamed of the arrest. Work the room."
        ),
        checkPassFlag="cidC1A2Done",
        activateCond="cidC1A1Done",
    )

    quest(
        id="cid_c1a3", npc="unnamed_nobleman_cid",
        title="The Mountain Toll",
        desc=(
            "The road climbs toward Toledo through a narrow pass. The toll-gate is manned by "
            "twenty guards, paid to delay all traffic two days. Force won't work. Your employer's "
            "court date is in three days. The delay will cause him to miss his court date."
        ),
        activateNode="TOL",
        checkStat="INT", checkDC=13,
        passText=(
            "A shepherd knows a drover's track half a league below the main road. One silver real "
            "and a promise of silence gets you through by nightfall. The Nobleman notes the track "
            "in his book without a word."
        ),
        failText=(
            "Two days lost in the cold. But your employer produces a three-day extension letter "
            "from the King's clerk — he anticipated this. The delay cost you time and coin, not the case."
        ),
        checkPassFlag="cidC1A3Done",
        activateCond="cidC1A2Done",
    )

    quest(
        id="cid_c1a4", npc="unnamed_nobleman_cid",
        title="The Night Before Court",
        desc=(
            "Toledo. The inn near the court building. At midnight the Nobleman asks you in. "
            "He tells you only this: the woman in his household was his daughter. The Counts who "
            "wronged her are powerful. Tomorrow he will make three demands in sequence — evidence "
            "first, then witnesses, then the naming. He needs to know you will be in the room. "
            "Not to threaten anyone. Just to be there. A Count's man then offers you your fee "
            "doubled to be ill in the morning."
        ),
        activateNode="TOL",
        checkStat="CHA", checkDC=12,
        passText=(
            "You decline the envelope and confirm the sight lines, identify the Counts' escorts "
            "by livery, report back with the layout. The Nobleman says: 'Good. That is all I need.' "
            "He sleeps four hours — more than he has slept since this began."
        ),
        failText=(
            "You decline the envelope. The man smiles and leaves. Your employer sees the exchange "
            "from his window and says nothing — but his hand is steady when he ties the cord back "
            "in the morning. He knows. That is enough."
        ),
        checkPassFlag="cidC1A4Done",
        activateCond="cidC1A3Done",
    )

    quest(
        id="cid_c1a5", npc="unnamed_nobleman_cid",
        title="Open Court",
        desc=(
            "The court hall. The Nobleman makes his three demands in sequence: first the evidence, "
            "then the witnesses, then the naming. At the naming, one of the Counts rises. The room "
            "goes loud. The Count's men make their procedural move — not steel, but a challenge "
            "designed to force your employer to respond before the King speaks. "
            "Your stillness is the answer."
        ),
        activateNode="TOL",
        checkStat="CON", checkDC=12,
        passText=(
            "The King's court rules the evidence admissible. The accusation is formal. "
            "On the street outside the Nobleman says only: 'My daughters will know your name.' "
            "He drops the cord into the gutter without watching it fall. Your contract is fulfilled."
        ),
        failText=(
            "The procedural challenge succeeds on a technicality. The Nobleman accepts it without "
            "visible reaction and requests a fifteen-day continuance. Granted. On the way out he says: "
            "'You'll want to know if you're needed in fifteen days.' You say yes. He nods."
        ),
        checkPassFlag="cidC1A5Done",
        activateCond="cidC1A4Done",
    )

    # ─── Cycle 2: The Pledge and the Sand ────────────────────────────────────
    say("Cycle two. The Pledge and the Sand. Burgos and Cardeña. Five acts.")
    print("\n-- Cycle 2: The Pledge and the Sand (BGZ→CDN→BGZ) --")

    quest(
        id="cid_c2a1", npc="martin_antolinez_cid",
        title="The Counting House",
        desc=(
            "Evening. Raquel and Vidas' counting house in Burgos. Two iron-bound chests on the floor. "
            "Candles on the table. Martin Antolinez presents the arrangement: the Cid's goods, sealed "
            "under oath, too valuable to move tonight — 600 marks against two locked chests. "
            "Vidas stands and moves toward the chests to weigh them. "
            "If he registers their weight the arrangement ends here."
        ),
        activateNode="BGZ",
        checkStat="CHA", checkDC=12,
        passText=(
            "You set the written terms in front of Vidas before he takes another step. "
            "'The weight certification is in the clause.' He reads it twice. He doesn't lift the chest. "
            "Raquel signs first. You receive the Counterpart Loan Receipt — sealed folio."
        ),
        failText=(
            "Vidas' hand closes on the chest handle. He lifts it six inches. His expression changes. "
            "Martin Antolinez speaks before he does — 'The seal is the protection; once broken on your "
            "floor the oath transfers to you.' Vidas sets the chest down. The receipt is signed."
        ),
        checkPassFlag="cidC2A1Done",
    )

    quest(
        id="cid_c2a2", npc="martin_antolinez_cid",
        title="The Night Road to Cardeña",
        desc=(
            "After midnight. The Burgos postern gate. Martin Antolinez has the coin. "
            "You have the counterpart receipt — the only document that proves the loan was entered honestly. "
            "Alfonso's patrols have been doubled since the exile proclamation. The patrol checkpoint "
            "is a mile out where the road narrows between two stone walls."
        ),
        activateNode="CDN",
        checkStat="DEX", checkDC=12,
        passText=(
            "The wall shadow takes you fifty yards past the checkpoint before they turn back. "
            "You hear the lantern behind you, receding. Five leagues to Cardeña. The Cid is waiting."
        ),
        failText=(
            "They stop you. Martin Antolinez speaks — he is from Burgos, they know his family, "
            "the coin is alms for Cardeña's poor box. They let you through with a warning. "
            "The receipt stayed in your pack and they never asked about it."
        ),
        checkPassFlag="cidC2A2Done",
        activateCond="cidC2A1Done",
    )

    quest(
        id="cid_c2a3", npc="martin_antolinez_cid",
        title="The Bridge",
        desc=(
            "Open Castilian country, six months later. The Cid's first campaign has yielded "
            "conquest-gold and Martin Antolinez has assembled the repayment. You are the courier, "
            "riding back toward Burgos. A count's road agent stops the party at a bridge. "
            "He knows what he's looking for: a receipt with two Burgalese names and the Cid's mark. "
            "If he takes it to the crown magistrate the repayment becomes a confession, not a discharge."
        ),
        activateNode="BGZ",
        checkStat="INT", checkDC=13,
        passText=(
            "His jurisdiction covers cargo, not sealed correspondence. You cite chapter and toll. "
            "He knows you're right and waves the party through. The receipt stays sealed."
        ),
        failText=(
            "He insists on inspection rights. You let him read the terms but not the names. "
            "He copies three words and waves you through. Those three words are now on the road south ahead of you."
        ),
        checkPassFlag="cidC2A3Done",
        activateCond="cidC2A2Done",
    )

    quest(
        id="cid_c2a4", npc="martin_antolinez_cid",
        title="The Poplars",
        desc=(
            "Two leagues from Burgos. Three riders in a stand of poplars waiting for the receipt. "
            "No livery. Acting on private instruction — if the receipt never reaches Burgos, "
            "the transaction never closes and the open loan becomes a standing fraud. "
            "They want the document, not blood — but they'll take what they need to get it."
        ),
        activateNode="BGZ",
        checkStat="STR", checkDC=13,
        quest_type="combat",
        monster="hired_rider", monsterHP=22, monsterAC=13,
        passText=(
            "Both riders are down. The receipt is intact. Martin Antolinez checks the seal — "
            "unbroken. 'Good,' he says."
        ),
        failText=(
            "They take the receipt. But Martin Antolinez holds the moneylenders' copy — "
            "the original Raquel and Vidas signed. The transaction can still close if you "
            "reach them first. You arrive at the counting house ahead of the count's men by one hour."
        ),
        checkPassFlag="cidC2A4Done",
        activateCond="cidC2A3Done",
    )

    quest(
        id="cid_c2a5", npc="martin_antolinez_cid",
        title="The Second Meeting",
        desc=(
            "Morning. Raquel and Vidas' counting house. The repayment on the table. "
            "Vidas counts the coin twice. He counts it a third time. He nods to Raquel. "
            "Raquel takes the key from her belt and opens the first chest. Sand. "
            "The second chest: sand. Vidas is looking at the coin. He is deciding. "
            "A Christian merchant is watching from the doorway."
        ),
        activateNode="BGZ",
        checkStat="WIS", checkDC=11,
        passText=(
            "Vidas burns his copy. Martin Antolinez says: the counterpart. You place it on the "
            "candle flame. The merchant in the doorway has already turned away. "
            "Raquel says: 'The Cid keeps his word.' Vidas: 'He does.' That is all that will be said of this."
        ),
        failText=(
            "The merchant in the doorway speaks first — he names the sand. Vidas looks at him, "
            "then at the coin. 'The terms were met.' He burns both receipts without speaking again. "
            "The merchant leaves. No one will say this happened."
        ),
        checkPassFlag="cidC2A5Done",
        activateCond="cidC2A4Done",
    )

    # ─── Cycle 3: The Lion and the Bench ─────────────────────────────────────
    say("Cycle three. The Lion and the Bench. Valencia to Constantinople to Weimar. Five acts.")
    print("\n-- Cycle 3: The Lion and the Bench (VLC→CON→NUE) --")

    quest(
        id="cid_c3a1", npc="salim_lionkeeper",
        title="The Keeper's Register",
        desc=(
            "Valencia palace. The lionkeeper Salim is being pressured to alter his record. "
            "The Infantes of Carrión were in the hall when the Cid's lion escaped its cage. "
            "Their servants have come twice asking whether the timing in his written account is correct. "
            "Salim gives you the vellum — a single page, the incident record written the same afternoon. "
            "He says: 'Carry it somewhere that does not have a count's factor at the gate.'"
        ),
        activateNode="VLC",
        checkStat="WIS", checkDC=11,
        passText=(
            "You understand the pattern from the two visits — the third approach will not be a visit. "
            "You leave through the harbor district before the third visit arrives. "
            "You receive The Lionkeeper's Account."
        ),
        failText=(
            "You take the vellum and leave by the main gate. A man follows from the palace district. "
            "You lose him in the market, but you lose half a day."
        ),
        checkPassFlag="cidC3A1Done",
    )

    quest(
        id="cid_c3a2", npc="salim_lionkeeper",
        title="The Count's Agent in the Port",
        desc=(
            "A Burgalese agent is at the harbor asking harborside workers if they have seen anyone "
            "with palace paperwork. He has a description of the vellum and of Salim. "
            "He does not know what you look like. He is asking workers and may ask you directly."
        ),
        activateNode="VLC",
        checkStat="CHA", checkDC=12,
        passText=(
            "He never directly approaches you. You read his movements, cross the dock at the right "
            "moment, and board your passage north."
        ),
        failText=(
            "He asks you directly. You give him a version that is technically accurate but redirecting. "
            "He accepts it, but he notes your direction. You will see him again at the first waystation."
        ),
        checkPassFlag="cidC3A2Done",
        activateCond="cidC3A1Done",
    )

    quest(
        id="cid_c3a3", npc="salim_lionkeeper",
        title="The Diplomatic Framing",
        desc=(
            "Constantinople. A Byzantine official with a general brief on Iberian political affairs "
            "wants to read the account before it is filed. His framing: if the account documents "
            "what it documents, it has diplomatic implications for the Castilian Crown's relationship "
            "with the Byzantine Church, which recently received a donation from the Infantes' family. "
            "He is not hostile. He is careful."
        ),
        activateNode="CON",
        checkStat="WIS", checkDC=12,
        passText=(
            "He accepts the archive-access distinction — a palace incident record filed in a neutral "
            "archive is publicly accessible to any scholar who requests it; his diplomatic brief can "
            "be served by reading the archived record. He says he will submit a scholarly access "
            "request after the filing."
        ),
        failText=(
            "He reads the account. He does not alter anything. He says nothing about it. "
            "But he has read it, and the knowledge is now in play."
        ),
        checkPassFlag="cidC3A3Done",
        activateCond="cidC3A2Done",
    )

    quest(
        id="cid_c3a4", npc="salim_lionkeeper",
        title="The Bosphorus Crossing",
        desc=(
            "The ferry crossing from Constantinople to the European shore in autumn swell. "
            "The vellum is a single page of fine material — vulnerable to spray. "
            "The ferry has no cover. The crossing is twelve to fifteen minutes in this chop."
        ),
        activateNode="CON",
        checkStat="CON", checkDC=11,
        passText=(
            "You cross with the document held close and dry throughout. "
            "The swell never catches your footing."
        ),
        failText=(
            "A wave-slap wets the side of your cloak. The vellum's left margin catches light spray. "
            "The ink is fast-dyed and holds; the vellum warps slightly at the corner. "
            "Sweelinck will note the water damage."
        ),
        checkPassFlag="cidC3A4Done",
        activateCond="cidC3A3Done",
    )

    quest(
        id="cid_c3a5", npc="salim_lionkeeper",
        title="The Incident Category",
        desc=(
            "Weimar Archive. Sweelinck reads the account. He reads the sequence of events carefully — "
            "who went where, what the Cid did that differed from everyone else in the room. "
            "'He woke, walked in, and took the lion by the mane,' Sweelinck says. "
            "'The lionkeeper wrote it down because that is what happened.'"
        ),
        activateNode="NUE",
        checkStat="INT", checkDC=11,
        passText=(
            "Sweelinck creates: Incident Records — Events That Settled Questions About the People Present, "
            "First Entry. The lionkeeper's account: the lion escaped the cage; the Cid walked in "
            "and took it by the mane; the archive holds it under the keeper's name, "
            "because the keeper had no stake in what the account documents."
        ),
        failText=(
            "Sweelinck files it under Valencia Palace Records — Incident Documents. "
            "Neutral and accessible but not distinctively categorized."
        ),
        checkPassFlag="cidC3A5Done",
        activateCond="cidC3A4Done",
    )

    # ─── Cycle 4: The Oath at Santa Gadea ────────────────────────────────────
    say("Cycle four. The Oath at Santa Gadea. Toledo to Venice to Weimar. Five acts.")
    print("\n-- Cycle 4: The Oath at Santa Gadea (TOL→VEN→NUE) --")

    quest(
        id="cid_c4a1", npc="toledo_court_archivist",
        title="The Court Archivist",
        desc=(
            "Toledo regional archive office. The court archivist has held the middle copy of the "
            "Santa Gadea attestation for three years in a locked chest. He has not declared it. "
            "He has not destroyed it. He has waited. He takes the copy out and sets it on his desk. "
            "He looks at you without moving it toward you. The text of the oath Alfonso VI swore "
            "on the Gospels three times — that he had no hand in his brother Sancho's murder — "
            "and the curse: 'may you die as your brother died, by the hand of a villain of your own trust.'"
        ),
        activateNode="TOL",
        checkStat="INT", checkDC=11,
        passText=(
            "You understand the three-copy structure — this is the evidentiary copy with all twelve "
            "witnesses' full names. Without it, the other two copies document the first and third oaths "
            "but not the sequence. The archivist watches you read. He nods once and hands it over. "
            "You receive The Santa Gadea Attestation."
        ),
        failText=(
            "You take the document but without grasping the three-copy structure. "
            "In Act II you will be unable to explain why this specific copy matters when challenged."
        ),
        checkPassFlag="cidC4A1Done",
    )

    quest(
        id="cid_c4a2", npc="toledo_court_archivist",
        title="The King's Chamberlain",
        desc=(
            "A royal chamberlain intercepts the road north from Toledo. He carries a letter from a "
            "royal secretary requesting that the document be returned to crown custody for permanent "
            "preservation. His framing: a document of this importance belongs in the royal archive."
        ),
        activateNode="TOL",
        checkStat="CHA", checkDC=12,
        passText=(
            "He accepts the neutral archive argument — the crown cannot serve as neutral arbiter "
            "of a record that implicates the crown's own king. He notes the document's route "
            "in his record without further interference."
        ),
        failText=(
            "He requests a receipt acknowledging the exchange and says he will forward the crown's "
            "position to Weimar directly. He does not block you. The crown's challenge will arrive "
            "ahead of the document."
        ),
        checkPassFlag="cidC4A2Done",
        activateCond="cidC4A1Done",
    )

    quest(
        id="cid_c4a3", npc="toledo_court_archivist",
        title="The Venetian Historian",
        desc=(
            "Venice. A Venetian chronicler specializing in Iberian court history has heard about "
            "the document through scholarly correspondence. He wants to publish a transcription "
            "in his chronicle immediately. His request is genuine; his intentions are scholarly."
        ),
        activateNode="VEN",
        checkStat="WIS", checkDC=12,
        passText=(
            "He accepts the archiving-before-publication sequence. Publication before archiving "
            "would subordinate the original to the transcription. He asks for the Weimar entry "
            "reference when the filing is complete."
        ),
        failText=(
            "He publishes a note about the document's existence before it reaches Weimar. "
            "Sweelinck will need to address the precedence question in the intake notes."
        ),
        checkPassFlag="cidC4A3Done",
        activateCond="cidC4A2Done",
    )

    quest(
        id="cid_c4a4", npc="toledo_court_archivist",
        title="The Alpine East Road",
        desc=(
            "The Alpine road east from Venice climbs through a section of loose limestone track "
            "where the spring rains have washed the path surface to bare rock. The formal document "
            "with its twelve witness names and Alfonso's signature cannot be allowed to crumple "
            "if you fall on wet limestone."
        ),
        activateNode="VEN",
        checkStat="DEX", checkDC=12,
        passText=(
            "You descend the limestone section carefully, hand to the cliff face at the steep sections, "
            "weight distributed forward. The attestation arrives dry."
        ),
        failText=(
            "You slip once at a steep section and your knee goes to the limestone. "
            "The pack holds steady. Your knee does not."
        ),
        checkPassFlag="cidC4A4Done",
        activateCond="cidC4A3Done",
    )

    quest(
        id="cid_c4a5", npc="toledo_court_archivist",
        title="The Curse in the Record",
        desc=(
            "Weimar Archive. Sweelinck reads the three-oath structure. He reads the curse. "
            "He sets the document down and looks at the twelve witnesses' names. "
            "'He made the king swear on the Gospels that he did not kill his brother,' Sweelinck says. "
            "'And the king swore. And three years later the king exiled him.'"
        ),
        activateNode="NUE",
        checkStat="INT", checkDC=11,
        passText=(
            "Sweelinck creates: Oath Records — The Sworn Statement Extracted at Maximum Political Cost, "
            "First Entry. The Santa Gadea attestation: the question required asking because its "
            "alternative was silence about a possible king's murder; Alfonso swore three times; "
            "the archive holds both the question and the answer and the certainty that both were "
            "offered at a cost."
        ),
        failText=(
            "Sweelinck files it under Royal Oaths — Alfonso VI. "
            "Accurate but the document's specific quality is lost in the category."
        ),
        checkPassFlag="cidC4A5Done",
        activateCond="cidC4A4Done",
    )

    # ─── Cycle 5: Corpes — The Oak Forest ────────────────────────────────────
    say("Cycle five. Corpes. The Oak Forest. Cardeña to Burgos to Weimar. Five acts.")
    print("\n-- Cycle 5: Corpes — The Oak Forest (CDN→BGZ→NUE) --")

    quest(
        id="cid_c5a1", npc="felez_munoz_cid",
        title="The Nephew's Register",
        desc=(
            "San Pedro de Cardeña monastery. Felez Muñoz is twenty-two, awake for three days, "
            "and doing his best not to show it. He found his cousins 'left to the mountain birds "
            "and the beasts' in the oak forest at Corpes and carried them out. He has written "
            "down what he found — two pages of vellum in his own hand, with two witness names "
            "on the second page. The word 'water' appears in the middle of page one. "
            "He wants someone to carry it to the Cid before any other version does."
        ),
        activateNode="CDN",
        checkStat="WIS", checkDC=11,
        passText=(
            "You understand: this document precedes the legal action at Toledo — it is the foundation "
            "of the Cortes proceeding, not commentary on it; the sequence of delivery matters. "
            "You move quickly. You receive Felez Muñoz's Account."
        ),
        failText=(
            "You carry it without grasping why the sequence matters. "
            "A faster courier reaches the Cid first with a partial account."
        ),
        checkPassFlag="cidC5A1Done",
    )

    quest(
        id="cid_c5a2", npc="felez_munoz_cid",
        title="The Infantes' Messenger",
        desc=(
            "A messenger from the Infantes of Carrión intercepts you at the monastery gate. "
            "He is polite and professional. He has a letter from the Infantes requesting any "
            "documents related to 'a recent matter of family honor' be held pending a statement "
            "from the Infante's household. The letter is addressed to the monastery, not to you."
        ),
        activateNode="CDN",
        checkStat="CHA", checkDC=12,
        passText=(
            "The letter is addressed to the monastery, not to you, and covers 'family documents' "
            "— a category the monastery's current holdings do not include. What you carry is a "
            "personal account by Felez Muñoz — not monastery property. The messenger accepts the "
            "distinction and notes your direction."
        ),
        failText=(
            "He makes the argument anyway and the monastery gatekeeper is uncertain. "
            "You are delayed two hours while the gatekeeper finds the relevant provision. "
            "He eventually agrees the letter doesn't apply."
        ),
        checkPassFlag="cidC5A2Done",
        activateCond="cidC5A1Done",
    )

    quest(
        id="cid_c5a3", npc="felez_munoz_cid",
        title="The Competing Account",
        desc=(
            "The Infantes' household has already filed a statement with Toledo court clerks. "
            "Their version describes a 'domestic correction' within the rights of the marriage compact. "
            "A court clerk on the road is carrying their version and heading toward the regional archive "
            "to register it first. The registration sequence creates a presumption of priority."
        ),
        activateNode="BGZ",
        checkStat="CHA", checkDC=12,
        passText=(
            "The clerk notes the evidentiary difference in the registration — Felez Muñoz's account "
            "was written by an eyewitness with two named witnesses; the Infantes' statement was written "
            "by their household with no independent witnesses. Both documents enter the record with "
            "equal standing."
        ),
        failText=(
            "The Infantes' statement is registered first. Felez's account is registered as a response. "
            "The sequence disadvantage will need to be argued at Toledo."
        ),
        checkPassFlag="cidC5A3Done",
        activateCond="cidC5A2Done",
    )

    quest(
        id="cid_c5a4", npc="felez_munoz_cid",
        title="The River Ford",
        desc=(
            "The road south to the Cid's location crosses a river ford running high. "
            "The two pages of vellum — Felez's account and the witnesses' names — cannot get wet. "
            "The ink on page one is ordinary. The names on page two are legally essential."
        ),
        activateNode="BGZ",
        checkStat="STR", checkDC=11,
        passText=(
            "You cross with the pages dry and both names legible — leather wrap tied shut, "
            "inside your cloak, pressed to your body, the current cold and fast at mid-crossing."
        ),
        failText=(
            "The cloak's hem catches the current and you stumble. Your arm goes out for balance. "
            "The leather wrap stays pressed to your chest. The pages are dry."
        ),
        checkPassFlag="cidC5A4Done",
        activateCond="cidC5A3Done",
    )

    quest(
        id="cid_c5a5", npc="felez_munoz_cid",
        title="What She Asked For",
        desc=(
            "Weimar Archive. Sweelinck reads the account. He reads both pages. He reads the witnesses' names. "
            "He reads the word in the middle of page one. He does not speak for a moment. "
            "'She was tied to a post and beaten and left. And when her cousin found her she asked for water.'"
        ),
        activateNode="NUE",
        checkStat="WIS", checkDC=11,
        passText=(
            "You confirm the ink and hand — the word is in the same hand as the rest, not added or annotated. "
            "Sweelinck creates: Rescue Testimony — What Was Found and What Was Asked For, First Entry. "
            "Felez Muñoz's account: he turned back at the road junction out of instinct; he found his "
            "cousins; the word 'water' in the middle of page one in the same ink and hand; "
            "the act of asking is what began the return."
        ),
        failText=(
            "Sweelinck files under Court Evidence — Corpes Incident. "
            "The document is accessible. The word is not highlighted."
        ),
        checkPassFlag="cidC5A5Done",
        activateCond="cidC5A4Done",
    )

    # ─── Cycle 6: The Toledo Cortes ───────────────────────────────────────────
    say("Cycle six. The Toledo Cortes. Toledo to Venice to Weimar. Five acts.")
    print("\n-- Cycle 6: The Toledo Cortes (TOL→VEN→NUE) --")

    quest(
        id="cid_c6a1", npc="kings_senior_clerk_cid",
        title="The Clerk's Note",
        desc=(
            "Toledo court district. The King's senior clerk — a careful man who has served three kings — "
            "has the record of the three demands Rodrigo made in open court: swords first, then the "
            "dowry gold, then the naming of the Infantes as traitors. He recorded the demands in real "
            "time. He added a note afterward in different ink: 'These three were made in sequence "
            "and the sequence was necessary.' He wants the document filed somewhere that will not "
            "require him to explain the note's addition to the crown's legal secretary."
        ),
        activateNode="TOL",
        checkStat="INT", checkDC=12,
        passText=(
            "You understand the sequence strategy: if Rodrigo had named the Infantes before the King "
            "had spoken to the evidence, the proceedings could have been terminated on procedural grounds. "
            "The three-demand sequence established the evidentiary record before requesting judgment. "
            "The clerk sees you understand. 'Good.' You receive The Three Demands Record."
        ),
        failText=(
            "You take the document without fully understanding the sequence logic. "
            "In Act II you will be unable to explain why the sequence specifically matters when challenged."
        ),
        checkPassFlag="cidC6A1Done",
    )

    quest(
        id="cid_c6a2", npc="kings_senior_clerk_cid",
        title="The Infantes' Estate",
        desc=(
            "Two of the Infantes' estate managers are watching the road from Toledo. "
            "They want the document — possession of the court record gives them leverage over "
            "how the Toledo proceedings are remembered. Their argument: the document is an internal "
            "court record and belongs to the crown's custody."
        ),
        activateNode="TOL",
        checkStat="CHA", checkDC=13,
        passText=(
            "A court document whose subject is a proceeding involving the crown's own legal errors — "
            "the marriages were arranged by Alfonso, and his judgment is part of the record — "
            "is better preserved in a neutral archive where the crown cannot exercise custody. "
            "The older estate manager turns to the younger: 'We're done here.' They go."
        ),
        failText=(
            "One of them makes a legal claim and files it with the road customs officer. "
            "The document travels with a challenge notation."
        ),
        checkPassFlag="cidC6A2Done",
        activateCond="cidC6A1Done",
    )

    quest(
        id="cid_c6a3", npc="kings_senior_clerk_cid",
        title="The Venetian Law Review",
        desc=(
            "Venice. A Venetian legal scholar has been tracking the Toledo Cortes through chronicle "
            "correspondence and wants to analyze the sequence strategy. He requests a copy for "
            "publication in a comparative legal analysis of Iberian and Mediterranean court procedures."
        ),
        activateNode="VEN",
        checkStat="WIS", checkDC=12,
        passText=(
            "He accepts the archive-citation arrangement — the value to his scholarship of having "
            "a copy versus citing an archived original is zero; the value to the archive's evidentiary "
            "quality of having the original filed before a copy circulates is not zero."
        ),
        failText=(
            "He publishes a description of the document from his correspondence sources. "
            "Sweelinck will receive the document alongside the published description."
        ),
        checkPassFlag="cidC6A3Done",
        activateCond="cidC6A2Done",
    )

    quest(
        id="cid_c6a4", npc="kings_senior_clerk_cid",
        title="The Po River Crossing",
        desc=(
            "The road north from Venice crosses the Po at a ford running fast from spring rains. "
            "The court document has a wax seal at the clerk's addition note — the bottom annotation. "
            "The seal must arrive intact. The ford is thigh-deep at the center."
        ),
        activateNode="VEN",
        checkStat="STR", checkDC=12,
        passText=(
            "You cross the deepest section with the document held steadily above your head. "
            "The seal is intact."
        ),
        failText=(
            "The current takes your footing for two steps. You recover. The document stays dry."
        ),
        checkPassFlag="cidC6A4Done",
        activateCond="cidC6A3Done",
    )

    quest(
        id="cid_c6a5", npc="kings_senior_clerk_cid",
        title="The Sequence Category",
        desc=(
            "Weimar Archive. Sweelinck reads the three demands. He reads the clerk's addition. "
            "'These three were made in sequence and the sequence was necessary.' "
            "He reads it again. 'The clerk understood the session in real time,' Sweelinck says. "
            "'He wrote down what the sequence accomplished before he had the conversation with anyone.'"
        ),
        activateNode="NUE",
        checkStat="INT", checkDC=11,
        passText=(
            "Sweelinck creates: Procedural Records — Three Demands Made in the Correct Sequence, "
            "First Entry. The Toledo Cortes three-demands record: property first, financial remedy "
            "second, legal classification third; the sequence prevented the proceedings from being "
            "terminated before the evidence was in the record; the clerk's addition is part of the "
            "document; the archive holds both the sequence and the understanding of the sequence."
        ),
        failText=(
            "Sweelinck files it under Court Records — Toledo Cortes. "
            "Accurate and accessible."
        ),
        checkPassFlag="cidC6A5Done",
        activateCond="cidC6A4Done",
    )

    # ─── Cycle 7: The Dead Man's Ride ─────────────────────────────────────────
    say("Cycle seven. The Dead Man's Ride. Valencia to Cardeña to Weimar. Five acts. Quest complete.")
    print("\n-- Cycle 7: The Dead Man's Ride (VLC→CDN→NUE) — questComplete --")

    quest(
        id="cid_c7a1", npc="gil_diaz_cid",
        title="The Carpenter's Record",
        desc=(
            "Valencia palace. The morning of the twelfth day after the Cid's death. "
            "Gil Díaz gives you four pages of vellum, technical and precise — the full description "
            "of the frame he built to carry the embalmed body on horseback from Valencia to Cardeña: "
            "the two hollowed boards, their dimensions, the bolt configuration, the nine stage-condition "
            "notes. He says: 'Carry this to Cardeña and from there to wherever records go now.' "
            "He does not ask you to come back and tell him how it went."
        ),
        activateNode="VLC",
        checkStat="WIS", checkDC=11,
        passText=(
            "You understand the timing — he is giving it now because after the departure there will "
            "not be another opportunity; the garrison will scatter, the city will fall to the Moors, "
            "and the specific technical knowledge will be unlocatable except in this document. "
            "You move exactly when he intends. You receive Gil Díaz's Frame-and-Saddle Account."
        ),
        failText=(
            "You delay one hour making preparations. Gil Díaz's instruction was the morning. "
            "The harbor is louder at the second hour."
        ),
        checkPassFlag="cidC7A1Done",
    )

    quest(
        id="cid_c7a2", npc="gil_diaz_cid",
        title="The Moorish Intelligence",
        desc=(
            "At the Valencia harbor, a Moorish factor from Bucar's camp wants to know the column's route. "
            "He is not asking about the account specifically — he is asking generally, collecting "
            "intelligence before the departure. He is professionally calm and politely persistent."
        ),
        activateNode="VLC",
        checkStat="CHA", checkDC=12,
        passText=(
            "You are a private carrier with materials for a Benedictine monastery in Castile. "
            "This is technically true. It does not name the column's route. It does not name the dead man. "
            "He accepts the monastery framing and notes it. He lets you board."
        ),
        failText=(
            "He is not satisfied but he is professional. He notes your direction and sends a rider. "
            "You will have company at the second waystation."
        ),
        checkPassFlag="cidC7A2Done",
        activateCond="cidC7A1Done",
    )

    quest(
        id="cid_c7a3", npc="gil_diaz_cid",
        title="The Road People",
        desc=(
            "The road to Cardeña. Word traveled ahead of the column and people are coming from "
            "Rioja and all Castile to see the Cid riding — 'hardly could they be persuaded that he was dead.' "
            "A local abbot intercepts you on the road. He wants to add a section to your account: "
            "a description of the miracle of the open eyes, the fresh countenance, the natural color. "
            "He believes it belongs with the technical record."
        ),
        activateNode="CDN",
        checkStat="WIS", checkDC=12,
        passText=(
            "Gil Díaz's account is a technical record of engineering and logistics. "
            "The engineering account and the miracle account serve different functions — filing them "
            "together subordinates the technical record to the theological claim. "
            "The abbot accepts the distinction and says he will write his observation in the monastery's chronicle."
        ),
        failText=(
            "The abbot adds his note on a new page. The document arrives with an appendix."
        ),
        checkPassFlag="cidC7A3Done",
        activateCond="cidC7A2Done",
    )

    quest(
        id="cid_c7a4", npc="gil_diaz_cid",
        title="The Cardeña Gate",
        desc=(
            "The monastery at Cardeña is receiving the Cid's body. King Alfonso has arrived from Toledo. "
            "The body has been set in the ivory chair. The gate is controlled by the King's guard. "
            "You are a carrier with a technical document. The gate check will hold you twenty minutes "
            "per standard procedure and there are forty people in the queue. "
            "The infirmary gate on the eastern wall requires a half-league detour through the hillside orchard."
        ),
        activateNode="CDN",
        checkStat="DEX", checkDC=13,
        passText=(
            "You reach the infirmary gate in twelve minutes. The gate monk recognizes the "
            "Benedictine carrier-pass format. You enter."
        ),
        failText=(
            "You wait in the main queue. You reach the gate at the thirty-minute mark. "
            "Standard review. You pass."
        ),
        checkPassFlag="cidC7A4Done",
        activateCond="cidC7A3Done",
    )

    quest(
        id="cid_c7a5", npc="gil_diaz_cid",
        title="The Technical Record",
        desc=(
            "Weimar Archive. Sweelinck reads the four pages carefully. He reads the bolt configuration. "
            "He reads the condition notes from each stage. He reads the final note: "
            "'At Cardeña, the body was lifted from between the boards by King Alfonso VI himself "
            "and found to be still firm and still bearing its natural colour.' "
            "The seventh stage note is longer than the others."
        ),
        activateNode="NUE",
        checkStat="WIS", checkDC=11,
        passText=(
            "You read the seventh-stage note to Sweelinck — it documents a real-time modification "
            "to the frame at the evening halt. This was a live commission with mid-journey adjustments, "
            "not just a documented plan. Sweelinck creates: Military Logistics — The Engineering Solution "
            "to an Impossible Commission, First Entry. Gil Díaz's frame-and-saddle account: "
            "the dead man rode nine days; Alfonso lifted the body and found it still firm; "
            "the technical record preceded the departure by four days because Gil Díaz knew it "
            "would be needed and would not be asked for at any convenient moment afterward."
        ),
        failText=(
            "Sweelinck files under Funerary Records — Notable Spanish Burials. "
            "Accurate but the engineering quality is lost."
        ),
        checkPassFlag="cidC7A5Done",
        activateCond="cidC7A4Done",
        questComplete=True,
    )

    print("\n=== CID import complete — 7 cycles, 35 acts ===")
    say("Chronicle of the Cid import complete. Seven cycles. Thirty-five acts. Quest complete on cycle seven.")

if __name__ == "__main__":
    main()
