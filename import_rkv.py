#!/usr/bin/env python3
"""§IMPORT-98 RKV: Poetic Edda (Anon, ~10th–13th C) — 35 acts, 7 cycles"""

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

say("RKV import: creating nodes VLH Volva Heath AEG Aegir feast hall RSS standing stone outside Asgardr — source Poetic Edda Anon tenth through thirteenth century Codex Regius 1270 — collision RKV Frost Wardens Throne — use AEG as hub for cycles 3 through 7")

create_node("VLH", "highlands", "Völva's Heath — The Empty Ground", 4, 108, 128,
    "A flat stretch of northern heath where the grass has been pressed flat in a rough circle. The place where the seeress was called up to speak Völuspá to Odin. No structures. The quality of the air after something large has been said in the invisible register. Two plain gold rings, cold, lying in the bent grass at the center.")

create_node("AEG", "camelot", "Ægir's Feast Hall — The Flyting End", 4, 108, 130,
    "The hall of the sea-giant Ægir, where the gods feast and where Loki returned after being ejected to say everything he had been saving about every god in the room. The torches burning low after the incident. Odin's ravens near the ceiling. Thor already gone down the road. A rune-chip half-under a bench near the threshold.")

create_node("RSS", "ruins", "The Standing Stone — The Archive Road", 4, 108, 132,
    "The standing stone at the road's edge outside Ásgarðr's walls, carved with marks older than the current rune-system — a prior notation for transactions of this type. At its base in the grass: other objects placed over time, things too dangerous to keep, things too true to destroy. The road from Ásgarðr's gate is a quarter-mile back. The stone receives what is carried here.")

# ─── AUDIT ──────────────────────────────────────────────────────────────────

say("RKV import: pre-import audit — Poetic Edda Anon tenth through thirteenth century")
n0, q0 = audit()
print(f"Pre-import: {n0} nodes, {q0} quests")

# ─── CYCLE 1 — After Völuspá ─────────────────────────────────────────────────

say("RKV cycle 1 After Voluspa: Odin paid the seeress two plain gold rings for the worlds complete history — creation golden age Ragnarok renewal — she has sunk — the rings are on the heath and must reach the standing stone at the fields edge — source Poetic Edda Anon — nodes VLH — quest chain rkv_01_act1 through rkv_01_act5")

quest("rkv_01_act1", "After Völuspá — The Empty Ground",
    "The heath is empty. The grass is pressed flat in a rough circle — the shape of where they stood. In the center: two rings, gold, lying in the bent grass. You did not see the encounter. By the time you reached the heath they were gone. The rings were there. They are cold and have been warm recently. Understand what the rings are and pick them up.",
    activateNode="VLH",
    passText="These paid for Völuspá. Odin left them here when she sank. They belong at the stone at the field's edge. You pick them up. They are cold and have been warm recently. You receive the Seeress's Payment Rings.",
    failText="The rings are two plain gold rings. Then you feel the weight of them — not physical weight but the specific gravity of objects that have changed hands in a significant transaction. You try again.",
    checkStat="WIS", checkDC=12,
    checkPassFlag="rkvC1A1Done",
    activateMissionBit="RKV_questActive",
    grantItem="The Seeress's Payment Rings — two plain gold rings, Odin's payment for the world's total history; cold; have been warm recently")

quest("rkv_01_act2", "After Völuspá — The Road Through the Village",
    "The village market is assembling in the morning's flat light. An old man at the corner is watching travelers from the direction of the heath. He can see the rings through your coat somehow — or feel the weight of them — and he is one of the people who knows what kind of rings these are. He steps toward you. Answer the old man's questions without giving the rings away or letting him decide where they should go. He may be right about what he knows. But he is not the destination.",
    activateNode="VLH",
    passText="He hears where you are going and nods. He says: 'I will meet you there.' He does not explain. He presses a smooth river stone into your hand. You receive the Old Man's Road-Stone — for the ford, he says, it runs fast in the morning.",
    failText="He reaches for the rings. He is not violent; he is certain. You find the argument that acknowledges what he knows and names where you are going. He steps back.",
    checkStat="CHA", checkDC=14,
    checkPassFlag="rkvC1A2Done",
    activateCond="() => !!S_story.rkvC1A1Done",
    grantItem="Old Man's Road-Stone — a smooth river stone from the ford, given for the crossing")

quest("rkv_01_act3", "After Völuspá — The River Crossing",
    "The ford is higher than usual — upstream runoff has brought the water up. The current is fast and the bottom is uneven stone. The field's edge is visible on the far side: a standing stone in the morning grey. The rings are small and the current would take them instantly. Cross the ford without dropping the rings.",
    activateNode="VLH",
    passText="You cross with both rings closed in your fist. The ford is behind you. The standing stone is thirty paces ahead in the morning light. You receive the Ford-Stone — the old man's road-stone, damp from the crossing, proof of the ford.",
    failText="The current pulls at your feet. One ring shifts in your grip. You close your hand tighter and find your footing on the uneven bottom and start again from the bank.",
    checkStat="STR", checkDC=14,
    checkPassFlag="rkvC1A3Done",
    activateCond="() => !!S_story.rkvC1A2Done",
    grantItem="Ford-Stone — the old man's road-stone, damp from the crossing, the physical proof of the ford")

