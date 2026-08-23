#!/usr/bin/env python3
# SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
# ═══════════════════════════════════════════════════════════════════════════
# ⚠️  ARCHAIC — OUT OF DATE.  Historical one-shot importer (POSTs to the
#     localhost:1367 WBAPI).  Content was long ago imported and lives in
#     index.html.  This script likely NO LONGER RUNS against the current
#     server/schema.  Kept for reference only — do not run without review.
#     Import history: BACKLOG.md / plan-archive.md / 1367-sources/.
# ═══════════════════════════════════════════════════════════════════════════
"""Import VIE — Faust (Johann Wolfgang von Goethe, 1808) — 7 cycles × 5 acts = 35 quests."""

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

say("VIE import: creating nodes VIE Vienna Imperial City, MGR Gretchen's Prison Tower, DKN Dominican Legal Court, CLK Clerk's Sickroom — source book Faust by Johann Wolfgang von Goethe 1808")

create_node("VIE", "city", "Vienna — The Imperial City",
            "Vienna — The Imperial City",
            90, 126,
            "A walled German imperial city in the Faust setting: lime-wash and old rain, Dominican courts and civic archives, a class of educated men who use legal procedure as a weapon. Hub for VIE cycles 3–7.")

create_node("MGR", "city", "Gretchen's Prison Tower",
            "Gretchen's Prison Tower",
            92, 126,
            "The stone anteroom of the prison tower where Margarete awaits execution. The chaplain waited here all night with ink-stained shaking hands, carrying the condemned woman's dignity as a commission. The deposition was sealed with her thumb-mark in blue wax.")

create_node("DKN", "city", "Dominican Legal Court",
            "Dominican Legal Court",
            92, 128,
            "The Dominican legal court in the imperial city's civic quarter, where competing jurisdictions collide: imperial law, church authority, family money, and the institutional pressure that bends the record-keeper before the document arrives.")

create_node("CLK", "city", "The Clerk's Sickroom",
            "The Clerk's Sickroom",
            94, 127,
            "A small residential house near the civic quarter. The clerk — seventy, thin, in pain for months — has been waiting here for a carrier. His notarized recantation of twenty-two-year-old perjury is on the bed beside him. The magistrate's agents are watching the front gate.")

# ─── Pre-import audit ──────────────────────────────────────────────────────
say("VIE import: pre-import audit — Faust Goethe 1808")
audit = api("get", "/api/audit")
parse = {p["section"]: p["count"] for p in audit.get("parse", [])}
print(f"Pre-import: {parse.get('NODE_MAP')} nodes, {parse.get('QUEST_DB')} quests")

# ─── Cycle 1: Margarete's Account ─────────────────────────────────────────
say("VIE cycle 1 Margarete's Account: condemned woman's deposition carried to archive before execution — source Faust Goethe 1808 — nodes MGR DKN WM — quest chain vie_01_act1 through vie_01_act5 — character Margarete — character Sweelinck — city MGR prison tower — quest vie_01 chain — property checkPassFlag vieC1A1Done")

quest("vie_01_act1",
      "Margarete's Account — The Chaplain's Commission",
      "The chaplain in the stone anteroom, ink-stained hands shaking. He passes the linen roll across the table — sealed twice: Margarete's thumb-mark in blue wax, his counterseal. The execution is before midday. He cannot go himself; he is confined to the prison district by the bishop's order. The family has already turned back two couriers. Get there before the second bell.",
      activateNode="MGR",
      passText="You read the chaplain's fear accurately — for her, not himself. He has no stake in the document's content except her right to have said what she said. You take the commission without hesitation.",
      failText="You misread the anxiety as self-preservation. You take the commission but carry a fraction of the wrong weight.",
      checkStat="WIS", checkDC=12,
      checkPassFlag="vieC1A1Done",
      grantItem="The Prison Deposition — a linen roll; Margarete's sworn account dictated to the chaplain; sealed with her thumb-mark and his counterseal; last line: 'I ask only that this account be opened in my presence, if possible, and in my absence if not'")

