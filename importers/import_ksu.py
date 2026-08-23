#!/usr/bin/env python3
# SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
# ═══════════════════════════════════════════════════════════════════════════
# ⚠️  ARCHAIC — OUT OF DATE.  Historical one-shot importer (POSTs to the
#     localhost:1367 WBAPI).  Content was long ago imported and lives in
#     index.html.  This script likely NO LONGER RUNS against the current
#     server/schema.  Kept for reference only — do not run without review.
#     Import history: BACKLOG.md / plan-archive.md / 1367-sources/.
# ═══════════════════════════════════════════════════════════════════════════
"""Import KSU — Heimskringla (Snorri Sturluson, c.1230) — 35 acts, 7 cycles."""
import requests, sys

BASE = "http://localhost:1367"

def api(method, path, **kw):
    r = getattr(requests, method)(BASE + path, **kw)
    if r.status_code not in (200, 201):
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
    if checkPassFlag:   payload["checkPassFlag"]    = checkPassFlag
    if activateCond:    payload["activateCond"]     = activateCond
    if activateMissionBit: payload["activateMissionBit"] = activateMissionBit
    if questComplete:   payload["questComplete"]    = True
    if monster:         payload["monster"]          = monster
    if monsterHP:       payload["monsterHP"]        = monsterHP
    if monsterAC:       payload["monsterAC"]        = monsterAC
    if grantItem:       payload["grantItem"]        = grantItem
    if takeItem:        payload["takeItem"]         = takeItem
    api("post", "/api/quest", json=payload, headers={"X-Nonce": nonce})
    print(f"  OK: {id} — {title}")

