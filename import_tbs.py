#!/usr/bin/env python3
"""§IMPORT-TBS: Knight in the Panther's Skin (Shota Rustaveli, c.1225) — 7 cycles, 35 acts
   New nodes: GEO (Georgia Mountain Road), PHY (Court Physician's Study), GHC (Guard House Cell)
   Uses existing: TBS, TIF, ALP, CAF, CON, DAM, WM
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
    say("§IMPORT T B S. Knight in the Panther's Skin. Seven cycles. Thirty-five acts. Georgia. Tbilisi. Aleppo. Weimar.")
    print("=== §IMPORT-TBS: Knight in the Panther's Skin — 7 cycles, 35 acts ===\n")

    # ─── Nodes ───────────────────────────────────────────────────────────────
    print("-- Nodes --")
    create_node("GEO", "highlands", "Georgia — Mountain Road Crossroads",
        act=1, r=152, c=242,
        desc="The Georgian highland road — wild mountain country north and east of Tbilisi. "
             "A crossroads where the road from the court meets the wilderness. "
             "In the poem's world: the edge of the known, where grief sits at the road's junction "
             "and asks to be seen before it will be moved.")
    create_node("PHY", "camelot", "Court Physician's Study",
        act=1, r=155, c=241,
        desc="A small room off the main corridor of a great hall: herb-smell and tallow, "
             "a single window, a table with clay vessels and linen bandages. "
             "Physician Maro at the table with a blank cedar tablet and twenty years of experience "
             "at not being enough. The cell door visible through the study window at corridor's end.")
    create_node("GHC", "camelot", "Guard House Cell",
        act=1, r=156, c=241,
        desc="A stone cell in the guard house annex: low ceiling, flat stone floor, "
             "a single iron lamp on an iron hook. The warrior in a panther's skin sits against "
             "the far wall with his back to the door. He has been reciting for weeks. "
             "The cell smells of stone and old straw and something like the wilderness that came in with him.")

    # ─── NPCs ─────────────────────────────────────────────────────────────────
    print("\n-- NPCs --")
    ensure_npc("tinatin_tbs", "Queen Tinatin",
        "Queen of Arabia and architect of the quest; commissioned Avtandil to find the weeping knight; "
        "proved love by sending away the one she loved, then burning the message when he returned",
        "TBS")
    ensure_npc("maro_tbs", "Maro",
        "Court physician; forty-five years old; twenty years in the court; "
        "has run out of approaches to reach the warrior in the panther's skin "
        "and asks the Fighter to try because she has nothing left",
        "PHY")
    ensure_npc("rostevan_tbs", "King Rostevan's Court Commander",
        "The court official who issued the commission to clear the blocked crossroads "
        "and report on the weeping knight's conditions without using force",
        "GEO")
    ensure_npc("nestan_tbs", "Nestan-Darejan",
        "Princess of India, imprisoned before an arranged marriage she refused; "
        "sent a sealed letter commanding her champion to stop the wedding by any means; "
        "her captivity and her letter are the twin engines of the poem's entire action",
        "TIF")
    ensure_npc("asmat_tbs", "Asmat",
        "Tariel's devoted attendant; lived alone at the edge of his wilderness retreat for two years "
        "bringing food and news; stayed because someone had to and no one else did",
        "GEO")
    ensure_npc("tariel_tbs", "Tariel",
        "Champion of India, clothed in a panther's skin; retreated into wilderness after losing "
        "Nestan-Darejan to captivity; his sustained grief is not pathology but the truest measure "
        "of love's depth; swore brotherhood with Avtandil and Pridon before the assault on Kajeti",
        "TIF")
    ensure_npc("pridon_tbs", "Pridon",
        "King of Mulghazanzer; the third sworn brother; provided ships and forces for the assault on Kajeti; "
        "whose map-maker drew the only tactical document for storming the demon king's fortress",
        "TIF")

    # ─── Cycle 1: Tinatin's Commission ────────────────────────────────────────
    say("Cycle one. Tinatin's Commission. Arabian court. Five acts.")
    print("\n-- Cycle 1: Tinatin's Commission (TBS×5) --")

    quest(
        id="tbs_c1a1", npc="tinatin_tbs",
        title="The Queen's Gift",
        desc=(
            "The throne room of Queen Tinatin's Arabian court. The champion Avtandil is being "
            "formally commissioned to ride east and find a mysterious weeping knight. "
            "Tinatin descends her throne — something queens do not do — and places a sealed message "
            "capsule in Avtandil's palm. Her fingers do not linger. Her face does not change. "
            "You are assigned as escort to the border. The capsule is warm from being held."
        ),
        activateNode="TBS",
        checkStat="WIS", checkDC=12,
        passText=(
            "You accept the charge and read the scene correctly: she has put herself in his pocket "
            "inside a case of bone, and smiled while doing it. "
            "The capsule will tell whoever finds him who sent him and why. You form up the escort detail."
        ),
        failText=(
            "You hesitate at the door-post. Tinatin's attention remains on Avtandil. "
            "You are reassigned from escort-captain to escort-member. The commission still stands."
        ),
        checkPassFlag="tbsC1A1Done",
    )

    quest(
        id="tbs_c1a2", npc="tinatin_tbs",
        title="The Road's First Night",
        desc=(
            "Three days east, camped in pines. Avtandil is carrying something too large to set down. "
            "At the fire he opens his mail coat and takes out the capsule. He turns it in his fingers "
            "without opening it. 'She said: come back. Not as a command. The way you say something "
            "when you know you cannot make it a command.' The road ahead is unknown country. "
            "Your role is to keep the party safe and moving."
        ),
        activateNode="TBS",
        checkStat="CON", checkDC=11,
        passText=(
            "You keep the party's pace and morale through difficult terrain without drawing attention "
            "to the weight he is carrying. By morning the outriders are rested and Avtandil has slept."
        ),
        failText=(
            "You push the pace too hard. A horse throws a shoe. Half a day lost. "
            "Avtandil waits without reproach while you arrange the repair."
        ),
        checkPassFlag="tbsC1A2Done",
        activateCond="tbsC1A1Done",
    )

    quest(
        id="tbs_c1a3", npc="tinatin_tbs",
        title="The Ambush on the Shale Road",
        desc=(
            "The shale road east of the Alazani ford, midday. Eight armed men from both treelines. "
            "Avtandil draws and you move to take the wider arc. In the fighting Avtandil takes a cut "
            "across his forearm. The message capsule's cord snaps in the scramble and it falls in the shale. "
            "You see it fall."
        ),
        activateNode="TBS",
        checkStat="STR", checkDC=13,
        quest_type="combat",
        monster="armed_brigand", monsterHP=22, monsterAC=12,
        passText=(
            "Both groups down. You retrieve the capsule from the stones before Avtandil's attention "
            "comes back to it. The seal is cracked but holding. You hand it back without comment. "
            "He stares at it: 'I thought it was gone.' You: 'It held.'"
        ),
        failText=(
            "The brigands are driven off but Avtandil retrieves the capsule himself from the stones. "
            "He finds it cracked. A wave of cold recognition crosses his face before he puts it away."
        ),
        checkPassFlag="tbsC1A3Done",
        activateCond="tbsC1A2Done",
    )

    quest(
        id="tbs_c1a4", npc="tinatin_tbs",
        title="The Parting at the Border Stone",
        desc=(
            "The border marker — a standing stone carved with the kingdom's device. "
            "The escort's commission ends here. Avtandil dismounts and looks east for a long time, "
            "then back west toward the court. 'If I'm not back in three years, tell her nothing. She will know.' "
            "He takes the cracked capsule from his neck and holds it out. "
            "'Take this back to her. I don't need it found on a dead man.'"
        ),
        activateNode="TBS",
        checkStat="CHA", checkDC=12,
        passText=(
            "'She gave it to you. Not to me.' Long silence. He puts the capsule back inside his mail. "
            "He mounts. He does not look back again. "
            "He turned down the one thing that could have brought him home early — "
            "and that is exactly what she knew he would do."
        ),
        failText=(
            "You reach for it. He pulls it back at the last moment — not indecision, but recognition. "
            "He holds it a long time, then puts it back himself. He mounts without speaking."
        ),
        checkPassFlag="tbsC1A4Done",
        activateCond="tbsC1A3Done",
    )

    quest(
        id="tbs_c1a5", npc="tinatin_tbs",
        title="The Return and the Burning",
        desc=(
            "Three years later. The throne room, morning. Avtandil has returned with Tariel "
            "and the woman Tariel spent three years dying for. He places the cracked capsule — "
            "worn and darkened from three years at a warrior's skin — in Tinatin's hands. "
            "She opens it. She reads the two words inside. She holds it to the candle. "
            "The silk burns in three seconds. She holds the empty bone cylinder."
        ),
        activateNode="TBS",
        checkStat="WIS", checkDC=11,
        passText=(
            "'It worked,' she says. Not to the court. To him. Avtandil crosses the room without protocol "
            "and takes her hand in front of everyone. The bone cylinder falls from her open palm "
            "and rolls across the stone floor. No one picks it up. "
            "You stand at the door-post where you stood three years ago."
        ),
        failText=(
            "You arrive a moment late and see the ash settling from her palm. "
            "The room is very quiet. You understand what has just completed."
        ),
        checkPassFlag="tbsC1A5Done",
        activateCond="tbsC1A4Done",
    )

    # ─── Cycle 2: The Panther's Skin ──────────────────────────────────────────
    say("Cycle two. The Panther's Skin. The physician's study and the guard house cell. Five acts.")
    print("\n-- Cycle 2: The Panther's Skin (PHY→GHC×4) --")

    quest(
        id="tbs_c2a1", npc="maro_tbs",
        title="The Physician's Commission",
        desc=(
            "Court physician Maro has tried food, water, medicines, three clergymen, two musicians, "
            "and the court jester. The warrior in the panther's skin lies on the cell floor and speaks "
            "only in verse — always the same woman, always her name, always the cadences of absolute loss. "
            "'He will die within the month. Not from starvation, precisely. From refusing to be in the world.' "
            "She holds out a blank cedar tablet. 'Write down anything he says about her. "
            "I have run out of things to try.'"
        ),
        activateNode="PHY",
        checkStat="WIS", checkDC=12,
        passText=(
            "You tell Maro the difference between making someone want to live and finding the single "
            "remaining obligation that makes staying possible — that the question is not 'do you want to live' "
            "but 'who will do the one thing you have not yet done.' "
            "She hands over the tablet without another word. TOKEN GRANTED: The Name-Tablet."
        ),
        failText=(
            "'You're going to tell him to think of people who love him.' She is not unkind. "
            "'Come back at the afternoon bell with a better answer.'"
        ),
        checkPassFlag="tbsC2A1Done",
    )

    quest(
        id="tbs_c2a2", npc="maro_tbs",
        title="The Letter Verse",
        desc=(
            "The cell. The warrior recites the way a man prays when he has stopped expecting an answer: "
            "a woman whose face, when she turns it away, makes the world go dark. He says it three times. "
            "Then the letter-verse: about a woman who gave him a letter that he killed a man over. "
            "He says this one only once. It costs him more. He has stopped."
        ),
        activateNode="GHC",
        checkStat="WIS", checkDC=12,
        passText=(
            "You ask about the letter — specifically, what happens to the letter's words when he is gone. "
            "After a long silence: 'The letter exists.' He says nothing more. But he has stopped reciting. "
            "You write 'the letter exists' on the cedar tablet. The blank is no longer blank."
        ),
        failText=(
            "The question was too direct. He turns his face to the wall. "
            "Try again — find the question he will answer before the approach is lost."
        ),
        checkPassFlag="tbsC2A2Done",
        activateCond="tbsC2A1Done",
    )

    quest(
        id="tbs_c2a3", npc="maro_tbs",
        title="Why You Wrote It Down",
        desc=(
            "The warrior is looking at the tablet. He did not expect anyone to write down what he said. "
            "Something changes in his face — not softening, exactly. Recognition. "
            "'You wrote it down.' 'Yes.' 'Why?' "
            "He wants to know if you are writing down evidence, or writing down witness. "
            "These are different things."
        ),
        activateNode="GHC",
        checkStat="CHA", checkDC=13,
        passText=(
            "You tell him: a man about to die has one remaining act — to put her name in a record "
            "that will exist after him; the record begins with what you wrote "
            "but is completed by what he writes; he is the only one who knows her name. "
            "After a long silence he takes the tablet and writes her name. He hands it back."
        ),
        failText=(
            "He goes still. The answer sounded like leverage. He is not wrong — it is leverage. "
            "Try again with fewer words. The argument is true; the delivery was wrong."
        ),
        checkPassFlag="tbsC2A3Done",
        activateCond="tbsC2A2Done",
    )

    quest(
        id="tbs_c2a4", npc="maro_tbs",
        title="The Guards at the Door",
        desc=(
            "Two guards outside the cell. The court captain's voice through the planks: "
            "the physician's assessment is terminal; take him to the lower level before the morning count. "
            "They open the door ready to use force. If they move him now, the last conversation is over. "
            "They will stop at half health or if given a reason to wait."
        ),
        activateNode="GHC",
        checkStat="STR", checkDC=12,
        quest_type="combat",
        monster="court_guard", monsterHP=20, monsterAC=12,
        passText=(
            "Both guards down or persuaded to wait. The cell is quiet again. "
            "The warrior watched without moving. 'You could have let them take me.' 'Yes.' "
            "He picks up the tablet and writes a place-name beneath her name — a direction, something specific. "
            "The tablet now holds three inscriptions."
        ),
        failText=(
            "They take the warrior to the lower level. The Fighter follows. "
            "The conversation continues there — context harsher, the exchange not yet lost."
        ),
        checkPassFlag="tbsC2A4Done",
        activateCond="tbsC2A3Done",
    )

    quest(
        id="tbs_c2a5", npc="maro_tbs",
        title="His Name",
        desc=(
            "'If I write my name,' he says, 'it means I am agreeing to be found. "
            "To be someone she can ask for when she is free. It means I believe she will be free.' "
            "He looks up. He is not asking for hope. He needs you to have looked at the situation "
            "and found the belief reasonable."
        ),
        activateNode="GHC",
        checkStat="CHA", checkDC=11,
        passText=(
            "You tell him what you actually believe: the woman who sent a letter commanding a war "
            "rather than endure an unwanted marriage is not the kind who stays captive; "
            "writing his name is not hope, it is the single remaining obligation — to be findable. "
            "He takes the tablet. He writes his name. "
            "'Take it to the physician. Tell her I will eat tomorrow.' TOKEN TAKEN: The Name-Tablet."
        ),
        failText=(
            "He sets the tablet down without writing. Name the one thing you have seen "
            "in the past hours that suggests she would act. He has been telling you about her. "
            "You should know."
        ),
        checkPassFlag="tbsC2A5Done",
        activateCond="tbsC2A4Done",
    )

    # ─── Cycle 3: The Weeping Knight of the Mountain Road ─────────────────────
    say("Cycle three. The Weeping Knight. Georgia to Tbilisi to Weimar. Five acts.")
    print("\n-- Cycle 3: The Weeping Knight (GEO→TIF→WM) --")

    quest(
        id="tbs_c3a1", npc="rostevan_tbs",
        title="The Crossroads",
        desc=(
            "A warrior in black armour has been at the mountain road crossroads for three days, "
            "turning away all who approach. He disarmed two military delegations without effort. "
            "You are the third delegation — alone, without drawn steel. "
            "He is not mad. He is not cursed. He is weeping with the absolute attention of a man "
            "who has decided that grief is the only honest thing left to do."
        ),
        activateNode="GEO",
        checkStat="WIS", checkDC=12,
        passText=(
            "You sit down on the far side of the road and wait. You understand before speaking: "
            "a man who blocked a road for three days is not asking to be moved, he is asking to be seen. "
            "After an hour he speaks. You write what he says. He does not object. "
            "TOKEN GRANTED: Crossroads Inquiry."
        ),
        failText=(
            "You speak first. He looks at you with the patience of a man who has turned down many approaches. "
            "You sit down instead and wait. You receive the inquiry at the afternoon bell."
        ),
        checkPassFlag="tbsC3A1Done",
    )

    quest(
        id="tbs_c3a2", npc="rostevan_tbs",
        title="The Royal Courier",
        desc=(
            "On the road to Tbilisi with the inquiry in hand, a royal courier intercepts you. "
            "The court wants the warrior declared mad and the road cleared by force. "
            "The inquiry contradicts this — the warrior is coherent and has stated specific conditions. "
            "The courier wants you to summarize it as 'incoherent grief-speech.'"
        ),
        activateNode="GEO",
        checkStat="CHA", checkDC=12,
        passText=(
            "The warrior's conditions are specific and can be met; summarizing as madness closes the avenue. "
            "The courier accepts that a written record makes a verbal summary unnecessary."
        ),
        failText=(
            "He files his own verbal report first. You file the inquiry alongside. "
            "Both reach the court. The verbal summary created a presumption you must now argue against."
        ),
        checkPassFlag="tbsC3A2Done",
        activateCond="tbsC3A1Done",
    )

    quest(
        id="tbs_c3a3", npc="rostevan_tbs",
        title="The Commander",
        desc=(
            "At the Georgian court in Tbilisi, a military commander wants to use the inquiry "
            "to identify and conscript the warrior — a man who disarmed two military delegations "
            "without injury is valuable. The inquiry was gathered as a record of grief, "
            "not a military assessment."
        ),
        activateNode="TIF",
        checkStat="WIS", checkDC=11,
        passText=(
            "You see this before the commander does: the inquiry cannot be used as a scouting document "
            "without violating the terms under which the warrior spoke. "
            "You withhold the section on his fighting capability. The archive receives the complete document."
        ),
        failText=(
            "The commander reads the full inquiry and adds a military note in the margin. "
            "It will travel to Weimar with both texts."
        ),
        checkPassFlag="tbsC3A3Done",
        activateCond="tbsC3A2Done",
    )

    quest(
        id="tbs_c3a4", npc="rostevan_tbs",
        title="The Historian's Office",
        desc=(
            "A court historian wants to use the inquiry as evidence that the warrior is a named casualty "
            "from a recent battle — grief with an assigned cause. "
            "The inquiry records what he said, not what caused it. "
            "Assigning a cause the warrior did not name violates the record."
        ),
        activateNode="TIF",
        checkStat="CHA", checkDC=11,
        passText=(
            "The historian receives a copy with the identity question explicitly unresolved. "
            "The archive holds more when it holds the ambiguity."
        ),
        failText=(
            "He adds an appendix identifying the warrior by inference. "
            "The inquiry travels with the appendix and the dissent."
        ),
        checkPassFlag="tbsC3A4Done",
        activateCond="tbsC3A3Done",
    )

    quest(
        id="tbs_c3a5", npc="rostevan_tbs",
        title="The Archive — The Crossroads Inquiry",
        desc=(
            "Weimar Archive. Sweelinck reads the inquiry. "
            "'He sat at a crossroads for three days and wept. He was not mad. He had conditions. "
            "The court wanted him declared mad because madness allows a different kind of response "
            "than grief does.' He considers the category."
        ),
        activateNode="WM",
        checkStat="INT", checkDC=11,
        passText=(
            "Sweelinck creates: Grief as Public Obstruction, First Entry. "
            "The Crossroads Inquiry: grief occupies public space with the full sincerity of a man "
            "who has nothing left to pretend with; the distinction between the cursed and the broken "
            "is the distinction the court must make before acting; "
            "the archive holds the statement of a man who asked to be seen, not moved."
        ),
        failText=(
            "Sweelinck files it under Unexplained Road Incidents. The document is accessible "
            "but the quality of the grief is lost in the category."
        ),
        checkPassFlag="tbsC3A5Done",
        activateCond="tbsC3A4Done",
    )

    # ─── Cycle 4: The Letter That Started a War ───────────────────────────────
    say("Cycle four. The Letter That Started a War. Tbilisi to Aleppo to Weimar. Five acts.")
    print("\n-- Cycle 4: The Letter That Started a War (TIF→ALP→WM) --")

    quest(
        id="tbs_c4a1", npc="nestan_tbs",
        title="The Tower Window",
        desc=(
            "The princess's tower in Tbilisi, late afternoon. A smuggler carries a letter "
            "from the highest window to a champion she trusts. You intercept it. He does not argue. "
            "The letter is sealed, wrapped in oilskin. Brief. "
            "You do not know if delivering it will start a war or condemn the princess to a marriage "
            "she has already refused in the only way available to her."
        ),
        activateNode="TIF",
        checkStat="WIS", checkDC=12,
        passText=(
            "You understand what you hold: the sealed document that binds someone to an act of war "
            "the moment it is received. You carry it sealed toward the scholar in Aleppo "
            "who must receive it as a document, not an order. TOKEN GRANTED: The Nestan-Darejan Letter."
        ),
        failText=(
            "You hesitate long enough that the smuggler reappears with a second copy — she prepared for interception. "
            "You take both. The first is the original. The second complicates provenance."
        ),
        checkPassFlag="tbsC4A1Done",
    )

    quest(
        id="tbs_c4a2", npc="nestan_tbs",
        title="The Mamluk Road",
        desc=(
            "Between Tbilisi and Aleppo, a Mamluk checkpoint. The officer recognizes oilskin-wrapped letters "
            "as the format used for political communications across the Georgian-Mamluk border. "
            "He wants to open it."
        ),
        activateNode="TIF",
        checkStat="CHA", checkDC=13,
        passText=(
            "This is a scholarly courier carrying a case study in legal philosophy, "
            "not active political correspondence. The framing holds. The letter passes sealed."
        ),
        failText=(
            "He opens it. He cannot read Georgian and seals it back, noting the language in his register. "
            "The letter travels with that notation."
        ),
        checkPassFlag="tbsC4A2Done",
        activateCond="tbsC4A1Done",
    )

    quest(
        id="tbs_c4a3", npc="nestan_tbs",
        title="The Scholar",
        desc=(
            "In Aleppo, a legal philosopher has been waiting for exactly this kind of document. "
            "He reads the letter: the command that was simultaneously an act of love and a declaration of war. "
            "A Mamluk court official then wants the letter as diplomatic evidence of Georgian instability."
        ),
        activateNode="ALP",
        checkStat="CHA", checkDC=12,
        passText=(
            "The letter is a philosophical document about the nature of command authority, "
            "not a diplomatic instrument; it goes to the archive, not the court. "
            "The official accepts the distinction with visible reluctance."
        ),
        failText=(
            "He claims diplomatic jurisdiction. The scholar files a counter-claim. "
            "The letter travels during the dispute and arrives with both claims attached."
        ),
        checkPassFlag="tbsC4A3Done",
        activateCond="tbsC4A2Done",
    )

    quest(
        id="tbs_c4a4", npc="nestan_tbs",
        title="The Theologian",
        desc=(
            "A second Aleppo scholar — a theologian — argues the letter should be suppressed: "
            "a woman commanding her lover to commit murder is sin, not love. "
            "The letter should not be preserved."
        ),
        activateNode="ALP",
        checkStat="WIS", checkDC=11,
        passText=(
            "The archive preserves the record of what happened, not a moral endorsement. "
            "Suppressing documents because they contain commands to sin destroys the record "
            "of every war started by a letter. He accepts the distinction between archiving and endorsing."
        ),
        failText=(
            "He attaches a theological caveat. "
            "The letter travels with both the analysis and the caveat."
        ),
        checkPassFlag="tbsC4A4Done",
        activateCond="tbsC4A3Done",
    )

    quest(
        id="tbs_c4a5", npc="nestan_tbs",
        title="The Archive — Command Documents",
        desc=(
            "Weimar Archive. Sweelinck reads the letter and the scholar's analysis. "
            "'She was imprisoned before a marriage she did not choose. "
            "She had one instrument: a letter commanding an act she knew would cost him everything. "
            "The letter created the war, the crime, and the love story simultaneously.'"
        ),
        activateNode="WM",
        checkStat="INT", checkDC=11,
        passText=(
            "Sweelinck creates: Command Documents That Create Their Own Consequences, First Entry. "
            "The Nestan-Darejan Letter: the command that was simultaneously an act of love "
            "and a declaration of war; the only form of authority available to the imprisoned; "
            "the archive holds the letter and notes that the consequences were intended, "
            "accepted, and irreversible at the moment of sealing."
        ),
        failText=(
            "Sweelinck files it under Correspondence — Political Letters. "
            "Accessible but without the specific category it earned."
        ),
        checkPassFlag="tbsC4A5Done",
        activateCond="tbsC4A4Done",
    )

    # ─── Cycle 5: Asmat's Vigil ────────────────────────────────────────────────
    say("Cycle five. Asmat's Vigil. Georgia to Constantinople to Weimar. Five acts.")
    print("\n-- Cycle 5: Asmat's Vigil (GEO→CON→WM) --")

    quest(
        id="tbs_c5a1", npc="asmat_tbs",
        title="The Forest Edge",
        desc=(
            "Asmat has lived alone at the edge of Tariel's forest for two years. "
            "Not cursed, not compelled by any oath anyone witnessed. "
            "She stayed because someone had to, and no one else did. "
            "She needs a message carried deeper into the forest. "
            "She will not send it with anyone who does not understand why she is here."
        ),
        activateNode="GEO",
        checkStat="WIS", checkDC=11,
        passText=(
            "You understand: not pity, recognition. She needs to see you understand "
            "the difference between waiting and watching. "
            "She gives you both the message and her written vigil record — "
            "'Someone should know what two years at the edge of a forest produces.' "
            "TOKEN GRANTED: Asmat's Vigil Record."
        ),
        failText=(
            "She gives you the message but not the record. "
            "'Come back with what he says. Then I'll show you the record.'"
        ),
        checkPassFlag="tbsC5A1Done",
    )

    quest(
        id="tbs_c5a2", npc="asmat_tbs",
        title="The Forest Road",
        desc=(
            "On the road toward Constantinople, a Byzantine scholar intercepts you at a waystation. "
            "He has heard of Asmat's vigil and wants to classify it as monastic vocation — "
            "the hesychast who chooses isolation in service of another's spiritual crisis. "
            "The vigil was not monastic. It was practical. She brought food and news."
        ),
        activateNode="GEO",
        checkStat="CHA", checkDC=12,
        passText=(
            "The hesychast classification erases the labor and elevates only the suffering. "
            "The scholar receives the record as a document of practical care, not spiritual vocation."
        ),
        failText=(
            "He adds a monastic classification to his notes. The record travels with both readings."
        ),
        checkPassFlag="tbsC5A2Done",
        activateCond="tbsC5A1Done",
    )

    quest(
        id="tbs_c5a3", npc="asmat_tbs",
        title="Constantinople",
        desc=(
            "At the Byzantine court, a court lady wants the vigil record as legal evidence "
            "to argue for elevating servants who choose to stay beyond their obligation. "
            "The vigil record should not be used in a legal argument without Asmat's knowledge. "
            "It can be studied, not deployed."
        ),
        activateNode="CON",
        checkStat="WIS", checkDC=12,
        passText=(
            "The court lady accepts the boundary. She receives a copy for study. "
            "The original continues to Weimar."
        ),
        failText=(
            "She presents the record at a court session before you can intervene. "
            "The archive receives the original before the session's conclusion."
        ),
        checkPassFlag="tbsC5A3Done",
        activateCond="tbsC5A2Done",
    )

    quest(
        id="tbs_c5a4", npc="asmat_tbs",
        title="The Scriptorium",
        desc=(
            "A Byzantine archivist wants to file the vigil record under women's devotional literature — "
            "the same category as hagiographies of women who waited for martyred husbands. "
            "The vigil is a secular document, not a devotional one."
        ),
        activateNode="CON",
        checkStat="CHA", checkDC=11,
        passText=(
            "The archivist creates a new category: Solitary Vigil Records — Practical Care Under "
            "Impossible Conditions. He files Asmat's record as its first entry."
        ),
        failText=(
            "He files it under devotional literature with a note questioning the classification. "
            "Sweelinck will refile it."
        ),
        checkPassFlag="tbsC5A4Done",
        activateCond="tbsC5A3Done",
    )

    quest(
        id="tbs_c5a5", npc="asmat_tbs",
        title="The Archive — Asmat's Vigil",
        desc=(
            "Weimar Archive. Sweelinck reads the vigil record. "
            "'She brought food and news for two years. She did not leave. "
            "She was not bound by oath. She stayed because someone had to, and she was there.'"
        ),
        activateNode="WM",
        checkStat="INT", checkDC=11,
        passText=(
            "Sweelinck creates: Solitary Vigil Records — Sustained Witness in Impossible Conditions, "
            "First Entry. Asmat's Vigil: the person who remains when everyone with better options has left; "
            "care performed without witness, without reward, without the certainty of outcome; "
            "the archive names this witness as presence."
        ),
        failText=(
            "Sweelinck files it under Women's Correspondence. "
            "The practical labor and the distinction are lost."
        ),
        checkPassFlag="tbsC5A5Done",
        activateCond="tbsC5A4Done",
    )

    # ─── Cycle 6: The Brotherhood Oath ────────────────────────────────────────
    say("Cycle six. The Brotherhood Oath. Tbilisi to Damascus to Weimar. Five acts.")
    print("\n-- Cycle 6: The Brotherhood Oath (TIF→DAM→WM) --")

    quest(
        id="tbs_c6a1", npc="tariel_tbs",
        title="The Oath",
        desc=(
            "The night before the assault on Kajeti, Tariel, Avtandil, and Pridon gather "
            "on the headland above Tbilisi harbor. The ritual requires each man to name "
            "the thing he would sacrifice for the others. "
            "Avtandil names his queen's command. Tariel names his grief — the most valuable thing he has left. "
            "Pridon names his kingdom. The Fighter witnesses. No one asked the Fighter to witness."
        ),
        activateNode="TIF",
        checkStat="WIS", checkDC=11,
        passText=(
            "You hold the exact words of all three speakers in memory long enough to write them down. "
            "Three men, three names, in the order spoken. Tariel's last, because his was the hardest. "
            "TOKEN GRANTED: Brotherhood Oath Inscription."
        ),
        failText=(
            "You write two accurately and paraphrase the third. You note the paraphrase. "
            "The record is honest about its own gap."
        ),
        checkPassFlag="tbsC6A1Done",
    )

    quest(
        id="tbs_c6a2", npc="tariel_tbs",
        title="The Harbor",
        desc=(
            "On the road south, a court official from Pridon's kingdom intercepts you. "
            "Pridon named his kingdom as the thing he would sacrifice — "
            "in political hands, this could be used as a territorial renunciation against him."
        ),
        activateNode="TIF",
        checkStat="CHA", checkDC=12,
        passText=(
            "The inscription is a philosophical document about the nature of sworn brotherhood, "
            "not a political renunciation; it cannot be used to press a territorial claim. "
            "The older official to the younger: 'We're done here.' They go."
        ),
        failText=(
            "He takes a copy. You retain the original. The copy is now on the road ahead."
        ),
        checkPassFlag="tbsC6A2Done",
        activateCond="tbsC6A1Done",
    )

    quest(
        id="tbs_c6a3", npc="tariel_tbs",
        title="The Damascus Scholar",
        desc=(
            "In Damascus, a legal philosopher reads the inscription. A feudal administrator present "
            "wants to use it as evidence that sworn brotherhood is legally subordinate to feudal duty — "
            "that Avtandil's disobedience of King Rostevan was criminal and the oath was illegal."
        ),
        activateNode="DAM",
        checkStat="WIS", checkDC=12,
        passText=(
            "The inscription records what was sworn, not a legal ruling on its validity. "
            "The archive receives the evidence; the court makes the ruling. "
            "The scholar adds his analysis as a companion document."
        ),
        failText=(
            "The administrator adds a legal opinion in the margin. "
            "The inscription travels to Weimar with both the analysis and the legal challenge."
        ),
        checkPassFlag="tbsC6A3Done",
        activateCond="tbsC6A2Done",
    )

    quest(
        id="tbs_c6a4", npc="tariel_tbs",
        title="The Sufi Theologian",
        desc=(
            "A Sufi theologian in Damascus argues the oath was the highest form of human act — "
            "the alignment of three souls to a single cause without material interest — "
            "and wants to file the inscription as sacred text. "
            "The inscription is a civil document, not a devotional one."
        ),
        activateNode="DAM",
        checkStat="CHA", checkDC=11,
        passText=(
            "The sacred and the civil are not opposed; the inscription belongs in the archive, "
            "not a mosque library. The theologian copies it for his own study and releases the original."
        ),
        failText=(
            "He requests the original. You decline and carry it. He has the copy."
        ),
        checkPassFlag="tbsC6A4Done",
        activateCond="tbsC6A3Done",
    )

    quest(
        id="tbs_c6a5", npc="tariel_tbs",
        title="The Archive — Brotherhood Oath",
        desc=(
            "Weimar Archive. Sweelinck reads the inscription. "
            "'Three men on a headland. Each named the most valuable thing he possessed "
            "as the price of what he was about to ask of the others. "
            "Avtandil named his queen's command. Tariel named his grief. Pridon named his kingdom. "
            "The archive has no category for this.' He creates one."
        ),
        activateNode="WM",
        checkStat="INT", checkDC=11,
        passText=(
            "Sweelinck creates: Sworn Brotherhood Records, First Entry. "
            "The Kajeti Oath: the oath that overrides feudal obligation by requiring each man "
            "to name what the oath costs him; sworn friendship creates obligations that throne-oaths cannot — "
            "not because they are higher, but because they are different; "
            "what is named in brotherhood is given, not pledged."
        ),
        failText=(
            "Sweelinck files it under Military Records — Pre-Battle Agreements. "
            "The specific character of the sworn gift is lost."
        ),
        checkPassFlag="tbsC6A5Done",
        activateCond="tbsC6A4Done",
    )

    # ─── Cycle 7: Storm the Sea-Fort ──────────────────────────────────────────
    say("Cycle seven. Storm the Sea-Fort. Tbilisi to Caffa to Weimar. Five acts. Quest complete.")
    print("\n-- Cycle 7: Storm the Sea-Fort (TIF→CAF→WM) — questComplete --")

    quest(
        id="tbs_c7a1", npc="pridon_tbs",
        title="The Plan",
        desc=(
            "The night before departure. Pridon's map-maker produces the only tactical document "
            "for the assault on Kajeti: a tide-chart with three annotations — "
            "gate location, tower stairs, prisoner's window. No other copy exists. "
            "The fortress has never been taken. The plan requires the gate to be held from inside "
            "by someone with no exit strategy."
        ),
        activateNode="TIF",
        checkStat="INT", checkDC=12,
        passText=(
            "You read the plan completely enough to understand what the gate defends "
            "and why losing it loses everything. The gate is not the hardest part. "
            "The hardest part is staying in it when the noise stops. "
            "TOKEN GRANTED: Kajeti Assault Plan."
        ),
        failText=(
            "You understand the gate but not the tower stairs. Pridon adds a verbal briefing. "
            "The plan still works."
        ),
        checkPassFlag="tbsC7A1Done",
    )

    quest(
        id="tbs_c7a2", npc="pridon_tbs",
        title="The Black Sea Road",
        desc=(
            "On the road to Caffa, a Genoese commercial factor intercepts the party. "
            "He has heard there is a plan to assault a sea-fortress. "
            "He wants to buy the plan — to sell it to the fortress's owner."
        ),
        activateNode="TIF",
        checkStat="CHA", checkDC=13,
        passText=(
            "The plan is useless to the fortress's owner after the assault has launched — "
            "it is a historical document, not an intelligence asset. "
            "The factor accepts the argument with visible disappointment."
        ),
        failText=(
            "He sends a rider ahead. You change the departure timing by one day. The plan still works."
        ),
        checkPassFlag="tbsC7A2Done",
        activateCond="tbsC7A1Done",
    )

    quest(
        id="tbs_c7a3", npc="pridon_tbs",
        title="The Caffa Harbor",
        desc=(
            "In Caffa, the Genoese harbor master wants to document the assault plan as a model "
            "for future Black Sea fortress operations. The tide-chart and annotations are exactly "
            "the material the harbor authority should hold."
        ),
        activateNode="CAF",
        checkStat="WIS", checkDC=11,
        passText=(
            "The plan's value is specific to this fortress at this tide — "
            "a historical document of one assault, not a replicable model. "
            "The harbor master receives a copy with site-specific notations highlighted. "
            "The original travels."
        ),
        failText=(
            "He files it as general doctrine. You request it back on grounds of provenance. He releases it."
        ),
        checkPassFlag="tbsC7A3Done",
        activateCond="tbsC7A2Done",
    )

    quest(
        id="tbs_c7a4", npc="pridon_tbs",
        title="The Ship",
        desc=(
            "The ship's captain, reading the plan for the night crossing, "
            "adds her own navigational notes — current charts, wind patterns, "
            "the exact heading for the gate approach in the dark. "
            "She wants to keep the plan with her navigational records."
        ),
        activateNode="CAF",
        checkStat="CHA", checkDC=11,
        passText=(
            "Her navigational notes belong in the archive alongside the plan, not in private records. "
            "She makes them a formal attachment. Both travel to Weimar."
        ),
        failText=(
            "She keeps her notes. The plan travels without them. Sweelinck will note the gap."
        ),
        checkPassFlag="tbsC7A4Done",
        activateCond="tbsC7A3Done",
    )

    quest(
        id="tbs_c7a5", npc="pridon_tbs",
        title="The Archive — Impregnable Fortresses Taken",
        desc=(
            "Weimar Archive. Sweelinck reads the tide-chart and its annotations. "
            "'Three men stormed a sea-fortress that had never been taken. "
            "The plan required the gate to be held from inside by someone with no exit. "
            "The tide-chart tells you where to approach and when. The annotations tell you where the stairs are. "
            "The plan had to work because there was no second plan.'"
        ),
        activateNode="WM",
        checkStat="INT", checkDC=11,
        passText=(
            "Sweelinck creates: Tactical Records — Impregnable Fortresses Taken, First Entry. "
            "The Kajeti Assault Plan: the single-use tactical document that succeeded "
            "because the alternative was not returning; "
            "the tide-chart as the record of how one fortress fell once, at one tide, "
            "in conditions that will not repeat; the gate that had to hold."
        ),
        failText=(
            "Sweelinck files it under Naval Records — Black Sea Operations. "
            "The specificity and the cost are lost in the category."
        ),
        checkPassFlag="tbsC7A5Done",
        activateCond="tbsC7A4Done",
        questComplete=True,
    )

    print("\n=== TBS import complete — 7 cycles, 35 acts ===")
    say("Knight in the Panther's Skin import complete. Seven cycles. Thirty-five acts. Quest complete on cycle seven.")

if __name__ == "__main__":
    main()
