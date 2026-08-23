#!/usr/bin/env python3
# SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson and Claude
# ═══════════════════════════════════════════════════════════════════════════
# ⚠️  ARCHAIC — OUT OF DATE.  Historical one-shot importer (POSTs to the
#     localhost:1367 WBAPI).  Content was long ago imported and lives in
#     index.html.  This script likely NO LONGER RUNS against the current
#     server/schema.  Kept for reference only — do not run without review.
#     Import history: BACKLOG.md / plan-archive.md / 1367-sources/.
# ═══════════════════════════════════════════════════════════════════════════
"""§IMPORT-97 HFT: Frithiof's Saga (Esaias Tegnér, 1825) — 35 acts, 7 cycles"""

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

def audit():
    r = api("get", "/api/audit")
    parse = {p["section"]: p["count"] for p in r["parse"]}
    return parse.get("NODE_MAP", "?"), parse.get("QUEST_DB", "?")

# ─── NODES ──────────────────────────────────────────────────────────────────

say("HFT import: creating nodes ALR Alrekstadir Temple BLG Balders Grove RNG Ring private chamber ING Ingeborg chamber HEO exists as Lejre — source Frithiof Saga Tegnér 1825 — collision HFT South Shore Fishermens Village — use BLG as hub for cycles 3 through 7")

create_node("ALR", "camelot", "Alrekstaðir Temple — The Continuous Flame", 4, 104, 128,
    "A Norse temple on the coastal plain where Balder's sacred fire has burned continuously through all the years of the other fire's absence. An old priest tends it. The flame here is the only source that can consecrate a new altar at Sognefjord. Pre-dawn light, the altar lamp, the warmth of a fire that has not gone out.")

create_node("BLG", "highlands", "Balder's Grove — The Altar Foundation", 4, 104, 130,
    "The sacred enclosure in the Sognefjord district where Balder's peace was kept. The altar foundation where the sacred flame once burned. Frithiof broke it here in grief's extremity. He is rebuilding it now. The fjord visible from the grove edge, salt air in the sacred space. The workmen's scaffolding is up but the altar stone waits for the flame from the right source.")

create_node("RNG", "camelot", "Ring's Private Chamber — The Low Fire", 4, 106, 128,
    "King Ring's private chamber: a low fire, the king propped on pillows, entirely lucid and clearly dying. He has sent for the Fighter specifically — not a herald, not a court witness, not Frithiof. The commission is precise: four sentences to carry exactly, the signet ring as seal, Ingeborg as recipient. No paraphrase. No softening. The chamberlain is outside the door.")

create_node("ING", "camelot", "Ingeborg's Chamber — The Morning Window", 4, 106, 130,
    "Ingeborg's private rooms at Ring's hall. A window open to the courtyard below, morning light, a writing board. She has been sitting here since early morning knowing something was happening outside Ring's chamber and unable to go to him while the court was assembled. When the Fighter enters, she reads the face before hearing the words. She waits for the four sentences.")

create_node("HEO", "beach", "Angantyr's Harbor — The Departure Point", 4, 106, 132,
    "The harbor on the Orkney main island. Angantyr's departure point where the tribute receipt was sealed and Frithiof's ship loaded. The household member who objected to the tribute characterization has gone ahead to instruct the harbor watch to implement a hold. The ship is ready. Four minutes before the hold can be formally implemented.")

# ─── AUDIT ──────────────────────────────────────────────────────────────────

say("HFT import: pre-import audit — Frithiof Saga Tegnér 1825")
n0, q0 = audit()
print(f"Pre-import: {n0} nodes, {q0} quests")

# ─── CYCLE 1 — The Sacred Flame ─────────────────────────────────────────────

say("HFT cycle 1 The Sacred Flame: clay lamp holding Balders sacred fire carried from Alrekstadir through mountain wind and harbor crossing to new altar at Balders grove — source Frithiof Saga Tegnér 1825 — nodes ALR BK BLG — quest chain hft_01_act1 through hft_01_act5 — character the old priest of Alrekstadir — character the ferryman — character workmen at grove")

quest("hft_01_act1", "The Sacred Flame — The Lamp-Lighting",
    "The temple at Alrekstaðir is warm with decades of careful fire-keeping. The old priest holds the altar flame out. He explains once: the flame must not go out before it reaches the altar; if it goes out it is common fire and cannot serve. He does not light the lamp for you — the transfer is the carrier's act. Take the sacred flame from the altar lamp into the clay carrier with the steadiness and attention this requires.",
    activateNode="ALR",
    passText="The flame transfers cleanly into the clay lamp. It is small and steady. The priest nods once. 'Come back if it goes out,' he says. 'We begin again.' You receive the Sacred Flame of Balder — clay lamp, both hands required.",
    failText="Your hands are not quite still enough and the flame sputters. The priest waits. You try again — smaller movement, closer approach, the attention of someone who knows what they are doing.",
    checkStat="CON", checkDC=12,
    checkPassFlag="hftC1A1Done",
    activateMissionBit="HFT_questActive",
    grantItem="The Sacred Flame of Balder — a clay lamp holding fire from the continuous source at Alrekstaðir; both hands required")