quest("vie_01_act2",
      "Margarete's Account — The Clerk at the Gate",
      "A notary's clerk in a green coat with a ledger, posted before dawn. He wants to log all correspondence exiting the prison district for a three-day verification hold. The execution is before midday. Three days is a polite way of saying never.",
      activateNode="MGR",
      passText="You invoke the prisoner's right to direct address. A sealed document addressed to the Archivus is official correspondence; interference before delivery is obstruction under imperial statute. The clerk backs down and waves you through.",
      failText="The clerk demands to inspect the outer seal. You argue without breaking it. You pass, but with a ledger notation that will complicate the next gate.",
      checkStat="CHA", checkDC=13,
      checkPassFlag="vieC1A2Done",
      activateCond="() => !!S_story.vieC1A1Done")

quest("vie_01_act3",
      "Margarete's Account — The Restraining Writ",
      "The Dominican court duty clerk has a family-commissioned writ on his desk — a restraining order on 'unsolicited depositions from prison inmates in adjudicated cases,' filed this morning at first light. Two men in the father's household livery are coming from the side hall. The Fighter has the Dominican prior's transit warrant and one legal argument.",
      activateNode="DKN",
      passText="You name the clerk's liability for unlawful withholding — a writ filed by an interested party on the morning of an execution is facially invalid. He stamps the transit receipt and steps back before the retainers arrive.",
      failText="Persuasion fails. The retainers arrive and move to remove you from the court.",
      checkStat="CHA", checkDC=14,
      checkPassFlag="vieC1A3Done",
      activateCond="() => !!S_story.vieC1A2Done",
      monster="Household Retainers ×2", monsterHP=18, monsterAC=13)

quest("vie_01_act4",
      "Margarete's Account — The Market Square Race",
      "A mounted agent in the father's colors cuts into the market square from the east road. He knows where the document is going. He cannot enter the square at speed — too many stalls — but he is going around. The Fighter is going through.",
      activateNode="DKN",
      passText="Through the market square at speed: between the fish carts, past the grain vendors, through the students at the archivists' corner door. You reach the archive gate before the agent rounds the square.",
      failText="You arrive at the gate at the same moment as the agent, who has a pre-emption writ. You argue past the gate-warden using the Dominican court stamp. It works but costs a quarter-hour.",
      checkStat="STR", checkDC=13,
      checkPassFlag="vieC1A4Done",
      activateCond="() => !!S_story.vieC1A3Done")

quest("vie_01_act5",
      "Margarete's Account — The Archivus",
      "Sweelinck is a grey man with glasses and a precise manner. He cites the standard procedure: two working days for verification, then opening in the presence of civil witnesses. Two working days is after the execution. He has not moved his pen. On his desk, half under a blotter: a family solicitor's request for voluntary hold. He doesn't want to comply. He wants reason not to.",
      activateNode="WM",
      passText="You name it directly: the request for hold, the conflict of interest, the woman's own last line — she has already given permission for the archive to act without her. Sweelinck takes off his glasses. He opens the register. The document is in the permanent record before the sentence is carried out.",
      failText="Sweelinck logs the document at the close of business, after the execution. It is filed correctly and permanently. The account is in the record. But it was filed after, not before.",
      checkStat="WIS", checkDC=12,
      checkPassFlag="vieC1A5Done",
      activateCond="() => !!S_story.vieC1A4Done",
      takeItem="The Prison Deposition — filed in the Archivus's permanent collection; sealed with the register's receipt stamp")

# ─── Cycle 2: The Perjured Record ─────────────────────────────────────────
say("VIE cycle 2 The Perjured Record: dying clerk's notarized recantation of twenty-two-year-old perjury — source Faust Goethe 1808 — nodes CLK DKN WM — quest chain vie_02_act1 through vie_02_act5 — character the dying clerk — character Magistrate Haas — city CLK sickroom — quest vie_02 chain — property checkPassFlag vieC2A1Done")

quest("vie_02_act1",
      "The Perjured Record — The Deathbed",
      "The clerk is seventy, thin, in pain for months. The notary was here an hour ago and left. He holds the sealed document toward you with a shaking hand. 'Twenty-two years ago I gave false testimony. Gerhardt Unger was convicted and executed. His children are in the city. The document names everyone involved. Including Magistrate Haas. Particularly Magistrate Haas.' He is not asking for absolution. His agents are already outside. Leave through the kitchen passage.",
      activateNode="CLK",
      passText="The document is for the archive. The dead man's children are not part of the commission — they are the reason the commission matters. You take it through the kitchen passage.",
      failText="You take it as a personal errand for the dying man. The right kind of steadiness is different.",
      checkStat="WIS", checkDC=12,
      checkPassFlag="vieC2A1Done",
      activateCond="() => !!S_story.vieC1A5Done",
      grantItem="The Clerk's Sealed Recantation — notarized; names the guild members, the false testimony, and Magistrate Haas; the exonerated man has been dead eleven years; his children are in the city")