quest("rkv_01_act4", "After Völuspá — The Standing Stone",
    "The standing stone at the field's edge is carved with marks older than the current rune-system — a prior notation for transactions of this kind. At its base is a natural hollow between the stone and the ground. Other things have been placed there before. The old man from the village is already here, standing back, watching. He is a witness. Find the correct placement in the hollow and determine the form for placing the rings.",
    activateNode="VLH",
    passText="You see it: the two rings belong at the back of the hollow, facing east — how all such payments in this system are oriented. The old man's stillness changes slightly. You receive the Stone-Carver's Mark-Chip — a fragment of the stone's carved surface that came away when you examined it.",
    failText="The hollow has two possible positions. One is correct. You look at the other objects placed there before — at how they were oriented — and try the correct one.",
    checkStat="WIS", checkDC=14,
    checkPassFlag="rkvC1A4Done",
    activateCond="() => !!S_story.rkvC1A3Done",
    grantItem="Stone-Carver's Mark-Chip — a fragment of the standing stone's carved surface, the accidental token of having found the form")

quest("rkv_01_act5", "After Völuspá — The Placement",
    "The field is quiet. The old man stands back. The dawn light is beginning to color the eastern edge. You are holding the rings over the hollow — the last inch between the payment and the record. It is a simple physical act, but it closes a transaction that was opened when the seeress first said: I remember the giants born of old. Place the rings in the hollow. Be present for the moment when the payment is recorded.",
    activateNode="VLH",
    passText="You place the rings at the back of the hollow, facing east. There is a moment through your fingers when they settle as if the hollow was made for them, which it was. The payment is complete. The old man nods once and begins walking back to the village. You receive the Stone-Witness's Carved Chip — the fragment, warm now from your grip, proof of the placement.",
    failText="Your hand hesitates — not from doubt but from the weight of what the rings represent. You breathe. You try again.",
    checkStat="CON", checkDC=12,
    checkPassFlag="rkvC1A5Done",
    activateCond="() => !!S_story.rkvC1A4Done",
    takeItem="The Seeress's Payment Rings — placed in the stone's hollow; the transaction recorded",
    grantItem="Stone-Witness's Carved Chip — the fragment of the standing stone's carved surface, warm from the grip, proof of the placement and the witnessing")

# ─── CYCLE 2 — Loki's Escape from Ægir's Feast ──────────────────────────────

say("RKV cycle 2 Loki Escape Aegir Feast: Loki dropped a rune chip on the floor of Aegirs hall as he walked out — thumb-sized alder wood — one rune carved on each face — an accusation and a proof — must be carried closed-fist to the standing stone outside Asgardr — source Poetic Edda Anon Lokasenna — nodes AEG ASG RSS")

quest("rkv_02_act1", "Loki's Escape — The Floor",
    "The feast at Ægir's is ending in the specific way Loki intended. He came in, sat down, said everything he had been saving about every god in the room, and walked out when Thor's threats became credible. On the floor near the threshold, half under a bench, is a small piece of alder-wood — thumb-sized. It was in Loki's hand at some point during the feast and now it is on the floor and he is gone. Understand before you look at it that you are not supposed to look at it. The commission is the carrying, not the knowing.",
    activateNode="AEG",
    passText="You close your hand around the chip with the carved faces inward. You do not look. The closed hand is the beginning of the commission. You are through the threshold before the first god turns. You receive Loki's Rune-Chip — alder-wood, closed, faces inward; dangerous; to be deposited not read.",
    failText="You look at one face. You understand immediately why it is dangerous. The understanding costs you something for the rest of the errand.",
    checkStat="WIS", checkDC=12,
    checkPassFlag="rkvC2A1Done",
    activateMissionBit="RKV2_questActive",
    grantItem="Loki's Rune-Chip — thumb-sized alder-wood, carved faces inward in your closed hand; an accusation and a proof; to be deposited not read")

quest("rkv_02_act2", "Loki's Escape — The Hall's Aftermath",
    "The hall's corridor is full of movement. Odin's ravens are circling near the ceiling. Several lesser gods are debating loudly. A figure with a spear is coming down the corridor from the wrong direction, looking at everything in reach. You are a person holding something in a closed hand in a divine corridor at the worst possible moment. Be the person who belongs in this corridor. The hand is just a hand. You have business outside.",
    activateNode="AEG",
    passText="The corridor clears in front of you. The debate about Odin and Freyr covers your footsteps. You reach the outer gate in thirty seconds. The gate is attended by one of Heimdall's people.",
    failText="The spear-figure looks at you a moment too long. You get past, but the pause is noted and the gate-warden will be watching specifically.",
    checkStat="CON", checkDC=12,
    checkPassFlag="rkvC2A2Done",
    activateCond="() => !!S_story.rkvC2A1Done")