quest("hft_01_act2", "The Sacred Flame — The Mountain Road",
    "The mountain road rises in switchbacks through a rocky valley. The wind is steady from the north — not a storm but a channeling cold that has been extinguishing flames since before roads were cut here. At the road's highest point, a gap between two rock faces focuses the wind into the worst angle for a carried flame. Both hands on the lamp. Your body as the windbreak. The gap is twenty feet wide.",
    activateNode="ALR",
    passText="You turn your body precisely and move through the gap at the speed that keeps the lamp in the wind-shadow your frame creates. The flame holds. You receive the Wind-Gap Stone — a small flat stone from the mountain road's hardest point.",
    failText="The flame sputters at the gap's worst point. You stop, turn your back to the wind completely, hold the lamp against your chest. The flame recovers. You continue.",
    checkStat="STR", checkDC=14,
    checkPassFlag="hftC1A2Done",
    activateCond="() => !!S_story.hftC1A1Done",
    grantItem="Wind-Gap Stone — a small flat stone from the mountain road's hardest point, pocketed marker of the passage")

quest("hft_01_act3", "The Sacred Flame — The Harbor Crossing",
    "The harbor ferry is flat-bottomed and the fjord is moving. The boatman offers his stern-box — a small wooden enclosure he uses for deliveries — to protect the lamp from salt spray. He has carried lit lamps before. He may be right about common fire. This is not common fire. The boat rocks as a wave catches the bow. Keep the flame in your hands and shelter it from the spray through the crossing.",
    activateNode="BK",
    passText="You find the balance: lamp at chest height, body turned to block the spray from the western side where the waves are worst. The crossing is rough and the flame holds. You receive the Ferry-Brass Ring — given without words as you step off the boat.",
    failText="A wave comes from an unexpected angle. Your body turns with it and the lamp nearly tips. You recover it. The flame is still going. The boatman is watching.",
    checkStat="STR", checkDC=14,
    checkPassFlag="hftC1A3Done",
    activateCond="() => !!S_story.hftC1A2Done",
    grantItem="Ferry-Brass Ring — a brass ring from the harbor ferry's bow-line, given wordlessly at the landing")

quest("hft_01_act4", "The Sacred Flame — The Last Road",
    "The coastal track runs to Balder's grove. Frithiof is ahead, not looking back. Two workmen at the grove's edge have been building in the dark since dawn and one of them moves toward the lamp — he needs light, not maliciously, just the ordinary need for a working flame. He holds out his torch stub. The flame is not for torches. The flame is for the altar. Decline without extinguishing the lamp in the encounter.",
    activateNode="BLG",
    passText="He steps back. He looks at the lamp again — at the quality of its light, which is perhaps different from common fire — and nods. He goes back to the shadows. You receive the Workman's Torch-Stub — the unlit stub, given afterward by Frithiof as the last obstacle's token.",
    failText="He reaches for the lamp anyway — not aggressively, just persistent. You find the words that make him understand why this specific flame cannot be divided before it reaches the altar.",
    checkStat="CHA", checkDC=14,
    checkPassFlag="hftC1A4Done",
    activateCond="() => !!S_story.hftC1A3Done",
    grantItem="Workman's Torch-Stub — the unlit stub from the workman at the grove's edge, given afterward by Frithiof as the last obstacle's token")

quest("hft_01_act5", "The Sacred Flame — The Altar Stone",
    "Frithiof kneels at the altar foundation, the bronze altar lamp in his hands, waiting. He hears you approach and turns. He sees the clay lamp still lit. His face does something you cannot quite name — not relief exactly, but the expression of a man who has been carrying the possibility of this moment for years and is now inside it. He holds the bronze lamp out. Transfer the flame from the clay carrier to the altar lamp.",
    activateNode="BLG",
    passText="The flame transfers to the bronze lamp. Frithiof sets it on the altar stone. It burns small and steady. Balder's peace begins again from this point, this flame, this specific source. The temple will be built around this. You receive the Clay Carrier's Shard — the empty clay lamp, still warm, proof of the full road.",
    failText="Your hands shake slightly — not from wind or spray but from the weight of what this is. You breathe. You try again with the full attention of the carrier who has brought the flame this far.",
    checkStat="CON", checkDC=12,
    checkPassFlag="hftC1A5Done",
    activateCond="() => !!S_story.hftC1A4Done",
    takeItem="The Sacred Flame of Balder — transferred to the altar; the clay lamp is empty",
    grantItem="Clay Carrier's Shard — the empty clay lamp, still warm, proof of the full road from source to altar")

# ─── CYCLE 2 — Ring's Deathbed Recognition ──────────────────────────────────

say("HFT cycle 2 Ring Deathbed Recognition: Rings signet ring pressed warm into Fighters palm on his deathbed — four sentences he always knew Frithiof from the first week — carried past the chamberlain to Ingeborg before court version fills the space — source Frithiof Saga Tegnér 1825 — nodes RNG ING — quest chain hft_02_act1 through hft_02_act5")

