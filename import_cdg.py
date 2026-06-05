#!/usr/bin/env python3
"""Import CDG — The Three Musketeers (Alexandre Dumas & Auguste Maquet, 1844) — 7 cycles × 5 acts = 35 quests."""

import requests, subprocess, sys

BASE = "http://localhost:1367"

def say(msg):
    subprocess.run(["./say.sh", msg], check=False)

def api(method, path, **kwargs):
    r = getattr(requests, method)(BASE + path, **kwargs)
    if not r.ok:
        print(f"  ERROR {r.status_code}: {r.text[:200]}")
        sys.exit(1)
    return r.json()

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

# ─── Nodes ─────────────────────────────────────────────────────────────────

say("CDG import: creating nodes BTH Bethune Convent, REL Relay Post, DAR Road Junction — Three Musketeers by Alexandre Dumas and Auguste Maquet 1844 — Constance Bonacieux cycle 2 locations — source book CDG")

create_node("BTH", "camelot", "Bethune — Convent of the Carmelites",
            "Bethune — Convent of the Carmelites",
            86, 118,
            "The walled garden of the Bethune convent where Constance Bonacieux hid for two months. She pressed Constance's Warning Letter into the Fighter's hands at this gate. Milady had come through the gate that morning on a pretext. She would return before nightfall.")

create_node("REL", "city", "Relay Post — Twelve Miles South of Bethune",
            "Relay Post — Twelve Miles South of Bethune",
            88, 120,
            "The relay post town on the south road. Postmaster always elsewhere. His seventeen-year-old assistant will not authorize without the postmaster's mark. The innkeeper's son across the road rode to Amiens and back in a day last week and is available for motivated errand work.")

create_node("DAR", "highlands", "The Road Junction — South of the Relay Post",
            "The Road Junction — South of the Relay Post",
            90, 122,
            "The road fork south of the relay post: right toward D'Artagnan's route, left toward nowhere useful. D'Artagnan and two companions arrived from the south here when the innkeeper's son flagged them down with Constance's Warning Letter.")

# ─── Pre-import audit ──────────────────────────────────────────────────────
say("CDG import: pre-import audit — Three Musketeers Alexandre Dumas 1844")
audit = api("get", "/api/audit")
parse = {p["section"]: p["count"] for p in audit.get("parse", [])}
print(f"Pre-import: {parse.get('NODE_MAP')} nodes, {parse.get('QUEST_DB')} quests")

# ─── Cycle 1: Before the Ball ─────────────────────────────────────────────
say("CDG cycle 1 Before the Ball: diamond stud-case raced London to Weimar court — source Three Musketeers Dumas 1844 — nodes LON CDV TL WM — quest chain cdg_01_act1 through cdg_01_act5")

quest("cdg_01_act1",
      "Before the Ball — The Duke's Goodbye",
      "Buckingham gives you the diamond stud-case himself. He has counted the studs twice. He holds it a moment — the Queen gave these as proof of something he is now returning, because she needs them more than he needs the proof. He hands the case over. Tell her I counted every one.",
      activateNode="LON",
      passText="You read the weight of the gesture — not the studs but the version of himself that held them. He is giving that back too. You understand what you are carrying.",
      failText="You understand that twelve diamond studs in a velvet box are urgent and important. The rest you will learn on the road.",
      checkStat="WIS", checkDC=12,
      checkPassFlag="cdgC1A1Done",
      grantItem="The Diamond Stud-Case — velvet-lined, sealed with Buckingham's wax; twelve studs, two of them replacements made in twenty-four hours to replace the two Milady stole")

quest("cdg_01_act2",
      "Before the Ball — The Port at Calais",
      "The harbor is locked. Cardinal Richelieu's order: no vessel departs for France without written authorization. The harbor officer is polite, firm, and entirely aware that every hour he holds you here is an hour closer to the ball's opening. His smile says: I don't need to fight you. I just need to keep you here until this afternoon.",
      activateNode="CDV",
      passText="You argue a clause of the Cardinal's own standing order permitting emergency royal correspondence. He believes you just enough to avoid the institutional risk of being wrong. He lets you through.",
      failText="He will not be moved by argument. You wait three hours for a merchant captain with a private grievance against the harbor authority. Three hours lost.",
      checkStat="CHA", checkDC=13,
      checkPassFlag="cdgC1A2Done",
      activateCond="() => !!S_story.cdgC1A1Done")