quest("rkv_02_act3", "Loki's Escape — Thor's Gate-Watch",
    "Heimdall's warden is at the gate, noting everyone who leaves in the hour after Loki. He looks at you. He looks at your right hand. He looks at your face. Your right hand is closed. Your left hand is empty and at your side. You are going out through the gate. You have a reason. The reason does not include what you are carrying. Leave through the gate as the least interesting person who attended this feast.",
    activateNode="ASG",
    passText="The warden looks at you and looks past you. You walk through the gate. The road is in front of you and the standing stone is a quarter-mile down it.",
    failText="The warden asks about your closed hand. You produce something from your left. He lets you through but notes the closed right hand.",
    checkStat="DEX", checkDC=13,
    checkPassFlag="rkvC2A3Done",
    activateCond="() => !!S_story.rkvC2A2Done")

quest("rkv_02_act4", "Loki's Escape — The Pursuit",
    "Two of the gods' pursuit party have doubled back from losing Loki's trail. They are checking everyone who left in the last hour. One has seen you and is pointing. The standing stone is one hundred feet ahead. The chip is still closed in your right hand. Fight through to the standing stone.",
    activateNode="RSS",
    passText="Both guards are down. The standing stone is ten feet ahead. The road behind you is empty. Ásgarðr's gate is a quarter-mile back and no one is moving toward you yet.",
    failText="They take you to the road's edge and open your hand. One of them reads one face and steps back. You have to fight him specifically for the right to finish the errand.",
    checkStat="STR", checkDC=13,
    checkPassFlag="rkvC2A4Done",
    activateCond="() => !!S_story.rkvC2A3Done",
    monster="Ásgarðr Pursuit Guard", monsterHP=24, monsterAC=13)

quest("rkv_02_act5", "Loki's Escape — The Standing Stone",
    "The standing stone is old. At its base: a carved rib-bone from something large, a piece of vellum whose ink has run, two smaller chips of various materials. Things too dangerous to keep. Things too true to destroy. You crouch at the stone's base. You place the chip in the grass at the stone's foot with the carved faces still inward. The deposit converts active accusation to archived truth. Location is everything. Place the chip at the stone without opening it.",
    activateNode="RSS",
    passText="Your hand opens. The chip is at the stone. You don't see anything. Whatever Loki accused someone of, it is here now, part of the collection, sealed against the stone. The world will get to it eventually. Today you made sure it would not be decided in Ægir's hall. You receive Loki's Dropped Coin — a small uncarved object that was beside the rune-chip on the floor.",
    failText="As your hand opens you see one face. The rune is there. You put the chip down with knowledge you weren't supposed to have.",
    checkStat="CON", checkDC=11,
    checkPassFlag="rkvC2A5Done",
    activateCond="() => !!S_story.rkvC2A4Done",
    takeItem="Loki's Rune-Chip — deposited at the standing stone outside Ásgarðr; archived truth, no longer active accusation",
    grantItem="Loki's Dropped Coin — a small uncarved object that was beside the rune-chip on the floor; Loki probably didn't mean to drop this one")

# ─── CYCLE 3 — Thor's Veil Pin ───────────────────────────────────────────────
# RKV collides with Frost Warden's Throne; use AEG as hub

say("RKV cycle 3 Thors Veil Pin: the bronze pin that held Thors bridal veil at Thrymrs hall — Loki kept it as evidence the comedy was not improvised — source Poetic Edda Anon Thrymskviða — nodes AEG BK WM — hub AEG since RKV collides with Frost Wardens Throne")

quest("rkv_03_act1", "Thor's Veil Pin — The Commission",
    "Loki gives the pin with no explanation — a small bronze pin, the kind used to secure a veil. The plan at Þrymr's hall required Thor to hold still while the veil held. At the feast's worst moment — Þrymr reaching up to lift the veil — the pin was what kept the plan alive long enough for the hammer to appear. Understand why a veil-pin is an archive object: the plan required exact timing; the pin is the evidence that the timing was met. Accept the commission with that frame.",
    activateNode="AEG",
    passText="The pin is small. It held a plan together. Without it at the right position at the right moment, Þrymr sees the beard, and the hammer stays in Jötunheim. You receive the Bridal Veil Pin — evidence that the comedy was not improvised.",
    failText="It is a veil-pin. Then you understand what it secured and when. The plan's timing required it. You nod.",
    checkStat="WIS", checkDC=11,
    checkPassFlag="rkvC3A1Done",
    activateMissionBit="RKV3_questActive",
    grantItem="The Bridal Veil Pin — bronze, small, the pin that secured Thor's bridal veil at Þrymr's hall; evidence the plan was not improvised")

