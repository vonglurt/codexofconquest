#!/usr/bin/env python3
# SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson and Claude
# ═══════════════════════════════════════════════════════════════════════════
# ⚠️  ARCHAIC — OUT OF DATE.  Historical one-shot importer (POSTs to the
#     localhost:1367 WBAPI).  Content was long ago imported and lives in
#     index.html.  This script likely NO LONGER RUNS against the current
#     server/schema.  Kept for reference only — do not run without review.
#     Import history: BACKLOG.md / plan-archive.md / 1367-sources/.
# ═══════════════════════════════════════════════════════════════════════════
"""Import LGW — Le Morte d'Arthur (Malory) — 7 cycles, 35 acts."""

import json, subprocess, time, sys

BASE = "http://localhost:1367"

def api(method, path, body=None, headers=None):
    cmd = ["curl", "-s", "-X", method, f"{BASE}{path}",
           "-H", "Content-Type: application/json"]
    if headers:
        for k, v in headers.items():
            cmd += ["-H", f"{k}: {v}"]
    if body:
        cmd += ["-d", json.dumps(body)]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        return None
    try:
        return json.loads(r.stdout)
    except Exception:
        return None

def wait_server():
    print("Waiting for server...")
    for _ in range(20):
        r = api("GET", "/api/ping")
        if r and r.get("ok"):
            print("Server up.")
            return True
        time.sleep(2)
    print("Server not responding.", file=sys.stderr)
    return False

def get_nonce(quest_id):
    r = api("POST", "/api/nonce", {"type": "quest", "id": quest_id})
    return r["nonce"] if r and "nonce" in r else None

def create_quest(q):
    nonce = get_nonce(q["id"])
    if not nonce:
        print(f"  ✗ {q['id']}: nonce failed")
        return False
    r = api("POST", "/api/quest", q, {"X-Nonce": nonce})
    if r and r.get("ok"):
        print(f"  ✓ {q['id']}: created")
        return True
    err = r.get("error", "unknown") if r else "no response"
    incomplete = r.get("incomplete", []) if r else []
    if incomplete:
        fields = [x["field"] for x in incomplete]
        print(f"  ✗ {q['id']}: missing {fields}")
    else:
        print(f"  ✗ {q['id']}: {err}")
    return False

print("LGW import — Le Morte d'Arthur — 35 quest acts across 7 cycles")
if not wait_server():
    sys.exit(1)