quest("cdg_01_act3",
      "Before the Ball — Tilbury Landing",
      "Richelieu's agent at Tilbury has four men and a description of the carrier from London. He has been waiting since yesterday. He moves when you step off the boat. They want the stud-case, not necessarily your life — a dead carrier creates paperwork; a robbed carrier is simply an incident.",
      activateNode="TL",
      passText="All four agents down. The stud-case is still in your coat. The road south is open.",
      failText="One agent gets through while you deal with the others. He takes the stud-case. The Cardinal's plan succeeds.",
      checkStat="STR", checkDC=13,
      checkPassFlag="cdgC1A3Done",
      activateCond="() => !!S_story.cdgC1A2Done",
      monster="Richelieu's Harbor Agents ×4", monsterHP=16, monsterAC=13)

quest("cdg_01_act4",
      "Before the Ball — The Road South",
      "The relay station at the fifteen-mile post has no horses. The stablemaster apologizes elaborately: all purchased this morning by a party of travelers, very legitimate, nothing irregular. The elaborateness tells you everything. The ball begins in three hours. You have no horse.",
      activateNode="TL",
      passText="You run two miles to the next village, flag down a traveling merchant's cart horse, and make up the time.",
      failText="Forty-five minutes lost sourcing a horse from a farmstead off the road. You arrive at the court just as the first guests are entering.",
      checkStat="STR", checkDC=13,
      checkPassFlag="cdgC1A4Done",
      activateCond="() => !!S_story.cdgC1A3Done")

quest("cdg_01_act5",
      "Before the Ball — The Court Entrance",
      "The court is bright and loud and full of people going to the same place. Constance is inside somewhere near the Queen's antechamber. You need to reach her before the King requests the studs. There is no one to fight here — only the crowd, the protocol, and the narrowing window.",
      activateNode="WM",
      passText="A servant who recognizes Buckingham's seal gets you to the antechamber in four minutes. Constance takes the case. She disappears through the inner door without looking back.",
      failText="A guard won't pass you without the recognition phrase. You send a message in; Constance comes out to collect it herself. Five additional minutes, almost unavailable. She runs.",
      checkStat="CHA", checkDC=15,
      checkPassFlag="cdgC1A5Done",
      activateCond="() => !!S_story.cdgC1A4Done",
      takeItem="The Diamond Stud-Case",
      grantItem="Constance Bonacieux's Ribbon — a small piece of blue ribbon pressed into your hand as she takes the case; the gesture of someone who has been afraid for three days and is, briefly, not afraid")

# ─── Cycle 2: The Convent Letter ──────────────────────────────────────────
say("CDG cycle 2 The Convent Letter: Constance's warning letter races Milady to Bethune convent — source Three Musketeers Dumas 1844 — nodes BTH REL DAR — quest chain cdg_02_act1 through cdg_02_act5 — city BTH node Bethune Convent of Carmelites — character Constance Bonacieux — character Milady de Winter")

quest("cdg_02_act1",
      "The Convent Letter — The Convent Gate",
      "Constance Bonacieux is afraid in the specific way of someone who has been afraid before and learned to manage it. Milady came through the gate this morning on some pretext. She will come back before nightfall. Constance presses the folded scrap into your hands — sealed with prayer-candle wax, D'Artagnan's name on the outside. Find D'Artagnan. The letter says everything else.",
      activateNode="BTH",
      passText="The window closes before nightfall. The relay post can send a rider faster than you can travel. You move.",
      failText="You understand urgent but not precisely. You leave without the calculation that would have you running instead of walking.",
      checkStat="WIS", checkDC=12,
      checkPassFlag="cdgC2A1Done",
      activateCond="() => !!S_story.cdgC1A5Done",
      grantItem="Constance's Warning Letter — prayer-candle wax seal; D'Artagnan's name outside; names Milady, names Bethune, names the wine; six-hour window before Milady returns")