quest("vie_02_act2",
      "The Perjured Record — The Side Street",
      "Two men in civic livery at the front gate, one watching the kitchen passage door twenty feet away. He has seen you. The side street is narrow, ends in an alley, connects to the civic quarter road three buildings down. The man at the passage door is deciding whether to follow.",
      activateNode="CLK",
      passText="You turn right at the alley's end at the exact pace of a resident making a correction, and you are on the civic quarter road before he decides whether to follow.",
      failText="He calls after you. You run. He runs. You reach the road a hundred feet ahead of him — enough — but the chase is noted.",
      checkStat="DEX", checkDC=12,
      checkPassFlag="vieC2A2Done",
      activateCond="() => !!S_story.vieC2A1Done")

quest("vie_02_act3",
      "The Perjured Record — The Civic Quarter",
      "The magistrate's senior legal agent is in the road between you and the archive, holding a folded writ. Post-mortem testimony in cases closed under the thirty-year statutory bar. The review board, scheduled for spring session, is chaired by Magistrate Haas. The thirty-year bar requires a legitimately-closed case.",
      activateNode="DKN",
      passText="A conviction obtained through fabricated testimony was never legitimately reached. The bar has no application to a case that was, legally speaking, a procedure that never validly occurred. He knows the argument is correct. He steps aside.",
      failText="He disputes the interpretation. You get through, but his formal objection is logged in the street.",
      checkStat="CHA", checkDC=13,
      checkPassFlag="vieC2A3Done",
      activateCond="() => !!S_story.vieC2A2Done")

quest("vie_02_act4",
      "The Perjured Record — The Archive Gate",
      "A court order barring entry to 'potentially defamatory materials related to ongoing civic proceedings' — issued this morning, the same morning the clerk signed his recantation. A legal enforcer is at the archive gate in case the legal officer's authority is disputed.",
      activateNode="WM",
      passText="The enforcer is down. The legal officer steps back. You are through the archive gate.",
      failText="You are taken to the side room. The document is confiscated. Sent to the statutory review board. Spring session. Magistrate Haas presiding.",
      checkStat="STR", checkDC=13,
      checkPassFlag="vieC2A4Done",
      activateCond="() => !!S_story.vieC2A3Done",
      monster="Legal Enforcer ×1", monsterHP=24, monsterAC=13)

quest("vie_02_act5",
      "The Perjured Record — The Intake Desk",
      "The Archivus is a woman in her fifties with ink on her left hand from a morning of filing. She breaks the seal and reads the first two lines. The document names Magistrate Haas in the second sentence. 'This is going to be a complicated day for everyone in this building.' She picks up her intake stamp. She looks at you.",
      activateNode="WM",
      passText="She stamps the document. She enters it in the ledger. 'I'll need your name for the chain of custody.' You give it. She writes it. You leave. Outside, the magistrate's legal agent is running.",
      failText="You say something accurate and well-intentioned about the clerk's state of mind or the family. She says, gently, that she didn't ask. You stop. She stamps.",
      checkStat="CON", checkDC=11,
      checkPassFlag="vieC2A5Done",
      activateCond="() => !!S_story.vieC2A4Done",
      takeItem="The Clerk's Sealed Recantation — filed in the Archive of Civic Records; permanent; Magistrate Haas is named in the second sentence",
      grantItem="Archive Chain-of-Custody Receipt — your name in the ledger on the receiving end of a permanent entry")

# ─── Cycle 3: The Scholar's Confession ────────────────────────────────────
say("VIE cycle 3 Scholar's Confession: professor's sealed confession and commission receipt naming guild corruption — source Faust Goethe 1808 — nodes VIE BK WM — quest chain vie_03_act1 through vie_03_act5 — character the dying professor — city VIE Vienna Imperial City — quest vie_03 chain")