quest("hft_02_act1", "Ring's Deathbed Recognition — The Summons",
    "Ring has sent for you specifically — not a herald, not a court witness, not Frithiof. He is propped on pillows, entirely lucid, clearly dying. 'I always knew who he was,' he says. 'The first week. There is a way a man holds his hands when he has been trained in a different fighting style than the one he is pretending to use. I chose to say nothing. I want her to know that the welcome was genuine.' Understand that the words are the thing — not the emotion, the specific words, in the order he will specify, no paraphrase.",
    activateNode="RNG",
    passText="The recognition is four specific sentences about a specific choice at a specific moment. The words are the commission, not the sentiment. You nod. He begins.",
    failText="You understand the emotion but not the mechanism — you hear 'go tell her he loved her' when what he said is precisely different from that and the difference matters.",
    checkStat="WIS", checkDC=12,
    checkPassFlag="hftC2A1Done",
    activateMissionBit="HFT2_questActive")

quest("hft_02_act2", "Ring's Deathbed Recognition — The Dictation",
    "Four sentences. He speaks them slowly and has you repeat them back. Once incorrect — the order of the second and third clause — and he corrects you. Again. Correctly. He works the ring off his forefinger — it costs him something, his hands are failing — and presses it into your palm. The ring is warm from his finger. Outside the door: the chamberlain's footstep. Perhaps thirty seconds before he enters. Hold the four sentences in exact order and leave before the chamberlain enters.",
    activateNode="RNG",
    passText="Four sentences, exact, in the order he specified. You close your hand around the ring and are through the door before the chamberlain's hand reaches the latch. You receive Ring's Signet Ring — warm from his finger, the seal of the recognition.",
    failText="You leave correctly but one clause has transposed in your memory. The paraphrase is close. But it is not what he said.",
    checkStat="CON", checkDC=12,
    checkPassFlag="hftC2A2Done",
    activateCond="() => !!S_story.hftC2A1Done",
    grantItem="Ring's Signet Ring — worked off his forefinger on his deathbed, pressed warm into your palm; four sentences spoken over it; seal of the recognition that he always knew")

quest("hft_02_act3", "Ring's Deathbed Recognition — The Corridor",
    "The chamberlain has been outside Ring's door for an hour. He looks at you. At your closed hand. 'The king is resting. What business did you have?' He is the man whose function is to manage the flow of information through this court. He would like to know what you are carrying and where it is going so he can decide whether it needs to pass through him first. It does not pass through him. A small personal commission; not court business; entirely ordinary.",
    activateNode="RNG",
    passText="He looks at you for one more moment, then steps to the side. He will ask again later. Later is fine. You are already at the end of the corridor.",
    failText="He insists on knowing the nature of the commission. You lose time. He is now watching Ingeborg's corridor specifically.",
    checkStat="CHA", checkDC=13,
    checkPassFlag="hftC2A3Done",
    activateCond="() => !!S_story.hftC2A2Done")

quest("hft_02_act4", "Ring's Deathbed Recognition — Ingeborg's Door",
    "The passage to Ingeborg's rooms is attended by a household guard — one of Helge's old people, loyal to the court's structural interests. He knows the correct procedure for delivering messages to the queen is through the chamberlain's office. He is not going to let you through on your own authority. Fight through to Ingeborg's door before the corridor fills.",
    activateNode="RNG",
    passText="The guard is down. Four minutes before the corridor fills. Ingeborg's door is at the end of the passage.",
    failText="You are held in the passage while the chamberlain is summoned. By the time you reach Ingeborg, his version has preceded you.",
    checkStat="STR", checkDC=13,
    checkPassFlag="hftC2A4Done",
    activateCond="() => !!S_story.hftC2A3Done",
    monster="Court Household Guard", monsterHP=24, monsterAC=13)

quest("hft_02_act5", "Ring's Deathbed Recognition — Ingeborg's Chamber",
    "She turns when you enter. She reads your face before you speak. She has been sitting at her writing board since early morning, knowing something was happening outside Ring's chamber. You open your hand. The ring is there. She looks at it. She does not take it yet. She is waiting for the four sentences. Below, in the court, the chamberlain is beginning to organize the formal announcement of the king's condition. Say the four sentences in the exact order Ring specified. No context. No softening.",
    activateNode="ING",
    passText="Four sentences. His words. She closes her hand around the ring. The chamberlain's version, when it comes, will come into a room where this one was already said. You receive Ingeborg's Thanks — a small carved ivory piece from her writing board.",
    failText="You say three correctly and paraphrase the fourth. She knows it is a paraphrase. The difference between 'I chose it' and 'it was genuine' is one she will carry for the rest of her life.",
    checkStat="CON", checkDC=11,
    checkPassFlag="hftC2A5Done",
    activateCond="() => !!S_story.hftC2A4Done",
    takeItem="Ring's Signet Ring — in Ingeborg's hand; the recognition delivered without transformation",
    grantItem="Ingeborg's Thanks — a small carved ivory piece from her writing board, pressed into your hand without explanation")

# ─── CYCLE 3 — The Arm-Ring's First Journey ─────────────────────────────────
# HFT collides with South Shore — Fishermen's Village; use BLG as hub