quests = [

# ── CYCLE 1: The Barge of the Maid of Astolat ────────────────────────────────

{
  "id": "lgw_01_act1",
  "title": "The Barge of the Maid of Astolat — The Barge Departs",
  "type": "skill_check",
  "activateNode": "AST",
  "checkStat": "WIS", "checkDC": 14,
  "desc": "The white-canopied barge sits low in grey morning water at Astolat dock. Bernard of Astolat hands you the mooring rope, dry-eyed and done with words — his daughter lies still beneath the canopy, her sealed letter between her hands. She asked only that it reach the king, read aloud in open court, before the man she loved. Upstream the willows are too quiet: Lancelot's outriders have been watching the manor road and stopped moving five minutes ago.",
  "passText": "You catch the shift in the leaves before the rider moves. You hold the barge still until he gives up the wait and withdraws. The river is clear for now. You receive Elaine's Sealed Letter — a small thing, red wax seal, pressed between still hands.",
  "failText": "The rider melts back through the willows. Word will reach the ford before you do. You push off anyway — the delay will cost you the tide and something harder to name.",
  "checkPassFlag": "lgwBargeAct1Done",
},
{
  "id": "lgw_01_act2",
  "title": "The Barge of the Maid of Astolat — The Ford at Midnight",
  "type": "skill_check",
  "activateNode": "RVP",
  "checkStat": "CHA", "checkDC": 14,
  "activateCond": "() => !!S_story.lgwBargeAct1Done",
  "desc": "The ford is shallow and pulling sideways — the barge wants to swing broadside into the willows. Torchlight from the west: Lancelot's squire Geoffrey raises his hand in the gesture that means stop, not attack. He does not want a fight. He wants the letter to disappear quietly. He is protecting a man he loves from a dead woman's honesty, and there is something almost decent in it. Behind him in the dark, a second rider you have not yet located.",
  "passText": "Geoffrey accepts your claim that the letter is a legal matter awaiting Chancery review. He steps aside, uncertain. You pole through the ford with the seal unbroken. You receive River-Bent Arrow — evidence of the crossing that almost did not happen.",
  "failText": "Geoffrey does not believe you. He calls downstream for support and takes a position on the bank. You must get past him before they close the ford. The barge is drifting.",
  "checkPassFlag": "lgwBargeAct2Done",
},
{
  "id": "lgw_01_act3",
  "title": "The Barge of the Maid of Astolat — Camelot River Gate",
  "type": "skill_check",
  "activateNode": "LGW",
  "checkStat": "CHA", "checkDC": 15,
  "activateCond": "() => !!S_story.lgwBargeAct2Done",
  "desc": "Camelot's water gate: grey stone and hanging banners, two knights in full livery on the quay. The barge grounds gently against the stone. Sir Torquil, senior gate-knight, reads the situation in one look and blocks the gangway with his body, not his sword — he knows he is in the wrong and is doing it anyway. Behind him the hall doors are shut. Court is in session. The queen is present. He says: this is not the time.",
  "passText": "The word 'attaint' lands in Torquil like a stone in still water — a sealed letter addressed to the king cannot be intercepted by any officer below peer rank. He steps aside without another word. You carry the letter up the stone steps. You receive Camelot Gate Writ.",
  "failText": "Torquil holds the gangway. He knows the law. He is not moved by it. Behind you the barge is drifting. Find a different angle — something this court values more than quiet.",
  "checkPassFlag": "lgwBargeAct3Done",
},
{
  "id": "lgw_01_act4",
  "title": "The Barge of the Maid of Astolat — The Great Hall",
  "type": "skill_check",
  "activateNode": "LGW",
  "checkStat": "STR", "checkDC": 14,
  "activateCond": "() => !!S_story.lgwBargeAct3Done",
  "desc": "Three hundred candles and a silence that cost something. Arthur holds the letter without opening it. Guinevere sits to his left, watching Lancelot, who stands at the far column the way he always stands — slightly apart. Everyone already knows what the letter is. Arthur says: Sir Griflet, read it aloud. The room's discomfort turns on you — the one who carried it here, the one who made this moment happen.",
  "passText": "You stand still through the full reading. You watch Lancelot's face and do not look away when it changes. When Griflet finishes, Arthur presses his ring into your palm. 'For witnessing,' he says. 'For bringing it through.' You receive King Arthur's Ring.",
  "failText": "The weight of three hundred silent witnesses lands on you halfway through the reading. You step back. Arthur's eyes find you across the hall. He says, quietly: stand still. You have come this far.",
  "checkPassFlag": "lgwBargeAct4Done",
},
{
  "id": "lgw_01_act5",
  "title": "The Barge of the Maid of Astolat — The Chapel Before Dawn",
  "type": "skill_check",
  "activateNode": "LGW",
  "checkStat": "WIS", "checkDC": 12,
  "activateCond": "() => !!S_story.lgwBargeAct4Done",
  "desc": "Camelot chapel before lauds: twelve candles, cold stone. Lancelot kneels at the altar rail, still in court clothes. A white lily from the barge stands in a plain cup of water on the altar, leaning slightly. He holds out his hand for the letter without turning. You place it in his hand. He crosses to the candle. The red wax seal is the first thing to go.",
  "passText": "Before he rises, Lancelot sets something on the altar — a small token he has carried since Astolat, unnamed, unacknowledged. He leaves it for her. You take the white lily from its cup before the last candle goes out. You receive Elaine's White Lily.",
  "failText": "You watch the letter burn. Lancelot rises and goes out without looking back. Something small catches the candlelight on the altar stone. Wait — look again before the candle gutters.",
  "checkPassFlag": "lgwBargeAct5Done",
},

# ── CYCLE 2: The Third Throw ──────────────────────────────────────────────────

{
  "id": "lgw_02_act1",
  "title": "The Third Throw — The Commission",
  "type": "skill_check",
  "activateNode": "CAM",
  "checkStat": "WIS", "checkDC": 12,
  "activateCond": "() => !!S_story.lgwBargeAct5Done",
  "desc": "The vale of Camlann after the battle. Arthur lies where Bedevere carried him, his armor opened at the wound. He speaks clearly. Bedevere receives the command and rises: take Excalibur, throw it in the lake, come again and tell me what you see. Arthur looks at you. He presses his ring seal into your palm — wax still warm. 'Stay behind him. Bear witness. If he cannot throw it, take it from him and throw it yourself. But understand the word cannot. It does not mean has not yet.'",
  "passText": "You understand what Arthur requires: patience precise enough to know the difference between a man who has not yet thrown the sword and a man who genuinely cannot. You receive Arthur's Command Seal — the ring impression in warm wax, the commission to witness.",
  "failText": "You carry the seal forward without the distinction fully in you. The first return will be harder to read. Hold the distinction — it is everything.",
  "checkPassFlag": "lgwThrowAct1Done",
},
{
  "id": "lgw_02_act2",
  "title": "The Third Throw — The First Return",
  "type": "skill_check",
  "activateNode": "CAM",
  "checkStat": "WIS", "checkDC": 13,
  "activateCond": "() => !!S_story.lgwThrowAct1Done",
  "desc": "Bedevere comes back from the lake. Between his going and coming back there was too much time and not enough sound. A sword entering a lake makes a sound. There was no such sound. His face is the face of a man composing himself to report something different from what he did. Arthur asks: what sawest thou there? Bedevere says: nothing but the waters wap and the waves wan. Arthur says: that is untrue. Go again.",
  "passText": "You see through the lie completely and hold the seal anyway. He has not proven cannot. He has proven has-not-yet. The seal stays closed in your fist. You receive Bedevere's First Return Token.",
  "failText": "You move forward. Arthur's hand finds your arm. He says: not yet. The word cannot has not yet arrived. Hold still.",
  "checkPassFlag": "lgwThrowAct2Done",
},
{
  "id": "lgw_02_act3",
  "title": "The Third Throw — The Word Traitor",
  "type": "skill_check",
  "activateNode": "CAM",
  "checkStat": "STR", "checkDC": 13,
  "activateCond": "() => !!S_story.lgwThrowAct2Done",
  "desc": "Bedevere returns from the second trip. No sound of a sword in water. The sword is still hidden somewhere in the reeds. Arthur says: Traitor untrue. Now hast thou betrayed me twice. Who would have weened that, thou that hast been to me so lief and dear? And thou art named a noble knight, and would betray me for the richness of a sword. Bedevere stands in it. He does not argue. The word is correct and he knows it. Arthur says: go again. Bedevere turns back toward the water.",
  "passText": "You hold still through the naming and the turning-back and the walk into the dark. Bedevere disappears toward the water. You follow at distance. The seal stays closed in your fist. You receive the Traitor-Named Token — a record of what was said and witnessed.",
  "failText": "Your hand moves toward Bedevere. Arthur's voice, very quiet: not yet. If you act now you take from him the only chance he has to be something else. Close your fist.",
  "checkPassFlag": "lgwThrowAct3Done",
},
{
  "id": "lgw_02_act4",
  "title": "The Third Throw — The Water's Edge",
  "type": "skill_check",
  "activateNode": "LKS",
  "checkStat": "STR", "checkDC": 14,
  "activateCond": "() => !!S_story.lgwThrowAct3Done",
  "desc": "You stand ten paces behind Bedevere at the lake. He holds Excalibur extended over the black water — jewels catching moonlight, the sword brilliant, the most beautiful thing either of you has held or will hold. His one good arm is extended. He holds it over the water for a long time. The seal is in your closed fist. Ten paces is two steps if the arm begins to lower.",
  "passText": "You hold still. You watch his arm extend to full reach. You watch the sword leave his hand in a long clean arc. You watch the hand rise from the water to catch it. You receive the Lakeside Witness Mark — the fact of having stood still at the correct moment.",
  "failText": "You step forward. One foot, forward. Bedevere turns and looks at you. He throws the sword. But the arc was broken. Step back, stay behind him, let the moment be his.",
  "checkPassFlag": "lgwThrowAct4Done",
},
{
  "id": "lgw_02_act5",
  "title": "The Third Throw — The Barge",
  "type": "skill_check",
  "activateNode": "LKS",
  "checkStat": "CHA", "checkDC": 12,
  "activateCond": "() => !!S_story.lgwThrowAct4Done",
  "desc": "Bedevere walks back to Arthur. The barge comes — three queens in black hoods, the water barely disturbed. He helps Arthur into it. He tries to board. Arthur says: nay. The barge moves onto the water. Bedevere stands at the shore until it is gone. You stand beside him. The lake is very quiet. No hand. No sword. Black water and still.",
  "passText": "You press the seal into his one good hand. He looks at it — the ring impression in the wax. He closes his hand around it. He stands at the water's edge until morning. You receive the Empty Commission Token — unused, which is the correct outcome.",
  "failText": "You hold it too long. He looks at it in your hand and turns back to the water. Come back when the lake is still and place it then.",
  "checkPassFlag": "lgwThrowAct5Done",
},

# ── CYCLE 3: Tristan's Harp ───────────────────────────────────────────────────

{
  "id": "lgw_03_act1",
  "title": "Tristan's Harp — The Commission",
  "type": "skill_check",
  "activateNode": "LGW",
  "checkStat": "WIS", "checkDC": 12,
  "activateCond": "() => !!S_story.lgwThrowAct5Done",
  "desc": "Tristan, exiled in Brittany, cannot send a letter — King Mark's agents read letters. He has made a harp instead, tuning its strings to a private code: all strings released together means 'I am still alive.' The tuning is the message. Playing any string or adjusting the tension destroys what he built into it. Mark's agents are watching for musical cargo from Brittany. The harp is cargo, not an instrument, until Iseult holds it.",
  "passText": "You understand what the harp is: not an instrument to play but a message to carry intact. The string tension is the content. You receive Tristan's Encoded Harp — strings tuned to say one thing, carry it without playing it.",
  "failText": "You ask what happens if the strings are loosened in transit. Tristan looks at you. 'Then it says nothing.' The harp is message or it is not. Understand this before the road.",
  "checkPassFlag": "lgwHarpAct1Done",
},
{
  "id": "lgw_03_act2",
  "title": "Tristan's Harp — The Road Watch",
  "type": "skill_check",
  "activateNode": "LGW",
  "checkStat": "CHA", "checkDC": 12,
  "activateCond": "() => !!S_story.lgwHarpAct1Done",
  "desc": "Mark's road agents are looking for musical cargo from Brittany. They stop caravans with instrument cases at the border. The harp is packed as a merchant's decoration piece on its way to a buyer in Birka. It is cargo, not an instrument in the sense they are watching for. At the crossing, an agent lifts the canvas from the cart and looks at the harp.",
  "passText": "Your cover holds: a merchant's decorative piece, purchased in Brittany, destination Birka. The agent loses interest. You receive Border Crossing Mark — the record of the harp that was not recognized as what it was.",
  "failText": "The agent looks at the harp more carefully. He knows instrument construction. You need a better account of why a Breton merchant harp is heading north. Try again with what is more specific.",
  "checkPassFlag": "lgwHarpAct2Done",
},
{
  "id": "lgw_03_act3",
  "title": "Tristan's Harp — The Birka Recognition",
  "type": "skill_check",
  "activateNode": "BK",
  "checkStat": "CHA", "checkDC": 13,
  "activateCond": "() => !!S_story.lgwHarpAct2Done",
  "desc": "Birka. A musician in the factor hall recognizes the harp as Tristan's by its construction — the specific curve of the neck, the tuning pegs' placement. He wants to play it. He says: I can hear what it would sound like. His recognition of the harp is itself a problem: Mark's dock agents are watching him specifically, because he is known to have contacts in Brittany. His wanting to play it is visible.",
  "passText": "You persuade him the harp is not available — its strings are set for a specific buyer and cannot be played before delivery. He accepts this reluctantly. Mark's dock agents see the conversation and see the harp put away. You receive Birka Factor Seal — proof of passage through the recognition without the message being discovered.",
  "failText": "He insists on a demonstration. The moment a string sounds the dock agents turn. You must close the conversation before the chord — refuse it, move the harp, do not let the strings speak.",
  "checkPassFlag": "lgwHarpAct3Done",
},
{
  "id": "lgw_03_act4",
  "title": "Tristan's Harp — The Road Refusal",
  "type": "skill_check",
  "activateNode": "WM",
  "checkStat": "WIS", "checkDC": 11,
  "activateCond": "() => !!S_story.lgwHarpAct3Done",
  "desc": "On the road to Weimar, at a roadside inn, someone asks to hear a song. The harp is present. The strings are intact. You are one note away from the message being audible to anyone in the room — including the wrong people. The request is friendly and genuine. The person asking has no connection to Mark's court. The string tension is still intact.",
  "passText": "You decline without explaining why. The harp is not for tonight. The person accepts this. You receive Road Refusal Mark — the understanding that the message stays intact until Iseult holds it, not before.",
  "failText": "You explain that the harp is a message, not an instrument. The person becomes curious. Now more people are asking what kind of message is in a harp. The string tension is still intact, but the attention is not useful.",
  "checkPassFlag": "lgwHarpAct4Done",
},
{
  "id": "lgw_03_act5",
  "title": "Tristan's Harp — The Archive",
  "type": "skill_check",
  "activateNode": "WM",
  "checkStat": "CHA", "checkDC": 11,
  "activateCond": "() => !!S_story.lgwHarpAct4Done",
  "desc": "Weimar. Sweelinck examines the harp. He does not play it. He holds it carefully and looks at the string tensions. He runs a finger along one string without touching it. He sets it on the desk. The strings are intact. He asks: what does it say?",
  "passText": "You tell him: all strings released together means 'I am still alive.' He writes without speaking. 'Encoded Message Records — The Harp Whose Strings Carry One Word. First entry. Tristan is still alive. The harp reached Iseult before it reached the archive. Both facts are in the record.' You receive Archive Receipt — Encoded Message.",
  "failText": "Sweelinck asks whether the message reached Iseult. You are not certain. He looks at the strings. 'The archive holds the mechanism and the intent. The delivery is a different question. Confirm the delivery route before we file.'",
  "checkPassFlag": "lgwHarpAct5Done",
},

# ── CYCLE 4: Gareth's Safe-Conduct ───────────────────────────────────────────

{
  "id": "lgw_04_act1",
  "title": "Gareth's Safe-Conduct — The Rod",
  "type": "skill_check",
  "activateNode": "LGW",
  "checkStat": "WIS", "checkDC": 11,
  "activateCond": "() => !!S_story.lgwHarpAct5Done",
  "desc": "Gareth Beaumains has been given a quest he has no rank to carry. Lynet's silver rod — authorization to pass through four colored knights' territories — authorizes its holder, not a specific named person. Gareth cannot present it in his own name yet; the court still calls him kitchen boy. He needs someone who can carry the rod and present it at each barrier while he rides as companion. The commission is yours.",
  "passText": "You understand the commission: the rod authorizes its carrier. Gareth is the companion. You present the rod in your own name at each barrier; Gareth follows. You receive Lynet's Silver Rod — the authorization that is not his yet.",
  "failText": "You ask whether Gareth should carry the rod himself. Lynet looks at you. 'Can he?' The question answers itself. The rod authorizes the holder. Understand the structure before the first barrier.",
  "checkPassFlag": "lgwGarethAct1Done",
},
{
  "id": "lgw_04_act2",
  "title": "Gareth's Safe-Conduct — The Green Knight's Barrier",
  "type": "skill_check",
  "activateNode": "LGW",
  "checkStat": "CHA", "checkDC": 12,
  "activateCond": "() => !!S_story.lgwGarethAct1Done",
  "desc": "The Green Knight's barrier, first of four. A stone gate across the road, the Green Knight on horseback in full livery. He looks at you, then at Gareth behind you, then at the rod. The rod is Lynet's. The device is her family's. The authorization is to the holder. Gareth must stay behind. If he speaks first, his rank becomes the question.",
  "passText": "You present the rod in your own person before Gareth can speak. The Green Knight reads the device, looks at the rod's holder — you — and waves the road open. Gareth passes behind you without incident. You receive Green Gate Token.",
  "failText": "Gareth speaks first. The Green Knight asks his rank. The conversation goes wrong from there. Present the rod before the question of rank arises — the rod's authorization does not mention rank.",
  "checkPassFlag": "lgwGarethAct2Done",
},
{
  "id": "lgw_04_act3",
  "title": "Gareth's Safe-Conduct — The Red Knight's Dispute",
  "type": "skill_check",
  "activateNode": "LGW",
  "checkStat": "CHA", "checkDC": 13,
  "activateCond": "() => !!S_story.lgwGarethAct2Done",
  "desc": "The Red Knight disputes that a non-noble carrier can present the rod. He is reading the device's terms carefully. Lynet's device authorizes the holder of the rod — there is no rank requirement in the text. The dispute is not about the rod's validity; it is about whether you have the standing to carry it. Argue the text before his guards take their positions.",
  "passText": "You cite the device's terms: authorization goes to the holder. Rank is not specified. The rod is in your hand. The Red Knight reads the terms again. He stands down. The road opens. You receive Red Gate Token.",
  "failText": "You argue from custom rather than the text. The Red Knight knows the custom agrees with him. Return to the text of the device — the terms are your argument, not the precedent.",
  "checkPassFlag": "lgwGarethAct3Done",
},
{
  "id": "lgw_04_act4",
  "title": "Gareth's Safe-Conduct — After the Quest",
  "type": "skill_check",
  "activateNode": "WM",
  "checkStat": "WIS", "checkDC": 11,
  "activateCond": "() => !!S_story.lgwGarethAct3Done",
  "desc": "The quest is done. Gareth has proven himself. He has his own authority now — the court no longer calls him kitchen boy. The rod that he could not carry is now the record of what he was before his own standing existed. It must be filed correctly: as proxy commission, not as Gareth's own record. The distinction matters for the archive's integrity.",
  "passText": "You file the commission correctly: proxy authority, carried for a knight before he earned standing to carry it himself. Not Gareth's record — the record of what he needed before he could not need it. You receive Commission Structure Mark — the correct filing category.",
  "failText": "You file it as Gareth's commission. Sweelinck looks at it. 'But he did not carry the rod.' The rod was yours. The commission was yours. Gareth was the companion. File it again with the correct carrier.",
  "checkPassFlag": "lgwGarethAct4Done",
},
{
  "id": "lgw_04_act5",
  "title": "Gareth's Safe-Conduct — The Archive",
  "type": "skill_check",
  "activateNode": "WM",
  "checkStat": "CHA", "checkDC": 11,
  "activateCond": "() => !!S_story.lgwGarethAct4Done",
  "desc": "Weimar. Sweelinck examines the device on the rod. He reads the terms. He looks at the filing category you proposed. He nods once and reaches for the rod. He holds it to the light.",
  "passText": "Sweelinck writes: 'Proxy Authority Records — The Token Carried for a Knight Before He Could Carry It Himself. First entry.' He sets the rod in the incoming shelf. 'The rod carried what Gareth had not yet earned. After, he earned it and carried his own authority. The rod is the record of the before.' You receive Archive Receipt — Proxy Authority.",
  "failText": "Sweelinck reads the device and asks: 'Who carried this rod?' You tell him. He looks at the filing category. 'Then it is not Gareth's record. It is yours, held in trust for what he would become.' File it again.",
  "checkPassFlag": "lgwGarethAct5Done",
},

# ── CYCLE 5: Gawain's Letter ──────────────────────────────────────────────────

{
  "id": "lgw_05_act1",
  "title": "Gawain's Letter — The Dying Commission",
  "type": "skill_check",
  "activateNode": "LGW",
  "checkStat": "WIS", "checkDC": 12,
  "activateCond": "() => !!S_story.lgwGarethAct5Done",
  "desc": "Gawain is dying at Dover from a skull wound reopened in a duel. He has written two letters. One is for Arthur. The other is for Lancelot: forgiveness asked, return requested. It reverses years. The seal ring is still warm — pressed into the wax while Gawain could still press it. The letter must be delivered while Gawain still lives, because if it arrives after his death it becomes a dead man's regret, not a living man's request. The distinction matters.",
  "passText": "You understand the commission's urgency and its specific meaning: the letter's value changes when Gawain dies. Move before his condition changes. You receive Gawain's Seal Letter — forgiveness and return, the ring still warm in the wax.",
  "failText": "You do not yet understand why timing matters. The letter will say the same things whether Gawain is alive or dead. Ask him again — he will explain what a living man's request is compared to a dead man's regret.",
  "checkPassFlag": "lgwGawainAct1Done",
},
{
  "id": "lgw_05_act2",
  "title": "Gawain's Letter — The Route",
  "type": "skill_check",
  "activateNode": "LGW",
  "checkStat": "STR", "checkDC": 13,
  "activateCond": "() => !!S_story.lgwGawainAct1Done",
  "desc": "The letter must travel quickly. Gawain will not survive the day. The direct route is through Mordred's controlled roads — he has blocked the south ports. The indirect route through Dover's neutral diplomatic channels is slower but the letter's integrity is protected from political interception. The timing is the argument: you have hours, not days.",
  "passText": "You take the route that protects the letter's integrity even at some cost in time. The letter moves. You receive Route Confirmation — the choice that got the letter through the right channels at the right speed.",
  "failText": "You take the direct route and are stopped at a Mordred checkpoint. The letter's existence becomes known before it is delivered. Start again with the protected route.",
  "checkPassFlag": "lgwGawainAct2Done",
},
{
  "id": "lgw_05_act3",
  "title": "Gawain's Letter — The Interception Attempt",
  "type": "skill_check",
  "activateNode": "CON",
  "checkStat": "CHA", "checkDC": 13,
  "activateCond": "() => !!S_story.lgwGawainAct2Done",
  "desc": "Constantinople's neutral diplomatic archive. A Mordred faction diplomat wants to suppress evidence of any Gawain-Lancelot communication — it undermines the narrative of Lancelot as betrayer that has been consolidated since the war began. Two agents have taken a formal position at the archive's intake desk. Private correspondence between individuals is not subject to diplomatic interception. Name the principle before they can record a formal objection.",
  "passText": "You name the principle before they can formalize their objection: private correspondence between individuals is not diplomatic intelligence. The archive intake proceeds. The letter is logged and dispatched. You receive Diplomatic Archive Receipt.",
  "failText": "You argue the content of the letter rather than its status. The agents use the content to argue that it is political correspondence. Argue the principle, not the content.",
  "checkPassFlag": "lgwGawainAct3Done",
},
{
  "id": "lgw_05_act4",
  "title": "Gawain's Letter — The Road After",
  "type": "skill_check",
  "activateNode": "WM",
  "checkStat": "WIS", "checkDC": 11,
  "activateCond": "() => !!S_story.lgwGawainAct3Done",
  "desc": "The letter's delivery is confirmed. Lancelot received it. On the road to Weimar, someone asks whether the letter changed anything — whether Lancelot returned in time, whether Gawain's reversal altered the war's outcome. That is the war's question. The archive holds the letter and the delivery confirmation. The archive does not hold the answer to whether it was enough.",
  "passText": "You give the archive's answer, not the war's: the letter was written, it was delivered, both facts are in the record. What happened after is the war's history. You receive Delivery Confirmation Mark — the record of what the archive holds and nothing more.",
  "failText": "You speculate on whether it changed anything. The person on the road needs that answer. The archive does not have it. Acknowledge the distinction between what was delivered and what it did.",
  "checkPassFlag": "lgwGawainAct4Done",
},
{
  "id": "lgw_05_act5",
  "title": "Gawain's Letter — The Archive",
  "type": "skill_check",
  "activateNode": "WM",
  "checkStat": "CHA", "checkDC": 11,
  "activateCond": "() => !!S_story.lgwGawainAct4Done",
  "desc": "Weimar. Sweelinck takes the letter from its diplomatic archive case. He reads it. He reads it again. A letter that reverses years of enmity, written by a dying man to the person he drove to war. The ring is still in the wax at the seal.",
  "passText": "Sweelinck writes: 'Reconciliation Records — The Letter That Reversed Years of Enmity. First entry. Gawain wrote it while dying. It reverses years. It arrived. Whether it arrived in time to change anything is the wars question, not the archives.' He files it. You receive Archive Receipt — Reconciliation Records.",
  "failText": "Sweelinck asks whether the letter changed anything. You give him the answer you gave on the road. He nods. 'The archive holds the letter and the delivery. The war holds the rest.' File it correctly.",
  "checkPassFlag": "lgwGawainAct5Done",
},

# ── CYCLE 6: The Grail Blood-Cloth ────────────────────────────────────────────

{
  "id": "lgw_06_act1",
  "title": "The Grail Blood-Cloth — The Dying Knight",
  "type": "skill_check",
  "activateNode": "LGW",
  "checkStat": "WIS", "checkDC": 11,
  "activateCond": "() => !!S_story.lgwGawainAct5Done",
  "desc": "A dying knight outside Corbenic presses a folded cloth into your hands. He glimpsed the Grail procession through a doorway he was not supposed to reach. The cloth was present at the procession. It is warm — warmer than the cloth of a dead man's coat should be, warmer than the night air, warm at a temperature that should not be possible. It must reach the Fisher King's chapel before first light or its last virtue fails. The chapel is through hostile territory.",
  "passText": "You understand the commission: the warmth is the evidence. The cloth must arrive still warm. Move before the warmth fails. You receive the Grail Blood-Cloth — folded, warm, the physical sign of what occurred.",
  "failText": "You ask what virtue means. The knight looks at you with the patience of a dying man. 'It means what it is. Move before it becomes what it was.' Take it and go.",
  "checkPassFlag": "lgwGrailAct1Done",
},
{
  "id": "lgw_06_act2",
  "title": "The Grail Blood-Cloth — The Night Road",
  "type": "skill_check",
  "activateNode": "LGW",
  "checkStat": "STR", "checkDC": 13,
  "activateCond": "() => !!S_story.lgwGrailAct1Done",
  "desc": "The chapel is through enemy-held territory at night. Three knights patrol the road between Corbenic and the Fisher King's hall. They are not looking for the cloth specifically — they are looking for anything moving after dark. The cloth is inside your coat. The warmth is still perceptible through the fabric. First light is two hours away.",
  "passText": "You move through the patrol's gaps without being stopped. The chapel is reached before first light. The cloth is still warm when the Fisher King receives it. You receive Night Road Mark — the passage completed in time.",
  "failText": "A patrol stops you. The delay costs thirty minutes. The chapel is reached, but the warmth has faded. The Fisher King takes the cloth and says nothing. You must deliver it faster.",
  "checkPassFlag": "lgwGrailAct2Done",
},
{
  "id": "lgw_06_act3",
  "title": "The Grail Blood-Cloth — The Relic Dispute",
  "type": "skill_check",
  "activateNode": "ROM",
  "checkStat": "CHA", "checkDC": 13,
  "activateCond": "() => !!S_story.lgwGrailAct2Done",
  "desc": "Rome. The Grail scholars at the Apostolic archive want to retain the cloth as a primary relic in church custody. Their argument is that the procession's physical evidence belongs under theological jurisdiction. The cloth documents the procession's occurrence as a physical event — it should be held in a neutral archive where its access cannot be controlled by any single institution. Make the argument before the relic agents take a formal position.",
  "passText": "You name the distinction: documentation of an occurrence is not the same as the occurrence's relic. The cloth is evidence, not a sacred object. Evidence belongs in a neutral archive. The relic agents' formal position is not yet taken. The cloth moves to the neutral archive. You receive Roman Clearance.",
  "failText": "You argue that the cloth is not sacred. The relic agents argue the warmth. You have given them the wrong argument — do not deny the warmth, argue the category.",
  "checkPassFlag": "lgwGrailAct3Done",
},
{
  "id": "lgw_06_act4",
  "title": "The Grail Blood-Cloth — The Carrier's Equanimity",
  "type": "skill_check",
  "activateNode": "WM",
  "checkStat": "WIS", "checkDC": 11,
  "activateCond": "() => !!S_story.lgwGrailAct3Done",
  "desc": "The road to Weimar. The cloth is still faintly warm at this distance from the procession's hour — it should not be, by any natural accounting, and everyone who handles it understands this. A merchant who briefly held the package at a customs station came back to ask about it. A border clerk asked you to open it and then asked you to take it away quickly. Hold the carrier's equanimity. The warmth is a fact, not a crisis.",
  "passText": "You hold still through the inquiries and move on. The warmth is noted as fact; it is not explained; it does not need to be. You receive Equanimity Mark — the record of having carried the impossible without drama.",
  "failText": "You explain the warmth. The explanation draws more attention. The warmth is a fact. Acknowledge it and decline to explain it. That is the archive's approach.",
  "checkPassFlag": "lgwGrailAct4Done",
},
{
  "id": "lgw_06_act5",
  "title": "The Grail Blood-Cloth — The Archive",
  "type": "skill_check",
  "activateNode": "WM",
  "checkStat": "CHA", "checkDC": 11,
  "activateCond": "() => !!S_story.lgwGrailAct4Done",
  "desc": "Weimar. Sweelinck holds the cloth carefully, at the corners. He does not fold it back. He holds a finger near its surface without touching it. He looks at you.",
  "passText": "Sweelinck writes very carefully: 'The procession occurred. The cloth was present. It is still warm.' He opens a new section. 'Procession Records — The Cloth That Was Present at the Grail. First entry. The archive holds the fact and the temperature.' You receive Archive Receipt — Procession Records.",
  "failText": "Sweelinck asks you to explain the warmth. You attempt an explanation. He looks at the cloth. 'The archive holds facts. The warmth is a fact. The explanation is outside the archive's scope.' Note the fact; decline to explain it.",
  "checkPassFlag": "lgwGrailAct5Done",
},

# ── CYCLE 7: Morgan's Reversal ────────────────────────────────────────────────

{
  "id": "lgw_07_act1",
  "title": "Morgan's Reversal — The Letter from the Barge",
  "type": "skill_check",
  "activateNode": "LGW",
  "checkStat": "WIS", "checkDC": 11,
  "activateCond": "() => !!S_story.lgwGrailAct5Done",
  "desc": "A black-hooded queen brings a letter from the barge at Avalon's edge to a London contact. Morgan le Fay wrote it the night before Camlann — a precise apology to Arthur for thirty years of enmity. The king was dead before it arrived. The letter was sealed, addressed, and could not reach its addressee. The archive receives letters that could not reach their addressee. This is what that section is for. The letter is sealed and goes to the archive sealed.",
  "passText": "You understand the commission: the letter is filed as an undelivered letter. The archive category this opens is its own commission. You receive Morgan's Apology — sealed, addressed to Arthur, the king who is no longer here to receive it.",
  "failText": "You ask what the apology says. The contact looks at you. 'The seal has not been broken. The archive receives it sealed.' The letter's content is between Morgan and Arthur. Take it to Weimar without opening it.",
  "checkPassFlag": "lgwMorganAct1Done",
},
{
  "id": "lgw_07_act2",
  "title": "Morgan's Reversal — The London Crossing",
  "type": "skill_check",
  "activateNode": "LDN",
  "checkStat": "CHA", "checkDC": 12,
  "activateCond": "() => !!S_story.lgwMorganAct1Done",
  "desc": "Mordred faction remnants in London want the letter suppressed. It challenges the consolidated narrative of Morgan-as-enemy. They do not know the letter's content — they know it exists and that it came from Avalon. The letter is private correspondence between Morgan and Arthur. Its existence challenges no one's standing. Name the principle at the crossing before they take a formal position.",
  "passText": "You name it before they can formalize: private correspondence is not political intelligence. The letter is sealed. Its existence challenges no one who is still living. They stand down. You receive London Crossing Mark.",
  "failText": "You argue they have no right to suppress it. They argue political necessity. You have given them the wrong argument — name the category of the letter, not their right to it.",
  "checkPassFlag": "lgwMorganAct2Done",
},
{
  "id": "lgw_07_act3",
  "title": "Morgan's Reversal — The Chronicle-Writer",
  "type": "skill_check",
  "activateNode": "LDN",
  "checkStat": "STR", "checkDC": 13,
  "activateCond": "() => !!S_story.lgwMorganAct2Done",
  "desc": "A chronicle-writer in London has heard about the letter and wants to read it before it is archived — for a history of Morgan le Fay, the most misunderstood figure in the age. Morgan's intention was private. The chronicle-writer's right to read for historical purposes is real but different from the archive's right to hold it permanently. Hold the seal through the chronicle-writer's request and the faction agents who arrive while the request is in progress.",
  "passText": "You hold the letter sealed through both pressures. The chronicle-writer's request is acknowledged and declined — the archive receives it sealed; access follows the archive's protocols. The agents see the letter moving in the right direction and do not press. You receive Seal Integrity Mark — the letter arrived sealed.",
  "failText": "You negotiate with the chronicle-writer about partial access. The agents use the negotiation as an opening. Hold the seal through both pressures simultaneously — there is no partial answer to a sealed letter.",
  "checkPassFlag": "lgwMorganAct3Done",
},
{
  "id": "lgw_07_act4",
  "title": "Morgan's Reversal — The Carrier's Curiosity",
  "type": "skill_check",
  "activateNode": "WM",
  "checkStat": "WIS", "checkDC": 11,
  "activateCond": "() => !!S_story.lgwMorganAct3Done",
  "desc": "On the road to Weimar, the Fighter wonders what the apology says. The letter is sealed. The commission was to carry it sealed. Morgan wrote it for Arthur; Arthur is not here to receive it; the archive holds it for the absence. The curiosity is understandable. The commission does not change because of it.",
  "passText": "You recognize the curiosity for what it is and hold the letter without opening it. The archive receives it sealed. What it says is between Morgan and a king who is not here. You receive Carrier's Restraint Mark — the letter unchanged.",
  "failText": "You open the letter. You read it. You seal it again. Sweelinck at the intake desk will know. The commission was to carry it sealed. Go back and answer for the opening before delivering it.",
  "checkPassFlag": "lgwMorganAct4Done",
},
{
  "id": "lgw_07_act5",
  "title": "Morgan's Reversal — The Archive",
  "type": "skill_check",
  "activateNode": "WM",
  "checkStat": "CHA", "checkDC": 11,
  "activateCond": "() => !!S_story.lgwMorganAct4Done",
  "desc": "Weimar. Sweelinck takes the letter. He holds it for a long moment. It is sealed. He does not open it. He reads the address on the exterior. He reads it again. He reaches for the intake ledger.",
  "passText": "Sweelinck opens a new archive section. 'Undelivered Letter Records — The Apology That Arrived After the King.' He writes carefully: 'She sent it the night before. It arrived after. The archive holds it for the king it was addressed to. He is not here to receive it. That is what this section is for.' The Morte d'Arthur series is complete. You receive Archive Receipt — Undelivered Letter Records.",
  "failText": "Sweelinck asks whether it was opened in transit. Tell him the truth. If it was opened, he notes it in the record. If it was not, he notes that. The archive holds the fact either way.",
  "checkPassFlag": "lgwMorganAct5Done",
  "questComplete": True,
},

]

created = 0
failed = 0
for q in quests:
    if create_quest(q):
        created += 1
    else:
        failed += 1

print(f"\n{'='*50}")
print(f"Done: {created} created, {failed} failed")

print("Saving...")
r = api("POST", "/api/save")
print("Save:", r.get("ok") if r else False)