def main():
    print("Creating KSU nodes...")
    create_node("NID", "city", "Nidaros — Olaf's Shrine City", 1, 79, 118,
        "The Norwegian harbor city of Nidaros (later Trondheim), home of Saint Olaf's tomb. Salt air, timber houses, a cathedral under construction. The Danish governor's compound at the harbor. The bishop's church at the hill's crest. A city becoming a pilgrimage destination against its occupiers' preferences.")
    create_node("ECF", "beach", "Eclipse Farm — Coast North of Stiklestad", 1, 77, 116,
        "A coastal farmstead on a headland north of Stiklestad where no one has visibly lived for twenty years. The man who measured the Stiklestad eclipse against a water-drip waited here three years for someone to come along who already knew why he was hiding.")

    print("\nImporting KSU — Heimskringla (35 acts)...")

    # ── Cycle 1: The First Miracle ──
    quest(
        id="ksu_01_act1", title="The First Miracle — The Bishop's Seal",
        activateNode="NID",
        desc="The sacristy smells of beeswax and incense. Bishop Grimkell is at the table with the document in front of him, the wax of his ring-seal cooling. Thorir Hundr's hand was healed when he wiped Olaf's blood from his spear. The document records the attestation. It must reach the Danish governor's hall before the governor decides how to handle this without the bishop's record being part of it.",
        checkStat="WIS", checkDC=12,
        passText="You understand: the document is the argument, you are the argument's carrier, and the carrier must not be someone the governor can dismiss as a church agent. You take it. You receive The First Miracle Document — Bishop Grimkell's authentication, Thorir Hundr's attestation, sealed with the episcopal ring.",
        failText="The weight of what he is describing is not small. You ask him to say it again, more directly. He does. The second time is clearer.",
        checkPassFlag="ksuC1A1Done",
        activateMissionBit="ksu_questActive",
    )
    quest(
        id="ksu_01_act2", title="The First Miracle — The Harbor Watch",
        activateNode="NID", activateCond="() => !!S_story.ksuC1A1Done",
        desc="The Danish marshal's men are at the quay, checking travelers from the church district. The harbor is busy — fish boats, merchant vessels, an ordinary morning — but the checkpoint is slow. They are looking for clerical dress and faces they know from the bishop's household. You are neither.",
        checkStat="CHA", checkDC=14,
        passText="The checkpoint waves you through. A clay token is pressed for cleared travelers — proof of passage.",
        failText="One of the marshal's men is looking at the shape of the document in your coat. He steps forward. You find the line between honest and revealing — something true about who you are that is not about what you're carrying.",
        checkPassFlag="ksuC1A2Done",
    )
    quest(
        id="ksu_01_act3", title="The First Miracle — The Governor's Gate",
        activateNode="NID", activateCond="() => !!S_story.ksuC1A2Done",
        desc="The governor's gate clerk reads faces for a living. He says the governor is not receiving informal visitors this morning. He names a process that takes three days. He does not explain why three days. The document needs to be in the governor's hand today, before the governor learns of Thorir's healing through other channels.",
        checkStat="CHA", checkDC=14,
        monster="Gate Guard", monsterHP=22, monsterAC=13,
        passText="The clerk opens the gate. The guard behind him acts on the marshal's standing orders. When it resolves, the clerk writes a passage-note — his written record of your admission, his own protection if this goes badly for him.",
        failText="The clerk shakes his head. He begins explaining the process again. You find the argument he cannot dismiss: not about what the document says, but about what the process costs the governor if he is seen to have delayed it.",
        checkPassFlag="ksuC1A3Done",
    )
    quest(
        id="ksu_01_act4", title="The First Miracle — The Ante-Chamber",
        activateNode="NID", activateCond="() => !!S_story.ksuC1A3Done",
        desc="Two Danish officials are at the side table. One stands when he sees the bishop's seal. He says the governor's position on stories about the late king is that they should go through appropriate channels. He is reaching for the document with the manner of a man who has been asked to make things tidy before they reach the governor.",
        checkStat="CHA", checkDC=14,
        passText="He stops reaching. He sits down. He waves you through to the inner door with the gesture of someone who has decided this is not his problem. A small ivory counter falls from the table when he sits — you pocket it without thinking.",
        failText="He steps closer. His argument is entirely procedural and entirely wrong. You find the one procedural argument that outranks his: the bishop's seal makes this the governor's correspondence, and intercepting it is the kind of thing that bishops record.",
        checkPassFlag="ksuC1A4Done",
    )
    quest(
        id="ksu_01_act5", title="The First Miracle — The Governor's Hall",
        activateNode="NID", activateCond="() => !!S_story.ksuC1A4Done",
        desc="The governor reads the document at his table. He is not a stupid man or a cruel one. He reads Thorir Hundr's name, reads the attestation, reads the bishop's careful language about the condition of the hand. His officials are watching his face. He sets the document down and looks at the wall above your head for a long time.",
        checkStat="CON", checkDC=12,
        passText="He orders the document copied and filed. He does not suppress it. He does not acknowledge it. He does the minimum thing the document required and then looks away. His clerk brings the filed receipt — the stamp on the copy, proof the document was received and recorded, the small act that makes everything harder to reverse.",
        failText="The silence in the hall is designed to make messengers leave. You wait it out. He is not going to ask you to leave; that would mean making a decision. You wait.",
        checkPassFlag="ksuC1A5Done",
        activateMissionBit="ksu_C1_complete",
    )

    # ── Cycle 2: The Eclipse Witness ──
    quest(
        id="ksu_02_act1", title="The Eclipse Witness — The Farm",
        activateNode="ECF", activateCond="() => !!S_story.ksuC1A5Done",
        desc="The farm is on a coastal headland. No one has lived here visibly for twenty years. The man who opened the door was waiting for someone who already knows why he is here. He measured the eclipse against a water-drip because that was what was in his hands — not because he was preparing testimony. Two other men who saw it beside him have since disappeared.",
        checkStat="WIS", checkDC=12,
        passText="You understand: the measurement is exact because it is accidental. No partisan could construct an accidental water-drip count. You explain this. He nods once and says to fetch the scribe.",
        failText="He talks. You understand the event but not why he has survived three years of staying quiet. The dictation session runs long.",
        checkPassFlag="ksuC2A1Done",
        activateMissionBit="ksu_C2_active",
    )
    quest(
        id="ksu_02_act2", title="The Eclipse Witness — The Dictation",
        activateNode="ECF", activateCond="() => !!S_story.ksuC2A1Done",
        desc="The scribe writes exactly what the witness says: date, sun's angle, duration (four minutes and seven seconds against a thirty-second drip, thirteen repetitions), precise sequence against the spear-strike, names of two missing witnesses. He reads it back. Three corrections. Then the wax is ready. The seal is when the witness stops being a hiding man and becomes a witness of record.",
        checkStat="CHA", checkDC=12,
        passText="He nods at the scribe. The wax drips. The seal is pressed. The deposition exists. You receive it warm from the scribe's table. It weighs almost nothing.",
        failText="He asks for one more revision that changes nothing substantive but costs an hour you did not have.",
        checkPassFlag="ksuC2A2Done",
    )
    quest(
        id="ksu_02_act3", title="The Eclipse Witness — The Road-Watch",
        activateNode="ECF", activateCond="() => !!S_story.ksuC2A2Done",
        desc="Three Danish marshal's men stop travelers with church documents at the road crossing. The deposition is the middle document in a letter-case between two farm-transfer records. Whether they read all three documents is a matter of what kind of traveler they think you are.",
        checkStat="CHA", checkDC=13,
        passText="The first man reads the first document, notes the farm name, looks at you, looks at the letter-case, and waves you through. The second and third are looking at something behind you. You walk south.",
        failText="They read all three documents. The sealed deposition is confiscated. You spend time recovering it — or you arrive at Nidaros without it.",
        checkPassFlag="ksuC2A3Done",
    )
    quest(
        id="ksu_02_act4", title="The Eclipse Witness — The Harbor",
        activateNode="NID", activateCond="() => !!S_story.ksuC2A3Done",
        desc="The Danish governor's harbor-watch has specific orders about people arriving from the coast road. These two are not reading documents — they are stopping people for questioning. Once in the questioning room, nothing is delivered to the bishop this morning. Both men move when they see you coming from the coast road gate.",
        checkStat="STR", checkDC=13,
        monster="Danish Harbor-Watch", monsterHP=24, monsterAC=13,
        passText="Both men down. You have approximately four minutes before someone senior notices. The bishop's house is two streets from the harbor.",
        failText="You are taken to the questioning room. The letter-case is opened. The deposition is found. You argue for its return before it can be destroyed.",
        checkPassFlag="ksuC2A4Done",
    )
    quest(
        id="ksu_02_act5", title="The Eclipse Witness — The Bishop's House",
        activateNode="NID", activateCond="() => !!S_story.ksuC2A4Done",
        desc="The bishop reads the deposition twice. He sets it down. 'Where is this man now.' You know where. You will not say. The bishop is intelligent and his assistants listen. The deposition is complete. The location is not part of it.",
        checkStat="CON", checkDC=11,
        passText="You look at the bishop. You say nothing. He holds the expression for another moment, then looks at the deposition. He carries it to the cabinet of authenticated reports. He closes the cabinet. 'Four minutes and seven seconds,' he says. 'Against a water-drip.' He does not ask again. He holds out a ring.",
        failText="You say something that implies a direction without naming a farm. The bishop is intelligent. By tomorrow his assistant will have inferred the headland.",
        checkPassFlag="ksuC2A5Done",
        activateMissionBit="ksu_C2_complete",
    )

    # ── Cycle 3: The Incorrupt Body ──
    quest(
        id="ksu_03_act1", title="The Incorrupt Body — The Coastal Route",
        activateNode="NID", activateCond="() => !!S_story.ksuC2A5Done",
        desc="Bishop Grimkell's authenticated account of the exhumation must reach the church at Birka before the Danish governor's competing account closes the question. The governor's version has already gone west by fast rider on the main road. The coastal fishing route bypasses the road-watch and arrives first — if you understand the route before accepting the document.",
        checkStat="WIS", checkDC=11,
        passText="You understand the route and its timing. The coastal fishing boats run daily. The authenticated record travels by sea while the governor's rider takes the land road. You accept the document.",
        failText="You misread the timing and take the land route first. You lose half a day before the boat route becomes clear.",
        checkPassFlag="ksuC3A1Done",
        activateMissionBit="ksu_C3_active",
    )
    quest(
        id="ksu_03_act2", title="The Incorrupt Body — The Coastal Transit",
        activateNode="NID", activateCond="() => !!S_story.ksuC3A1Done",
        desc="Coastal transit by fishing boat: cold northern water, rough passage, the authenticated record in oilskin. The governor's administrative account closes the question at Birka's church when the Danish rider arrives. The boat route is faster but unforgiving in bad weather.",
        checkStat="STR", checkDC=12,
        passText="The passage is rough but the boat is fast. You arrive at Birka's harbor with the authenticated record intact and the governor's rider not yet visible on the road.",
        failText="The passage is rougher than expected. You arrive at Birka with the record intact but with less lead time than planned.",
        checkPassFlag="ksuC3A2Done",
    )
    quest(
        id="ksu_03_act3", title="The Incorrupt Body — The Church Door",
        activateNode="BK", activateCond="() => !!S_story.ksuC3A2Done",
        desc="The governor's messenger is at the church door with the administrative account claiming ordinary decomposition. Bishop Grimkell's authenticated record — three countersignatures, bishop's seal, the body's condition in precise detail — supersedes the administrative one. The authenticated episcopal record takes precedence over a civil administrator's account in a matter of sanctity.",
        checkStat="CHA", checkDC=13,
        monster="Governor's Messenger with Guard", monsterHP=20, monsterAC=12,
        passText="You name the precedence and hold the door. The church records Grimkell's authenticated account. The governor's version is noted as received but not primary.",
        failText="The messenger's guard moves to block the door. You hold your ground. The precedence argument succeeds with the church official watching.",
        checkPassFlag="ksuC3A3Done",
    )
    quest(
        id="ksu_03_act4", title="The Incorrupt Body — The Road Scholar",
        activateNode="BK", activateCond="() => !!S_story.ksuC3A3Done",
        desc="A scholar on the road to Weimar is quoting the governor's version of the exhumation as the definitive account — standard decomposition, nothing unusual. He has a copy of the administrative record and has been citing it at every inn. The authenticated bishop's record is the response. Argument on a road is not the response.",
        checkStat="CON", checkDC=12,
        passText="You do not debate the body's condition with a scholar on a road. The authenticated record is the response, not argument. You show him Grimkell's seal and continue walking.",
        failText="You begin a debate about decomposition timelines. It runs twenty minutes. The scholar is not unconvinced but the road does not get shorter.",
        checkPassFlag="ksuC3A4Done",
    )
    quest(
        id="ksu_03_act5", title="The Incorrupt Body — Exhumation Records",
        activateNode="WM", activateCond="() => !!S_story.ksuC3A4Done",
        desc="Sweelinck reads both accounts side by side: Grimkell's authenticated record and the governor's administrative claim. He opens a new section: Exhumation Records — The Body That Did Not Decay.",
        checkStat="WIS", checkDC=10,
        passText="'The body was the testimony,' he says. 'The governor's version required it to be ordinary. Grimkell's version required it to be extraordinary. The body was present at both depositions and did not change.' He files both. The record holds both because the argument is part of the history.",
        failText="Sweelinck reads both documents carefully. He files Grimkell's as primary. He files the governor's as contested secondary. Exhumation Records opens.",
        checkPassFlag="ksuC3A5Done",
        activateMissionBit="ksu_C3_complete",
    )

    # ── Cycle 4: The Sealed Relic ──
    quest(
        id="ksu_04_act1", title="The Sealed Relic — The Commission",
        activateNode="NID", activateCond="() => !!S_story.ksuC3A5Done",
        desc="A sealed reliquary box — a corner of Olaf's battle-cloak, cut from the body at the exhumation and sealed in a reliquary by Grimkell — is being sent east to Yaroslav in Kiev. The seals are part of the authentication: breaking them for inspection voids the provenance. The Danish Baltic checkpoint will ask to inspect. Understand this before the checkpoint.",
        checkStat="WIS", checkDC=11,
        passText="You understand: the reliquary's seals are the argument for its authenticity. Breaking them for inspection voids the provenance. The inspection refusal is the correct answer at the Baltic checkpoint.",
        failText="You consider opening the reliquary to show the cloak corner. You reconsider — broken seals at the Danish checkpoint would mean starting the provenance chain over from Nidaros.",
        checkPassFlag="ksuC4A1Done",
        activateMissionBit="ksu_C4_active",
    )
    quest(
        id="ksu_04_act2", title="The Sealed Relic — The Baltic Checkpoint",
        activateNode="NID", activateCond="() => !!S_story.ksuC4A1Done",
        desc="A Danish Baltic trade inspector knows what sealed reliquaries from Nidaros look like. He has seen three in the past month and knows what they are for. The reliquary in your cargo must be personal cargo of a merchant — not a religious commission — or it will be held for documentation. The seals remain on the reliquary throughout.",
        checkStat="CHA", checkDC=12,
        passText="The reliquary is merchant's personal cargo, not a religious commission. He looks at it for a moment longer than comfortable, then stamps the cargo record and waves you through.",
        failText="He identifies the reliquary's design as Nidaros episcopal manufacture. You hold the description until he stops looking — it is personal cargo, unconditionally.",
        checkPassFlag="ksuC4A2Done",
    )
    quest(
        id="ksu_04_act3", title="The Sealed Relic — The Relic Broker at Venice",
        activateNode="VEN", activateCond="() => !!S_story.ksuC4A2Done",
        desc="A relic broker at Venice wants the corner of the cloak before it reaches its commission destination. He has Yaroslav's route mapped and arrived before you did. He knows what the reliquary contains. His agents are at the dock where the Rus merchant transfer is supposed to happen.",
        checkStat="CON", checkDC=12,
        monster="Relic Broker's Dock Agent", monsterHP=18, monsterAC=11,
        passText="The reliquary is not for sale and not negotiable. You hold the dock. The Rus merchant transfer proceeds with the seals intact.",
        failText="The broker's agents press from both sides. The reliquary does not change hands. You hold the dock until the transfer can proceed.",
        checkPassFlag="ksuC4A3Done",
    )
    quest(
        id="ksu_04_act4", title="The Sealed Relic — The Transfer Problem",
        activateNode="VEN", activateCond="() => !!S_story.ksuC4A3Done",
        desc="The Rus merchant who was supposed to receive the reliquary has been detained on a debt claim. The reliquary needs a church intermediary with documentation valid at Yaroslav's court. There is one contact in Venice whose provenance Yaroslav will recognize — a Greek monastic representative who has traded with the Rus court.",
        checkStat="WIS", checkDC=12,
        passText="You identify the Greek monastic representative and arrange the transfer with documentation that Yaroslav's court will authenticate. The chain of custody is intact.",
        failText="You try two other contacts first. The Greek monastic representative was the right choice. The transfer proceeds with one additional day's delay.",
        checkPassFlag="ksuC4A4Done",
    )
    quest(
        id="ksu_04_act5", title="The Sealed Relic — Relic Transit Records",
        activateNode="WM", activateCond="() => !!S_story.ksuC4A4Done",
        desc="Sweelinck receives the transit record. The reliquary went east. He opens a new section: Relic Transit Records — The Corner of the Battle-Cloak Sent East.",
        checkStat="WIS", checkDC=10,
        passText="'The chain of custody is the argument,' he says. 'The cloak was at the body. The body was at Stiklestad. The corner is on its way to Yaroslav. The archive holds the link between Stiklestad and the eastern acknowledgment.' He files the transit record.",
        failText="Sweelinck reviews the chain of custody documentation. The Greek monastic transfer is noted. Relic Transit Records opens.",
        checkPassFlag="ksuC4A5Done",
        activateMissionBit="ksu_C4_complete",
    )

    # ── Cycle 5: The Canonization Document ──
    quest(
        id="ksu_05_act1", title="The Canonization Document — The Commission",
        activateNode="NID", activateCond="() => !!S_story.ksuC4A5Done",
        desc="Grimkell's formal petition to Rome: seven authenticated miracles, legal basis for local canonization, cover letter addressing the Greek jurisdictional objection. The Greek bishop's letter of objection is folded inside. Both documents travel together. The Greek secretary wants the letter of objection back — his bishop has changed his position.",
        checkStat="WIS", checkDC=12,
        passText="You understand: the petition is stronger with the Greek objection than without it. An argument that excludes the counter-claim is weaker than one that addresses it. You accept the commission with both documents inside.",
        failText="You consider removing the Greek objection to streamline the petition. The bishop explains why that would weaken it. An argument that excludes the counter-claim loses to one that answers it.",
        checkPassFlag="ksuC5A1Done",
        activateMissionBit="ksu_C5_active",
    )
    quest(
        id="ksu_05_act2", title="The Canonization Document — The Baltic Checkpoint",
        activateNode="NID", activateCond="() => !!S_story.ksuC5A1Done",
        desc="At the Danish Baltic checkpoint, a petition addressed to Rome on church jurisdictional grounds is not under Danish administrative jurisdiction. The checkpoint officer is uncertain about this but knows he should be. Name the correct authority before he writes to his superior and the delay runs three days.",
        checkStat="CHA", checkDC=12,
        passText="You name the correct authority: a petition addressed from an episcopal see to Rome is under ecclesiastical jurisdiction, not Danish civil administration. He stamps the cargo record and waves you through before his superior is consulted.",
        failText="He is not satisfied with your first answer. You name the authority more precisely on the second attempt. He passes the petition through before the superior letter can be written.",
        checkPassFlag="ksuC5A2Done",
    )
    quest(
        id="ksu_05_act3", title="The Canonization Document — The Greek Secretary",
        activateNode="CON", activateCond="() => !!S_story.ksuC5A2Done",
        desc="The Greek bishop has changed his position and his secretary arrives at Constantinople with a formal recovery request for the letter of objection. The letter's earlier position — the objection as filed — is more valuable to the historical record than the bishop's revised position. The secretary has documentation authorizing the recall.",
        checkStat="WIS", checkDC=13,
        monster="Greek Secretary's Guard", monsterHP=18, monsterAC=12,
        passText="You hold the letter through the formal request. The Greek bishop's earlier position is the one that belongs in the record; revised positions belong in a separate submission. The secretary's documentation does not override Grimkell's commission.",
        failText="The secretary's guards press the issue. You hold the commission's terms: Grimkell's petition and the enclosed objection travel together. The revised position can be submitted separately.",
        checkPassFlag="ksuC5A3Done",
    )
    quest(
        id="ksu_05_act4", title="The Canonization Document — The Road Theologian",
        activateNode="CON", activateCond="() => !!S_story.ksuC5A3Done",
        desc="A Danish theologian on the road north from Constantinople argues that the canonization is politically motivated — a Norwegian king conveniently becoming a saint to embarrass Danish governance. The petition is addressed to Rome, not to road theologians. The archive is not the place to debate political motivations.",
        checkStat="CON", checkDC=11,
        passText="You say nothing that requires a reply and continue walking. The petition is for Rome. The road theologian's argument is for someone with time to stand in a road.",
        failText="You engage with one element of the argument. It takes fifteen minutes. You walk away with the petition unchanged and the road theologian satisfied with having talked.",
        checkPassFlag="ksuC5A4Done",
    )
    quest(
        id="ksu_05_act5", title="The Canonization Document — Canonization Records",
        activateNode="WM", activateCond="() => !!S_story.ksuC5A4Done",
        desc="Sweelinck reads Grimkell's petition and the Greek bishop's letter of objection. He reads both carefully. He opens a new section: Canonization Records — The Petition and the Objection Filed Together.",
        checkStat="WIS", checkDC=10,
        passText="'The Greek bishop objected. The Norse bishop petitioned. Both are in the record.' He files both. 'The archive holds the argument because the argument is the history.' He closes the section.",
        failText="Sweelinck reviews both documents. He notes the Greek bishop's subsequently changed position and the decision to file the original objection. Canonization Records opens.",
        checkPassFlag="ksuC5A5Done",
        activateMissionBit="ksu_C5_complete",
    )

    # ── Cycle 6: The Incorrupt Hair ──
    quest(
        id="ksu_06_act1", title="The Incorrupt Hair — The Personal Commission",
        activateNode="NID", activateCond="() => !!S_story.ksuC5A5Done",
        desc="A lock of Olaf's incorrupt hair in beeswax, cut at the exhumation and sealed by Grimkell, is being sent to Harald Hardrada at Rome — not to his official Varangian capacity but personally, as a half-brother who was fifteen at Stiklestad. Harald is in Rome for two days. After that he goes east with the Guard and cannot be reached.",
        checkStat="WIS", checkDC=11,
        passText="You understand the distinction: Harald receives this as a half-brother, not as a Varangian officer. The Guard will not admit a stranger to their commander unless the carrier distinguishes between the two capacities. You prepare to name the commission correctly.",
        failText="You approach this as an official delivery to the Varangian Guard. The Guard's security protocols reject unofficial commissions. You reconsider the framing.",
        checkPassFlag="ksuC6A1Done",
        activateMissionBit="ksu_C6_active",
    )
    quest(
        id="ksu_06_act2", title="The Incorrupt Hair — The Road to Rome",
        activateNode="NID", activateCond="() => !!S_story.ksuC6A1Done",
        desc="Harald is in Rome for two days. The fastest available route still requires pushing. The Varangian Guard packs up precisely at the second day's end — they do not wait. You need to reach Rome before the second day ends.",
        checkStat="STR", checkDC=12,
        passText="You reach Rome before the second day ends. The Guard's camp is still pitched. Harald has not yet given the order to break.",
        failText="The road delays are real. You arrive on the second day's morning with less time than planned but enough. The Guard is still there.",
        checkPassFlag="ksuC6A2Done",
    )
    quest(
        id="ksu_06_act3", title="The Incorrupt Hair — The Varangian Guards",
        activateNode="ROM", activateCond="() => !!S_story.ksuC6A2Done",
        desc="The Varangian guards do not admit strangers to their commander. They are trained to notice people who are too eager and to be unmoved by urgency. This is a private delivery from Bishop Grimkell for Harald personally — not an audience request, not an official commission to the Varangian command. Name the commission and stand still.",
        checkStat="CHA", checkDC=13,
        monster="Varangian Guard", monsterHP=22, monsterAC=14,
        passText="You name the commission clearly and stand still. Varangian guards are trained to notice eagerness; stillness is the correct behavior. They admit you.",
        failText="The guard reads your urgency as suspicious. You find the correct stillness on the second approach. They admit you.",
        checkPassFlag="ksuC6A3Done",
    )
    quest(
        id="ksu_06_act4", title="The Incorrupt Hair — The Relic Broker's Inquiry",
        activateNode="ROM", activateCond="() => !!S_story.ksuC6A3Done",
        desc="An Italian relic broker in Rome has learned that Harald Hardrada received something from Nidaros and wants to know what it was. Harald has already left for the eastern road. The transaction was private. The information is not available.",
        checkStat="CON", checkDC=11,
        passText="You say so once and walk. The broker asks a follow-up question to your back. You do not slow down.",
        failText="You give the broker one piece of information — not about what Harald received, but about who sent it. He nods and lets you go. It was more than you should have said.",
        checkPassFlag="ksuC6A4Done",
    )
    quest(
        id="ksu_06_act5", title="The Incorrupt Hair — Physical Relic Records",
        activateNode="WM", activateCond="() => !!S_story.ksuC6A4Done",
        desc="Sweelinck receives the transit record. Not the lock of hair itself — Harald kept it. The record is of the commission, the delivery, and the recipient. He opens a new section: Physical Relic Records — The Lock That Harald Hardrada Carried East.",
        checkStat="WIS", checkDC=10,
        passText="'Harald was at Stiklestad,' he says. 'He was fifteen. He survived. He received a lock of his half-brother's hair sealed in beeswax and carried it east with the Varangian Guard.' He closes the section. 'What he did with it afterward is not in this archive.'",
        failText="Sweelinck files the transit record. The commission, the delivery, the recipient. Physical Relic Records opens.",
        checkPassFlag="ksuC6A5Done",
        activateMissionBit="ksu_C6_complete",
    )

    # ── Cycle 7: Sigvat's Lament ──
    quest(
        id="ksu_07_act1", title="Sigvat's Lament — The Reconstruction",
        activateNode="NID", activateCond="() => !!S_story.ksuC6A5Done",
        desc="A vellum copy of Sigvat's Erfidrápa Óláfs helga — the full elegy for King Olaf, composed by his personal skald from survivors' accounts — is in a Norwegian merchant's keeping at London. One stanza names names. Cnut's court wants this copy destroyed before it circulates into English church circles. Sigvat was not at Stiklestad. The poem is a reconstruction. Its value is that it names what a witness account would have named.",
        checkStat="WIS", checkDC=11,
        passText="You understand: Sigvat was not there. The poem says that. Its value is not testimony — it is that it names what a witness account would have named. You carry this understanding into Cnut's London.",
        failText="You treat the elegy as an eyewitness account. The distinction matters at London — a reconstruction that claims witness authority is vulnerable; one that acknowledges reconstruction is not.",
        checkPassFlag="ksuC7A1Done",
        activateMissionBit="ksu_C7_active",
    )
    quest(
        id="ksu_07_act2", title="Sigvat's Lament — The North Sea Crossing",
        activateNode="NID", activateCond="() => !!S_story.ksuC7A1Done",
        desc="North Sea crossing on a Danish merchant ship. The declared cargo is a scholar's courier commission. The Danish sailors do not need to know the vellum concerns a Norwegian elegy about a battle their king won. Be a scholar's agent.",
        checkStat="CHA", checkDC=12,
        passText="The Danish sailors take no interest in a scholar's papers. The vellum travels in a scholar's document case. You arrive at the London merchant's house before the court's men locate the copy.",
        failText="A sailor asks about the document case. You give an answer that is true and uninteresting and he loses interest. The crossing completes without incident.",
        checkPassFlag="ksuC7A2Done",
    )
    quest(
        id="ksu_07_act3", title="Sigvat's Lament — The Court's Men",
        activateNode="LDN", activateCond="() => !!S_story.ksuC7A2Done",
        desc="Cnut's court men have located the copy at the merchant's house and arrived first. They are not there to arrest anyone — they are there to collect paper. They have the vellum in hand and are preparing to leave the merchant's house.",
        checkStat="CON", checkDC=13,
        monster="Danish Court Guard", monsterHP=20, monsterAC=12,
        passText="Both men down. You have the vellum. The merchant watches from the doorway with the expression of someone who made the correct decision in giving you the address.",
        failText="The court men move to block you. The vellum is still in the first man's hand. You recover it before they reach the door.",
        checkPassFlag="ksuC7A3Done",
    )
    quest(
        id="ksu_07_act4", title="Sigvat's Lament — The Named Party's Agent",
        activateNode="LDN", activateCond="() => !!S_story.ksuC7A3Done",
        desc="A named party's agent intercepts the Fighter on the road out of London. His principal is named in the stanza that calls them a battle-collaborator. He does not want his name in a document that reaches the English church. He is not wrong about what the stanza implies. He is wrong about what destroying this copy would accomplish.",
        checkStat="CHA", checkDC=13,
        passText="You explain once: the poem is filed with Sigvat; destroying this copy changes nothing. The archive is the response to suppression, not the instrument of accusation. He hears this and steps aside. He knows you are right.",
        failText="He pushes the argument further. You explain a second time, more specifically: Sigvat kept the original; the archive's copy documents the suppression attempt as much as the poem. He steps aside.",
        checkPassFlag="ksuC7A4Done",
    )
    quest(
        id="ksu_07_act5", title="Sigvat's Lament — Skaldic Memorial Records",
        activateNode="WM", activateCond="() => !!S_story.ksuC7A4Done",
        desc="Sweelinck reads the elegy. He reads the one stanza twice. He sets it down. He opens the final section of the Heimskringla series: Skaldic Memorial Records — The Elegy That Arrived Before the Suppression.",
        checkStat="WIS", checkDC=10,
        passText="'Sigvat was not there,' he says. 'He arrived after. He wrote the poem from what survivors told him. The poem is not a witness account. It is a reconstruction that names what a witness account would have named. That is its value and its danger.' He files the elegy. 'Both are in the archive now.' The Heimskringla series is complete.",
        failText="Sweelinck reads the elegy carefully. He notes the stanza. He files the record. Skaldic Memorial Records opens. The Heimskringla series is complete.",
        checkPassFlag="ksuC7A5Done",
        activateMissionBit="ksu_C7_complete",
        questComplete=True,
    )

    print("\nAll 35 acts imported. Running audit...")
    audit = api("get", "/api/audit")
    errors = audit.get("errors", [])
    if errors:
        print(f"AUDIT ERRORS: {errors}")
    else:
        parse = {p["section"]: p["count"] for p in audit.get("parse", [])}
        print(f"Audit clean. Nodes: {parse.get('NODE_MAP','?')}, Quests: {parse.get('QUEST_DB','?')}")

if __name__ == "__main__":
    main()