quest("cdg_02_act2",
      "The Convent Letter — The Checkpoint",
      "Two miles south of Bethune: a Richelieu checkpoint specifically checking travelers from the convent district. The letter is in your coat. If found, it is seized and D'Artagnan never receives the warning. No side-paths. No detours without an hour you do not have.",
      activateNode="BTH",
      passText="Waved through. The letter still in your coat. The road south is open.",
      failText="They find the letter. It goes with the checkpoint sergeant. D'Artagnan never receives Constance's warning.",
      checkStat="CHA", checkDC=12,
      checkPassFlag="cdgC2A2Done",
      activateCond="() => !!S_story.cdgC2A1Done")

quest("cdg_02_act3",
      "The Convent Letter — The Relay Post",
      "The postmaster is gone. His assistant won't authorize without the postmaster's mark. The innkeeper's son across the road rode Amiens and back in one day last week and is available. The letter must leave this town in thirty minutes or D'Artagnan passes the Bethune junction.",
      activateNode="REL",
      passText="The innkeeper's son takes the letter and goes to the stable. Thirty seconds later he is on the road south at a canter.",
      failText="He wants proof. Leaves without confidence, rides slower than needed.",
      checkStat="CHA", checkDC=13,
      checkPassFlag="cdgC2A3Done",
      activateCond="() => !!S_story.cdgC2A2Done")

quest("cdg_02_act4",
      "The Convent Letter — The North Road",
      "Three riders from the north, Milady's people, following the innkeeper's son after seeing him leave with a sealed letter. You are between them and him. Stop them before one gets past you to the boy.",
      activateNode="REL",
      passText="Both riders down. The innkeeper's son is already at the junction taking the right fork. You follow on foot.",
      failText="One rider gets past. He catches the boy before the junction. The letter is taken.",
      checkStat="STR", checkDC=13,
      checkPassFlag="cdgC2A4Done",
      activateCond="() => !!S_story.cdgC2A3Done",
      monster="Milady's Hired Riders ×2", monsterHP=24, monsterAC=13)

quest("cdg_02_act5",
      "The Convent Letter — The Junction",
      "D'Artagnan looks at the handwriting before he breaks the seal. He reads. Four seconds. He looks at you: 'How long ago did she write this?' Give him the one piece of information beyond the letter. No elaboration. Let him go.",
      activateNode="DAR",
      passText="'This morning.' He turns. The road north opens. The commission is done.",
      failText="You start to explain more. He interrupts and leaves. You needed three extra seconds he didn't have.",
      checkStat="CON", checkDC=11,
      checkPassFlag="cdgC2A5Done",
      activateCond="() => !!S_story.cdgC2A4Done",
      takeItem="Constance's Warning Letter — in D'Artagnan's coat now; his business",
      grantItem="D'Artagnan's Coin — pressed into your hand as his horse turns; the rider's fee, returned")

# ─── Cycle 3: The Cardinal's Sealed Order ────────────────────────────────
say("CDG cycle 3 Cardinal's Sealed Order: Richelieu's authorization for Buckingham assassination carried through Hanseatic ports — source Three Musketeers Dumas 1844 — nodes LON BK WM — quest chain cdg_03_act1 through cdg_03_act5 — character Cardinal Richelieu — character Lord de Winter — city node LON London Lord Chancellor")

quest("cdg_03_act1",
      "The Cardinal's Sealed Order — Understanding the Chain",
      "Lord de Winter has intercepted Richelieu's authorization for Milady to kill Buckingham. The order's value as evidence depends on maintaining the custody chain from Richelieu's hand through Milady's delivery route to the current holder. Any gap can be challenged. Understand the chain before the Hanseatic ports.",
      activateNode="LON",
      passText="The order's legal value is unbroken. The chain from Richelieu's seal to Lord de Winter's interception is traceable. You carry it as evidence, not cargo.",
      failText="You understand the document is important but not why the chain matters. On the road, you will not notice when the chain is broken.",
      checkStat="WIS", checkDC=11,
      checkPassFlag="cdgC3A1Done",
      activateCond="() => !!S_story.cdgC2A5Done",
      grantItem="Richelieu's Authorization — French royal seal broken; names Milady by alias; names Buckingham by name; custody chain from Richelieu's hand is the evidence")