quest("vie_03_act1",
      "The Scholar's Confession — The Professor's Commission",
      "The dying professor is calm in the way of a man who has arranged everything. He has two documents: the sealed confession naming guild members who commissioned false testimony, and the original commission receipt showing exactly what sum was paid and by which guild officer. He kept the receipt for twenty years as protection. He no longer needs protection.",
      activateNode="VIE",
      passText="The professor's calm is completion, not performance. You take both documents without the absolution he is not asking for.",
      failText="You treat the moment as more emotional than it is. You take the documents with unnecessary weight — your weight, not his.",
      checkStat="WIS", checkDC=11,
      checkPassFlag="vieC3A1Done",
      activateCond="() => !!S_story.vieC2A5Done",
      grantItem="Scholar's Sealed Confession — names guild members who commissioned false testimony and the sum paid; the original commission receipt folded and sealed within; kept twenty years as protection")

quest("vie_03_act2",
      "The Scholar's Confession — Jurisdictional Writ",
      "A university clerk has a jurisdictional writ covering academic disputes. He is at the transit point between the professor's quarter and Birka. The confession is sealed personal correspondence addressed to the Archive — not an academic dispute.",
      activateNode="VIE",
      passText="The jurisdictional writ covers academic disputes, not personal correspondence. The clerk knows it. He steps aside.",
      failText="He insists the documents fall under the writ's scope. You spend time arguing around a technicality he invented.",
      checkStat="CHA", checkDC=12,
      checkPassFlag="vieC3A2Done",
      activateCond="() => !!S_story.vieC3A1Done")

quest("vie_03_act3",
      "The Scholar's Confession — The Document Comparison",
      "At Birka, Solvei the archivist is performing the three-document comparison that will authenticate the confession against the commission receipt against the guild's registered marks. It requires twenty uninterrupted minutes. Northern guild agents are in the corridor.",
      activateNode="BK",
      passText="The corridor held. Solvei completes the three-document comparison. All three documents are authenticated and match.",
      failText="An interruption forces the comparison to restart. Solvei completes it eventually, but the guild agents have reported the presence of the documents.",
      checkStat="STR", checkDC=13,
      checkPassFlag="vieC3A3Done",
      activateCond="() => !!S_story.vieC3A2Done",
      monster="Northern Guild Agents ×2", monsterHP=18, monsterAC=12)

quest("vie_03_act4",
      "The Scholar's Confession — The Civil Claim",
      "A civil claim requires acknowledgment to be served. The process server is waiting at the waystation on the direct road to Weimar. The forest track bypasses the waystation: two hours slower but the server cannot reach you on it.",
      activateNode="BK",
      passText="The forest track taken. You arrive at Weimar two hours later than the direct road. The civil claim was never served. The documents are clean.",
      failText="You take the direct road and acknowledge the civil claim at the waystation. The claim slows your arrival and requires response.",
      checkStat="CON", checkDC=12,
      checkPassFlag="vieC3A4Done",
      activateCond="() => !!S_story.vieC3A3Done")

quest("vie_03_act5",
      "The Scholar's Confession — Academic Corruption Records",
      "Sweelinck reads all three documents in order. The confession alone is a dying man's statement. The receipt makes it a transaction record. Academic Corruption Records opens.",
      activateNode="WM",
      passText="The confession names the members. The receipt names the sum and the guild officer. The authentication confirms both documents are genuine. Academic Corruption Records filed.",
      failText="Without the authenticated receipt, the confession is one man's deathbed statement. The archive logs it but cannot open Academic Corruption Records on a single-source claim.",
      checkStat="WIS", checkDC=11,
      checkPassFlag="vieC3A5Done",
      activateCond="() => !!S_story.vieC3A4Done",
      takeItem="Scholar's Sealed Confession — filed under Academic Corruption Records at Weimar")

# ─── Cycle 4: The Widow's Contract ────────────────────────────────────────
say("VIE cycle 4 Widow's Contract: pre-confirmed widow's property deed carried to Venice before mine lord's theft claim completes — source Faust Goethe 1808 — nodes VIE VEN WM — quest chain vie_04_act1 through vie_04_act5")