quest("rkv_03_act2", "Thor's Veil Pin — The Road",
    "A giant's kinsman is on the road, looking for someone from Þrymr's hall to take his anger on. He is not subtle about it and he is blocking the road. He did not attend the feast but his cousin's hall is ashes. Get past him before the Birka authentication window closes.",
    activateNode="AEG",
    passText="You find the path around him — not the road, which he owns at this moment, but the field margin that rejoins the road fifty paces ahead. He is still standing in the road when you pass his position.",
    failText="He steps to block the field margin too. You wait him out at the road's edge — ten minutes he needs to be somewhere else, and then he is.",
    checkStat="STR", checkDC=12,
    checkPassFlag="rkvC3A2Done",
    activateCond="() => !!S_story.rkvC3A1Done")

quest("rkv_03_act3", "Thor's Veil Pin — The Birka Authentication",
    "A scholar at Birka is countersigning an official account of the Þrymskviða events that does not mention the veil-pin. His account will be the filed version unless the pin's presence is established first. He is not hostile — he simply did not have the pin as evidence when he wrote. Establish the pin's role before his agent presses the countersignature seal.",
    activateNode="BK",
    passText="The agent's hand stops. The scholar reads the account again, adds a line about the pin's position and timing, and signs it with the addition. The filed account now names the object that made the plan work.",
    failText="The agent moves to press the seal. You interpose the pin and the argument simultaneously. The scholar reads it. He is persuaded but the delay cost something — the countersignature is provisional pending your archive deposit.",
    checkStat="CHA", checkDC=13,
    checkPassFlag="rkvC3A3Done",
    activateCond="() => !!S_story.rkvC3A2Done",
    monster="Eddic scholar authentication agent", monsterHP=17, monsterAC=11)

quest("rkv_03_act4", "Thor's Veil Pin — The Retelling",
    "Someone on the road retells Þrymskviða as pure comedy — Thor in the dress, Thor eating an ox, the beard under the veil. The pin is not in his account. The pin is not a punchline; it is what made the comedy work. Hold the distinction without correcting him. The archive has the record.",
    activateNode="BK",
    passText="You listen. The retelling is accurate enough about everything visible. The pin held the veil during the part of the plan that was invisible. The archive has the record. You continue north.",
    failText="You correct him once — not about the comedy but about the timing. He incorporates it and tells the story again. It is still funny.",
    checkStat="CON", checkDC=11,
    checkPassFlag="rkvC3A4Done",
    activateCond="() => !!S_story.rkvC3A3Done")

quest("rkv_03_act5", "Thor's Veil Pin — Weimar Archive",
    "Sweelinck holds the pin between two fingers. He turns it. He sets it down. The plan required this to be in a specific position at a specific moment. It was. Without it, Þrymr sees the beard. The hammer stays in Jötunheim. The myth of Thor retrieving Mjölnir by force requires the comedy to have worked.",
    activateNode="WM",
    passText="Sweelinck writes: 'Plan Execution Records — The Pin That Held the Veil Before Þrymr Turned. First entry. The plan required a pin at a precise moment. Loki provided it. The Fighter carried it. Þrymr never noticed the beard.' He files it.",
    failText="The pin is received. Sweelinck holds it once and files it. The category is new: Plan Execution Records. He opens it with the note about timing.",
    checkStat="WIS", checkDC=11,
    checkPassFlag="rkvC3A5Done",
    activateCond="() => !!S_story.rkvC3A4Done",
    takeItem="The Bridal Veil Pin — filed in the Weimar archive under Plan Execution Records")

# ─── CYCLE 4 — The Unanswered Question ──────────────────────────────────────

say("RKV cycle 4 Unanswered Question: Vafthrudnir carved his best guess at what Odin whispered in Baldrs ear onto a bone before the wisdom contest — sealed it in a stone box — the bone is in the ruin — archive receives it sealed without opening it — source Poetic Edda Anon Vafthrudnismal — nodes AEG VEN WM")

quest("rkv_04_act1", "The Unanswered Question — The Ruin",
    "In Vafþrúðnismál, Odin won the wisdom contest with the one question only Odin could ask: what did he whisper in Baldr's ear before the funeral pyre? The giant knew he had been speaking to Odin himself and the contest ended. But before the match, Vafþrúðnir was careful enough to carve his best guess and seal it in a stone box. The bone is in the ruin. The archive will receive it sealed. Understand that the bone is not Odin's answer — it is a giant's guess at Odin's answer. The difference determines how it is filed.",
    activateNode="AEG",
    passText="The distinction is clear: the sealed guess is evidence that the question was not unknowable to everyone, only unanswerable by anyone other than Odin. Filed as Secret Knowledge Records, not as Revealed Truth. The ravens are watching the box.",
    failText="The ravens are near the ruin before the distinction is clear. You understand it before they can determine the box's destination on your behalf.",
    checkStat="WIS", checkDC=12,
    checkPassFlag="rkvC4A1Done",
    activateMissionBit="RKV4_questActive",
    grantItem="Vafþrúðnir's Sealed Bone — carved bone in a sealed stone box; the giant's guess at what Odin whispered in Baldr's ear; sealed; to be received and filed without opening")