quest("cdg_03_act2",
      "The Cardinal's Sealed Order — Hanseatic Transit",
      "French diplomatic riders are following the interception route. Carry Richelieu's authorization through the Hanseatic ports as a commercial courier without triggering the French network's attention.",
      activateNode="LON",
      passText="Through the Hanseatic ports without the French network's attention. The document is unremarkable commercial cargo as far as anyone along the route is concerned.",
      failText="The French network notices. A rider is dispatched ahead of you. Birka will be more complicated.",
      checkStat="DEX", checkDC=12,
      checkPassFlag="cdgC3A2Done",
      activateCond="() => !!S_story.cdgC3A1Done")

quest("cdg_03_act3",
      "The Cardinal's Sealed Order — Birka Confrontation",
      "A French diplomatic contact at Birka insists the order is a forgery and demands surrender for authentication by French authorities. A French diplomatic demand in a neutral port does not override the carrier's commission. Name the distinction before the guards escalate.",
      activateNode="BK",
      passText="The distinction holds. The French diplomatic contact withdraws without the document. The custody chain is intact.",
      failText="The diplomatic pressure succeeds. The document is surrendered for authentication that will never complete.",
      checkStat="CHA", checkDC=13,
      checkPassFlag="cdgC3A3Done",
      activateCond="() => !!S_story.cdgC3A2Done",
      monster="French Diplomatic Guards ×2", monsterHP=20, monsterAC=12)

quest("cdg_03_act4",
      "The Cardinal's Sealed Order — The Road to Weimar",
      "Someone on the road has heard about the Buckingham assassination attempt and wants confirmation the Cardinal was behind it. The order is not a public document. Hold it until Weimar.",
      activateNode="BK",
      passText="You give them nothing. The road to Weimar is clear. The document stays sealed.",
      failText="Your answer implies enough. The question follows you to the next checkpoint.",
      checkStat="CON", checkDC=11,
      checkPassFlag="cdgC3A4Done",
      activateCond="() => !!S_story.cdgC3A3Done")

quest("cdg_03_act5",
      "The Cardinal's Sealed Order — Authorization Records",
      "Sweelinck reads the order and the broken seal. He reads the name it gives Milady. Authorization Records opens.",
      activateNode="WM",
      passText="Richelieu signed it. Milady received it. The man it named is dead. The order is filed under Authorization Records. The custody chain ends here, intact.",
      failText="The chain was broken somewhere on the road. The archive cannot file a document whose custody cannot be traced.",
      checkStat="WIS", checkDC=11,
      checkPassFlag="cdgC3A5Done",
      activateCond="() => !!S_story.cdgC3A4Done",
      takeItem="Richelieu's Authorization — filed under Authorization Records at Weimar")

# ─── Cycle 4: The Goldsmith's Receipt ────────────────────────────────────
say("CDG cycle 4 Goldsmith's Receipt: date 1625 proves conspiracy designed to be foiled before the theft — source Three Musketeers Dumas 1844 — nodes LON VEN WM — quest chain cdg_04_act1 through cdg_04_act5 — city VEN Venice — character Buckingham goldsmith")

quest("cdg_04_act1",
      "The Goldsmith's Receipt — The Date",
      "Buckingham's goldsmith's receipt: two additional diamond studs, dated 1625, goldsmith's mark and Buckingham's countersignature. The date is what matters — the studs were made before the theft because the theft was anticipated. The Cardinal arranged the theft knowing the replacement was possible. The receipt is proof the conspiracy was not improvised.",
      activateNode="LON",
      passText="The date is the evidence. The conspiracy was designed to be foiled — the replacement anticipated, the entire scheme theater. You carry the proof of design.",
      failText="You understand the document is valuable. The significance of the date specifically, you will have to reconstruct under pressure in Venice.",
      checkStat="WIS", checkDC=11,
      checkPassFlag="cdgC4A1Done",
      activateCond="() => !!S_story.cdgC3A5Done",
      grantItem="Buckingham's Goldsmith Receipt — two additional studs, dated 1625 before the theft; goldsmith's mark and Buckingham's countersignature; the date is the evidence")