quest("vie_04_act1",
      "The Widow's Contract — The Notary's Office",
      "The widow and her two children are present. The notary has pre-confirmed the property contract: the deed is valid, the notarial act complete, the mine lord's subsequent theft claim postdates the confirmation. The Fighter must carry the pre-confirmed contract to Venice for the Venetian notary's authentication before the mine lord's factor can complete the claim.",
      activateNode="VIE",
      passText="You acknowledge all three family members before taking the contract. The notary notes the commission is accepted with full understanding of all parties present.",
      failText="You take the contract without properly acknowledging the family members. The notary has to add a clarifying notation. Minor delay, but noted.",
      checkStat="CHA", checkDC=11,
      checkPassFlag="vieC4A1Done",
      activateCond="() => !!S_story.vieC3A5Done",
      grantItem="The Widow's Pre-Confirmed Contract — notarially confirmed; theft claim postdates the confirmation; the date is the legal argument; mine lord's Venice factor has been briefed on the route")

quest("vie_04_act2",
      "The Widow's Contract — The Inspection Point",
      "The inspection point at the city gate is watching for vellum contracts — the mine lord's factor has briefed them. The chandler's alley bypasses it: twenty minutes longer, tight storage district.",
      activateNode="VIE",
      passText="The chandler's alley navigated. You emerge on the Venice road past the inspection point, with the contract still sealed.",
      failText="The alley is blocked by a delivery cart. You lose forty minutes finding an alternative path that avoids the inspection point.",
      checkStat="STR", checkDC=12,
      checkPassFlag="vieC4A2Done",
      activateCond="() => !!S_story.vieC4A1Done")

quest("vie_04_act3",
      "The Widow's Contract — Venice Confrontation",
      "The mine lord's Venice factor has a theft report, filed after the pre-confirmation. He demands surrender of the contract for inspection. The pre-confirmation is a completed notarial act. The theft report postdates it. Name it so the Venice notary can agree on record.",
      activateNode="VEN",
      passText="The pre-confirmation is a completed notarial act. The theft report postdates it. The Venice notary agrees on record. The factor withdraws.",
      failText="The factor escalates. The Venice notary is unwilling to rule without more documentation. The factor gains time.",
      checkStat="CHA", checkDC=13,
      checkPassFlag="vieC4A3Done",
      activateCond="() => !!S_story.vieC4A2Done",
      monster="Mine Lord's Venice Factor ×1", monsterHP=22, monsterAC=13)

quest("vie_04_act4",
      "The Widow's Contract — The Forfeit Order",
      "A forfeit order requiring theft provenance is presented at the last checkpoint before Weimar. The contract was purchased by the widow in a legitimate notarial transaction, not stolen. The distinction must be stated without acknowledging the order's potential validity.",
      activateNode="VEN",
      passText="The contract was purchased, not stolen. The forfeit order has no basis in fact. Through the checkpoint without acknowledging the order as potentially valid.",
      failText="Your answer implies the order might have some basis. The checkpoint officer records the exchange and sends a message to the mine lord's office.",
      checkStat="CON", checkDC=12,
      checkPassFlag="vieC4A4Done",
      activateCond="() => !!S_story.vieC4A3Done")

quest("vie_04_act5",
      "The Widow's Contract — Duress Voidance Records",
      "Sweelinck reads the escape clause and the intake stamp: eleven forty-two. The mine lord put the escape clause there to satisfy the form requirements. He didn't anticipate someone reading the third paragraph. Duress Voidance Records opens.",
      activateNode="WM",
      passText="The escape clause is in the third paragraph. The intake stamp is eleven forty-two, before the forfeit order was filed. The contract predates the claim on every document. Duress Voidance Records filed.",
      failText="The chain of authentication has a gap. The archive cannot file a duress claim without the Venetian notary's confirmed authentication.",
      checkStat="WIS", checkDC=11,
      checkPassFlag="vieC4A5Done",
      activateCond="() => !!S_story.vieC4A4Done",
      takeItem="The Widow's Pre-Confirmed Contract — filed under Duress Voidance Records at Weimar")

# ─── Cycle 5: The Mayor's Commission ──────────────────────────────────────
say("VIE cycle 5 Mayor's Commission: legislative delivery of the mayor's sealed instrument through guild obstruction — source Faust Goethe 1808 — nodes VIE CON WM — quest chain vie_05_act1 through vie_05_act5")