say("HFT cycle 3 Arm-Ring First Journey: Ingeborg gives Frithiof her arm-ring at the harbor before banishment — heavy silver interlaced knotwork warm from her wrist — carried past Helges watchers to the ship — source Frithiof Saga Tegnér 1825 — nodes BLG BK WM — hub BLG since HFT collides with South Shore Fishermens Village")

quest("hft_03_act1", "The Arm-Ring's First Journey — The Harbor at Sognefjord",
    "Helge's watchers are at the harbor gate: a tall man in a grey cloak keeping a tally of who passes and what they carry, and a shorter one near the customs post watching faces. Helge wants to know if anyone passes anything to Frithiof before the ship departs. Ingeborg has given the ring to the Fighter — pressed it into the hand closest to her, at a moment when the watchers' attention was on Frithiof. She said nothing. The ring is warm from her wrist. Understand what she has done: the commission is concealment, not escort.",
    activateNode="BLG",
    passText="She gave it through an intermediary because direct transfer was watched. The ring must arrive at Frithiof's ship as if it never passed through the harbor gate at all. You close your fingers around the ring.",
    failText="You understand the emotion but not the mechanism. She did not give it to you for safekeeping; she gave it to you to carry unseen past the men who are watching for it.",
    checkStat="WIS", checkDC=11,
    checkPassFlag="hftC3A1Done",
    activateMissionBit="HFT3_questActive",
    grantItem="Ingeborg's Arm-Ring — heavy silver, interlaced knotwork, warm from her wrist; Helge's watchers have a description")

quest("hft_03_act2", "The Arm-Ring's First Journey — The Harbor Gate",
    "The tall watcher checks everyone passing through the harbor gate. He has a description of the arm-ring — heavy silver, interlaced knotwork — and is noting objects that match. The ring is inside your coat. Pass through the harbor gate as someone carrying personal goods, not as someone carrying a commission from Ingeborg.",
    activateNode="BLG",
    passText="The watcher looks at you and looks at the next person in line. You are through the gate with the ring still inside your coat.",
    failText="He looks at you a moment too long. You find the ordinary posture of someone carrying nothing remarkable and walk through before he can form the question.",
    checkStat="CHA", checkDC=13,
    checkPassFlag="hftC3A2Done",
    activateCond="() => !!S_story.hftC3A1Done")

quest("hft_03_act3", "The Arm-Ring's First Journey — The Dock",
    "The shorter watcher has the dock in sight. He has noted that you passed through the gate and are heading for the ship, and he is watching with the specific attention of a man told to watch for anything that was not cargo. Frithiof is supervising the loading. He cannot be approached directly without the watcher seeing a transfer. Reach Frithiof through the activity of the loading process, not as a separate encounter.",
    activateNode="BK",
    passText="In the ordinary motion of cargo work — a rope passed, a hand reached out — the ring moves from your hand to Frithiof's without a visible exchange.",
    failText="The watcher's angle shifts at the wrong moment. You wait for another opening in the loading activity. It comes.",
    checkStat="CHA", checkDC=12,
    checkPassFlag="hftC3A3Done",
    activateCond="() => !!S_story.hftC3A2Done")

quest("hft_03_act4", "The Arm-Ring's First Journey — The Last Minutes",
    "The ring is in Frithiof's possession. The shorter watcher has moved down the dock — he did not see the transfer directly but he suspects it and is noting your position. Frithiof's hand is closed around the arm-ring. The ship must be moving before the question can be answered. Create the distance between the watcher and Frithiof's departure moment.",
    activateNode="BK",
    passText="The ship moves off the dock. The watcher is still walking toward where you were standing. By the time he arrives, the question he intended to ask has no useful object.",
    failText="He reaches you before the ship has fully cleared the dock and asks what was passed. You answer with something that takes thirty seconds to say. The ship is moving by the time he looks up.",
    checkStat="STR", checkDC=12,
    checkPassFlag="hftC3A4Done",
    activateCond="() => !!S_story.hftC3A3Done")

quest("hft_03_act5", "The Arm-Ring's First Journey — Weimar Archive",
    "The arm-ring went with Frithiof on the Orkney voyage and eventually came to rest on Ingeborg's arm in Ring's hall, placed there by Ring himself. The account of how it reached the ship — through the watchers' eyes — was recorded by one of Helge's watchers who thought the tally would be used against Frithiof. It was not. Sweelinck receives the watcher's tally: the harbor record with you noted as 'unknown carrier, suspected transfer.' The watcher wrote it to name a crime. It names a kindness instead.",
    activateNode="WM",
    passText="Sweelinck writes: 'First entry. Gift Records — The Object That Carried Two People's Promise Across the Watching Eyes. The tally proves the ring was moved without being seen. The document that failed to document what it was looking for.' He files it.",
    failText="The tally sheet is incomplete. Sweelinck notes the gap and files what is there. The record is partial but legible.",
    checkStat="WIS", checkDC=11,
    checkPassFlag="hftC3A5Done",
    activateCond="() => !!S_story.hftC3A4Done",
    takeItem="Ingeborg's Arm-Ring — the watcher's tally is the receipt; the ring traveled further than this document knew")

# ─── CYCLE 4 — Angantyr's Receipt ───────────────────────────────────────────

