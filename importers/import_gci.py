#!/usr/bin/env python3
# SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
# ═══════════════════════════════════════════════════════════════════════════
# ⚠️  ARCHAIC — OUT OF DATE.  Historical one-shot importer (POSTs to the
#     localhost:1367 WBAPI).  Content was long ago imported and lives in
#     index.html.  This script likely NO LONGER RUNS against the current
#     server/schema.  Kept for reference only — do not run without review.
#     Import history: BACKLOG.md / plan-archive.md / 1367-sources/.
# ═══════════════════════════════════════════════════════════════════════════
"""Import GCI — Toilers of the Sea (Victor Hugo, 1866) — 7 cycles × 5 acts = 35 quests"""
import requests, time, sys

BASE = "http://localhost:1367"

def api(method, path, **kwargs):
    r = getattr(requests, method)(f"{BASE}{path}", **kwargs)
    if r.status_code not in (200, 201):
        print(f"ERROR {method.upper()} {path}: {r.status_code} {r.text[:200]}")
        sys.exit(1)
    return r.json()

def get_nonce(quest_id):
    d = api("post", "/api/nonce", json={"type": "quest", "id": quest_id})
    return d["nonce"]

def create_quest(q):
    nonce = get_nonce(q["id"])
    result = api("post", "/api/quest", json=q, headers={"X-Nonce": nonce})
    print(f"  OK: {q['id']} — {q['title']}")
    return result

def wait_server():
    for _ in range(20):
        try:
            r = requests.get(f"{BASE}/api/ping", timeout=3)
            if r.status_code == 200:
                return
        except Exception:
            pass
        time.sleep(1)
    print("Server did not come back")
    sys.exit(1)