quest("rkv_04_act2", "The Unanswered Question — The Ravens",
    "Odin's ravens have been following the box since the ruin was opened. They are noting, not attacking. Carry the box without the ravens' attention registering it as significant. A closed box on an ordinary cart is not interesting. A closed box being watched by a carrier who knows what it contains is very interesting.",
    activateNode="AEG",
    passText="You are an ordinary carrier with ordinary cargo. The box is on the cart with the other cargo. The ravens circle once over the road and continue north. They are noting everything; this specific box is not distinguished from the other things being noted.",
    failText="The ravens note the box. You adjust — move it to a less prominent position, cover it with travel gear — and the attention shifts.",
    checkStat="DEX", checkDC=12,
    checkPassFlag="rkvC4A2Done",
    activateCond="() => !!S_story.rkvC4A1Done")

quest("rkv_04_act3", "The Unanswered Question — The Venetian Scholar",
    "A Venetian theologian wants to open the box before it is filed. He is writing a treatise on divine secrets. The bone's condition — sealed, unread — is part of its archive value. If he reads it and the guess is close to right, he will carry a dangerous fact for the rest of his life. Explain this without insulting his scholarship. He can read the bone at the archive with appropriate documentation.",
    activateNode="VEN",
    passText="He considers. The arrangement is actually better for his treatise: he will be documented as the first scholar to read the guess at the archive, with the sealed condition confirmed. His agents stand down. The box continues sealed.",
    failText="The agents move to take the box. You hold the argument open long enough for the scholar to see the better arrangement. He accepts it, the agents stand down, and the box continues sealed.",
    checkStat="CHA", checkDC=13,
    checkPassFlag="rkvC4A3Done",
    activateCond="() => !!S_story.rkvC4A2Done",
    monster="Venice scholar assistant", monsterHP=17, monsterAC=11)

quest("rkv_04_act4", "The Unanswered Question — The Road",
    "On the road, the Fighter begins to wonder what the answer is. What did Odin whisper in Baldr's ear? The bone is in the box. The box is sealed. Hold the question without opening the box. The curiosity is part of the commission's difficulty.",
    activateNode="VEN",
    passText="The question is interesting. The box is sealed. These are two separate facts. The archive will receive the box sealed, and the answer — if the giant guessed right — will be there when the world is ready for it. You continue north.",
    failText="The box is in your hands. The seal is a wax impression over a cord. You set the box on the road surface and pick it up again. The cord is still tied. You continue.",
    checkStat="WIS", checkDC=11,
    checkPassFlag="rkvC4A4Done",
    activateCond="() => !!S_story.rkvC4A3Done")

quest("rkv_04_act5", "The Unanswered Question — Weimar Archive",
    "Sweelinck takes the box and does not open it. He turns it once and reads the outside of the seal. He sets it down. Vafþrúðnir guessed before the match. Whether he guessed right, the archive does not determine. The question is the record: Odin asked what he whispered in Baldr's ear; only Odin could ask this; only Odin knows the answer; a giant guessed and sealed the guess.",
    activateNode="WM",
    passText="Sweelinck writes: 'Secret Knowledge Records — Vafþrúðnir's Guess Before the Match. First entry. The archive does not open the box to find out if the guess is right. The question is the record.' He files the box sealed.",
    failText="The box is received. Sweelinck files it without comment. The category is new: Secret Knowledge Records. He opens it with the box still sealed.",
    checkStat="WIS", checkDC=11,
    checkPassFlag="rkvC4A5Done",
    activateCond="() => !!S_story.rkvC4A4Done",
    takeItem="Vafþrúðnir's Sealed Bone — filed sealed in the Weimar archive under Secret Knowledge Records")

# ─── CYCLE 5 — The Runes' Origin ─────────────────────────────────────────────

say("RKV cycle 5 Runes Origin: Odin hung on Yggdrasil for nine days and nine nights and the runes revealed themselves — the bark with the original cuttings preserved by the well-keeper at Mimirs well — must be authenticated by a Byzantine scholar at Constantinople before archive will accept it — source Poetic Edda Anon Havamal — nodes AEG CON WM")

quest("rkv_05_act1", "The Runes' Origin — The Well-Keeper's Gift",
    "Odin hung on Yggdrasil for nine days and nine nights, wounded by a spear, looking down into the void, until the runes revealed themselves and he took them up screaming. What the world received was the runes in mind and mouth. What was left on the tree was the bark he cut when he inscribed the first runes. A section of Yggdrasil's bark with those first cuttings — dull silver-grey, thicker than ordinary bark, the cuts shallow and exact — was preserved by the well-keeper at Mimir's well. The bark is fragile and the inscriptions are on the inner surface. Understand this before the sea route.",
    activateNode="AEG",
    passText="The bark is not the knowledge. The bark is the physical evidence that the knowledge was acquired at a specific moment on a specific tree by a specific act. The inner surface must be protected. The commission is physical care as much as delivery.",
    failText="The bark is a piece of tree. Then you look at the cuts — the specific depth and angle, the substrate — and understand what it is. The inner surface must not be exposed.",
    checkStat="WIS", checkDC=11,
    checkPassFlag="rkvC5A1Done",
    activateMissionBit="RKV5_questActive",
    grantItem="Yggdrasil Bark Fragment — dull silver-grey, thicker than ordinary bark; Odin's first rune-cuttings on the inner surface; shallow and exact; fragile")