quest("cdg_04_act2",
      "The Goldsmith's Receipt — Venice Entry",
      "French agents are watching the main Venice entry routes. The receipt is commercial paperwork from a London goldsmith. Enter as a merchant's assistant and hold the description through the harbor checkpoint.",
      activateNode="LON",
      passText="Through Venice harbor as a merchant's assistant with unremarkable cargo. The French network does not flag you.",
      failText="The French network flags something at the checkpoint. Secondary questioning and the Cardinal's agents inside Venice are alerted.",
      checkStat="CHA", checkDC=12,
      checkPassFlag="cdgC4A2Done",
      activateCond="() => !!S_story.cdgC4A1Done")

quest("cdg_04_act3",
      "The Goldsmith's Receipt — Venice Confrontation",
      "The Cardinal's Venice agent insists the receipt is a forgery and demands surrender for inspection. Commercial documentation of a legitimate goldsmith commission is not under French diplomatic jurisdiction. Name the distinction before the agents escalate.",
      activateNode="VEN",
      passText="The distinction holds. The receipt stays in your possession. Authentication proceeds under your custody.",
      failText="The diplomatic pressure succeeds. The receipt is surrendered for inspection that reveals the date before it reaches a neutral archive.",
      checkStat="CHA", checkDC=13,
      checkPassFlag="cdgC4A3Done",
      activateCond="() => !!S_story.cdgC4A2Done",
      monster="Cardinal's Venice Agents ×2", monsterHP=19, monsterAC=12)

quest("cdg_04_act4",
      "The Goldsmith's Receipt — Authenticated",
      "The Venetian banker's authentication has made the receipt more valuable and more dangerous. Hold it through the last checkpoint without volunteering that it has been authenticated.",
      activateNode="VEN",
      passText="Through the checkpoint without revealing the authentication. The document arrives at Weimar with the banker's mark undisclosed.",
      failText="The checkpoint officer notices something has been added to the document. Secondary questioning delays you and alerts the French network.",
      checkStat="CON", checkDC=11,
      checkPassFlag="cdgC4A4Done",
      activateCond="() => !!S_story.cdgC4A3Done")

quest("cdg_04_act5",
      "The Goldsmith's Receipt — Evidence Records",
      "Sweelinck reads the date. 1625. Before the ball. Before the theft. Evidence Records opens.",
      activateNode="WM",
      passText="1625. The studs were made before the ball. Before the theft. The replacement was anticipated because the plot was designed to be foiled. Filed under Evidence Records.",
      failText="The receipt's chain of custody has a gap. The archive cannot establish when the document was created or authenticated.",
      checkStat="WIS", checkDC=11,
      checkPassFlag="cdgC4A5Done",
      activateCond="() => !!S_story.cdgC4A4Done",
      takeItem="Buckingham's Goldsmith Receipt — filed under Evidence Records at Weimar")

# ─── Cycle 5: Athos's Past ────────────────────────────────────────────────
say("CDG cycle 5 Athos's Past: La Fere execution record 1615 establishes Milady's legal identity for prosecution — source Three Musketeers Dumas 1844 — nodes LON CON WM — quest chain cdg_05_act1 through cdg_05_act5 — character Athos Comte de la Fere — character Milady de Winter — city CON Constantinople")

quest("cdg_05_act1",
      "Athos's Past — The Two-Step Legal Argument",
      "The execution record from the Comte de la Fère's estate: Milady's hanging for theft in 1615, the parish record, magistrate's signature, death-declaration. If she is legally dead as of 1615, all her subsequent crimes were committed by a legally dead person — the record must establish identity continuity before any charges can hold. The Cardinal's agents want it destroyed.",
      activateNode="LON",
      passText="The two-step argument is clear: the record establishes first identity, which must be connected to the second before prosecution holds. You carry it with that understanding.",
      failText="You understand the document is important. The legal argument you will have to reconstruct under pressure from a Byzantine legal scholar.",
      checkStat="WIS", checkDC=12,
      checkPassFlag="cdgC5A1Done",
      activateCond="() => !!S_story.cdgC4A5Done",
      grantItem="La Fère Execution Record — Milady's hanging for theft 1615; magistrate's signature; death-declaration; the document that makes the first date the legal basis for prosecuting the second")

