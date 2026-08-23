#!/usr/bin/env python3
# SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
# ═══════════════════════════════════════════════════════════════════════════
# ⚠️  ARCHAIC — OUT OF DATE.  Historical one-shot importer (POSTs to the
#     localhost:1367 WBAPI).  Content was long ago imported and lives in
#     index.html.  This script likely NO LONGER RUNS against the current
#     server/schema.  Kept for reference only — do not run without review.
#     Import history: BACKLOG.md / plan-archive.md / 1367-sources/.
# ═══════════════════════════════════════════════════════════════════════════
"""Import BHD — Cuchulain of Muirthemne (Lady Gregory, 1902) — 7 cycles × 5 acts = 35 quests"""
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

# Note: BHD already exists as Camelot node — cycle 1 uses EMR (Emain Macha) instead
quests = [
    # ── Cycle 1 — Fergus's Cloak (all at EMR; BHD collision) ─────────────────
    {
        "id": "bhd_01_act1",
        "title": "Fergus's Cloak — The Dockside",
        "type": "skill_check",
        "activateNode": "EMR",
        "checkStat": "CHA", "checkDC": 12,
        "desc": "A Scottish harbor at grey dawn. The boat is loaded and waiting. Fergus has placed his red war-cloak over Naoise's shoulders and put the column in your care. Deirdre stands with her back to the water, singing something under her breath in Irish. She will not board until she has spoken her lament for Scotland — every glen, every tree she is leaving. The tide window is closing.",
        "passText": "She nods once, speaks the last line quietly to herself, and boards. As she passes you she touches Fergus's cloak on Naoise's shoulders — briefly, the way you touch something you are afraid to hold. The boat pushes off. You receive Fergus's Cloak.",
        "failText": "She takes the full lament. The tide goes. You cross in afternoon chop instead of morning calm, arriving on the Irish coast in darkness. Naoise looks at you with eyes that do not blame you. Deirdre does not look at you at all.",
        "checkPassFlag": "bhdC1A1Done",
    },
    {
        "id": "bhd_01_act2",
        "title": "Fergus's Cloak — The Crossing",
        "type": "skill_check",
        "activateNode": "EMR",
        "checkStat": "WIS", "checkDC": 13,
        "activateCond": "() => !!S_story.bhdC1A1Done",
        "desc": "The channel is grey and pitching. Deirdre stands at the stern singing her lament for Scotland. The cloak on Naoise's shoulders is dark with spray. A squall is building to the west, and the sailors want to put in at a sheltered cove — adding a full day to the crossing, one more day Conchubar can use. Read the weather and hold the course.",
        "passText": "You find the gap in the squall and take it. The crossing is fast and violent and the cloak is ruined with spray, but you land before dark with everything intact. Deirdre presses her amber pin into your hand without explanation. You receive Deirdre's Amber Pin.",
        "failText": "You call for shelter. The squall hits harder than expected; a chest of the brothers' weapons goes over the rail. They reach the Irish coast a full day behind. Deirdre says: 'I would have pressed through.' She says it without accusation, which is worse.",
        "checkPassFlag": "bhdC1A2Done",
    },
    {
        "id": "bhd_01_act3",
        "title": "Fergus's Cloak — The Feast of Borrach",
        "type": "skill_check",
        "activateNode": "EMR",
        "checkStat": "WIS", "checkDC": 14,
        "activateCond": "() => !!S_story.bhdC1A2Done",
        "desc": "Borrach's hall is warm and smells of roast meat. Fergus stands in the doorway watching a mechanism engage that he cannot stop — he cannot refuse this feast; his geis will not let him. Ride ahead to Emain Macha and read the hall: is Conchubar's welcome genuine or a killing-ground staged as a homecoming?",
        "passText": "The hall is armed for the wrong occasion — warriors at feast in hauberks, Eógan mac Durthacht at Conchubar's right hand. You ride back fast. Fergus gives you his son Illan to lead the column. Illan hands you his shield clasp as a sign of his bond. You receive Illan's Shield Clasp.",
        "failText": "Emain Macha looks like any king's court preparing a feast. You see nothing wrong. You return and report: all seems well. Naoise thanks you. Deirdre is already looking at the fire.",
        "checkPassFlag": "bhdC1A3Done",
    },
    {
        "id": "bhd_01_act4",
        "title": "Fergus's Cloak — Emain Macha",
        "type": "skill_check",
        "activateNode": "EMR",
        "checkStat": "STR", "checkDC": 14,
        "activateCond": "() => !!S_story.bhdC1A3Done",
        "desc": "The hall at Emain Macha is wrong from the first step inside — armed men where guests should sit, Eógan mac Durthacht stepping forward with the expression of a man who has been rehearsing this for years. Deirdre's eyes are already closed. Eógan takes Fergus's cloak from Naoise's shoulders. The hall erupts. Hold the door to the yard open long enough for the brothers to reach open ground.",
        "passText": "You hold the door long enough. The brothers fall in the open air. Deirdre kneels beside Naoise and places Fergus's cloak in your hands: 'Tell Fergus his word was kept. It was Conchubar's that broke.' You receive Deirdre's Last Word.",
        "failText": "You are driven from the door. The brothers fall inside the hall. You find the cloak on the stone floor after, in the blood, and take it without anyone giving it to you.",
        "checkPassFlag": "bhdC1A4Done",
    },
    {
        "id": "bhd_01_act5",
        "title": "Fergus's Cloak — Borrach's Fire",
        "type": "skill_check",
        "activateNode": "EMR",
        "checkStat": "CHA", "checkDC": 12,
        "activateCond": "() => !!S_story.bhdC1A4Done",
        "desc": "Borrach's hall is still lit and loud. Fergus sits apart from the feast with a full, untouched cup, watching the door with a face that is already beyond surprise. He sees you. He sees what you are carrying. Deliver Deirdre's last words exactly as she spoke them — his word was kept; it was Conchubar's that broke. Not with your own grief in the way.",
        "passText": "You say it exactly. Fergus closes his eyes for a count of three. Then he puts the cloak into the fire and watches until it is ash. He pulls his war-ring from his finger and holds it out to you. Three thousand men walk out of Ulster that night. You receive Fergus's War-Ring.",
        "failText": "Your voice breaks on her name. Fergus takes the cloak from your hands in silence, burns it without speaking. Something of what she meant is lost in the gap between what you said and what she said.",
        "checkPassFlag": "bhdC1A5Done",
    },

    # ── Cycle 2 — The Standing Stone (PSU → ULC) ─────────────────────────────
    {
        "id": "bhd_02_act1",
        "title": "The Standing Stone — The Stone, Midday",
        "type": "skill_check",
        "activateNode": "PSU",
        "checkStat": "WIS", "checkDC": 12,
        "activateCond": "() => !!S_story.bhdC1A5Done",
        "desc": "A single grey standing stone rises from flat Ulster plain. Cuchulain is lashed to it with his own belt, past healing, his eyes on the eastern treeline where Lugaid has been waiting since dawn. He gives you the commission: hold the perimeter, do not fight, do not stand in front of him. When the raven lands and Lugaid comes, take the sword north to Emain Macha. Understand the scope exactly.",
        "passText": "You take position at the stone's base. He nods once. The sword at his belt catches the afternoon light and you understand what you will be carrying north when this is done.",
        "failText": "You take a protective position in front of the stone — between him and the field — and he corrects you. 'Not there. At the base. You are not my shield.' You find the right position, but you have already shown him that you heard it wrong.",
        "checkPassFlag": "bhdC2A1Done",
    },
    {
        "id": "bhd_02_act2",
        "title": "The Standing Stone — The Long Afternoon",
        "type": "skill_check",
        "activateNode": "PSU",
        "checkStat": "CON", "checkDC": 12,
        "activateCond": "() => !!S_story.bhdC2A1Done",
        "desc": "Three hours at the stone's base. The sun moves. Figures appear at the treeline and withdraw — testing whether he is dead yet — and each time his eyes track them and each time they do not cross. The wind from the north is cold. Hold the vigil without moving toward the treeline, without speaking, through the long afternoon that has no shape except duration.",
        "passText": "The afternoon passes through you without touching what you have been commissioned to hold. When one of Lugaid's men walks half the field and goes back, he does so because of Cuchulain and because of the stillness at the stone's base.",
        "failText": "You shift once — one step toward the treeline — and one of Lugaid's men reads the movement correctly. He calls across the field that the guardian looks tired. Cuchulain does not react. But the perimeter has shown a gap.",
        "checkPassFlag": "bhdC2A2Done",
    },
    {
        "id": "bhd_02_act3",
        "title": "The Standing Stone — The Raven",
        "type": "skill_check",
        "activateNode": "PSU",
        "checkStat": "WIS", "checkDC": 13,
        "activateCond": "() => !!S_story.bhdC2A2Done",
        "desc": "Late afternoon. His grip loosens. The scabbard tilts against the stone. The grey raven comes from the north, circles once, and lands on his shoulder. Lugaid steps out of the treeline. You have the time it takes a man to cross fifty yards of flat grass. Read the exact moment the raven's shadow falls on the stone and have the scabbard in your hand before he reaches the halfway point.",
        "passText": "You see the shadow before the bird. You have the scabbard in your grip the moment Lugaid steps from the treeline. He takes the head without speaking and turns back. You receive Cuchulain's Sword.",
        "failText": "You see the raven land. You look at Lugaid. You look at the sword. The sequence costs three seconds. Lugaid is ten feet away when your hand and his reach the scabbard at the same moment. You do not lose it, but the retrieval is a contest rather than a custody.",
        "checkPassFlag": "bhdC2A3Done",
    },
    {
        "id": "bhd_02_act4",
        "title": "The Standing Stone — The Trophy Men",
        "type": "skill_check",
        "activateNode": "PSU",
        "checkStat": "STR", "checkDC": 14,
        "activateCond": "() => !!S_story.bhdC2A3Done",
        "desc": "Lugaid walks back to the treeline with the head. Two of his men have decided the sword is as good as a head and approach from two sides with the manner of men who expect possession to transfer based on numbers. Hold the sword against two men who want it. They have no argument except that there are two of them.",
        "passText": "The plain empties. The stone is behind you. The raven is still on his shoulder and the sword is in your hand and you are the only living person left on the field.",
        "failText": "You are driven from the stone. Lugaid calls his men off before they do worse and you leave the field alive, but the sword goes with them. Emain Macha will hear of this from someone else.",
        "checkPassFlag": "bhdC2A4Done",
    },
    {
        "id": "bhd_02_act5",
        "title": "The Standing Stone — Emain Macha's Gate",
        "type": "skill_check",
        "activateNode": "ULC",
        "checkStat": "CHA", "checkDC": 12,
        "activateCond": "() => !!S_story.bhdC2A4Done",
        "desc": "Conall Cernach stands at Emain Macha's inner gate. He was supposed to be with Cuchulain today. He was not. He sees the sword. He does not take it yet. He asks: 'How did it end?' He is asking about the form, not the facts. Give him a true account — not elegy, not comfort, but the exact sequence in the order it happened.",
        "passText": "You say it exactly: the stone, the belt, the waiting, the raven landing before Lugaid moved, the sword already held. He chose the form. Conall takes the sword with both hands and says: 'He would have chosen you for this.' You receive Conall's Coin.",
        "failText": "You tell it in the register of grief. You soften the raven. Conall takes the sword and says: 'You were there,' and nothing else. The commission is complete but the account is not what Cuchulain sent you to carry.",
        "checkPassFlag": "bhdC2A5Done",
    },

    # ── Cycle 3 — Emer's Bargain (EMR → WM) ──────────────────────────────────
    {
        "id": "bhd_03_act1",
        "title": "Emer's Bargain — The Boundary",
        "type": "skill_check",
        "activateNode": "EMR",
        "checkStat": "WIS", "checkDC": 12,
        "activateCond": "() => !!S_story.bhdC2A5Done",
        "desc": "The boundary between Emer's hall and the otherworld passage: flat grey ground where sound changes and the women of the household will not follow. Emer goes forward alone. She does not know you are there. She speaks to Fand — the most important thing she will ever say, offered to the one person who will not keep the record. Write down what she says. She will not repeat herself.",
        "passText": "You write every word. The offer is recorded in her voice — the concession that will give Cuchulain back without offering him the knowledge of what it cost. You receive Emer's Witness Note.",
        "failText": "You catch most of it. The central sentence — the offer itself — is paraphrased rather than quoted. The note contains the meaning but not the words.",
        "checkPassFlag": "bhdC3A1Done",
    },
    {
        "id": "bhd_03_act2",
        "title": "Emer's Bargain — Fand Goes Back",
        "type": "skill_check",
        "activateNode": "EMR",
        "checkStat": "WIS", "checkDC": 12,
        "activateCond": "() => !!S_story.bhdC3A1Done",
        "desc": "Fand returns to the sea. The women take Cuchulain toward the hall. Emer stays at the boundary alone. A druid approaches with the forgetfulness-cup. He gives it to Cuchulain. He does not give one to Emer. Emer watches. The note in your hands is the only record of what she paid. Understand both halves of the transaction.",
        "passText": "You write a second line that records only what the druid did and did not do, without commentary. The gap is clear — the act of love performed without audience, the price the forgetfulness drink did not remove.",
        "failText": "You add an interpretive note to the vellum. The observation is accurate but it editorializes Emer's act.",
        "checkPassFlag": "bhdC3A2Done",
    },
    {
        "id": "bhd_03_act3",
        "title": "Emer's Bargain — The Household Women",
        "type": "skill_check",
        "activateNode": "EMR",
        "checkStat": "CHA", "checkDC": 11,
        "activateCond": "() => !!S_story.bhdC3A2Done",
        "desc": "Three women of Emer's household want the Fighter to leave the note with them — they will keep it in the hall, where it belongs, where Emer can decide what to do with it. Their argument is reasonable. But the hall is not a neutral custodian; the people who love Emer cannot be impartial about what she said and what it cost.",
        "passText": "They accept the distinction between the hall's care and the archive's neutrality. The note travels alone.",
        "failText": "One woman argues that the archive is a foreign institution that will misread the context. She adds a page of domestic context. Both travel.",
        "checkPassFlag": "bhdC3A3Done",
    },
    {
        "id": "bhd_03_act4",
        "title": "Emer's Bargain — The Road North",
        "type": "skill_check",
        "activateNode": "EMR",
        "checkStat": "WIS", "checkDC": 12,
        "activateCond": "() => !!S_story.bhdC3A3Done",
        "desc": "A Ulster court scald intercepts the Fighter on the road north. He is composing the official version of events — the reconciliation, the druids' intervention — with Emer as a gracious queen accepting her husband's return. He has not asked Emer what happened. The note does not contradict his version. It supplements it with what was unsaid.",
        "passText": "He reads the note. He goes quiet. He adds a line to his composition that leaves a gap where Emer's words should go.",
        "failText": "He argues that a private note outweighs his source material. The Fighter names the archive and continues. He writes his version anyway.",
        "checkPassFlag": "bhdC3A4Done",
    },
    {
        "id": "bhd_03_act5",
        "title": "Emer's Bargain — The Archive",
        "type": "skill_check",
        "activateNode": "WM",
        "checkStat": "WIS", "checkDC": 11,
        "activateCond": "() => !!S_story.bhdC3A4Done",
        "desc": "Sweelinck reads the witness note. He says: she did not contest the claim. She offered to release him if Fand would return to the sea. Fand went. The druids gave Cuchulain forgetfulness. They did not give it to Emer.",
        "passText": "You describe the boundary, the druid's omission, the road meeting with the scald. Sweelinck creates: Unwitnessed Negotiations — Acts That Changed Situations Without Official Record, First Entry. Emer's Bargain filed in her voice.",
        "failText": "You describe only the note's contents. Sweelinck files it under Personal Transactions — Otherworld Negotiations. The document is preserved.",
        "checkPassFlag": "bhdC3A5Done",
    },

    # ── Cycle 4 — The Ring at the Ford (ULC → WM) ────────────────────────────
    {
        "id": "bhd_04_act1",
        "title": "The Ring at the Ford — The Woman Who Recognized It",
        "type": "skill_check",
        "activateNode": "ULC",
        "checkStat": "INT", "checkDC": 12,
        "activateCond": "() => !!S_story.bhdC3A5Done",
        "desc": "A woman at the Ulster camp saw the boy at the ford wearing Cuchulain's gold thumb-ring — the notch, the gold weight, the thumb-width. She comes to you with the identification. Connla has not yet given his name. The combat rule is set. You carry the ring identification note to the ford before the meeting hour.",
        "passText": "You read the document completely — the notch, the weight, the origin. You understand what the recognition means and why it must arrive before the first exchange, not after. You receive the Ring Identification Note.",
        "failText": "You take the document without reading it fully. The notch is mentioned but not the weight. On the road you stop and read it again.",
        "checkPassFlag": "bhdC4A1Done",
    },
    {
        "id": "bhd_04_act2",
        "title": "The Ring at the Ford — The Ford Road",
        "type": "skill_check",
        "activateNode": "ULC",
        "checkStat": "CHA", "checkDC": 12,
        "activateCond": "() => !!S_story.bhdC4A1Done",
        "desc": "A Connacht scout checkpoint on the ford road questions your business. They have standing orders to delay anyone bringing messages to Cuchulain before the combat. You are carrying a private identification note from a camp woman — not a military dispatch.",
        "passText": "You describe the note as private family correspondence. He waves you through without inspecting the document.",
        "failText": "He is not convinced. He holds you for twenty minutes while he consults his commander. You lose the time.",
        "checkPassFlag": "bhdC4A2Done",
    },
    {
        "id": "bhd_04_act3",
        "title": "The Ring at the Ford — The Wrong Side",
        "type": "skill_check",
        "activateNode": "ULC",
        "checkStat": "STR", "checkDC": 13,
        "activateCond": "() => !!S_story.bhdC4A2Done",
        "desc": "The pre-combat interval at the ford. Connla is on the Connacht side; you are on the Ulster side. The water between you is waist-deep and moving fast. You must cross before Cuchulain arrives at his position — the note has to reach Connla before the combat rule engages.",
        "passText": "You ford the current before Cuchulain appears on the Ulster bank. You have the note in his hand before the combat opens.",
        "failText": "The current takes you off your feet once. You recover and cross. Cuchulain is already at his position when you emerge.",
        "checkPassFlag": "bhdC4A3Done",
    },
    {
        "id": "bhd_04_act4",
        "title": "The Ring at the Ford — What Connla Does",
        "type": "skill_check",
        "activateNode": "ULC",
        "checkStat": "CHA", "checkDC": 14,
        "activateCond": "() => !!S_story.bhdC4A3Done",
        "desc": "Connla reads the identification note. He looks at his ring. He looks at Cuchulain's position across the ford. The combat rule does not release him from combat once engaged — his name has been asked and refused. He looks back at you. He does not speak. The note arrived in time and changed nothing. Some structures are designed to be entered completely before the recognition is possible.",
        "passText": "You hold his gaze and say nothing. There is nothing to say that would change what comes next. He nods once and turns back to the ford. You have carried the message faithfully and it arrived correctly. The ring was always on the boy's hand.",
        "failText": "You try to offer him an argument for withdrawal. He has already weighed the same argument and found it insufficient. He turns to the ford.",
        "checkPassFlag": "bhdC4A4Done",
    },
    {
        "id": "bhd_04_act5",
        "title": "The Ring at the Ford — The Archive",
        "type": "skill_check",
        "activateNode": "WM",
        "checkStat": "INT", "checkDC": 11,
        "activateCond": "() => !!S_story.bhdC4A4Done",
        "desc": "Sweelinck reads the ring identification note. He reads the transit record. He says: the note arrived before the combat and changed nothing. The archive files recognition that arrived correctly and changed nothing — a category distinct from recognition that arrived too late.",
        "passText": "You describe Connla's response: he read it, looked at the ring, turned to the ford. Sweelinck creates: Correct Recognition Records — The Message That Arrived and Was Received and Made No Difference.",
        "failText": "Sweelinck files under Missed Warnings — Documents That Arrived Too Late. You correct him: it arrived before. He updates the category.",
        "checkPassFlag": "bhdC4A5Done",
    },

    # ── Cycle 5 — Three Nights at the Ford (ULC → WM) ────────────────────────
    {
        "id": "bhd_05_act1",
        "title": "Three Nights at the Ford — The Healer's Commission",
        "type": "skill_check",
        "activateNode": "ULC",
        "checkStat": "WIS", "checkDC": 11,
        "activateCond": "() => !!S_story.bhdC4A5Done",
        "desc": "The healer Lena has been tasked with keeping Cuchulain's wounds closed enough to fight each day. She needs the cart brought to the ford each evening at dusk — she cannot carry it herself while tending wounds. The cart is loaded. The inventory is written on the front side. The back is blank. 'Write down what you see at the ford,' she says. 'Not the fighting. What happens at dusk.'",
        "passText": "You understand the commission: not official record, not elegy — observation in the margins of the healer's inventory. The back of the vellum is available. You receive the Ford Supply and Witness Record.",
        "failText": "You ask what kind of record she wants. She is already at the wound. 'What happens at dusk,' she repeats.",
        "checkPassFlag": "bhdC5A1Done",
    },
    {
        "id": "bhd_05_act2",
        "title": "Three Nights at the Ford — The First Evening",
        "type": "skill_check",
        "activateNode": "ULC",
        "checkStat": "WIS", "checkDC": 11,
        "activateCond": "() => !!S_story.bhdC5A1Done",
        "desc": "First dusk at the ford. Cuchulain and Ferdiad share food and medicine across the water — sending provisions to each other's banks at the same moment. Both men tend the wounds they gave each other today. The specific quality of what passes between them at this hour is the thing no official account will record.",
        "passText": "You write what they say to each other without commentary. The register is observation: what was passed, what was said, the quality of the silence that followed.",
        "failText": "You write the events without the quality. The record has form but not substance. You add a second observation later that night.",
        "checkPassFlag": "bhdC5A2Done",
    },
    {
        "id": "bhd_05_act3",
        "title": "Three Nights at the Ford — The Second Evening",
        "type": "skill_check",
        "activateNode": "ULC",
        "checkStat": "INT", "checkDC": 12,
        "activateCond": "() => !!S_story.bhdC5A2Done",
        "desc": "Second dusk. Maeve has sent a letter to Ferdiad — pressures, promises, the political machinery of the war behind this personal combat. Ferdiad reads it and sets it aside without visible reaction. The record needs to note what the letter contained and what Ferdiad's posture did with it. This is a distinction that requires care.",
        "passText": "You note the letter's source, Ferdiad's reading posture, the specific quality of how he set it aside — the gesture of a man who has already decided — and the fact that he did not discuss it with Cuchulain at the ford.",
        "failText": "You note the letter's existence but not what Ferdiad did with it. The record has the fact but not the document's function.",
        "checkPassFlag": "bhdC5A3Done",
    },
    {
        "id": "bhd_05_act4",
        "title": "Three Nights at the Ford — The Third Evening",
        "type": "skill_check",
        "activateNode": "ULC",
        "checkStat": "CHA", "checkDC": 12,
        "activateCond": "() => !!S_story.bhdC5A3Done",
        "desc": "Third evening. A Connacht officer on the south bank has noticed the Fighter writing during the dusk periods. He approaches after both men have gone to their camps and asks to see the record. His interest is military intelligence about Cuchulain's wound progression.",
        "passText": "You explain that the record is an observer's inventory, not an intelligence report. The supply and witness data are inseparable — he cannot have the wound notes without the personal observations that frame them. He withdraws.",
        "failText": "He argues military necessity. You decline. He reports back to his commander. The record continues north.",
        "checkPassFlag": "bhdC5A4Done",
    },
    {
        "id": "bhd_05_act5",
        "title": "Three Nights at the Ford — The Archive",
        "type": "skill_check",
        "activateNode": "WM",
        "checkStat": "INT", "checkDC": 11,
        "activateCond": "() => !!S_story.bhdC5A4Done",
        "desc": "Sweelinck reads both sides of the vellum. He reads the supply inventory on the front and the observations on the back. He notes the three evenings, the Maeve letter entry, the quality of the third evening's silence.",
        "passText": "You describe the commission: Lena's instruction, the observer's register, the choice to write observation rather than elegy. Sweelinck creates: Combat Boundary Records — The Evenings That Were Not the Combat.",
        "failText": "Sweelinck files under Military Supply Records — Ulster Campaign. You explain the back of the vellum. He opens a second category.",
        "checkPassFlag": "bhdC5A5Done",
    },

    # ── Cycle 6 — The Lament at the Ford (ULC → BK → WM) ────────────────────
    {
        "id": "bhd_06_act1",
        "title": "The Lament at the Ford — The Body at the Ford",
        "type": "skill_check",
        "activateNode": "ULC",
        "checkStat": "WIS", "checkDC": 12,
        "activateCond": "() => !!S_story.bhdC5A5Done",
        "desc": "Ferdiad falls in the shallow water. Cuchulain wades in and holds the body. He does not speak immediately. Then he speaks — of the noble ways, the upstanding body, the training at Scathach's camp, the man Ferdiad was before this ford existed. The Fighter has a blank vellum sheet. Write the lament in real time — it is not long but it does not repeat itself; the words are already leaving and will not come back in the same order.",
        "passText": "You write it in his voice. The record holds the exact words. The lament that named what was lost before the combat was ever a combat.",
        "failText": "You get the shape but not the words. The record is a paraphrase. The meaning is present; the voice is not.",
        "checkPassFlag": "bhdC6A1Done",
    },
    {
        "id": "bhd_06_act2",
        "title": "The Lament at the Ford — The Connacht Officers",
        "type": "skill_check",
        "activateNode": "ULC",
        "checkStat": "WIS", "checkDC": 11,
        "activateCond": "() => !!S_story.bhdC6A1Done",
        "desc": "The Connacht officers cross from the south bank. One of them — who was also at Scathach's camp — sees the Fighter writing and approaches. He wants a copy. His request is genuine; he also lost a friend today. But a copy circulating through the Connacht camp will be used differently than a document traveling to a neutral archive.",
        "passText": "You decline the copy without declining the acknowledgment. He understands. He gives you Ferdiad's campfire name — the name Cuchulain used in the lament that he used alone. It will not appear in any official record.",
        "failText": "He argues that he has equal right to the lament as a witness. You explain the archive procedure. He accepts it reluctantly.",
        "checkPassFlag": "bhdC6A2Done",
    },
    {
        "id": "bhd_06_act3",
        "title": "The Lament at the Ford — The Ulster Counselor",
        "type": "skill_check",
        "activateNode": "ULC",
        "checkStat": "CHA", "checkDC": 12,
        "activateCond": "() => !!S_story.bhdC6A2Done",
        "desc": "An Ulster counselor in the camp objects to the lament being preserved and circulated. A warrior mourning an enemy damages the official narrative of the campaign. The lament is a document of grief, not a military communication — it belongs to the archive's grief category, not to the campaign's record.",
        "passText": "You explain the archive's neutrality. The counselor's objection is about military narrative; the archive's function is to preserve what the military narrative cannot hold. He withdraws the formal objection.",
        "failText": "He invokes Conchubar's authority. You invoke the archive's independence. The document continues north.",
        "checkPassFlag": "bhdC6A3Done",
    },
    {
        "id": "bhd_06_act4",
        "title": "The Lament at the Ford — The Scald's Version",
        "type": "skill_check",
        "activateNode": "BK",
        "checkStat": "CHA", "checkDC": 11,
        "activateCond": "() => !!S_story.bhdC6A3Done",
        "desc": "A court scald on the road north is composing his version of the ford — a formal praise-poem for Cuchulain's victory, which elides the lament entirely. He has heard that the Fighter carries a document from the ford. He argues that his version is the correct one: the victor does not mourn the enemy.",
        "passText": "You show him the specific sentence where Cuchulain names what Ferdiad was before the ford existed. The scald reads it twice. He does not change his version but he stops arguing that the Fighter's document is incorrect.",
        "failText": "He will not read the lament. He argues by principle. The document continues to Weimar.",
        "checkPassFlag": "bhdC6A4Done",
    },
    {
        "id": "bhd_06_act5",
        "title": "The Lament at the Ford — The Archive",
        "type": "skill_check",
        "activateNode": "WM",
        "checkStat": "INT", "checkDC": 11,
        "activateCond": "() => !!S_story.bhdC6A4Done",
        "desc": "Sweelinck reads the lament transcription. He reads the Connacht officer note. He reads the counselor's objection and the scald's counter-composition reference. 'Both the friendship and the correct combat are simultaneously true. The archive files both as necessary.'",
        "passText": "You explain the lament's context: not elegy for an enemy, but grief for a friend who became an enemy correctly. Sweelinck creates: Combat Grief Records — The Lament That Named What Was Lost Before the Combat Was a Combat.",
        "failText": "Sweelinck files under Warriors' Personal Documents. The transcription is preserved.",
        "checkPassFlag": "bhdC6A5Done",
    },

    # ── Cycle 7 — Deirdre's Year (ULC → VS → WM) — questComplete ─────────────
    {
        "id": "bhd_07_act1",
        "title": "Deirdre's Year — The Servant's Record",
        "type": "skill_check",
        "activateNode": "ULC",
        "checkStat": "INT", "checkDC": 11,
        "activateCond": "() => !!S_story.bhdC6A5Done",
        "desc": "A household servant named Mían has kept a daily record for twelve months: what Deirdre ate, when she spoke, what she looked at, what she refused to do. The unsmiling has been consistent for a year. Mían wants the record removed from the hall before Conchubar's household archives it under a different category.",
        "passText": "You receive the full record without reading it in front of Mían. You understand what you are carrying: the record of sustained refusal as the only form of protest still available. You receive Deirdre's Hall Account.",
        "failText": "You read the first pages in front of Mían. She waits. 'You can read it on the road,' she says. 'Take it now.'",
        "checkPassFlag": "bhdC7A1Done",
    },
    {
        "id": "bhd_07_act2",
        "title": "Deirdre's Year — The Hall Captain",
        "type": "skill_check",
        "activateNode": "ULC",
        "checkStat": "CHA", "checkDC": 12,
        "activateCond": "() => !!S_story.bhdC7A1Done",
        "desc": "The hall captain's office stops you at the gate. He has heard that a household servant has given a private record to someone leaving the hall. He wants to see the document — all documents leaving Conchubar's household pass through his office.",
        "passText": "You explain that the record was given by its author to a private carrier for personal reasons, and that private communications between household members and their correspondents do not fall under the hall captain's archival authority. He releases you.",
        "failText": "He reads the first page. He decides it is not his business. He waves you through. The record is intact.",
        "checkPassFlag": "bhdC7A2Done",
    },
    {
        "id": "bhd_07_act3",
        "title": "Deirdre's Year — The Norse Factor",
        "type": "skill_check",
        "activateNode": "ULC",
        "checkStat": "WIS", "checkDC": 11,
        "activateCond": "() => !!S_story.bhdC7A2Done",
        "desc": "On the Baltic road north, a Norse factor who buys unusual documents intercepts the carrier. He has purchased similar records before — observation documents from royal households that tell the commercial visitor what the official diplomatic register does not. He offers good coin.",
        "passText": "His interest is genuine but his use would be commercial intelligence, not archival preservation. You explain the distinction. He accepts it. He says the archive at Weimar has a good name on these roads.",
        "failText": "He argues that a document preserved commercially is still preserved. You decline. The road continues.",
        "checkPassFlag": "bhdC7A3Done",
    },
    {
        "id": "bhd_07_act4",
        "title": "Deirdre's Year — The End of the Year",
        "type": "skill_check",
        "activateNode": "VS",
        "checkStat": "INT", "checkDC": 11,
        "activateCond": "() => !!S_story.bhdC7A3Done",
        "desc": "At a Baltic waystation, you read the final entry of the record: the last day of the year. It describes what Deirdre looked at out the window on the morning of the day she died. Mían has left the final line incomplete — three words, then nothing. The archive needs the full final entry. Add the three words she omitted, in the observation register she used throughout, based on what the previous twelve months of record makes clear the final line was.",
        "passText": "The three words complete the observation without editorializing. The final entry is now whole and consistent with the preceding year's record.",
        "failText": "You add four words. The fourth is interpretation. You revise it. Three words, observation register.",
        "checkPassFlag": "bhdC7A4Done",
    },
    {
        "id": "bhd_07_act5",
        "title": "Deirdre's Year — The Archive",
        "type": "skill_check",
        "activateNode": "WM",
        "checkStat": "INT", "checkDC": 11,
        "activateCond": "() => !!S_story.bhdC7A4Done",
        "desc": "Sweelinck reads the twelve months. He reads the final entry. He reads the three completed words. He is quiet for a long time. He says: 'The unsmiling is a document as legible as any signed testimony. The question is whether the archive can hold it as the document it is, rather than what it resembles.'",
        "passText": "You explain the servant's observation register and the year's consistency. Sweelinck creates: Sustained Refusal Records — The Unsmiling as Document, First Entry. Deirdre's Hall Account: twelve months of sustained refusal as the only protest available to the captive.",
        "failText": "Sweelinck files under Royal Household Records — Captive Nobles. The document is preserved. He adds a note: see Sustained Refusal.",
        "checkPassFlag": "bhdC7A5Done",
        "questComplete": True,
    },
]

def main():
    wait_server()
    print(f"Importing BHD — Cuchulain of Muirthemne ({len(quests)} acts)...")
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