quest("rkv_05_act2", "The Runes' Origin — The Sea Route",
    "The bark requires specific packing and physical care over sea and overland routes. The inscriptions are shallow and the bark is drier than it should be. Get it to Constantinople without the inner surface being exposed to salt air. Both the physical substrate and its content must arrive intact.",
    activateNode="AEG",
    passText="The bark arrives packed in linen inside a sealed wooden case. The inner surface is unchanged. The cuts are as they were at departure. Constantinople is visible from the harbor approach.",
    failText="The case took a wave at the stern. You check the inner surface — the cuts are intact, the bark has taken some moisture from the case but not from the sea. Acceptable. You continue.",
    checkStat="STR", checkDC=13,
    checkPassFlag="rkvC5A2Done",
    activateCond="() => !!S_story.rkvC5A1Done")

quest("rkv_05_act3", "The Runes' Origin — The Byzantine Authentication",
    "A Byzantine scholar of ancient inscription systems can authenticate the difference between a direct bark inscription and a copy. Another collector has a competing fragment he claims is also an original Yggdrasil inscription. His fragment is a copy — the grain direction and tool marks are wrong. Demonstrate the physical difference before his agents can prevent the authentication from completing.",
    activateNode="CON",
    passText="The scholar examines both fragments. The grain direction on the competitor's fragment runs contrary to the cut direction — a copy's artifact. The original's cuts follow the grain. The authentication closes in the Yggdrasil bark's favor. The agents stand down.",
    failText="The agents arrive as the scholar is examining both fragments. You hold the competitor's piece and the original side by side and point to the grain direction. The scholar sees it. The authentication closes.",
    checkStat="CHA", checkDC=13,
    checkPassFlag="rkvC5A3Done",
    activateCond="() => !!S_story.rkvC5A2Done",
    monster="Competing inscription collector agents", monsterHP=18, monsterAC=12)

quest("rkv_05_act4", "The Runes' Origin — The Road Inn",
    "A travelling Norse scholar at a road inn wants to borrow the bark to verify his translation. He means to make a copy without asking — you can see the vellum already open on his table. Recognize the intent before handing it over.",
    activateNode="CON",
    passText="You recognize the vellum open at his elbow. You tell him: the bark will be at the Weimar archive and he may study it there with documentation. He accepts this, closes the vellum, and names the archive date he will plan for.",
    failText="The vellum is already out when you look again. You ask what it is for. He answers vaguely. You decline to lend the bark and name the archive as the place for his work. He accepts.",
    checkStat="WIS", checkDC=11,
    checkPassFlag="rkvC5A4Done",
    activateCond="() => !!S_story.rkvC5A3Done")

quest("rkv_05_act5", "The Runes' Origin — Weimar Archive",
    "Sweelinck handles the bark with linen cloth. He does not touch the inner surface. He examines the cuts once, slowly, and sets it down. The nine days on the tree produced the runes. The bark is the nine days. Everything else is the world knowing the runes.",
    activateNode="WM",
    passText="Sweelinck writes: 'Original Inscription Records — The Bark from the Nine Days on the Tree. First entry. Odin cut these when the runes were new. The tree held them for the nine days and then they were taken into the world. This bark is the nine days. Everything else is the world.' He files it in linen.",
    failText="The bark is received. Sweelinck handles it carefully and files it. The category is new: Original Inscription Records.",
    checkStat="WIS", checkDC=11,
    checkPassFlag="rkvC5A5Done",
    activateCond="() => !!S_story.rkvC5A4Done",
    takeItem="Yggdrasil Bark Fragment — filed in the Weimar archive under Original Inscription Records")

# ─── CYCLE 6 — The Hammer Blessing ──────────────────────────────────────────

say("RKV cycle 6 Hammer Blessing: Loki recorded the consecration formula the priest spoke while carrying Mjolnir to the brides lap at Thrymrs hall — the specific words and gesture in the moment the hammer was in the air — clay tablet — must reach Weimar archive before a Roman scholar frames it incorrectly — source Poetic Edda Anon Thrymskviða — nodes AEG ROM WM")