quest("cdg_05_act2",
      "Athos's Past — The Fast Overland Route",
      "The Cardinal's agents are on the same road. Take the fast overland route and arrive at Constantinople before the execution record is intercepted.",
      activateNode="LON",
      passText="Constantinople before the interception route. The execution record arrives in Byzantine jurisdiction ahead of the Cardinal's agents.",
      failText="The Cardinal's agents are faster on the main road. Constantinople is already complicated before you arrive.",
      checkStat="STR", checkDC=12,
      checkPassFlag="cdgC5A2Done",
      activateCond="() => !!S_story.cdgC5A1Done")

quest("cdg_05_act3",
      "Athos's Past — The Byzantine Scholar",
      "The Byzantine legal scholar wants to keep a copy of the execution record for his comparative archive. A copy entering Byzantine records creates a second version that can be challenged independently. Decline the copy request before the Cardinal's agents arrive and complicate the room.",
      activateNode="CON",
      passText="Copy request declined. The execution record remains the only version. The Cardinal's agents arrive to a room where the scholar has nothing to show them.",
      failText="The scholar's copy enters Byzantine records. The Cardinal's agents use it to create a challenge to the original's authenticity.",
      checkStat="WIS", checkDC=13,
      checkPassFlag="cdgC5A3Done",
      activateCond="() => !!S_story.cdgC5A2Done",
      monster="Cardinal's Agents ×2", monsterHP=19, monsterAC=12)

quest("cdg_05_act4",
      "Athos's Past — The Road to Weimar",
      "Someone on the road wants to know what happened to Milady. The execution record is the answer. The answer is not public yet. Hold it until the archive receives it.",
      activateNode="CON",
      passText="Nothing given. The road to Weimar is clear. The execution record stays sealed.",
      failText="Your answer implies enough. The question reaches the Cardinal's network before you reach Weimar.",
      checkStat="CON", checkDC=11,
      checkPassFlag="cdgC5A4Done",
      activateCond="() => !!S_story.cdgC5A3Done")

quest("cdg_05_act5",
      "Athos's Past — Identity Records",
      "Sweelinck reads the execution record. 1615. He reads the magistrate's name. He looks up. Identity Records opens.",
      activateNode="WM",
      passText="She was legally hanged in 1615. She continued to exist and act until 1628. The document makes the first date the legal basis for prosecuting the second. The archive holds both.",
      failText="The chain of identity cannot be established from the document alone. The archive cannot file an execution record whose subject is disputed.",
      checkStat="WIS", checkDC=11,
      checkPassFlag="cdgC5A5Done",
      activateCond="() => !!S_story.cdgC5A4Done",
      takeItem="La Fère Execution Record — filed under Identity Records at Weimar")

# ─── Cycle 6: Planchet's Loyalty ─────────────────────────────────────────
say("CDG cycle 6 Planchet's Loyalty: Queen's deactivated seal with D'Artagnan delivery notch carried from Rome to Weimar — source Three Musketeers Dumas 1844 — nodes LON ROM WM — quest chain cdg_06_act1 through cdg_06_act5 — character Planchet — character D'Artagnan — city ROM Rome Prefect Court Quarter")

quest("cdg_06_act1",
      "Planchet's Loyalty — The Deactivated Seal",
      "The Queen's authorization seal with D'Artagnan's delivery notch on the back — the mark confirming the Buckingham mission completed correctly. Cannot return to the Queen through normal channels; French intelligence is watching her correspondence. The Roman cardinal-confessor held it in transit. The notch is the evidence; the seal is the authority that made the notch meaningful.",
      activateNode="LON",
      passText="The seal is deactivated but still a piece of the French queen's private correspondence system. The delivery notch is evidence; the seal is the authority that made the notch meaningful. You carry both.",
      failText="You understand the seal is important. The legal distinction between a deactivated seal and an active one, you will have to reconstruct in Rome.",
      checkStat="WIS", checkDC=11,
      checkPassFlag="cdgC6A1Done",
      activateCond="() => !!S_story.cdgC5A5Done",
      grantItem="The Queen's Deactivated Seal — D'Artagnan's delivery notch on the back; confirms mission completion; cannot return to the Queen directly; held by Roman cardinal-confessor in transit")