say("HFT cycle 4 Angantyr Receipt: partial Orkney tribute carried to Jarl Angantyr for his sealing mark — the seal is the politics the sum is secondary — source Frithiof Saga Tegnér 1825 — nodes BLG HEO WM — quest chain hft_04_act1 through hft_04_act5")

quest("hft_04_act1", "Angantyr's Receipt — The Orkney Hall",
    "Angantyr's hall on the Orkney main island. He received Frithiof with the formal courtesy due a genuine warrior. The tribute question is complicated — he has the goods but did not pay because payment would endorse a contested political claim he had not made. Give Angantyr a reason to seal the partial payment that does not require him to endorse the political claim he has been avoiding for twenty years. Frame it as a personal transaction between warriors, not a political submission.",
    activateNode="BLG",
    passText="He looks at you. 'A personal transaction between warriors.' He reaches for the marking tools. The thrall is brought in. The counting begins.",
    failText="He shakes his head at the framing. You find a different approach — a personal acknowledgment of debt, not a formal submission to a disputed crown.",
    checkStat="CHA", checkDC=13,
    checkPassFlag="hftC4A1Done",
    activateMissionBit="HFT4_questActive")

quest("hft_04_act2", "Angantyr's Receipt — The Counting",
    "The tribute goods are being counted. The shortfall is significant. Angantyr says: 'The seal can cover what is here. But the receipt will name the shortfall.' A receipt naming the shortfall is technically a record of partial failure. The alternative: a receipt naming only what was paid, not what was owed. Understand what Angantyr is offering and what the decision means.",
    activateNode="BLG",
    passText="The distinction is clear: the political value of a receipt naming only delivery versus the accuracy cost of erasing the shortfall. The delivered sum is what the Sognefjord court needs. The original obligation is secondary.",
    failText="The distinction blurs. Angantyr makes the decision himself: delivery only, shortfall unstated. The receipt will name what arrived.",
    checkStat="WIS", checkDC=12,
    checkPassFlag="hftC4A2Done",
    activateCond="() => !!S_story.hftC4A1Done")

quest("hft_04_act3", "Angantyr's Receipt — The Seal",
    "The receipt is being prepared. One of Angantyr's household members objects: sealing the receipt gives the Helge faction legal standing in a territorial dispute — the partial payment will be cited. He wants the transaction recharacterized as a gift, not tribute. Maintain the tribute characterization. A gift has no political weight; a tribute receipt carries the acknowledgment that mattered.",
    activateNode="BLG",
    passText="The household member is overruled. The receipt is sealed as tribute. Angantyr's notch-mark and the thrall's impression confirm: the transaction occurred in the correct political register. You receive Angantyr's Sealed Receipt — birchwood, notch-mark at top, impression at bottom.",
    failText="The characterization is contested. Angantyr makes the final call: tribute. The seal goes on.",
    checkStat="CHA", checkDC=12,
    checkPassFlag="hftC4A3Done",
    activateCond="() => !!S_story.hftC4A2Done",
    grantItem="Angantyr's Sealed Receipt — birchwood with Orkney jarl's notch-mark and thrall's impression; official acknowledgment that tribute was received; the seal is the politics")

quest("hft_04_act4", "Angantyr's Receipt — The Harbor",
    "The receipt is sealed. The household member who objected has gone to the harbor ahead of you and told the harbor watch that the departure carries documents needing review before leaving. The harbor watch has authority to hold the ship. Reach the ship before the hold can be formally implemented.",
    activateNode="HEO",
    passText="You are on the ship and the lines are cast before the harbor watch has finished reading the hold order. The ship is moving. The receipt is aboard.",
    failText="The harbor watch reaches you at the gangplank. You negotiate the delay down to one question. The ship leaves late but it leaves.",
    checkStat="STR", checkDC=13,
    checkPassFlag="hftC4A4Done",
    activateCond="() => !!S_story.hftC4A3Done")

quest("hft_04_act5", "Angantyr's Receipt — Weimar Archive",
    "The receipt was used at the Sognefjord court to establish the validity of Frithiof's mission. It worked. Sweelinck receives it: the partial payment acknowledged as complete by the right authority. A category the archive had not yet received.",
    activateNode="WM",
    passText="Sweelinck writes: 'First entry. Tributary Records — The Partial Payment Acknowledged as Complete by the Right Authority.' He files the receipt. 'The seal is the politics. The sum is a detail.'",
    failText="The receipt is accepted. Sweelinck notes the unusual category and files it. The category was empty before this.",
    checkStat="WIS", checkDC=11,
    checkPassFlag="hftC4A5Done",
    activateCond="() => !!S_story.hftC4A4Done",
    takeItem="Angantyr's Sealed Receipt — filed in the Weimar archive under Tributary Records")

# ─── CYCLE 5 — The False Name ────────────────────────────────────────────────

say("HFT cycle 5 The False Name: Frithiof at Ring court as Thief — false origin document to hold chamberlain investigation — alias that was accurate in a deeper sense — source Frithiof Saga Tegnér 1825 — nodes BLG CON WM — quest chain hft_05_act1 through hft_05_act5")