quest("rkv_06_act1", "The Hammer Blessing — The Tablet",
    "At Þrymr's hall, the priest carried Mjölnir to the 'bride's' lap to consecrate the marriage — standard Norse wedding ceremony. The specific formula he spoke while the hammer was in the air between his hands and the bride's reception was recorded by Loki on a clay tablet immediately after. Loki noticed the gap in the record-keeping. The tablet is the straight account inside the comedy: what the priest said and did in the gap between two sets of hands. Understand the frame before the Alpine crossing.",
    activateNode="AEG",
    passText="The tablet records the blessing formula — the ritual procedure — not the theft. What is being preserved is the liturgical words spoken at the exact moment the plan's timing required them. The commission is the straight account inside the comedy.",
    failText="The tablet is a clay tablet with writing. Then you read the opening line — the formula spoken while the hammer was in the air — and understand that the straight record is inside the comedy. The archive frame is clear.",
    checkStat="WIS", checkDC=11,
    checkPassFlag="rkvC6A1Done",
    activateMissionBit="RKV6_questActive",
    grantItem="Loki's Blessing Tablet — clay tablet; the consecration formula spoken while Mjölnir was in the air between two sets of hands at Þrymr's hall; Loki's real-time recording")

quest("rkv_06_act2", "The Hammer Blessing — The Alpine Border",
    "At the Alpine border a customs officer classifies the clay tablet as a religious instrument in active use and moves to impound it for ecclesiastical review. It is not in active use. It is a historical record of a specific event. Name the distinction before the impound order is written.",
    activateNode="AEG",
    passText="A historical record of a completed event is not a liturgical instrument in active use. The customs officer accepts the distinction with reluctance and lets the tablet through as a document, not a relic.",
    failText="The impound order is already being written. You name the distinction — historical record versus active use — and the officer reads his own form's classification category. He crosses out 'religious instrument' and writes 'historical document.'",
    checkStat="CHA", checkDC=12,
    checkPassFlag="rkvC6A2Done",
    activateCond="() => !!S_story.rkvC6A1Done")

quest("rkv_06_act3", "The Hammer Blessing — The Roman Scholar",
    "A Roman scholar of pre-Christian blessing rites wants the tablet for three days. Three days misses the archive intake window. He can read it at the archive — offer this arrangement before the collector's agents make the alternative worse.",
    activateNode="ROM",
    passText="The scholar sees the advantage: documented first-reader status at the archive, the sealed condition of the intake confirmed, a better position for his treatise than a private three-day loan. The agents stand down. The tablet continues to Weimar.",
    failText="The agents move. You hold the arrangement open — three days versus archive access with documentation — long enough for the scholar to recognize the better option. He accepts. The tablet continues.",
    checkStat="WIS", checkDC=13,
    checkPassFlag="rkvC6A3Done",
    activateCond="() => !!S_story.rkvC6A2Done",
    monster="Roman relic collector agents", monsterHP=17, monsterAC=12)

quest("rkv_06_act4", "The Hammer Blessing — The Retelling",
    "Someone on the road retells Þrymskviða as pure comedy. The blessing formula is not in his account. The formula was spoken while the hammer was genuinely in the air between two sets of hands — the moment when it was neither safely delivered nor safely gone. The tablet is the straight account of that moment. Hold the distinction without lecturing.",
    activateNode="ROM",
    passText="The comedy is accurate about what was visible. The blessing was the invisible thing at the center. The tablet is the center's account. You continue north.",
    failText="You note once that the blessing was real — the formula was spoken, the hammer was in the air. The reteller incorporates it as an interesting detail. The comedy is unchanged. You continue north.",
    checkStat="CON", checkDC=11,
    checkPassFlag="rkvC6A4Done",
    activateCond="() => !!S_story.rkvC6A3Done")

quest("rkv_06_act5", "The Hammer Blessing — Weimar Archive",
    "Sweelinck reads the formula. He reads it twice. He looks up. The blessing was spoken while the hammer was in the air between two sets of hands. The priest spoke the words. Thor received the hammer. The words are what made the moment a moment — not comedy, not violence, but the ritual that held both.",
    activateNode="WM",
    passText="Sweelinck writes: 'Ritual Record — The Formula Spoken While the Hammer Was in the Air. First entry. The blessing was spoken while the hammer was between two sets of hands. The words made the moment work.' He files the tablet.",
    failText="The tablet is received. Sweelinck reads it carefully and files it. The category is new: Ritual Record.",
    checkStat="WIS", checkDC=11,
    checkPassFlag="rkvC6A5Done",
    activateCond="() => !!S_story.rkvC6A4Done",
    takeItem="Loki's Blessing Tablet — filed in the Weimar archive under Ritual Records")

# ─── CYCLE 7 — Gudrun's First Lament ────────────────────────────────────────

say("RKV cycle 7 Gudrun First Lament: Gudrun could not weep after Sigurd was killed — Gullrönd lifted the cloth from his face — Gudrun wept — a woman in the hall wrote the lament in real time — the doubled word in the third stanza is the proof it was written simultaneously not composed later — source Poetic Edda Anon Gudrunarkviða I — nodes AEG LDN WM — FINAL CYCLE questComplete")