quest("cdg_06_act2",
      "Planchet's Loyalty — The Roman Cardinal's Secretary",
      "The Roman cardinal's secretary wants to hold the seal in Rome permanently as evidence of the Queen's agency in the affair. The seal's permanent record should be in a neutral archive, not a church library where it could be used diplomatically. Explain the distinction.",
      activateNode="LON",
      passText="The secretary accepts the distinction. The seal is released for transit to the neutral archive.",
      failText="The secretary is unmoved. The seal stays in Rome longer than planned and its presence in the church library becomes known to French intelligence.",
      checkStat="CHA", checkDC=12,
      checkPassFlag="cdgC6A2Done",
      activateCond="() => !!S_story.cdgC6A1Done")

quest("cdg_06_act3",
      "Planchet's Loyalty — Rome Confrontation",
      "A French diplomatic agent in Rome recognizes the seal's description and attempts to acquire it. The seal is a completed document; French diplomatic authority over a completed commission does not extend to the commission's archive record. Name the principle and hold the seal.",
      activateNode="ROM",
      passText="The principle holds. The French agent withdraws without the seal. The commission's archive record remains with the carrier.",
      failText="The diplomatic pressure succeeds. The seal is surrendered. The commission's evidence enters French diplomatic channels.",
      checkStat="CON", checkDC=13,
      checkPassFlag="cdgC6A3Done",
      activateCond="() => !!S_story.cdgC6A2Done",
      monster="French Diplomatic Agents ×2", monsterHP=19, monsterAC=12)

quest("cdg_06_act4",
      "Planchet's Loyalty — The Jesuit on the Road",
      "A Jesuit on the road recognizes the seal's origin and wants to know the details of how it was used. The seal's use is not public knowledge. Close the conversation without confirming the Jesuit's inference.",
      activateNode="ROM",
      passText="The conversation closed without confirmation. The Jesuit's inference remains unverified. The road to Weimar is clear.",
      failText="Your response confirms enough. The Jesuit's inference becomes a report that reaches French intelligence before Weimar.",
      checkStat="WIS", checkDC=11,
      checkPassFlag="cdgC6A4Done",
      activateCond="() => !!S_story.cdgC6A3Done")

quest("cdg_06_act5",
      "Planchet's Loyalty — Commission Completion Records",
      "Sweelinck examines the delivery notch on the back of the seal. He sets it down. The mission was completed correctly. Commission Completion Records opens.",
      activateNode="WM",
      passText="The seal opened one door at one specific moment. The notch on the back confirms it was used correctly. Both facts are now in the archive.",
      failText="The seal's chain of custody cannot be established. The archive cannot confirm the mission was completed correctly.",
      checkStat="WIS", checkDC=11,
      checkPassFlag="cdgC6A5Done",
      activateCond="() => !!S_story.cdgC6A4Done",
      takeItem="The Queen's Deactivated Seal — filed under Commission Completion Records at Weimar")

# ─── Cycle 7: The Musketeers' Billet ─────────────────────────────────────
say("CDG cycle 7 The Musketeers' Billet: Athos sealed report naming court officials still in power written at La Rochelle siege — source Three Musketeers Dumas 1844 — nodes LON LDN WM — quest chain cdg_07_act1 through cdg_07_act5 — FINAL CYCLE questComplete — character Athos — character Lord de Winter — property questComplete final act")