quest("hft_05_act1", "The False Name — Ring's Court",
    "Frithiof knows the chamberlain is asking questions about 'Thief Eriksson.' He cannot respond directly without revealing who he is. He needs a document that will hold the inquiry long enough to become irrelevant. He gives the Fighter two instructions: the origin story (a fictional coastal chieftain, three years of service, nothing easily disproved) and the recipient (the chamberlain, before the archive inquiry returns nothing). Persuade the court scribe to produce the sealed letter, framed as a personal commission for a guest needing credentials for a border guard inquiry.",
    activateNode="BLG",
    passText="The scribe produces the sealed letter. The coastal chieftain's name is correct in form. The origin story is internally consistent. The seal is unfamiliar — which is the weakness, but also unavoidable.",
    failText="The scribe hesitates at the commission's unusual character. You find a different framing — a traveler's attestation for a minor border crossing, not an unusual commission at all.",
    checkStat="CHA", checkDC=12,
    checkPassFlag="hftC5A1Done",
    activateMissionBit="HFT5_questActive",
    grantItem="The False Origin Document — sealed letter confirming 'Thief Eriksson' served a fictional coastal chieftain; a forgery; also, in the way aliases are, a record of a real thing")

quest("hft_05_act2", "The False Name — The Corridor",
    "The sealed letter is in your hand. The chamberlain is at the end of the corridor, about to enter his office where the archive inquiry waits on his desk. If he enters before you reach him, the inquiry goes forward. Reach the chamberlain before he enters his office and opens the inquiry.",
    activateNode="BLG",
    passText="You reach him at the corridor's end before his hand is on the latch. He turns. You hold out the letter.",
    failText="He is through the door before you reach him. You knock. He opens it. The letter still arrives before the inquiry is opened.",
    checkStat="STR", checkDC=12,
    checkPassFlag="hftC5A2Done",
    activateCond="() => !!S_story.hftC5A1Done")

quest("hft_05_act3", "The False Name — The Chamberlain",
    "The chamberlain receives the letter. He is a careful man. He looks at the seal. 'This is a coastal chieftain's mark I don't recognize.' An unfamiliar seal is a verification gap. Satisfy his concern without adding details that can be disproved. The seal is correct in form; the chieftain's name is one he would not know from the northern coastal districts.",
    activateNode="BLG",
    passText="He accepts it provisionally. A northern coastal district — incomplete records are a known problem in that category. He notes the gap and files the letter for follow-up that will never be convenient.",
    failText="He presses for the chieftain's name's provenance. You give him the northern coastal district explanation and he accepts it with visible reluctance.",
    checkStat="CHA", checkDC=13,
    checkPassFlag="hftC5A3Done",
    activateCond="() => !!S_story.hftC5A2Done")

quest("hft_05_act4", "The False Name — The Archive",
    "The chamberlain accepted the letter but also forwarded the archive inquiry in case the letter proved insufficient. The inquiry has reached the archive assistant's desk. A search for 'Thief Eriksson, coastal Norwegian' will return nothing. Reach the archive assistant before the search is completed and redirect the inquiry to the incomplete northern coastal district category, which is filed separately and notoriously incomplete.",
    activateNode="CON",
    passText="The assistant redirects the inquiry to the northern coastal category. Incomplete records. Expected absence. No result is a result in this category.",
    failText="The search has already returned nothing. You reach the assistant as he is writing 'no record found.' You explain the northern coastal district category. He adds a note: 'see coastal incomplete.' The absence is categorized.",
    checkStat="CHA", checkDC=11,
    checkPassFlag="hftC5A4Done",
    activateCond="() => !!S_story.hftC5A3Done")

quest("hft_05_act5", "The False Name — Weimar Archive",
    "Ring's court dissolved, Ring died, Frithiof's identity became known. The false origin document was found in the chamberlain's files and sent to the Weimar archive as a curiosity. The chamberlain attached his own note: 'Thief Eriksson — alias determined to be Frithiof Thorstenson of Sognefjord. Origin document forged. Inquiry successfully delayed.' Sweelinck reads both documents together.",
    activateNode="WM",
    passText="Sweelinck writes: 'First entry. Alias Records — The Identity That Was Correct While It Was Used.' He files both the forgery and the chamberlain's note facing each other. 'Without both, neither is fully legible.'",
    failText="Sweelinck receives the forgery but the chamberlain's note was lost in transit. He files the forgery alone with a note: 'alias document; partner document expected.'",
    checkStat="WIS", checkDC=11,
    checkPassFlag="hftC5A5Done",
    activateCond="() => !!S_story.hftC5A4Done",
    takeItem="The False Origin Document — filed in the Weimar archive under Alias Records alongside the chamberlain's note")

# ─── CYCLE 6 — The Arm-Ring Returns ─────────────────────────────────────────

say("HFT cycle 6 Arm-Ring Returns: Ring estate dissolution — arm-ring chain of custody Ingeborg to Frithiof to Ring to Ingeborg — transferred from estate inventory to personal property — source Frithiof Saga Tegnér 1825 — nodes BLG VEN WM — quest chain hft_06_act1 through hft_06_act5")