quests = [
    # ── Cycle 1 — The Gold Ring of St. Sampson (all at STP) ──────────────────
    {
        "id": "gci_01_act1",
        "title": "The Gold Ring — The Commission",
        "type": "skill_check",
        "activateNode": "STP",
        "checkStat": "WIS", "checkDC": 12,
        "desc": "A gaunt, salt-scarred man materializes from pre-dawn fog in the lane beside the church and presses a warm oilcloth packet into your hands before you can see his face clearly. Inside: a plain gold ring, still holding the heat of the jeweler's mold. Lethierry's man stands at the main church entrance watching the road. You must reach Dean Hérode's vestry unseen.",
        "passText": "You thread the side alley, reach the vestry door unseen, and place the oilcloth packet on Dean Hérode's lectern. His eyebrows rise as he unrolls it. You receive Gilliatt's Gold Ring.",
        "failText": "You choose the direct path. Lethierry's man spots movement and calls out. Voices echo in the fog; the moment fractures. Return to the lane — the vestry door is still unguarded on the far side.",
        "checkPassFlag": "gciC1A1Done",
    },
    {
        "id": "gci_01_act2",
        "title": "The Gold Ring — The Dean's Reluctance",
        "type": "skill_check",
        "activateNode": "STP",
        "checkStat": "CHA", "checkDC": 14,
        "activateCond": "() => !!S_story.gciC1A1Done",
        "desc": "The nave is cold. Dean Hérode holds the rolled marriage licence as if he wishes he hadn't been handed it. 'The man who brought back the Durande,' he says quietly. 'I know the name. But he is not present. A marriage arranged at dawn, in secret, by a man who will not show his face — you understand why I hesitate.' A candle gutters between you. Outside, feet on stone — the congregation arriving.",
        "passText": "The Dean holds your gaze for a long moment, then opens the licence and smooths it flat. He reaches for his pen. 'Tell him I will be ready.' He stamps a registry slip and hands it to you — the ceremony's outside witness.",
        "failText": "The Dean closes the licence. 'Without the man himself, I cannot proceed.' He sets it aside. The congregation is filing in — the window is narrowing. Return when you can speak more plainly, and quickly.",
        "checkPassFlag": "gciC1A2Done",
    },
    {
        "id": "gci_01_act3",
        "title": "The Gold Ring — The Altar",
        "type": "skill_check",
        "activateNode": "STP",
        "checkStat": "CON", "checkDC": 14,
        "activateCond": "() => !!S_story.gciC1A2Done",
        "desc": "Caudray and Déruchette stand at the altar — confused, tearful, barely believing the impediments have been removed. Gilliatt stands in the doorway. He walks Déruchette forward without speaking. The Dean asks who gives this woman. Gilliatt says: 'I do.' Then: shouting at the door — Lethierry's factor, red-faced, claiming the licence is fraudulent.",
        "passText": "You fill the doorway, immovable. The factor argues with your silence and loses. Inside, the Dean's voice completes the rite. Déruchette slides the ring onto her finger. The ceremony is complete.",
        "failText": "The factor pushes through; the Dean hesitates; the ceremony stalls. Gilliatt steps forward and speaks quietly, but the moment has cost weight and time. Try again — the vows are not finished.",
        "checkPassFlag": "gciC1A3Done",
    },
    {
        "id": "gci_01_act4",
        "title": "The Gold Ring — The Harbor Walk",
        "type": "skill_check",
        "activateNode": "STP",
        "checkStat": "STR", "checkDC": 13,
        "activateCond": "() => !!S_story.gciC1A3Done",
        "desc": "The harbor road at noon is loud with a crowd celebrating something it only half understands. Gilliatt walks ahead, not stopping. Lethierry's boatswain grabs his arm. More men press in from behind. The Cashmere is at Havelet dock; the couple is already aboard. If Gilliatt is swallowed by this crowd, he will never reach the cliff path.",
        "passText": "You shoulder through the press, take the boatswain's arm off Gilliatt's with a firm grip, and open the lane to Havelet. Gilliatt walks on without looking back. The couple boards. The Cashmere sounds its horn.",
        "failText": "The crowd carries you both half a street backward by sheer goodwill and noise. Gilliatt says nothing. Break free and push through again — the Cashmere is still at the dock, its horn not yet sounded.",
        "checkPassFlag": "gciC1A4Done",
    },
    {
        "id": "gci_01_act5",
        "title": "The Gold Ring — The Gild-Holm-Ur Seat",
        "type": "skill_check",
        "activateNode": "STP",
        "checkStat": "WIS", "checkDC": 14,
        "activateCond": "() => !!S_story.gciC1A4Done",
        "desc": "The cliff path is empty. Below, cut into the granite at water level, is the Gild-Holm-'Ur seat — a niche shaped like a chair, where the tide already reaches Gilliatt's knees. He is watching the Cashmere round the headland. There is no one else here. The seat will be underwater in minutes.",
        "passText": "You stand on the cliff's edge. The Cashmere rounds the point. Déruchette leans over the stern and sees a man on a rock. The ship moves on. The horizon takes it. The seat is gone under the water. You receive A Chip of the Gild-Holm-Ur Stone.",
        "failText": "You shout for the harbor boat; you scramble down the cliff path; you call his name. The harbor boat arrives. The seat is empty. You stand at the waterline with wet boots. Stand still this time. Watch.",
        "checkPassFlag": "gciC1A5Done",
    },

    # ── Cycle 2 — The Gild-Holm-Ur Seat (STP then GHL) ──────────────────────
    {
        "id": "gci_02_act1",
        "title": "The Seat — Lethierry's Quay",
        "type": "skill_check",
        "activateNode": "STP",
        "checkStat": "WIS", "checkDC": 12,
        "activateCond": "() => !!S_story.gciC1A5Done",
        "desc": "Mess Lethierry at the harbor edge in the afternoon — a large gray man who has decided to act after a long time of not deciding. He hands over a coil of rope with Gilliatt's name knotted into one end and two knots that mean: come back. 'Reach him before dark,' is all he says. The cliff path is two miles. The tide is at six.",
        "passText": "You see it in Lethierry's posture. You hold the rope in both arms — not an errand, but the last possible thing that can be sent. You receive Lethierry's Message Line.",
        "failText": "You start toward the cliff path without understanding the weight of what you are carrying. You will understand it at the seat.",
        "checkPassFlag": "gciC2A1Done",
    },
    {
        "id": "gci_02_act2",
        "title": "The Seat — The Cliff Road",
        "type": "skill_check",
        "activateNode": "STP",
        "checkStat": "STR", "checkDC": 12,
        "activateCond": "() => !!S_story.gciC2A1Done",
        "desc": "The cliff road narrows to a gorse track. A local fisherman at the path's junction tells you Gilliatt has been at the seat since noon. The third ledge is wet. The tide is at six. The path is unmarked. You must descend before the tide change puts the lower ledges underwater.",
        "passText": "You reach the upper ledge with twenty minutes to the tide. Below you, the seat. In it, Gilliatt. The horizon has one ship on it.",
        "failText": "The third ledge is wet and you go down on one knee. You recover. You are slower but the tide is not yet at the seat's lip.",
        "checkPassFlag": "gciC2A2Done",
    },
    {
        "id": "gci_02_act3",
        "title": "The Seat — The Ledge Above",
        "type": "skill_check",
        "activateNode": "GHL",
        "checkStat": "WIS", "checkDC": 12,
        "activateCond": "() => !!S_story.gciC2A2Done",
        "desc": "Gilliatt is in the seat, tide at his waist, face toward the horizon, hands flat on his thighs in the water. He is at peace. His face says: I have finished. You call his name. He turns. He sees the rope. He says one word: Lethierry.",
        "passText": "You say nothing. He looks at the rope in your arms. The horizon empties as the ship clears the line of sight.",
        "failText": "You say something. He listens. He looks back at the horizon. The message is the rope — let it speak.",
        "checkPassFlag": "gciC2A3Done",
    },
    {
        "id": "gci_02_act4",
        "title": "The Seat — The Rope Thrown",
        "type": "skill_check",
        "activateNode": "GHL",
        "checkStat": "DEX", "checkDC": 13,
        "activateCond": "() => !!S_story.gciC2A3Done",
        "desc": "The horizon is empty. The tide is at the seat's lip. Gilliatt's right hand is in the water beside the stone ledge. You have the rope in both arms. The message is in the knot. Throw it well.",
        "passText": "The knot-cipher lands beside his right hand in the shallows. He reads it. His hand comes up out of the water. He closes his fist around the rope.",
        "failText": "The throw is short. The knot-cipher falls in the water below the seat. You haul it back. Try again — the tide is still at the lip, not over it.",
        "checkPassFlag": "gciC2A4Done",
    },
    {
        "id": "gci_02_act5",
        "title": "The Seat — The Climb",
        "type": "skill_check",
        "activateNode": "GHL",
        "checkStat": "STR", "checkDC": 11,
        "activateCond": "() => !!S_story.gciC2A4Done",
        "desc": "He climbs up the rock face by handholds he cut himself over a year of sitting here. He is at the ledge in thirty seconds. He stands beside you, wet to the chest. He looks at the empty sea once. He says: Tell him I read it. He starts up the cliff path. Escort him back to St. Peter Port harbor.",
        "passText": "He walks ahead of you on the cliff path. He does not look back at the sea. At the harbor, Lethierry is waiting. Gilliatt does not speak. He holds out his hand. Lethierry takes it.",
        "failText": "The path back is longer than the path down — something on the road. You keep pace with him. He reaches the harbor later, but he reaches it.",
        "checkPassFlag": "gciC2A5Done",
    },

    # ── Cycle 3 — Gilliatt's Salvage Log (STP → BK → WM) ────────────────────
    {
        "id": "gci_03_act1",
        "title": "The Salvage Log — The Harbor Commission",
        "type": "skill_check",
        "activateNode": "STP",
        "checkStat": "INT", "checkDC": 11,
        "activateCond": "() => !!S_story.gciC2A5Done",
        "desc": "Mess Lethierry hands you the log at the harbor. He found it in Gilliatt's house after. He says: people will say he was brave. He was brave. He was also a very good engineer who thought carefully about every problem before he solved it. The log shows the thinking. Understand before the road why the archive wants the log and not the engine: the engine is in the harbor; the thinking is here.",
        "passText": "You read the first three pages. The entries begin with the tide schedule and the angle of the Douvre rocks at dawn. The thinking is in the margins. You receive Gilliatt's Salvage Log.",
        "failText": "You hold the log without opening it. Lethierry watches. 'Read it,' he says. 'Then you'll know what you're carrying.'",
        "checkPassFlag": "gciC3A1Done",
    },
    {
        "id": "gci_03_act2",
        "title": "The Salvage Log — The French Engineer",
        "type": "skill_check",
        "activateNode": "STP",
        "checkStat": "CHA", "checkDC": 12,
        "activateCond": "() => !!S_story.gciC3A1Done",
        "desc": "A French engineer at a Norman port on the northern route wants to copy the log for a technical study of improvised marine salvage equipment. His interest is entirely practical — only the specific tool-making solutions in weeks four through six. The archive makes copies available after deposit. Not on the road.",
        "passText": "He understands the distinction. He takes your card for the archive's copy request procedure. The log continues north.",
        "failText": "He argues that his study is more immediately useful than any archive. You hold the log. He will find another approach.",
        "checkPassFlag": "gciC3A2Done",
    },
    {
        "id": "gci_03_act3",
        "title": "The Salvage Log — The Flemish Merchant",
        "type": "skill_check",
        "activateNode": "BK",
        "checkStat": "STR", "checkDC": 13,
        "activateCond": "() => !!S_story.gciC3A2Done",
        "desc": "A Flemish merchant in the Birka harbor district who deals in technical documents wants the log for a buyer interested in steam-engine salvage methods. He offers a significant sum and has a hired man with him. The technical content has commercial value. The log goes to the archive.",
        "passText": "You hold your ground against the hired man's interference. The merchant reads your posture correctly. He withdraws his offer. The log is in the case.",
        "failText": "The hired man blocks the lane. You push through. The merchant calls after you but does not follow. The log is safe.",
        "checkPassFlag": "gciC3A3Done",
    },
    {
        "id": "gci_03_act4",
        "title": "The Salvage Log — The Road to Weimar",
        "type": "skill_check",
        "activateNode": "BK",
        "checkStat": "CON", "checkDC": 11,
        "activateCond": "() => !!S_story.gciC3A3Done",
        "desc": "Three days to Weimar. The log is in the case. The gap in the entries — three days, storm, silence — is in the middle. After the gap, the entries continue. Keep moving.",
        "passText": "You arrive at Weimar with the log intact. The gap is still in the middle. It will still be there when Sweelinck reads it.",
        "failText": "The road costs a day. You arrive later than planned. Sweelinck is at his desk regardless.",
        "checkPassFlag": "gciC3A4Done",
    },
    {
        "id": "gci_03_act5",
        "title": "The Salvage Log — The Archive",
        "type": "skill_check",
        "activateNode": "WM",
        "checkStat": "INT", "checkDC": 11,
        "activateCond": "() => !!S_story.gciC3A4Done",
        "desc": "Sweelinck reads the log from the beginning. He reads the final entry. He notes the three-day gap. He says: the gap is not a failure of record — it is the record itself. Solitary Engineering Records opens.",
        "passText": "You explain where the log came from, who held it, and what Lethierry said. Sweelinck adds a provenance note. The log is filed.",
        "failText": "Sweelinck asks about the gap and you have no answer. He files it with a question mark in the provenance column. It will do.",
        "checkPassFlag": "gciC3A5Done",
    },

    # ── Cycle 4 — Clubin's Scheme Notebook (STP → VEN → WM) ─────────────────
    {
        "id": "gci_04_act1",
        "title": "Clubin's Notebook — The Harbor Commission",
        "type": "skill_check",
        "activateNode": "STP",
        "checkStat": "INT", "checkDC": 12,
        "activateCond": "() => !!S_story.gciC3A5Done",
        "desc": "Lethierry hands over the notebook at the harbor office. He says: Gilliatt found it while clearing the wreck and gave it to me without reading it carefully. The scheme is in there — every column, the identity name, the tide calculations. Understand before the road what the archive wants: not the scheme, but the record of competence applied to betrayal — and what the world did with that competence afterward.",
        "passText": "You open the notebook to the tide calculations. Each column is exact. The identity name is someone who never existed. You understand what you are carrying. You receive Clubin's Scheme Notebook.",
        "failText": "You hold the notebook without opening it. 'Read it,' Lethierry says. 'At least the tide columns. Then you'll know what kind of man drew them.'",
        "checkPassFlag": "gciC4A1Done",
    },
    {
        "id": "gci_04_act2",
        "title": "Clubin's Notebook — The Norman Merchant",
        "type": "skill_check",
        "activateNode": "STP",
        "checkStat": "CHA", "checkDC": 12,
        "activateCond": "() => !!S_story.gciC4A1Done",
        "desc": "A Norman merchant on the sea route south who was financially damaged by the Durande's loss wants the notebook for a civil proceeding against Clubin's estate. His case has merit. The archive holds evidence for the permanent record; courts have their own channels for active proceedings.",
        "passText": "He understands the archive's position. He takes note of the deposit procedure. The notebook continues south.",
        "failText": "He argues that a civil proceeding has more immediate consequence than an archive shelf. The notebook stays in the case.",
        "checkPassFlag": "gciC4A2Done",
    },
    {
        "id": "gci_04_act3",
        "title": "Clubin's Notebook — The Venetian Underwriter",
        "type": "skill_check",
        "activateNode": "VEN",
        "checkStat": "CHA", "checkDC": 13,
        "activateCond": "() => !!S_story.gciC4A2Done",
        "desc": "A Venetian insurance underwriter wants the notebook as evidence in a fraud proceeding — the Durande's owner received a settlement for the loss; if the wrecking was deliberate, the settlement may be recoverable. His interest is commercial and legally grounded. The archive's preservation and a court's proceeding can both hold the same document.",
        "passText": "He agrees that access can be arranged after deposit. He provides a letter of introduction for the archive intake. The notebook goes north.",
        "failText": "He offers a substantial sum. You decline. He respects this more than he would have respected acceptance.",
        "checkPassFlag": "gciC4A3Done",
    },
    {
        "id": "gci_04_act4",
        "title": "Clubin's Notebook — The Alpine Road",
        "type": "skill_check",
        "activateNode": "VEN",
        "checkStat": "CON", "checkDC": 11,
        "activateCond": "() => !!S_story.gciC4A3Done",
        "desc": "The Alpine road north. Three days to Weimar. The notebook is in the sealed case. The tide calculations in it are correct. The identity name is someone who never existed. The octopus is not in the notebook. Keep moving.",
        "passText": "You arrive at Weimar with the case intact. Three days, no incident.",
        "failText": "The Alpine pass costs a day of delay. You arrive at Weimar on the fourth day. Sweelinck's desk is the same.",
        "checkPassFlag": "gciC4A4Done",
    },
    {
        "id": "gci_04_act5",
        "title": "Clubin's Notebook — The Archive",
        "type": "skill_check",
        "activateNode": "WM",
        "checkStat": "INT", "checkDC": 11,
        "activateCond": "() => !!S_story.gciC4A4Done",
        "desc": "Sweelinck reads the columns. He notes the tide calculations. He notes the identity name. He notes the date of the final column. Premeditated Wreck Records opens.",
        "passText": "You explain the notebook's provenance — found by Gilliatt, held by Lethierry, undisturbed. Sweelinck writes: integrity of evidence confirmed. The notebook is filed.",
        "failText": "Sweelinck notes a handling mark on the cover that post-dates the wreck. He files it with a question. The record is intact.",
        "checkPassFlag": "gciC4A5Done",
    },

    # ── Cycle 5 — Rantaine's Signed Confession (STP → CON → WM) ─────────────
    {
        "id": "gci_05_act1",
        "title": "The Confession — The Harbor Commission",
        "type": "skill_check",
        "activateNode": "STP",
        "checkStat": "INT", "checkDC": 12,
        "activateCond": "() => !!S_story.gciC4A5Done",
        "desc": "Lethierry hands over the confession at the harbor office. He says: Gilliatt brought this to me and said nothing about how he had gotten it. That is the part the archive should hold. Understand before the road what the document is: a weapon returned to its victim, by a person who had no interest in either party's financial standing, who obtained it as a necessary step in giving Déruchette away correctly.",
        "passText": "You read the signature and the sum and the date. You understand the sequence: stolen, held as leverage, returned. You receive Rantaine's Signed Confession.",
        "failText": "You read the signature. You understand less than you should about why it was returned. Lethierry explains it once. You receive the document.",
        "checkPassFlag": "gciC5A1Done",
    },
    {
        "id": "gci_05_act2",
        "title": "The Confession — Rantaine's Agent",
        "type": "skill_check",
        "activateNode": "STP",
        "checkStat": "CHA", "checkDC": 12,
        "activateCond": "() => !!S_story.gciC5A1Done",
        "desc": "Rantaine has learned the confession is leaving Guernsey. A man he hired in a Norman port wants to retrieve it — Rantaine's legal exposure is diminished if the signed confession is destroyed. The hired man is on the road south. He has a description of the document-carrier. Take the sea route east.",
        "passText": "You change route at the harbor. The hired man waits on the southern road for three days. You are already at sea.",
        "failText": "He has already identified you at the dock. You change ships at the last moment. He loses the trail at the harbor.",
        "checkPassFlag": "gciC5A2Done",
    },
    {
        "id": "gci_05_act3",
        "title": "The Confession — The Agent at Constantinople",
        "type": "skill_check",
        "activateNode": "CON",
        "checkStat": "STR", "checkDC": 13,
        "activateCond": "() => !!S_story.gciC5A2Done",
        "desc": "The agent tracked the sea route. He found you at the Constantinople harbor. His commission is the confession. The document goes to the archive.",
        "passText": "You hold the case and meet his approach directly. He reads that the document will not change hands here. He withdraws.",
        "failText": "He makes contact at the harbor gate. You force the confrontation early, before he has position. He retreats. The confession is intact.",
        "checkPassFlag": "gciC5A3Done",
    },
    {
        "id": "gci_05_act4",
        "title": "The Confession — West from Constantinople",
        "type": "skill_check",
        "activateNode": "CON",
        "checkStat": "CON", "checkDC": 11,
        "activateCond": "() => !!S_story.gciC5A3Done",
        "desc": "West from Constantinople, three weeks. The confession is in the sealed wallet. Rantaine is in Guernsey, legally exposed. Lethierry has rebuilt. The marriage has happened. Gilliatt is at the tidal seat. Keep moving.",
        "passText": "You arrive at Weimar on the twenty-third day. The sealed wallet is intact.",
        "failText": "A delay on the Balkan road costs four days. You arrive at Weimar on the twenty-seventh day. The wallet is intact.",
        "checkPassFlag": "gciC5A4Done",
    },
    {
        "id": "gci_05_act5",
        "title": "The Confession — The Archive",
        "type": "skill_check",
        "activateNode": "WM",
        "checkStat": "INT", "checkDC": 11,
        "activateCond": "() => !!S_story.gciC5A4Done",
        "desc": "Sweelinck reads the confession. He notes the sum, the signature, the date. He notes the document's transit: stolen, held as leverage, returned. He opens a new category: Returned Evidence Records.",
        "passText": "You describe the agent at Constantinople and the changed sea route. Sweelinck notes both. The confession is filed under the new category.",
        "failText": "You describe only the document. Sweelinck notes the transit gap. He files it. The record is sufficient.",
        "checkPassFlag": "gciC5A5Done",
    },

    # ── Cycle 6 — Déruchette's Undelivered Letter (STP → ROM → WM) ───────────
    {
        "id": "gci_06_act1",
        "title": "The Unread Letter — The Harbor Commission",
        "type": "skill_check",
        "activateNode": "STP",
        "checkStat": "INT", "checkDC": 11,
        "activateCond": "() => !!S_story.gciC5A5Done",
        "desc": "Mess Lethierry hands you the letter sealed. He says: she wrote it at the inn while waiting for the tide. The innkeeper delivered it to Gilliatt's house after the boat was gone. It was on the table, still sealed. Understand why the archive holds an unread letter: the value is not in its content — no one has read it. The value is in the sequence: written, left, delivered, found sealed.",
        "passText": "You understand the sequence. You hold the sealed letter in both hands without trying to read it. You receive Déruchette's Sealed Letter.",
        "failText": "You ask what it says. Lethierry looks at you. 'No one knows,' he says. 'That is what you are carrying.'",
        "checkPassFlag": "gciC6A1Done",
    },
    {
        "id": "gci_06_act2",
        "title": "The Unread Letter — The Norman Priest",
        "type": "skill_check",
        "activateNode": "STP",
        "checkStat": "CHA", "checkDC": 12,
        "activateCond": "() => !!S_story.gciC6A1Done",
        "desc": "A Norman priest on the sea route south believes the letter should be destroyed out of respect for Déruchette's privacy — she wrote it for one person who cannot now read it; no one else should read it. His argument is about privacy; the archive's argument is about the record. The letter travels sealed. Neither the priest nor the archive opens it.",
        "passText": "He understands that a sealed, unread document can be preserved without violation. He blesses your journey. The letter continues south.",
        "failText": "He remains unconvinced. He does not try to take it. The letter continues south regardless.",
        "checkPassFlag": "gciC6A2Done",
    },
    {
        "id": "gci_06_act3",
        "title": "The Unread Letter — The Church Official at Rome",
        "type": "skill_check",
        "activateNode": "ROM",
        "checkStat": "CHA", "checkDC": 12,
        "activateCond": "() => !!S_story.gciC6A2Done",
        "desc": "A church official at Rome who has heard the story of Gilliatt wants the letter for a collection of examples of Christian self-sacrifice — he believes Gilliatt's life has hagiographic value and the letter would complete the account. His use of the letter requires opening it. The archive holds it sealed.",
        "passText": "You explain that a sealed letter whose value lies in its unread state cannot be opened for any collection without destroying what makes it valuable. He concedes the theological point. The letter goes north.",
        "failText": "He argues that holiness is increased by witness. You hold the letter. He eventually accepts that the archive's custody is the correct one.",
        "checkPassFlag": "gciC6A3Done",
    },
    {
        "id": "gci_06_act4",
        "title": "The Unread Letter — North from Rome",
        "type": "skill_check",
        "activateNode": "ROM",
        "checkStat": "CON", "checkDC": 11,
        "activateCond": "() => !!S_story.gciC6A3Done",
        "desc": "North from Rome, five days to Weimar. The sealed letter is in the case. Déruchette is on a boat somewhere east of England. Gilliatt is under the tide at Gild-Holm-'Ur. The letter is between them in a document case on an Alpine road. Keep moving.",
        "passText": "You arrive at Weimar on the fifth day. The seal is intact.",
        "failText": "The road north costs an extra day. You arrive at Weimar on the sixth day. The seal is intact.",
        "checkPassFlag": "gciC6A4Done",
    },
    {
        "id": "gci_06_act5",
        "title": "The Unread Letter — The Archive",
        "type": "skill_check",
        "activateNode": "WM",
        "checkStat": "INT", "checkDC": 11,
        "activateCond": "() => !!S_story.gciC6A4Done",
        "desc": "Sweelinck takes the letter. He examines the seal — Déruchette's hand, a small impression. He does not break it. He marks it: sealed, unread, delivered post-mortem. Undelivered Gratitude Records opens.",
        "passText": "You confirm that the seal has been unbroken since the innkeeper found it. Sweelinck writes: provenance clean. The letter is filed.",
        "failText": "Sweelinck notes a slight press-mark on the wax — not broken, but handled. He files it with a note. The letter is intact.",
        "checkPassFlag": "gciC6A5Done",
    },

    # ── Cycle 7 — Lethierry's Final Account (STP → LDN → WM) — questComplete ─
    {
        "id": "gci_07_act1",
        "title": "Lethierry's Account — The Harbor Commission",
        "type": "skill_check",
        "activateNode": "STP",
        "checkStat": "INT", "checkDC": 11,
        "activateCond": "() => !!S_story.gciC6A5Done",
        "desc": "Lethierry hands you the pages at his house. He says: I wrote it when I could write. Three days after. It describes what I saw on the quay. Understand before the road what makes this account different: Lethierry is not a witness to Gilliatt's death — no one witnessed that. He is the witness to the last act Gilliatt chose to perform in public view, which is not the same thing.",
        "passText": "You read the direction Lethierry names — toward the coast path. You understand what the account holds and what it does not. You receive Lethierry's Quay Account.",
        "failText": "You ask Lethierry what happened at the seat. 'I wasn't there,' he says. 'That's the point. Read what I did see.'",
        "checkPassFlag": "gciC7A1Done",
    },
    {
        "id": "gci_07_act2",
        "title": "Lethierry's Account — The Norman Journalist",
        "type": "skill_check",
        "activateNode": "STP",
        "checkStat": "CHA", "checkDC": 12,
        "activateCond": "() => !!S_story.gciC7A1Done",
        "desc": "A Norman journalist on the coastal route north has been writing about Gilliatt's salvage as a human interest piece for a French newspaper. He wants Lethierry's account for the final article. The archive holds the original. His article can quote from the record after deposit.",
        "passText": "He agrees to the archive's terms. He takes the intake address. The account continues north.",
        "failText": "He argues that newspapers reach more readers than archives. You explain that the account reaches readers through both channels — but the original stays in the case.",
        "checkPassFlag": "gciC7A2Done",
    },
    {
        "id": "gci_07_act3",
        "title": "Lethierry's Account — The English Publisher",
        "type": "skill_check",
        "activateNode": "LDN",
        "checkStat": "CHA", "checkDC": 12,
        "activateCond": "() => !!S_story.gciC7A2Done",
        "desc": "An English publisher in London wants to acquire Lethierry's account as a source document for a Victor Hugo biography — the event is recent enough that primary sources are rare. His offer is significant. The account travels to the archive. After deposit, access can be arranged.",
        "passText": "He understands that first deposit, then access, is the archive's procedure. He provides a letter of inquiry for after the deposit. The account continues east.",
        "failText": "He doubles his offer. You decline. He respects this and provides the inquiry letter for the archive.",
        "checkPassFlag": "gciC7A3Done",
    },
    {
        "id": "gci_07_act4",
        "title": "Lethierry's Account — Three Days East",
        "type": "skill_check",
        "activateNode": "LDN",
        "checkStat": "CON", "checkDC": 11,
        "activateCond": "() => !!S_story.gciC7A3Done",
        "desc": "Three days east to Weimar. The account is in the case. Lethierry is alive at St. Peter Port. The boat with Déruchette is in the Channel somewhere. Gild-Holm-'Ur is under the spring tide. Keep moving.",
        "passText": "You arrive at Weimar on the third day. The account is intact.",
        "failText": "The road costs an extra day. You arrive at Weimar on the fourth day. The account is intact.",
        "checkPassFlag": "gciC7A4Done",
    },
    {
        "id": "gci_07_act5",
        "title": "Lethierry's Account — The Archive",
        "type": "skill_check",
        "activateNode": "WM",
        "checkStat": "INT", "checkDC": 11,
        "activateCond": "() => !!S_story.gciC7A4Done",
        "desc": "Sweelinck reads the account from the beginning. He reads the direction Lethierry names — toward the coast path. He reads what Lethierry says he understood. He closes the account and sets it on the stack. He says: the GCI file is complete.",
        "passText": "You describe the full chain: ring, rope, log, notebook, confession, letter, account — seven documents from a single life, carried separately, arrived complete. Sweelinck opens the GCI file index. He writes: closed.",
        "failText": "You describe only the account. Sweelinck notes the arrival. He opens the file index. He adds the account. He writes: closed.",
        "checkPassFlag": "gciC7A5Done",
        "questComplete": True,
    },
]

def main():
    wait_server()
    print(f"Importing GCI — Toilers of the Sea ({len(quests)} acts)...")
    for q in quests:
        create_quest(q)
    print("\nAll 35 acts imported. Running audit...")
    audit = api("get", "/api/audit")
    errors = audit.get("errors", [])
    if errors:
        print(f"AUDIT ERRORS ({len(errors)}):")
        for e in errors:
            print(f"  {e}")
    else:
        print(f"Audit clean. Nodes: {audit.get('nodes')}, Quests: {audit.get('quests')}")

if __name__ == "__main__":
    main()