quest("rkv_07_act1", "Gudrun's First Lament — The Doubled Word",
    "Gudrun could not weep after Sigurd was killed. Other women showed her their grief and she remained dry-eyed. Then Gullrönd lifted the cloth from Sigurd's body and Gudrun looked at his face — and she wept until the tears turned the grass gold. A woman in the hall had parchment in her sewing bag and wrote as she listened. The transcription error in the third stanza — a word written twice because the scribe's hand trembled — is the evidence the poem was not composed later. A London scholar is about to publish a framing that argues it was. Understand why the doubled word is the argument.",
    activateNode="AEG",
    passText="A scribe composing a poem does not write the same word twice. A scribe listening to a woman begin to weep for the first time and writing as fast as she can does. The physical detail of the transcription error is the entire argument against the London scholar's framing. This is why the vellum must reach London before his publication closes the question.",
    failText="The doubled word seems like a copying error. Then you read the third stanza — the word that is doubled, its specific position in the grief, the place where the scribe's hand would have trembled — and you understand.",
    checkStat="WIS", checkDC=11,
    checkPassFlag="rkvC7A1Done",
    activateMissionBit="RKV7_questActive",
    grantItem="Gudrun's First Lament Transcript — the real-time transcription by a woman in the hall; a word written twice in the third stanza; the doubled word is the physical evidence of when it was written")

quest("rkv_07_act2", "Gudrun's First Lament — The Channel Crossing",
    "The London scholar has agents intercepting copies of the poem en route. The transcript is personal correspondence, not a literary document. Hold that description through the Channel crossing.",
    activateNode="AEG",
    passText="The transcript is a letter from one woman scholar to another. It contains a poem as an enclosure. It is not literary material being transported to a scholar for professional reasons. It passes the Channel without being flagged.",
    failText="An agent flags the vellum at the port. You name the description — personal correspondence, not literary document — and he reads his own charter's classification. He lets it through.",
    checkStat="CHA", checkDC=12,
    checkPassFlag="rkvC7A2Done",
    activateCond="() => !!S_story.rkvC7A1Done")

quest("rkv_07_act3", "Gudrun's First Lament — The London Scholar's Agents",
    "The scholar has published a preliminary statement claiming the lament was composed after the fact. His agents know the transcript is coming and want to acquire it before it can contradict the preliminary statement. The doubled word in the third stanza disproves his framing. Make the physical argument before the agents acquire the transcript.",
    activateNode="LDN",
    passText="You hold the transcript open at the third stanza and point to the doubled word. One agent reads it and steps back. The other reaches for the vellum and you hold it away from him. He stops. The argument is in the room. The preliminary statement is now incorrect in a way the scholar will have to address publicly.",
    failText="One agent gets close enough to read over your arm. He reads the third stanza. He also steps back. The other moves for the vellum; you retain it. Two agents have now read the doubled word. The argument has reached the people who needed to see it.",
    checkStat="CHA", checkDC=13,
    checkPassFlag="rkvC7A3Done",
    activateCond="() => !!S_story.rkvC7A2Done",
    monster="London scholar collection agents", monsterHP=18, monsterAC=11)

quest("rkv_07_act4", "Gudrun's First Lament — The Road North",
    "Someone on the road asks about the scholar's framing question — whether the lament was composed in grief or after grief. The answer is the doubled word. Say it once, concisely, and continue north.",
    activateNode="LDN",
    passText="'There is a word written twice in the third stanza. A composer does not do that. A listener does.' He nods and continues his own road. You continue north.",
    failText="You explain the third stanza twice. The second time is unnecessary but he needed it. You continue north.",
    checkStat="CON", checkDC=11,
    checkPassFlag="rkvC7A4Done",
    activateCond="() => !!S_story.rkvC7A3Done")

quest("rkv_07_act5", "Gudrun's First Lament — Weimar Archive",
    "Sweelinck reads the transcript. He reads the third stanza. He reads it again. He sets the vellum down. The transcription error in the third stanza is the document. A scribe composing a poem does not write the same word twice. A scribe listening to a woman begin to weep for the first time and writing as fast as she can does.",
    activateNode="WM",
    passText="Sweelinck writes: 'Unmediated Grief Records — The Lament Written as It Was Spoken. First entry. That is the archive's note on the framing question. The doubled word is the document.' He files the transcript. The Poetic Edda series is complete.",
    failText="The transcript is received. Sweelinck reads the third stanza once and files it. The category is new: Unmediated Grief Records. He writes the archive's note on the framing question: 'See the third stanza.'",
    checkStat="WIS", checkDC=11,
    checkPassFlag="rkvC7A5Done",
    activateCond="() => !!S_story.rkvC7A4Done",
    takeItem="Gudrun's First Lament Transcript — filed in the Weimar archive under Unmediated Grief Records",
    questComplete=True)

# ─── AUDIT ──────────────────────────────────────────────────────────────────

say("RKV import complete: post-import audit — Poetic Edda Anon Codex Regius 1270 — 7 cycles 5 acts 35 quests — nodes VLH BLG AEG RSS — collision RKV Frost Wardens Throne resolved using AEG as hub for cycles 3 through 7 — cycle 1 at VLH — cycle 2 at AEG ASG RSS — checking final counts")
n1, q1 = audit()
print(f"Post-import: {n1} nodes, {q1} quests")