quest("hft_06_act1", "The Arm-Ring Returns — Ring's Estate Office",
    "Ring's estate is being dissolved. Everything is being counted. The arm-ring on Ingeborg's wrist has been noted by the estate clerk as 'silver arm-ring, quality work, inventory item pending status determination.' It is not an inventory item — it was a personal gift that traveled a specific documented journey. Ingeborg hands the Fighter a note in her own hand: the chain of custody. Understand what documentation the clerk needs to transfer the ring as personal property rather than estate asset.",
    activateNode="BLG",
    passText="The clerk needs a formal chain of custody statement covering the transfer moments: Ingeborg to Frithiof at the harbor, Frithiof to Ring as tribute, Ring to Ingeborg at table in the formal gesture of gift. The re-gifting moment is the operative act.",
    failText="The clerk's requirements are not immediately clear from his category system. You find the form he uses for disputed personal property and work from there.",
    checkStat="WIS", checkDC=11,
    checkPassFlag="hftC6A1Done",
    activateMissionBit="HFT6_questActive")

quest("hft_06_act2", "The Arm-Ring Returns — The Inventory Challenge",
    "One of Ring's distant nephews has filed a claim on the ring as a high-value estate asset. His argument: the ring was offered to Ring as tribute — tribute offered to a king becomes crown property, not personal gift. Counter: Ring placed the ring on Ingeborg's arm himself, which is the formal gesture of gift, not retention. Establish the re-gifting gesture as the operative act that removed the ring from the tribute-retention category.",
    activateNode="BLG",
    passText="The crown-property doctrine applies to tribute retained, not tribute re-gifted. Ring's gesture at table terminates the tributary character. The clerk accepts the distinction.",
    failText="The nephew's representative presses the argument. The clerk calls for witness statements before ruling.",
    checkStat="CHA", checkDC=13,
    checkPassFlag="hftC6A2Done",
    activateCond="() => !!S_story.hftC6A1Done")

quest("hft_06_act3", "The Arm-Ring Returns — The Clerk's Verification",
    "The clerk requires a witness statement that Ring placed the ring on Ingeborg's arm at a specific meal, in front of witnesses. Two of Ring's household members who were present are in the guest quarter on the far side of the hall. The nephew's representative is also heading toward the guest quarter. Reach the witnesses before he can instruct them not to provide the statement.",
    activateNode="BLG",
    passText="The witnesses are reached first. They provide the statement: Ring placed the arm-ring on Ingeborg's arm at the Yule meal, in the presence of the full household. The representative arrives to find the statement already signed.",
    failText="The representative arrives at the same moment. The witnesses look between you. They choose the party with the simpler request.",
    checkStat="STR", checkDC=12,
    checkPassFlag="hftC6A3Done",
    activateCond="() => !!S_story.hftC6A2Done")

quest("hft_06_act4", "The Arm-Ring Returns — The Transfer Document",
    "The witnesses have provided the statement. The clerk is preparing the transfer document. The nephew's representative files a final procedural objection: the chain of custody includes Frithiof's tribute offer, a crown transaction, therefore subject to crown-property rules regardless of subsequent re-gifting. He argues the transfer must go through the chamberlain's review. Distinguish tribute transaction from subsequent re-gift: crown-property attaches at retention, not at offer.",
    activateNode="VEN",
    passText="The distinction holds. Ring's re-gift terminated the tributary character. The clerk accepts. The transfer document is completed. You receive the Arm-Ring Estate Transfer Receipt — chain of custody documented, status personal gift returned.",
    failText="The representative's argument requires a procedural note from the chamberlain. The note is obtained. It supports the re-gifting position. The transfer proceeds with the note attached.",
    checkStat="CHA", checkDC=12,
    checkPassFlag="hftC6A4Done",
    activateCond="() => !!S_story.hftC6A3Done",
    grantItem="Arm-Ring Estate Transfer Receipt — estate clerk's formal record: silver arm-ring transferred from inventory to Ingeborg's personal property; chain of custody: Ingeborg → Frithiof → Ring → Ingeborg; status: personal gift returned")

quest("hft_06_act5", "The Arm-Ring Returns — Weimar Archive",
    "The estate transfer receipt was filed with the dissolution proceedings. A copy was sent to the Weimar archive by a Sognefjord legal scholar using the case to illustrate the distinction between tributary retention and subsequent gift. Sweelinck reads the chain of custody aloud: Ingeborg gave it, Frithiof carried it, he offered it to Ring as tribute, Ring put it on her arm himself.",
    activateNode="WM",
    passText="Sweelinck writes: 'First entry. Estate Transfer Records — The Gift That Circled Through Three Hands and Came Home.' He files it. 'The chain of custody is the arc. It was always going back.'",
    failText="The estate receipt is received. Sweelinck traces the chain of custody and files it without comment. The arc is legible in the document itself.",
    checkStat="WIS", checkDC=11,
    checkPassFlag="hftC6A5Done",
    activateCond="() => !!S_story.hftC6A4Done",
    takeItem="Arm-Ring Estate Transfer Receipt — filed in the Weimar archive under Estate Transfer Records")

# ─── CYCLE 7 — Helge's Weapon ────────────────────────────────────────────────

