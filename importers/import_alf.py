#!/usr/bin/env python3
# SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
# ═══════════════════════════════════════════════════════════════════════════
# ⚠️  ARCHAIC — OUT OF DATE.  Historical one-shot importer (POSTs to the
#     localhost:1367 WBAPI).  Content was long ago imported and lives in
#     index.html.  This script likely NO LONGER RUNS against the current
#     server/schema.  Kept for reference only — do not run without review.
#     Import history: BACKLOG.md / plan-archive.md / 1367-sources/.
# ═══════════════════════════════════════════════════════════════════════════
"""Import ALF — Kalevala (Elias Lönnrot, 1849) — 35 acts, 7 cycles."""
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
    # Skip if quest already exists
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
    print("Creating ALF nodes...")
    create_node("TUO", "ruins", "Tuonela — The Boundary Shore", 1, 84, 116,
        "The edge of the Finnish underworld: black water, reed-banks, cold mud that is different from other mud. The boundary a living person can stand at but not cross. The far shore visible. The iron rake waiting in the reeds.")
    create_node("KVF", "highlands", "Kullervo's Forest — The Pine Clearing", 1, 80, 114,
        "A clearing in deep Finnish forest where a man stood with a sword in the earth and made his final arrangements. Late afternoon light through pine. The sword stood upright; it had already answered yes.")
    create_node("KVM", "camelot", "The Master's Hall — Kullervo's People", 1, 82, 116,
        "The hall of Kullervo's master: a fire, a steward at the gate, household members watching. The place the sword came back to with six words and nothing more.")

    print("\nImporting ALF — Kalevala (35 acts)...")

    # ── Cycle 1: The Iron Rake ──
    quest(
        id="alf_01_act1", title="The Iron Rake — The Mother at the Boundary",
        activateNode="TUO",
        desc="The mother stands at Tuonela's boundary, second sight full of her son's scattered pieces. The iron rake is on the far shore — six paces past the black water she cannot cross. She needs someone to cross, retrieve it, and return. She is not asking. She is standing.",
        checkStat="CON", checkDC=12,
        passText="You agree. She presses a smooth stone into your hand — a river-token to hold up on your return. She says nothing else. She is already looking at the river.",
        failText="The black water is quiet and the far shore is close and both are worse than a loud and distant danger. You look at the rake and decide the fear is not sufficient reason.",
        checkPassFlag="alfC1A1Done",
        activateMissionBit="alf_questActive",
    )
    quest(
        id="alf_01_act2", title="The Iron Rake — The Ferryman",
        activateNode="TUO", activateCond="() => !!S_story.alfC1A1Done",
        desc="The ferryman of Tuonela works the crossing. He moves the dead. He has a specific policy about the living, explained at length while not looking at you. The black water between shores is not wide. You could swim it. Tuonela's water on a living person is not like other water.",
        checkStat="CHA", checkDC=14,
        passText="He rows you across. He does not comment on your destination. A sliver of the ferry's gunwale presses into your palm when you step off — proof of the passage.",
        failText="His logic is impeccable: he carries the dead, not the living. You find a different argument — what happens to the river if Lemminkäinen's pieces are never recovered.",
        checkPassFlag="alfC1A2Done",
    )
    quest(
        id="alf_01_act3", title="The Iron Rake — The Far Shore",
        activateNode="TUO", activateCond="() => !!S_story.alfC1A2Done",
        desc="The far shore. Reed-grass, cold mud, the rake exactly where second sight described it. Two figures in the reed-grass — watchers of the dead, assigned to monitor for exactly this kind of arrival. They are not attacking. In Tuonela, watching is the first form of prevention.",
        checkStat="CHA", checkDC=14,
        monster="Tuonela Shore Watcher", monsterHP=20, monsterAC=12,
        passText="They let you pick up the rake. The far shore is in your hands and the near shore is visible. You hold a handful of reeds from the far bank, cold with the specific cold of the underworld.",
        failText="The shore-watcher drives you back toward the water. The rake is still in your hands. You are not losing the rake. You are losing ground. You recover.",
        checkPassFlag="alfC1A3Done",
    )
    quest(
        id="alf_01_act4", title="The Iron Rake — The River Crossing",
        activateNode="TUO", activateCond="() => !!S_story.alfC1A3Done",
        desc="The ferryman will carry you back but has a new objection: the rake is property of Tuonela's shore. The current is stronger going toward life than toward death. The rake makes the crossing slower. The near shore is visible. The mother is a shape on it, standing exactly where you left her.",
        checkStat="STR", checkDC=14,
        passText="You cross. The rake drips Tuonela's black water. You hold up the river-token. The mother sees it. A stone from the river-bed clings to the rake's teeth — it came across with you.",
        failText="The current is stronger than expected and the rake heavier in the water. The ferryman is reconsidering. You find the grip and the angle that holds — the way of carrying a long object across a current that wants to take it.",
        checkPassFlag="alfC1A4Done",
    )
    quest(
        id="alf_01_act5", title="The Iron Rake — The Count Begins",
        activateNode="TUO", activateCond="() => !!S_story.alfC1A4Done",
        desc="The mother is standing where you left her. She has not moved. She is ready. You carry the rake to her. She does not reach for it yet — she waits until you are close enough to hand it properly, with both hands, the way you hand something that matters.",
        checkStat="CON", checkDC=12,
        passText="She takes the rake with both hands. She does not look at you. She wades to her knees and begins. The first pass brings up cloth — the edge of his shirt. She lays it on the bank. Her face does not change. She will not stop. You receive the First Reed of the Counting — the evidence of where the work began.",
        failText="The weight of the moment makes you hesitate at the last step. She is looking at the river, not at you. She is already counting. You take the last step and hold the rake out.",
        checkPassFlag="alfC1A5Done",
        activateMissionBit="alf_C1_complete",
    )

    # ── Cycle 2: Kullervo's Sword ──
    quest(
        id="alf_02_act1", title="Kullervo's Sword — The Forest Clearing",
        activateNode="KVF", activateCond="() => !!S_story.alfC1A5Done",
        desc="A clearing in deep pine forest. He has been waiting for someone who could carry a sword out of a forest and keep quiet about where they found it. The sword stands upright in the earth. He holds it out to you, hilt-first. Take it back to his master's hall. Tell him you found it in the forest. That is all.",
        checkStat="WIS", checkDC=12,
        passText="You take the sword and understand. Six words. The sentence is already complete. What he is asking you not to do is as important as what he is asking you to do.",
        failText="You take the sword and already you are thinking about what context to add. You will have to unlearn this before the final act.",
        checkPassFlag="alfC2A1Done",
        activateMissionBit="alf_C2_active",
    )
    quest(
        id="alf_02_act2", title="Kullervo's Sword — The Transfer",
        activateNode="KVF", activateCond="() => !!S_story.alfC2A1Done",
        desc="He asked you to turn away before the thing happened. You are ten steps from him now, facing the forest path. Behind you: a sound. Not a long sound. Not a complicated sound. Then nothing. The sword is heavier now. The errand began when you turned away.",
        checkStat="CON", checkDC=12,
        passText="You move. The path opens in front of you. Pine and birch and afternoon light. The clearing is behind you. You do not look back.",
        failText="You pause at the clearing's edge. The pause costs you composure for the rest of the journey.",
        checkPassFlag="alfC2A2Done",
    )
    quest(
        id="alf_02_act3", title="Kullervo's Sword — The Forest Road",
        activateNode="KVF", activateCond="() => !!S_story.alfC2A2Done",
        desc="Three hours in, a huntsman with two dogs coming the other direction. He recognizes the sword's marking. 'That's Kullervo's sword.' He is not accusing you. But the question behind the identification is clear. You have six words for the master's hall. You have no words for the forest road except movement.",
        checkStat="CHA", checkDC=13,
        passText="You say something true and useless and keep walking. The huntsman watches you go. The dogs sit at his feet. You do not look back.",
        failText="You say too much. The huntsman's face changes. He has one of the dogs follow you at a distance. By the time you reach the hall, someone will have arrived before you with a more complicated version.",
        checkPassFlag="alfC2A3Done",
    )
    quest(
        id="alf_02_act4", title="Kullervo's Sword — The Master's Gate",
        activateNode="KVM", activateCond="() => !!S_story.alfC2A3Done",
        desc="The master's steward opens the gate and sees the sword. He wants to know everything. Where did you get it. What happened. Where is Kullervo. You have six words. They are not for the steward.",
        checkStat="CON", checkDC=13,
        passText="The steward steps aside. He knows he will not get what he wants from you. He will find out when the master does. You go through the gate.",
        failText="The steward extracts enough from you that by the time you reach the master the story is already half-told in fragments.",
        checkPassFlag="alfC2A4Done",
    )
    quest(
        id="alf_02_act5", title="Kullervo's Sword — The Master's Hall",
        activateNode="KVM", activateCond="() => !!S_story.alfC2A4Done",
        desc="The master is seated by the fire. He sees the sword before he sees you. He takes it, turns it, looks at the marking on the hilt. Looks at you. 'Where did you find this.' This is the sentence you have been carrying since the clearing. Six words. The ones Kullervo chose.",
        checkStat="CON", checkDC=11,
        passText="Six words. The master's hands close on the hilt. The fire pops once. No one in the room says anything. This is the shape Kullervo chose for his ending. You gave it to him.",
        failText="You say the six words and then you say something else. It is small and well-intentioned and it ruins it. The master looks at you and the room changes shape.",
        checkPassFlag="alfC2A5Done",
        activateMissionBit="alf_C2_complete",
    )

    # ── Cycle 3: The Honey-Bee's Errand ──
    quest(
        id="alf_03_act1", title="The Honey-Bee's Errand — The Bee's Departure",
        activateNode="TUO", activateCond="() => !!S_story.alfC2A5Done",
        desc="The body is assembled on Tuonela's bank. What is missing is the animation — the honey of life from Tapiola. The bee is here. It knows where it is going. It will go through four gates in Tapiola. At each gate the Fisher will try to stop it. The bee cannot argue or fight. It can only pass if the gate is cleared.",
        checkStat="WIS", checkDC=11,
        passText="You understand: the commission is subtraction, not addition. Every instinct toward protection or guidance is a way of altering the bee's course. You take the commission as a constraint on action, not a license for it.",
        failText="You ask what to do if the bee seems to be going wrong. The mother says: it will not go wrong if you clear the gate and stand aside.",
        checkPassFlag="alfC3A1Done",
        activateMissionBit="alf_C3_active",
    )
    quest(
        id="alf_03_act2", title="The Honey-Bee's Errand — The Pine Gate",
        activateNode="TUO", activateCond="() => !!S_story.alfC3A1Done",
        desc="The Fisher of the Pine Gate is a tall man made of spruce-wood and patience. He does not want to fight. He wants to ask a question that must be answered correctly. The question is about wood: what is the name of the tree that bends without breaking.",
        checkStat="CHA", checkDC=12,
        passText="You name the willow — not the oak, which does not bend; not the pine, which breaks at the wind's direct pressure. The gate opens before the bee reaches it.",
        failText="You name the wrong tree. The gate Fisher holds the gate for one minute while the bee waits. Eventually the bee's presence at the gate is itself the answer, and the gate opens.",
        checkPassFlag="alfC3A2Done",
    )
    quest(
        id="alf_03_act3", title="The Honey-Bee's Errand — The Birch Gate",
        activateNode="BK", activateCond="() => !!S_story.alfC3A2Done",
        desc="The Fisher of the Birch Gate is a woman who has been turning leaves from white to gold since before autumn had a name. She does not ask a question. She asks you to sit down and wait. Sitting down and waiting is exactly what cannot happen. The bee is moving.",
        checkStat="CON", checkDC=13,
        monster="Birch Gate Warden", monsterHP=16, monsterAC=11,
        passText="You stand at the gate without speaking or acting. The Fisher looks at the bee. The bee passes. The gate closes behind it. You did not sit. You did not force the gate. You did nothing.",
        failText="You speak or gesture. The Fisher closes the gate for five minutes before opening it. The delay costs a position.",
        checkPassFlag="alfC3A3Done",
    )
    quest(
        id="alf_03_act4", title="The Honey-Bee's Errand — The Stone Gate and Water Gate",
        activateNode="BK", activateCond="() => !!S_story.alfC3A3Done",
        desc="The stone gate opens only from inside — the bee is already inside with the honey and trying to return. The compact is automatic: if nothing was taken from Tapiola during the passage, the gate opens. The water gate at the boundary stream requires staying within three paces of the bee or it closes for the living.",
        checkStat="STR", checkDC=12,
        passText="You stay with the bee through the boundary stream, which moves in unexpected directions. The water gate closes behind you both. You are out of Tapiola. The bee carries the honey of life.",
        failText="The boundary stream catches you off-angle. You are briefly separated from the bee. You find the current's direction and close the gap before the gate reads you as behind.",
        checkPassFlag="alfC3A4Done",
    )
    quest(
        id="alf_03_act5", title="The Honey-Bee's Errand — Forest Passage Records",
        activateNode="WM", activateCond="() => !!S_story.alfC3A4Done",
        desc="Sweelinck holds the carved birch-bark marker — Tapio's acknowledgment of passage. He reads the grain pattern, which is not writing but contains something that reading can approximate. He opens a new section: Forest Passage Records — The Path That Could Not Be Forced, Only Cleared.",
        checkStat="WIS", checkDC=10,
        passText="'Every other commission involves doing something,' he says. 'This one involves not doing things. That is harder to document because nothing is the evidence.' The archive records passage compact kept: nothing taken, nothing forced.",
        failText="Sweelinck reads the marker carefully. The grain pattern shows one moment of hesitation at the birch gate. He notes it and files the record.",
        checkPassFlag="alfC3A5Done",
        activateMissionBit="alf_C3_complete",
    )

    # ── Cycle 4: The Kantele at the Bottom ──
    quest(
        id="alf_04_act1", title="The Kantele at the Bottom — The Ship's Deck",
        activateNode="TUO", activateCond="() => !!S_story.alfC3A5Done",
        desc="The battle is over. The kantele went overboard in the last exchange. Väinämöinen is at the prow watching the water. 'I can hear it from here. It is on the bottom, silent. The Sampo's guards are not asleep. I cannot sing them to sleep without the kantele.' Forty feet down. Cold water. Something moving in the deep.",
        checkStat="WIS", checkDC=11,
        passText="You understand: the kantele will hum when touched — that is the instrument recognizing contact, not a danger. You accept the commission with that knowledge.",
        failText="You dive without this understanding and are briefly confused by the hum. You recover before surfacing.",
        checkPassFlag="alfC4A1Done",
        activateMissionBit="alf_C4_active",
    )
    quest(
        id="alf_04_act2", title="The Kantele at the Bottom — The Dive",
        activateNode="TUO", activateCond="() => !!S_story.alfC4A1Done",
        desc="Grey-green water, cold, not entirely silent. Things moving at the edge of visibility that are not fish. The kantele is on a rock shelf twenty feet from the surface's pull — caught on the way down. Within range. The shelf visible from above as a difference in the dark.",
        checkStat="STR", checkDC=13,
        passText="You reach the shelf. The kantele hums immediately when you touch it — a single note against the hand. You kick back up with it in both arms. The note does not stop when you surface.",
        failText="The kantele slips off the rock on the first touch and sinks another ten feet. You surface to breathe and make a second dive.",
        checkPassFlag="alfC4A2Done",
    )
    quest(
        id="alf_04_act3", title="The Kantele at the Bottom — Louhi's Eagle",
        activateNode="BK", activateCond="() => !!S_story.alfC4A2Done",
        desc="Louhi's eagle was circling when the kantele was retrieved. A northern factor with ties to Louhi's trading interests is at Birka's dock before the ship arrives — he knew before the dive completed. He is positioned to intercept the carrier at the main dock with an offer.",
        checkStat="WIS", checkDC=12,
        monster="Northern Factor's Agent", monsterHP=18, monsterAC=12,
        passText="You spot the factor from the water and bring the kantele through the harbor's secondary gate before he positions himself. The kantele hums against your back the whole way.",
        failText="The factor intercepts at the main dock. He offers an insulting sum. The refusal must be made without allowing physical contact with the instrument.",
        checkPassFlag="alfC4A3Done",
    )
    quest(
        id="alf_04_act4", title="The Kantele at the Bottom — The Maritime Claim",
        activateNode="BK", activateCond="() => !!S_story.alfC4A3Done",
        desc="The factor's network sent a maritime salvage claim ahead: 'unidentified recovered objects from the sea between Kalevala and the Northern Sea.' A civil officer at a road checkpoint is processing it. The claim's specificity is calibrated to include the kantele without naming it.",
        checkStat="CHA", checkDC=12,
        passText="You name the abandonment requirement: maritime salvage requires the object to have been abandoned property. The kantele was not abandoned — it fell overboard during combat and was retrieved within hours of the same voyage. The claim lapses. The checkpoint opens.",
        failText="You do not name the specific requirement. The civil officer places a two-day hold pending maritime review. You find the argument on the second attempt.",
        checkPassFlag="alfC4A4Done",
    )
    quest(
        id="alf_04_act5", title="The Kantele at the Bottom — Recovered Instrument Records",
        activateNode="WM", activateCond="() => !!S_story.alfC4A4Done",
        desc="Sweelinck holds the kantele at arm's length before taking it, as if uncertain how to handle an instrument that hums when touched. He sets it on the intake counter very carefully. He opens a new section: Recovered Instrument Records — The Pike-Jaw Kantele Saved from the Sea Before the Last Song Was Lost.",
        checkStat="WIS", checkDC=10,
        passText="'Without this, the guards sleep,' he says. 'Without the guards sleeping, the Sampo's fragments stay in a sea watched by people who do not want them found.' He files the record. 'The last song was not lost. That is what this record is.'",
        failText="Sweelinck examines the kantele carefully. Salt-cold, waterlogged, still resonant. He files the record.",
        checkPassFlag="alfC4A5Done",
        activateMissionBit="alf_C4_complete",
    )

    # ── Cycle 5: The Sampo Fragment ──
    quest(
        id="alf_05_act1", title="The Sampo Fragment — The Ship's Deck",
        activateNode="TUO", activateCond="() => !!S_story.alfC4A5Done",
        desc="The Sampo shattered when it hit the gunwale. Most went into the sea. One fragment — the size of a man's palm — landed on the deck planking: warm, slightly luminous, entirely out of place. Louhi's eagle circles above. It knows the fragment is on the deck. 'Hold it,' Väinämöinen says. 'Whatever happens on this deck, hold it.'",
        checkStat="WIS", checkDC=11,
        passText="The fragment responds to intent. You hold it with steady purpose — not greed, not desperation. It stays warm and still in your hand as the eagle circles.",
        failText="Your grip tightens involuntarily with the eagle's approach. The fragment pulses once, brighter. You steady yourself and it settles.",
        checkPassFlag="alfC5A1Done",
        activateMissionBit="alf_C5_active",
    )
    quest(
        id="alf_05_act2", title="The Sampo Fragment — The Eagle's Strike",
        activateNode="TUO", activateCond="() => !!S_story.alfC5A1Done",
        desc="The eagle makes one pass. A wing the size of a sail sweeps the deck — the wind of it knocks two sailors into the rail. The eagle is not trying to kill anyone. It is trying to knock the fragment loose, off the deck, into the sea. The wind of the eagle's wing is not weather; it is intent.",
        checkStat="STR", checkDC=13,
        passText="You hold position on the moving deck in the sweep of a wing the size of a sail. The fragment stays in both hands. The eagle banks away. It circles but does not strike again.",
        failText="The eagle's wingbeat staggers you toward the rail. You find your footing and the angle of least resistance. The fragment does not leave your hands.",
        checkPassFlag="alfC5A2Done",
    )
    quest(
        id="alf_05_act3", title="The Sampo Fragment — The Constantinople Factor",
        activateNode="CON", activateCond="() => !!S_story.alfC5A2Done",
        desc="At Constantinople, a merchant who has spent seven years trying to acquire Sampo fragments is at the harbor. He has northern informants and knows what was on the ship. His offer: three talents of silver for 'historical study.' He is genuine, sincere, and wrong about the nature of the transaction.",
        checkStat="CON", checkDC=12,
        monster="Merchant's Hired Persuader", monsterHP=17, monsterAC=12,
        passText="You explain without contempt that the fragment is not available for sale — it is a commission object, not a personal possession. The merchant accepts this with regret. He is a man who understands clear refusals.",
        failText="You allow a negotiation to begin. The merchant's offer escalates. Ending it costs thirty minutes and his goodwill.",
        checkPassFlag="alfC5A3Done",
    )
    quest(
        id="alf_05_act4", title="The Sampo Fragment — The Scholar on the Road",
        activateNode="CON", activateCond="() => !!S_story.alfC5A3Done",
        desc="A scholar traveling north recognizes the fragment from descriptions in the northern chronicles and asks to examine it. He is genuinely scholarly. He wants to write about it. He means no harm. A scholar's intent is not possession-intent — but it is not steady purpose either.",
        checkStat="WIS", checkDC=11,
        passText="You show the fragment without removing it from the pouch. He can see the light from inside without touching it. He accepts this and makes his notes. The fragment stays warm and still throughout.",
        failText="You transfer the fragment to the scholar's hands. It dims briefly. He notes the dimming in his chronicle. You recover it and continue.",
        checkPassFlag="alfC5A4Done",
    )
    quest(
        id="alf_05_act5", title="The Sampo Fragment — Fragment Preservation Records",
        activateNode="WM", activateCond="() => !!S_story.alfC5A4Done",
        desc="Sweelinck holds out his hand and waits. You place the fragment in his palm. It is warm. He opens a new section: Fragment Preservation Records — The Piece That Was Not Lost to the Eagle.",
        checkStat="WIS", checkDC=10,
        passText="'The Sampo shattered,' he says. 'Most is in the northern sea. This piece is on this table. It does not mill anything. But it holds the memory of milling in the grain of the metal.' He looks at it. 'The eagle wanted it. The sea wanted it. Someone held it through both. That is the record.'",
        failText="Sweelinck examines the fragment carefully. Warm in his hand, heavy for its size. He files the record.",
        checkPassFlag="alfC5A5Done",
        activateMissionBit="alf_C5_complete",
    )

    # ── Cycle 6: The Origin-Words Tablet ──
    quest(
        id="alf_06_act1", title="The Origin-Words Tablet — Pohjola's Gate",
        activateNode="TUO", activateCond="() => !!S_story.alfC5A5Done",
        desc="Louhi's hall. She is occupied with the battle's aftermath. The archive room's shelf is intact and the birch-bark tablet is on it. The gate-keeper is a young man who did not fight and is uncertain about his authority. 'You can have it,' he says finally. 'She didn't say to keep it from anyone specifically.'",
        checkStat="CHA", checkDC=12,
        passText="You name the inscribed-property argument: the tablet belongs to the one who inscribed it. Väinämöinen inscribed it. Inscribed property does not become Louhi's by being left in her hall. The gate-keeper accepts it. The tablet is retrieved.",
        failText="You offer something in exchange. The gate-keeper refuses on principle — he is not looking for a bribe. The argument must be made cleanly on the second attempt.",
        checkPassFlag="alfC6A1Done",
        activateMissionBit="alf_C6_active",
    )
    quest(
        id="alf_06_act2", title="The Origin-Words Tablet — The North Road",
        activateNode="TUO", activateCond="() => !!S_story.alfC6A1Done",
        desc="Louhi returns earlier than expected. She sends a shape: an iron hawk that does not need to land to interfere. It cannot carry anything but will spend six hours doing everything short of direct violence to delay the tablet's arrival at the forge. Four obstacles on the south road, each engineered for delay.",
        checkStat="STR", checkDC=13,
        passText="You get through each obstacle before the iron hawk can create the next: the collapsed bridge that was not collapsed, the scattered cattle herd, the muddied ford, the knocked door-bar. The hawk follows but falls behind.",
        failText="The hawk's second obstacle catches you mid-repair of the first. You work through the sequence faster on the second pass.",
        checkPassFlag="alfC6A2Done",
    )
    quest(
        id="alf_06_act3", title="The Origin-Words Tablet — The Forge at Rome",
        activateNode="ROM", activateCond="() => !!S_story.alfC6A2Done",
        desc="The tablet's notation requires glossing before Ilmarinen can work from it. Fra Domenico, a scholar of old northern texts near Rome, can gloss the two ambiguous passages in thirty minutes. His colleague at the neighboring desk will want to copy the tablet's content — a three-hour delay — if the request arises.",
        checkStat="WIS", checkDC=13,
        monster="Forge Guild Agent", monsterHP=17, monsterAC=12,
        passText="You position the tablet before the colleague's request arises. Fra Domenico completes the gloss in thirty minutes without the copy question. The marginal notes are very good.",
        failText="The colleague asks to copy the tablet's reverse. Fra Domenico defers to you. You explain without insulting either scholar why a copy cannot be made.",
        checkPassFlag="alfC6A3Done",
    )
    quest(
        id="alf_06_act4", title="The Origin-Words Tablet — The Final Road to the Forge",
        activateNode="ROM", activateCond="() => !!S_story.alfC6A3Done",
        desc="The gloss is complete. Ilmarinen has been waiting at the forge, keeping it cold, which means the metal has set wrong. The tablet must arrive before the third heating cycle. His forge assistant is at the road's end: the third heating cycle begins in forty minutes.",
        checkStat="CON", checkDC=11,
        passText="You hand Ilmarinen the tablet, say the gloss is in the margins, and step back. He opens it to the first inscription. The heating cycle begins correctly. Everything else is for later.",
        failText="You add two sentences of context. Ilmarinen asks a question. The exchange takes eight minutes. The heating cycle begins with two minutes to spare.",
        checkPassFlag="alfC6A4Done",
    )
    quest(
        id="alf_06_act5", title="The Origin-Words Tablet — Sacred Text Records",
        activateNode="WM", activateCond="() => !!S_story.alfC6A4Done",
        desc="Sweelinck reads the inscriptions on both sides, then the marginal gloss. He takes longer than usual. He opens a new section: Sacred Text Records — The Words That Tame the Metal Before It Burns.",
        checkStat="WIS", checkDC=10,
        passText="'The origin-songs of iron, fire, and water,' he says. 'Not metaphor. Not poetry in the decorative sense. These are the working instructions for what those things are and how they behave when you handle them correctly.' He reads Fra Domenico's gloss again. 'Ilmarinen worked from this. The forge was correct. Without these words, the forge burns the smith.'",
        failText="Sweelinck reads both sides carefully. He files the record: the words that tame the metal.",
        checkPassFlag="alfC6A5Done",
        activateMissionBit="alf_C6_complete",
    )

    # ── Cycle 7: The Copper Boat's Last Cargo ──
    quest(
        id="alf_07_act1", title="The Copper Boat's Last Cargo — The Shore",
        activateNode="TUO", activateCond="() => !!S_story.alfC6A5Done",
        desc="The boat is gone. Five objects are on the wet sand: the iron rake, the new kantele made from birch and tears, a Sampo fragment from the wave-wash, a sealed clay pot of forge-fire, a cloth pouch of origin-words spoken into wax. The manifest tablet is in the sand beside them. The new king's hall is a day's walk inland.",
        checkStat="WIS", checkDC=11,
        passText="You understand: the manifest is the token; the five objects are the cargo. The new king will not know what most of these are, and this is the correct state — the archive is the explanation, not the hall.",
        failText="You plan to explain the objects to the new king. This is correct in intention and wrong in the commission's terms. You reconsider.",
        checkPassFlag="alfC7A1Done",
        activateMissionBit="alf_C7_active",
    )
    quest(
        id="alf_07_act2", title="The Copper Boat's Last Cargo — The Inland Road",
        activateNode="TUO", activateCond="() => !!S_story.alfC7A1Done",
        desc="Three coastal factors have already reported the beached objects to the hall's administrative officer. The factors' report reaches him in two hours. You have the manifest, which establishes prior claim — a departing master's instruction is not salvage — but the manifest must arrive before the assessment closes.",
        checkStat="STR", checkDC=12,
        passText="You reach the hall with an hour before the assessment closes. The manifest is presented first. The objects are received as commission goods, not salvage.",
        failText="The assessment closes before you arrive. The objects have been categorized as salvage. A brief jurisdictional argument is required before delivery proceeds.",
        checkPassFlag="alfC7A2Done",
    )
    quest(
        id="alf_07_act3", title="The Copper Boat's Last Cargo — The New King's Hall",
        activateNode="LDN", activateCond="() => !!S_story.alfC7A2Done",
        desc="The new king is young. Councilors are suspicious of unannounced arrivals with unusual objects. The iron rake is alarming in their context. The kantele is interpretable as a political gift with implications. The sealed clay pot they simply do not understand. They want to know what the objects mean before accepting them.",
        checkStat="CHA", checkDC=13,
        monster="Hall Guard", monsterHP=20, monsterAC=13,
        passText="You state the commission's terms once: the manifest names the hall; the objects are delivered per the commission; what happens next is the hall's business. The councilors accept that the hall's name on the manifest is sufficient authorization.",
        failText="You attempt to explain the rake or the kantele. One councilor asks about the sealed clay pot. The session extends thirty minutes.",
        checkPassFlag="alfC7A3Done",
    )
    quest(
        id="alf_07_act4", title="The Copper Boat's Last Cargo — The Last Road to Weimar",
        activateNode="LDN", activateCond="() => !!S_story.alfC7A3Done",
        desc="The delivery is made. The manifest has been countersigned by the administrative officer. A hall courier overtakes you on the road: the new king's council wants to attach a context note to the manifest requesting 'historical context on the origin of the items.' Politely phrased. A postponement tactic simultaneously.",
        checkStat="CON", checkDC=11,
        passText="The manifest is complete and signed and belongs to the archive's intake. A context note can be appended after filing. You continue to Weimar and inform Sweelinck that a context note from the hall's council may arrive separately.",
        failText="You pause on the road to draft a reply. The pause costs two hours. The context note question remains unresolved but the filing proceeds.",
        checkPassFlag="alfC7A4Done",
    )
    quest(
        id="alf_07_act5", title="The Copper Boat's Last Cargo — Final Commission Records",
        activateNode="WM", activateCond="() => !!S_story.alfC7A4Done",
        desc="Sweelinck reads the manifest: five objects, one hall, destination confirmed. He reads the administrative officer's countersignature. He sets it down. He opens the archive's final section: Final Commission Records — The Objects Left for the New World.",
        checkStat="WIS", checkDC=10,
        passText="'Väinämöinen left without explaining what he was leaving,' he says. 'That is the last thing he did before the copper boat disappeared. The objects are at the hall. The hall's council will spend a generation arguing about what they mean. The archive has the manifest.' He closes the archive. The Kalevala series is complete.",
        failText="Sweelinck reads the manifest carefully. He files the record. The Kalevala series is complete.",
        checkPassFlag="alfC7A5Done",
        activateMissionBit="alf_C7_complete",
        questComplete=True,
    )

    print("\nAll 35 acts imported. Running audit...")
    audit = api("get", "/api/audit")
    errors = audit.get("errors", [])
    node_count = audit.get("nodeCount", "?")
    quest_count = audit.get("questCount", "?")
    if errors:
        print(f"AUDIT ERRORS: {errors}")
    else:
        print(f"Audit clean. Nodes: {node_count}, Quests: {quest_count}")

if __name__ == "__main__":
    main()