quest("vie_05_act1",
      "The Mayor's Commission — The Neutral Carrier",
      "The mayor's sealed instrument: a legislative delivery commission. The neutral carrier is not a fiction — it is the legal instrument. The commission is to walk through the door and hand it across the desk. Nothing more than that is required. Understanding this before the guild's private security network is essential.",
      activateNode="VIE",
      passText="The commission is to deliver the document sealed. The neutral carrier's role is exactly that: delivery. Nothing beyond delivery is required or permitted.",
      failText="You treat the commission as more than delivery. The additional weight will cost you at the guild's security checkpoint.",
      checkStat="WIS", checkDC=11,
      checkPassFlag="vieC5A1Done",
      activateCond="() => !!S_story.vieC4A5Done",
      grantItem="The Mayor's Sealed Instrument — a legislative delivery commission; the mayor's seal constitutes diplomatic recognition; the carrier is neutral; delivery is the entire commission")

quest("vie_05_act2",
      "The Mayor's Commission — The Security Checkpoint",
      "The guild's private security guard has no authority to inspect sealed administrative correspondence. The inspection right covers goods, not documents. He is at the transit point to Constantinople.",
      activateNode="VIE",
      passText="The inspection right covers goods, not documents. Administrative sealed correspondence is outside his authority. He steps aside.",
      failText="He insists the distinction does not apply. You spend time with a guild notary who eventually confirms your position, but the delay is noted.",
      checkStat="CHA", checkDC=12,
      checkPassFlag="vieC5A2Done",
      activateCond="() => !!S_story.vieC5A1Done")

quest("vie_05_act3",
      "The Mayor's Commission — The Young Diplomat",
      "The guild has deployed a young diplomat with an extra-territorial claim against the mayor's jurisdiction. He wants a graceful exit. The mayor's seal constitutes diplomatic recognition superseding the extra-territorial claim. Name the specific structure so he can yield without appearing pressured. His guild liaison officers are prepared to enforce if the diplomatic argument fails.",
      activateNode="CON",
      passText="The specific structure named. He yields without appearing pressured. The guild liaison officers stand down. The delivery proceeds.",
      failText="The argument is correct but not specific enough for a graceful exit. The liaison officers escalate while the diplomat hesitates.",
      checkStat="WIS", checkDC=13,
      checkPassFlag="vieC5A3Done",
      activateCond="() => !!S_story.vieC5A2Done",
      monster="Guild Liaison Officers ×2", monsterHP=19, monsterAC=12)

quest("vie_05_act4",
      "The Mayor's Commission — The Renewal Bell",
      "The archive intake closes at the renewal bell. The canal freight path is fifteen minutes faster than the direct road. The renewal bell will ring soon.",
      activateNode="CON",
      passText="The canal freight path taken. You arrive at Weimar intake before the renewal bell. Delivery before bell. The injunction filed after delivery is out of sequence.",
      failText="You take the direct road. You arrive at intake after the renewal bell. The injunction was filed before your arrival. Intake is complicated.",
      checkStat="STR", checkDC=12,
      checkPassFlag="vieC5A4Done",
      activateCond="() => !!S_story.vieC5A3Done")

quest("vie_05_act5",
      "The Mayor's Commission — Legislative Delivery Records",
      "Sweelinck reads the delivery log stamp and the renewal bell's time. Delivery before renewal. Injunction after delivery. The document arrived first. Legislative Delivery Records opens.",
      activateNode="WM",
      passText="Delivery log: before the renewal bell. Injunction filing: after delivery. The document arrived first. The injunction has no standing against a completed delivery. Legislative Delivery Records filed.",
      failText="The delivery log and the bell's time do not clearly establish precedence. The archive cannot rule on the injunction's validity without further documentation.",
      checkStat="WIS", checkDC=11,
      checkPassFlag="vieC5A5Done",
      activateCond="() => !!S_story.vieC5A4Done",
      takeItem="The Mayor's Sealed Instrument — filed under Legislative Delivery Records at Weimar")

# ─── Cycle 6: The Wager's Record ──────────────────────────────────────────
say("VIE cycle 6 Wager's Record: sealed private compact between guild and magistrate carried to city council vote — source Faust Goethe 1808 — nodes VIE ROM WM — quest chain vie_06_act1 through vie_06_act5 — city ROM Rome Prefect Court Quarter — RME to ROM substitution")