say("HFT cycle 7 Helge Weapon: smith commission record of weapon made in violation of truce — Helge paid to keep no record the smith kept one — carried to Halfdan then Weimar archive — source Frithiof Saga Tegnér 1825 — nodes BLG LDN WM — FINAL CYCLE questComplete")

quest("hft_07_act1", "Helge's Weapon — The Smith's Forge",
    "After Helge drowns in the confrontation at the shore, the smith comes to the Fighter. He made what he was paid to make and kept his own record as he always does: tool and trade records for his own protection. He hands a folded note: the commission, the date, the specifications. 'He commissioned a weapon with a specific design — one that would break under examination to suggest it was carried in good faith, not made for killing under a truce. He paid me to keep no record. I kept one. I don't know what you do with it. I know I shouldn't hold it.' Receive the account.",
    activateNode="BLG",
    passText="The paper is plain. The specifications are specific. The date is during the truce. You take it. The smith nods and walks back toward the forge.",
    failText="The smith is reluctant at the last moment. You ask him what he expected would happen to a weapon made like this. He hands it over.",
    checkStat="WIS", checkDC=10,
    checkPassFlag="hftC7A1Done",
    activateMissionBit="HFT7_questActive",
    grantItem="Helge's Weapon Account — smith's commission record: weapon specifications, date during the truce, payment, note that client requested no record; the smith kept one anyway")

quest("hft_07_act2", "Helge's Weapon — The Shore",
    "Helge is dead. Multiple accounts are already being composed. The account naming the truce-violating weapon makes Helge's drowning an ironic accident rather than a divine judgment on a man who came armed in violation of the peace. Reach Halfdan directly before the chamberlain's version hardens, and present the smith's account without accusing Helge's memory of cowardice.",
    activateNode="BLG",
    passText="Halfdan receives you before the chamberlain's version is formalized. He reads the commission specifications. He sits with it. He does not deny it.",
    failText="The chamberlain's version reaches Halfdan's ears first. You present the smith's account anyway. Halfdan considers both. The commission record goes in the official file.",
    checkStat="CHA", checkDC=13,
    checkPassFlag="hftC7A2Done",
    activateCond="() => !!S_story.hftC7A1Done")

quest("hft_07_act3", "Helge's Weapon — Halfdan's Hall",
    "Halfdan says: 'My brother went to the shore with a weapon. He went because of me, in a way — because I was king and he was not, and the loss of everything he expected was mine to have caused.' He looks at the account. 'What do you want for this document?' He is not offering a bribe. He is asking what the Fighter needs the document to do: archive, court proceeding, or Frithiof? Understand what Halfdan is asking and answer correctly.",
    activateNode="BLG",
    passText="The account is for the archive. Not against Helge. For the record of what the truce required and what was done with it. Halfdan nods. 'Take it where it belongs.'",
    failText="The question requires a moment. You give the wrong answer first — 'for Frithiof' — and correct it: for the archive, the permanent record, the one that outlasts the court's version.",
    checkStat="WIS", checkDC=12,
    checkPassFlag="hftC7A3Done",
    activateCond="() => !!S_story.hftC7A2Done")

quest("hft_07_act4", "Helge's Weapon — The Journey",
    "Two men from Helge's household are on the road from Sognefjord to the northern harbor. They do not know what the Fighter carries but they know the smith gave something to someone. They are not organized; they are grief-blind and looking for something to protect on behalf of a dead master. Pass them on the road.",
    activateNode="LDN",
    passText="They are looking, not pursuing. You are on the road before they have resolved what they are looking for. They watch you pass and do not move.",
    failText="One of them recognizes you from the forge. He asks what the smith gave you. You answer truthfully and uninformatively: a trade record, routine. He lets you continue.",
    checkStat="STR", checkDC=12,
    checkPassFlag="hftC7A4Done",
    activateCond="() => !!S_story.hftC7A3Done")

quest("hft_07_act5", "Helge's Weapon — Weimar Archive",
    "The smith's account has reached the archive. The official court record notes that Helge was armed; it does not specify the weapon's character. The archive holds the specification. Sweelinck reads the commission: a weapon designed to appear to be a self-defense blade under examination, commissioned during the truce, client requested no record.",
    activateNode="WM",
    passText="Sweelinck writes: 'First entry. Truce Records — The Weapon Made in Violation of the Peace.' He files it. 'The truce is the document this weapon violated. Both live here now. The smith kept the record because he knows what records are for.'",
    failText="The account is received. Sweelinck reads the commission date against the truce date, notes the overlap, and files it under Truce Records. The category was empty before this.",
    checkStat="WIS", checkDC=11,
    checkPassFlag="hftC7A5Done",
    activateCond="() => !!S_story.hftC7A4Done",
    takeItem="Helge's Weapon Account — filed in the Weimar archive under Truce Records",
    questComplete=True)

# ─── AUDIT ──────────────────────────────────────────────────────────────────

say("HFT import complete: post-import audit — Frithiof Saga Tegnér 1825 — 7 cycles 5 acts 35 quests — nodes ALR BLG RNG ING — HEO existed as Lejre — collision HFT South Shore resolved using BLG as hub for cycles 3 through 7 — checking final counts")
n1, q1 = audit()
print(f"Post-import: {n1} nodes, {q1} quests")