quest("cdg_07_act1",
      "The Musketeers' Billet — Do Not Read the Report",
      "Athos's sealed report to the Musketeer captain: names, dates, the chain of complicity from Milady to Richelieu to court officials still in position. Written at La Rochelle while the siege was in progress. The names in the report are more dangerous to know than not to know. The commission is delivery sealed. Do not read it.",
      activateNode="LON",
      passText="The report stays sealed. You carry it as Athos wrote it — a fact without its contents, a danger without its details.",
      failText="You open the report. You know the names. The names are now a liability you carry in addition to the document.",
      checkStat="WIS", checkDC=11,
      checkPassFlag="cdgC7A1Done",
      activateCond="() => !!S_story.cdgC6A5Done",
      grantItem="Athos's Sealed Report — names, dates, chain of complicity from Milady to Richelieu to court officials; sealed at La Rochelle; more dangerous to know than not to know")

quest("cdg_07_act2",
      "The Musketeers' Billet — Channel Crossing",
      "The Cardinal has agents watching the Channel crossings for Musketeer-adjacent cargo. Travel as a commercial courier with unremarkable cargo. The sealed report is business correspondence.",
      activateNode="LON",
      passText="Through the Channel crossing without the Cardinal's agents flagging Musketeer-adjacent cargo. The report is unremarkable business correspondence.",
      failText="The Cardinal's agents flag something at the crossing. A rider is dispatched ahead of you. London will be complicated.",
      checkStat="DEX", checkDC=12,
      checkPassFlag="cdgC7A2Done",
      activateCond="() => !!S_story.cdgC7A1Done")

quest("cdg_07_act3",
      "The Musketeers' Billet — Lord de Winter",
      "A French agent is with Lord de Winter when you arrive. Lord de Winter needs to release his supporting evidence today. Persuade de Winter that delay is the Cardinal's win — before the diplomatic riders on the road out of London become the main problem.",
      activateNode="LDN",
      passText="Lord de Winter releases the supporting documents. The diplomatic riders on the road are handled before they can intercept. The sealed report and Lord de Winter's evidence travel together.",
      failText="The French agent's presence delays Lord de Winter's release of the supporting documents. The diplomatic riders get ahead of you on the road to Weimar.",
      checkStat="CHA", checkDC=13,
      checkPassFlag="cdgC7A3Done",
      activateCond="() => !!S_story.cdgC7A2Done",
      monster="French Diplomatic Riders ×2", monsterHP=21, monsterAC=13)

quest("cdg_07_act4",
      "The Musketeers' Billet — The Road to Weimar",
      "Someone on the road who has heard about La Rochelle asks about the Musketeers' role there. The sealed report is not public information. Say nothing that implies a commission is in progress.",
      activateNode="LDN",
      passText="Nothing given. The commission stays unrevealed. Weimar is ahead.",
      failText="Your answer implies a commission. The Cardinal's network receives the information before Weimar.",
      checkStat="CON", checkDC=11,
      checkPassFlag="cdgC7A4Done",
      activateCond="() => !!S_story.cdgC7A3Done")

quest("cdg_07_act5",
      "The Musketeers' Billet — Complicity Records",
      "Sweelinck receives both documents. He does not open the report. He files it sealed with the supporting documents attached. Complicity Records opens. The Three Musketeers series is complete.",
      activateNode="WM",
      passText="Athos wrote the report while the siege was still in progress. He sent it before the Cardinal could close the channel. The names in the report are still active as of the date of filing. The archive does not act on its contents. It holds them.",
      failText="The chain of custody is incomplete. The archive cannot file a sealed report without documentation of the signing and sealing.",
      checkStat="WIS", checkDC=11,
      checkPassFlag="cdgC7A5Done",
      activateCond="() => !!S_story.cdgC7A4Done",
      takeItem="Athos's Sealed Report — filed sealed under Complicity Records at Weimar",
      questComplete=True)

# ─── Post-import audit ────────────────────────────────────────────────────
say("CDG import complete: post-import audit — Three Musketeers Alexandre Dumas Auguste Maquet 1844 — 7 cycles 5 acts 35 quests — nodes BTH Bethune REL Relay Post DAR Road Junction — checking final node and quest counts")
audit = api("get", "/api/audit")
parse = {p["section"]: p["count"] for p in audit.get("parse", [])}
print(f"Post-import: {parse.get('NODE_MAP')} nodes, {parse.get('QUEST_DB')} quests")