quest("vie_06_act1",
      "The Wager's Record — The Secretary's Commission",
      "The magistrate's secretary is not acting from loyalty to the discredited magistrate. She is acting from the record. The sealed compact between the guild and the magistrate — the agreement to allow harbor pollution in exchange for the magistrate's silence about price-fixing — is signed by both parties. Both are guilty. A partial account is a lie. The city council is voting today.",
      activateNode="VIE",
      passText="The document is correction, not advocacy. Both parties are guilty; the record must show both. You take the commission with that understanding.",
      failText="You take it as advocacy for the secretary or the discredited magistrate. The wrong framing will cost you at the guild's legal checkpoint.",
      checkStat="WIS", checkDC=12,
      checkPassFlag="vieC6A1Done",
      activateCond="() => !!S_story.vieC5A5Done",
      grantItem="The Sealed Compact — signed by the guild and the magistrate; harbor pollution in exchange for silence about price-fixing; the harbor is fouled; illness in the fishing district; the city council votes today")

quest("vie_06_act2",
      "The Wager's Record — The Targeting Error",
      "The guild has a writ applying to the secretary's custody of the document. It does not apply to the Fighter's custody. Recognize the targeting error and walk through without acknowledging the writ's relevance to the current carrier.",
      activateNode="VIE",
      passText="The writ names the secretary. You are not the secretary. You walk through without acknowledging the writ's relevance. The clerk who served it is reading it again, confused.",
      failText="You acknowledge the writ's existence, which implies you might be subject to it. The clerk escalates to a supervisor.",
      checkStat="WIS", checkDC=12,
      checkPassFlag="vieC6A2Done",
      activateCond="() => !!S_story.vieC6A1Done")

quest("vie_06_act3",
      "The Wager's Record — Rome Authentication",
      "A guild legal officer in Rome claims the compact's seals are not the guild's registered marks. Guild members' internal marks are their registered ecclesiastical marks. Equivalence applies. Name it before the guild officer's procedural delay completes and the city council vote is taken without the document in the record.",
      activateNode="ROM",
      passText="Guild internal marks equal ecclesiastical registered marks. Equivalence established. The guild officer cannot dispute his own guild's registration. The compact's seals are authenticated.",
      failText="The guild officer's procedural delay completes. The city council vote is taken without the compact in the record. You are too late for the vote but not for the archive.",
      checkStat="CHA", checkDC=14,
      checkPassFlag="vieC6A3Done",
      activateCond="() => !!S_story.vieC6A2Done",
      monster="Guild Legal Officer ×1", monsterHP=18, monsterAC=12)

quest("vie_06_act4",
      "The Wager's Record — Twelve Minutes",
      "New evidence enters the session record before the vote's final call. The clerk is at the near end of the corridor. Twelve minutes.",
      activateNode="ROM",
      passText="Twelve minutes. The compact enters the session record before the vote's final call. Both parties' culpability is in the record before the vote.",
      failText="Thirteen minutes. The vote was called before the compact entered the record. The archive intake is still available but the vote was taken without it.",
      checkStat="STR", checkDC=11,
      checkPassFlag="vieC6A4Done",
      activateCond="() => !!S_story.vieC6A3Done")

quest("vie_06_act5",
      "The Wager's Record — Private Compact Records",
      "Sweelinck reads both seals and the compact's terms. Both culpable. The vote was taken with this in the record. Private Compact Records opens.",
      activateNode="WM",
      passText="Both seals authentic. Both parties culpable. The compact is now in the permanent archive. Private Compact Records filed alongside the session record that includes it.",
      failText="The authentication of one seal is disputed. The archive cannot file a private compact under Private Compact Records with a disputed authentication.",
      checkStat="WIS", checkDC=11,
      checkPassFlag="vieC6A5Done",
      activateCond="() => !!S_story.vieC6A4Done",
      takeItem="The Sealed Compact — filed under Private Compact Records at Weimar")

# ─── Cycle 7: The Undelivered Release ─────────────────────────────────────
say("VIE cycle 7 Undelivered Release: usurer's will clause releasing all life-debts carried to city court before heir suppresses it — source Faust Goethe 1808 — nodes VIE LDN WM — quest chain vie_07_act1 through vie_07_act5 — FINAL CYCLE questComplete — property questComplete final act")

quest("vie_07_act1",
      "The Undelivered Release — The Notary's Copy",
      "A usurer converted to a religious order two years before his death. His will contains a clause releasing all life-debt contracts held at his death — he wanted his estate clean. His heir has suppressed the will and is collecting the debts anyway: thirty-seven families still bound by contracts the dead man released. The notary who drafted the will has the copy. He cannot bring it to the city court himself — the heir is watching his office.",
      activateNode="VIE",
      passText="The notary is sad and relieved. He is not asking for consolation. You take the document without comment and without making the commission larger than it is.",
      failText="You say something about the injustice. The notary looks at you. He knows. He doesn't need you to explain it. You take the document with unnecessary weight.",
      checkStat="WIS", checkDC=11,
      checkPassFlag="vieC7A1Done",
      activateCond="() => !!S_story.vieC6A5Done",
      grantItem="The Will's Release Clause — the notary's certified copy; names the usurer's conversion; releases all life-debt contracts held at death; thirty-seven families; the heir has suppressed the original")

quest("vie_07_act2",
      "The Undelivered Release — The Eight-Minute Race",
      "The watcher on a fast horse reaches the heir's solicitor in six minutes. The Fighter needs to reach the intake counter before the challenge is filed. Eight minutes at pace.",
      activateNode="VIE",
      passText="Eight minutes at pace. The will's release clause reaches the intake counter before the challenge is filed. The document is in hand before the solicitor arrives.",
      failText="The watcher's horse is faster than you expected. The challenge is filed two minutes before you arrive at intake. The clerk is reading it.",
      checkStat="STR", checkDC=12,
      checkPassFlag="vieC7A2Done",
      activateCond="() => !!S_story.vieC7A1Done")

quest("vie_07_act3",
      "The Undelivered Release — The Solicitor's Framework",
      "The heir's solicitor argues that the contracts are subject to English commercial framework, which supersedes German probate law on debt instruments. German probate law applies to the will's release clause. The contracts/will distinction must be named before the solicitor introduces the second procedural layer.",
      activateNode="LDN",
      passText="English framework applies to the contracts. German probate law applies to the will's release. The release clause is a probate instrument. The solicitor cannot apply commercial framework to a probate clause.",
      failText="The solicitor introduces the second procedural layer before the distinction is established. The argument is correct but delayed by the additional layer.",
      checkStat="CHA", checkDC=13,
      checkPassFlag="vieC7A3Done",
      activateCond="() => !!S_story.vieC7A2Done",
      monster="Heir's Solicitor ×1", monsterHP=17, monsterAC=12)

quest("vie_07_act4",
      "The Undelivered Release — The Civil Nuisance Suit",
      "The heir has filed a civil nuisance suit. It requires a response in ten days. Receiving the notice without treating it as significant is the correct move. Do not slow down.",
      activateNode="LDN",
      passText="The notice received without treating it as significant. You do not slow down. Weimar is ahead.",
      failText="You slow to read the nuisance suit carefully. The delay is minor but the heir's agent notes your reaction and sends word to file additional paperwork.",
      checkStat="CON", checkDC=11,
      checkPassFlag="vieC7A4Done",
      activateCond="() => !!S_story.vieC7A3Done")

quest("vie_07_act5",
      "The Undelivered Release — Testamentary Release Records",
      "Sweelinck reads the third clause and the date: two years ago. He wanted his estate clean. The notary made it binding. The heir buried it. Testamentary Release Records opens. The Faust series is complete.",
      activateNode="WM",
      passText="The third clause: release of all life-debt contracts held at death. The date: two years before his death, during the period of religious conversion. The notary's copy is certified. Thirty-seven families. Testamentary Release Records filed. Faust series complete.",
      failText="The certification of the notary's copy is questioned. The archive cannot file a testamentary release without confirmed certification from the will's drafting notary.",
      checkStat="WIS", checkDC=11,
      checkPassFlag="vieC7A5Done",
      activateCond="() => !!S_story.vieC7A4Done",
      takeItem="The Will's Release Clause — filed under Testamentary Release Records at Weimar",
      questComplete=True)

# ─── Post-import audit ────────────────────────────────────────────────────
say("VIE import complete: post-import audit — Faust Johann Wolfgang von Goethe 1808 — 7 cycles 5 acts 35 quests — nodes VIE Vienna MGR Gretchen's Prison DKN Dominican Court CLK Clerk's Sickroom — checking final node and quest counts")
audit = api("get", "/api/audit")
parse = {p["section"]: p["count"] for p in audit.get("parse", [])}
print(f"Post-import: {parse.get('NODE_MAP')} nodes, {parse.get('QUEST_DB')} quests")
