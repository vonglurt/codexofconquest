#!/usr/bin/env python3
# SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
# ═══════════════════════════════════════════════════════════════════════════
# ⚠️  ARCHAIC — OUT OF DATE.  Historical one-shot importer (POSTs to the
#     localhost:1367 WBAPI).  Content was long ago imported and lives in
#     play.html.  This script likely NO LONGER RUNS against the current
#     server/schema.  Kept for reference only — do not run without review.
#     Import history: BACKLOG.md / plan-archive.md / 1367-sources/.
# ═══════════════════════════════════════════════════════════════════════════
"""§IMPORT-102 RIX: Egil's Saga (Anon/Snorri, c.1240) — 35 acts, 7 cycles
No new nodes: YRK (York) and ISL (Althing Ground Iceland) already exist."""

import requests, subprocess

BASE = "http://localhost:1367"

def api(method, path, **kwargs):
    r = getattr(requests, method)(BASE + path, **kwargs)
    r.raise_for_status()
    return r.json()

def say(msg):
    subprocess.run(["./say.sh", msg], capture_output=True)

def quest(id, title, desc, activateNode, passText, failText, checkStat, checkDC,
          checkPassFlag=None, activateCond=None, questComplete=False,
          monster=None, monsterHP=None, monsterAC=None):
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
    if checkPassFlag:  payload["checkPassFlag"]  = checkPassFlag
    if activateCond:   payload["activateCond"]   = activateCond
    if questComplete:  payload["questComplete"]  = True
    if monster:        payload["monster"]        = monster
    if monsterHP:      payload["monsterHP"]      = monsterHP
    if monsterAC:      payload["monsterAC"]      = monsterAC
    api("post", "/api/quest", json=payload, headers={"X-Nonce": nonce})
    print(f"  OK: {id} — {title}")

def main():
    say("§IMPORT 102 RIX. Egil's Saga. Snorri Sturluson, circa 1240. "
        "No new nodes. York and Althing Ground Iceland already in map. Beginning import.")

    print("=== §IMPORT-102 RIX: Egil's Saga ===")
    print("  (No new nodes — YRK and ISL already exist)")

    say("Beginning cycle 1: The Head-Ransom. "
        "Egil composes Höfuðlausn overnight against a death sentence. "
        "All five acts at York. Token: The Höfuðlausn Scroll.")

    # --- Cycle 1: The Head-Ransom ---
    print("\n-- Cycle 1: The Head-Ransom --")
    quest("rix_01_act1", "The Completed Draft",
          "The room smells of lamp oil and cold sea-air and new ink. Egil is at the "
          "writing board. He is done. He has been composing since midnight with a raven "
          "at his window and the knowledge of what happens at dawn hanging over everything, "
          "and he is done. Twenty stanzas. He rolls the vellum, holds the candle over it, "
          "lets one drop of wax seal the roll. He looks at you. 'Arinbjörn needs this in "
          "his hands before the king finishes breakfast. If Gunnhildr's people see what "
          "it is, they'll burn it.' He holds it out. His voice is entirely calm.",
          "YRK",
          "You see it — the calm of a man who has already done the hardest thing and needs "
          "only this last act done correctly. You take the scroll. The wax seal is still "
          "faintly warm from the candle.",
          "You hesitate at the weight of what he is describing. He looks at you steadily. "
          "He says: 'The raven sat there all night. I wrote anyway. Take it.' You take it.",
          "WIS", 14,
          checkPassFlag="rixC1A1Done")

    quest("rix_01_act2", "The Corridor Watch",
          "The corridor is stone and torch-smoke. Two of Gunnhildr's household men stand "
          "at the far end, watching anyone who comes out of the holding rooms carrying "
          "something. They are not violent men — they are careful ones. If they identify "
          "the scroll, it goes to Gunnhildr, not to the hall. The scroll cannot be named. "
          "If it is opened and read it loses nothing — but if they know what it is, they "
          "know why it matters, and then it disappears into a fire and Egil recites "
          "nothing this morning.",
          "YRK",
          "You walk the corridor with purpose. They watch you pass and find nothing in "
          "your expression worth interrupting. You are through.",
          "One of them steps forward. He wants to see what you're carrying. You find a "
          "different answer — not a lie about the scroll, but a truth about your "
          "destination that makes the scroll irrelevant. You try again.",
          "CHA", 14,
          checkPassFlag="rixC1A2Done",
          activateCond="() => !!S_story.rixC1A1Done")

    quest("rix_01_act3", "Gunnhildr's Threshold",
          "The direct path to the great hall passes through a junction Gunnhildr's "
          "household controls. Her steward stands there — a polite, immovable man who "
          "says the king is not yet ready. The kitchen smell from the hall means Eirik "
          "finished breakfast minutes ago. The steward knows about the one-night grace "
          "and has instructions to make the morning go a different way. You find the "
          "argument that moves him. Then a second man steps out of the alcove — one "
          "who was not sent to delay, but to act.",
          "YRK",
          "He goes down. The steward looks at the floor and does not interfere. You "
          "walk through the junction to the hall corridor. The scroll is still sealed.",
          "He drives you back toward the junction. The scroll is still sealed. You "
          "recover your footing. You do not let go.",
          None, None,
          checkPassFlag="rixC1A3Done",
          activateCond="() => !!S_story.rixC1A2Done",
          monster="Gunnhildr's enforcer", monsterHP=20, monsterAC=13)

    quest("rix_01_act4", "Arinbjörn at the Hall Door",
          "Arinbjörn is at the door, dressed for the hall, awake since before midnight. "
          "He has been standing here on honor alone. When he sees you coming down the "
          "corridor with the scroll, his face does something between relief and bracing. "
          "The hall door is beginning to open behind him. Inside, Eirik is already seated. "
          "There is almost no time.",
          "YRK",
          "You put the scroll in his hands. You tell him: twenty stanzas, intact, sealed. "
          "He weighs it once. He nods. 'Stay close,' he says. 'If this goes wrong I need "
          "someone who can move.' He turns to the hall.",
          "The door opens before you reach him. Eirik can see the corridor now. "
          "Arinbjörn turns to buy you twenty seconds — a courtly delay, a formal greeting "
          "— and you reach him in that window.",
          "CON", 12,
          checkPassFlag="rixC1A4Done",
          activateCond="() => !!S_story.rixC1A3Done")

    quest("rix_01_act5", "The Recitation",
          "Egil stands at the hall's center, the scroll open in his hands, reciting. "
          "The hall is silent except for his voice. Eirik sits on the high seat with "
          "Gunnhildr at his shoulder. She is watching the room, not Egil — watching for "
          "the moment when someone acts. At the back of the hall, one of her agents has "
          "shifted his weight and his hand is moving toward his belt.",
          "YRK",
          "You see the hand move before the arm lifts. You catch Arinbjörn's eye. He "
          "shifts his position once. The agent freezes. Egil recites the twentieth stanza "
          "into complete silence. Eirik looks at the poet who just ransomed his own life "
          "with language. 'He will go free,' the king says. 'I will not kill the man "
          "who gave me this poem.'",
          "The agent moves before you see him. Arinbjörn catches it himself — barely — "
          "and you move together. The twentieth stanza continues. You settle back into "
          "position, shaken.",
          "WIS", 12,
          checkPassFlag="rixC1A5Done",
          activateCond="() => !!S_story.rixC1A4Done")

    say("Cycle 1 complete. Beginning cycle 2: The Raven's Errand. "
        "Token: The Raven Token. All five acts at York. "
        "The anonymous sympathy that enabled the poem to be heard.")

    # --- Cycle 2: The Raven's Errand ---
    print("\n-- Cycle 2: The Raven's Errand --")
    quest("rix_02_act1", "The Window",
          "The raven has been at Egil's window since midnight. You have been watching "
          "it since the lamp burned low, half-asleep against the wall while the poet "
          "worked. Now Egil is on his final stanza and the raven is still there and "
          "something about the way it holds its weight is wrong. It is not asking to be "
          "let in. It is waiting for you to come to it. Tied to its leg with a twist of "
          "fine green wool is a small carved wood-piece, a runic seal impressed into the "
          "binding, the seal intact. The raven has not come for Egil. It has come for "
          "whoever is willing to take this off its leg before Egil turns around.",
          "YRK",
          "The token is in your hand and you understand: it is not addressed to the man "
          "at the writing-board. It is addressed to whoever was awake, watchful, and "
          "willing. It is addressed to you. You close your fist around it and do not "
          "turn around. The raven leaves immediately.",
          "You hold the token for a moment and then set it on the table beside the lamp, "
          "meaning to think about it. In the morning Egil finds it himself and is furious "
          "that you didn't wake him. You lost the window in which the token could do "
          "its work.",
          "WIS", 12,
          checkPassFlag="rixC2A1Done")

    quest("rix_02_act2", "The Seal",
          "You step into the corridor to open it. The seal is pressed wax over a "
          "wood-peg closure — you break it with a thumbnail and the wool comes loose "
          "and the wood-piece unfolds into a narrow strip of vellum wrapped around the "
          "core. The message names Gunnhildr's legal challenge: a suborned hall-master's "
          "clerk, a prior challenge registered at first bell, three days until Eirik's "
          "patience runs out. The signature is a runic device and nothing else. You know "
          "this seal. You know the face. You will not name them.",
          "YRK",
          "You see it whole. The warning tells you the challenge is coming. The seal "
          "tells you the agent cannot proceed if it is visible at the moment of challenge "
          "— the person who sent this is someone the agent cannot publicly contradict. "
          "You hold a message and a weapon. You know which hand to put each in.",
          "You read the surface and miss the mechanism: that the seal itself is the "
          "counter-evidence. You carry the message to Egil without understanding how to "
          "deploy it, and Egil has to reconstruct the counter-move himself.",
          "WIS", 13,
          checkPassFlag="rixC2A2Done",
          activateCond="() => !!S_story.rixC2A1Done")

    quest("rix_02_act3", "The Corridor Watch",
          "Arinbjörn needs to know before first bell. Two of Gunnhildr's household men "
          "watch the corridor at three in the morning. They know your face. What they "
          "don't know is whether you are carrying anything. You have the token in your "
          "belt-pouch. You have nothing in your hands. You are walking toward them at "
          "three in the morning in the York court of Eirik Bloodaxe, which is either "
          "completely normal or immediately suspicious.",
          "YRK",
          "You cross at the exact pace of someone who has been sent on an errand below "
          "their interest. They look past you. You knock at Arinbjörn's door.",
          "One of the men steps forward and asks where you're going. You get through "
          "— you have a plausible answer — but they remember your face. When the moment "
          "comes in the hall they will be watching you specifically.",
          "DEX", 13,
          checkPassFlag="rixC2A3Done",
          activateCond="() => !!S_story.rixC2A2Done")

    quest("rix_02_act4", "Egil's Skeptic",
          "Arinbjörn has woken Egil. Egil has just finished the poem. He is not grateful "
          "for the interruption. He looks at the vellum strip. He looks at the wood-piece. "
          "He looks at you. 'Who sent this.' You know who sent it. You will not say. The "
          "sender's name in this room, spoken aloud, destroys the sender. The only thing "
          "you can give Egil is the certainty that the seal is genuine, the warning is "
          "accurate, and the mechanism will work if he trusts it — a stranger holding an "
          "anonymous message at three in the morning, asking him to act on information "
          "you cannot source.",
          "YRK",
          "Egil looks at the seal for a long moment. He puts the wood-piece in his own "
          "belt-pouch. He says nothing about who sent it. He understands the mechanism "
          "perfectly and will use it at the exact right moment. 'You held the window,' "
          "he says. That is all he says. He goes back to his room to wait for dawn.",
          "Egil is unconvinced. He goes to the recitation without the counter-move "
          "prepared. Arinbjörn has to improvise a counter-argument without the "
          "counter-evidence. The hearing is delayed one day instead of three.",
          "CHA", 12,
          checkPassFlag="rixC2A4Done",
          activateCond="() => !!S_story.rixC2A3Done")

    quest("rix_02_act5", "The First Bell",
          "The hall fills. Gunnhildr's agent moves toward the clerk's table from the "
          "left side. He will reach it before Egil can be introduced. The challenge will "
          "be registered. Three days, then Eirik's patience, then an axe. You are at "
          "the right side of the room. You step into his sightline. You hold the token's "
          "wood-piece where the runic seal is visible — not to the room, to him. He "
          "knows what the seal is. He knows what registering this challenge would cost "
          "the sender. He does the mathematics in three seconds.",
          "YRK",
          "He steps back from the clerk's table. The hall is silent. Egil recites twenty "
          "stanzas. Eirik listens. Afterward, in the yard, you open your hand. The Raven "
          "Token sits there. The sender will never ask for it back. It was always yours "
          "from the moment the raven left the window.",
          "Your hand trembles slightly. The agent reads uncertainty and moves toward the "
          "clerk again. You step directly into his path — visible to the room, a commotion "
          "Eirik notices. The recitation begins late into a hall already disrupted.",
          "WIS", 11,
          checkPassFlag="rixC2A5Done",
          activateCond="() => !!S_story.rixC2A4Done")

    say("Cycle 2 complete. Beginning cycle 3: Arinbjörnarkvíða. "
        "Token: Arinbjörnarkvíða autograph copy. "
        "Node route Althing Ground Iceland, Birka, Weimar.")

    # --- Cycle 3: Arinbjörnarkvíða ---
    print("\n-- Cycle 3: Arinbjörnarkvíða --")
    quest("rix_03_act1", "The Working Copy",
          "Egil's daughter Þorgerðr hands you the scroll at Borg farm. She says: this "
          "is not the version people recite. This is the version he kept. Two stanzas "
          "struck through with a correction mark, one marginal addition in a cramped "
          "hand, the final stanza rewritten at the bottom in slightly darker ink. "
          "Not a fair copy. The working copy, the one Egil kept. Every other version "
          "in circulation was made from this one.",
          "ISL",
          "You understand before the road why an autograph copy with corrections is a "
          "different document from any fair copy: the corrections are the record of what "
          "he found wrong in what he had said; the final version erased those discoveries "
          "from public view; the working copy holds them. Þorgerðr sets the scroll in "
          "your hands.",
          "You take the scroll. The distinction between working copy and fair copy settles "
          "on the road south — the corrections are not errors, they are the record of "
          "where he found what he had said wrong.",
          "WIS", 12,
          checkPassFlag="rixC3A1Done")

    quest("rix_03_act2", "The Skald at the Trading Post",
          "A Norse skald at a trading post on the coastal route has never seen the "
          "corrections and marginal addition in Arinbjörnarkvíða. He wants to make a "
          "copy from the autograph before it reaches Weimar. His copy would preserve "
          "what he finds there; it would also circulate it before the archive has "
          "received and catalogued the original.",
          "ISL",
          "The archive makes copies available after deposit. Not before. After the "
          "autograph is catalogued, the corrections will be part of the record the "
          "archive preserves. He gives you his address for the copy request.",
          "He is not satisfied by the routing. He follows you to the next waystation "
          "asking questions about the corrections. You board without opening the scroll.",
          "CHA", 12,
          checkPassFlag="rixC3A2Done",
          activateCond="() => !!S_story.rixC3A1Done")

    quest("rix_03_act3", "Gunnhildr's Network in Birka",
          "Gunnhildr's network in Birka is still active. A Gunnhildr agent at the dock "
          "identifies the scroll case by its markings — she has long maintained interest "
          "in every copy of Egil's work that contains corrections, because corrections "
          "sometimes contain what the public version suppressed. He approaches while you "
          "are at the dock.",
          "BK",
          "He is down in the harbor district. The scroll case is intact. You keep moving "
          "east toward the road to Weimar.",
          "He delays you long enough that the evening gate closes. You spend the night "
          "inside the city with the scroll before continuing in the morning.",
          None, None,
          checkPassFlag="rixC3A3Done",
          activateCond="() => !!S_story.rixC3A2Done",
          monster="Gunnhildr's network agent", monsterHP=20, monsterAC=12)

    quest("rix_03_act4", "The Road East",
          "Three days east of Birka, the road to Weimar. The scroll is in the case. "
          "The corrections are inside. Egil composed this for a man who was already at "
          "a distance that felt like permanent absence — Arinbjörn had sailed to Norway "
          "and could no longer be reached. The praise poem for a living man, written "
          "when the distance became what permanent absence would feel like. Keep moving.",
          "BK",
          "Three days. The scroll stays sealed. The corrections are the record of where "
          "he found what he had said wrong. The archive holds both: the finding and the "
          "correction.",
          "You think about the corrections on the road — what he crossed out, what he "
          "rewrote at the bottom. The thinking is not part of the delivery.",
          "WIS", 11,
          checkPassFlag="rixC3A4Done",
          activateCond="() => !!S_story.rixC3A3Done")

    quest("rix_03_act5", "Personal Memorial Records",
          "Sweelinck unrolls the scroll carefully. He notes the two corrections. He "
          "reads the marginal addition. He notes the final stanza in darker ink — the "
          "rewrite. He examines the hand throughout. He marks it: autograph copy, "
          "working draft, held by the poet. He sets it in the archive space.",
          "WM",
          "Sweelinck opens Personal Memorial Records. Every other version in circulation "
          "has been cleaned up. This one has the corrections. The corrections are the "
          "record of where he found what he had said wrong. The archive holds the version "
          "that shows the work.",
          "Sweelinck receives the scroll. He will examine the corrections in detail when "
          "he has a Norse scholar he trusts to read the hand accurately.",
          "WIS", 10,
          checkPassFlag="rixC3A5Done",
          activateCond="() => !!S_story.rixC3A4Done")

    say("Cycle 3 complete. Beginning cycle 4: Æthelstan's Compensation. "
        "Token: Æthelstan's Compensation Agreement. "
        "Node route York, Venice, Weimar.")

    # --- Cycle 4: Æthelstan's Compensation ---
    print("\n-- Cycle 4: Æthelstan's Compensation --")
    quest("rix_04_act1", "The Settlement Clause",
          "Æthelstan's court clerk at Winchester hands over the compensation document. "
          "The silver chests have been moved, the compensation has been paid, the legal "
          "obligation has been settled. Two chests of silver — extraordinary for a battle "
          "death. The document names Þórólf's death at Vínheiðr, specifies the amount, "
          "and contains a settlement clause that acknowledges the king's responsibility. "
          "That acknowledgment is unusual. Standard compensation for a battle death does "
          "not require acknowledgment of fault.",
          "YRK",
          "You understand before the road what the archive wants: not the outcome of the "
          "compensation, but the specific language of the acknowledgment — a king admitting "
          "responsibility for a battle death, in writing, under seal. The clerk hands "
          "it over.",
          "You take the document. The distinction between a receipt and an acknowledgment "
          "settles on the road south when you read the settlement clause carefully.",
          "WIS", 11,
          checkPassFlag="rixC4A1Done")

    quest("rix_04_act2", "The English Cleric",
          "An English cleric on the southern road has read the document in passing and "
          "wants to understand why Æthelstan acknowledged responsibility for a death in "
          "battle. Standard compensation does not require it. His question is precise and "
          "partly correct — the language is unusual. He has a point. The document travels "
          "to the archive regardless.",
          "YRK",
          "The archive holds the document because the unusual language is the document's "
          "contribution to the record of what compensation agreements can say. Both the "
          "settlement and the acknowledgment are in the same instrument. He accepts this "
          "and lets you continue south.",
          "He is not satisfied by the archival argument. He follows you to the next waystation "
          "continuing the discussion. You board without opening the seal again.",
          "CHA", 12,
          checkPassFlag="rixC4A2Done",
          activateCond="() => !!S_story.rixC4A1Done")

    quest("rix_04_act3", "The Venetian Collector",
          "A Venetian merchant in the harbor district who deals in legal documents wants "
          "to purchase the compensation agreement for a collection of royal "
          "acknowledgments of liability. He has the means and the collection is genuine. "
          "The document is not for sale.",
          "VEN",
          "The document belongs to the archive's intake, not to a private collection. "
          "After deposit, the archive can correspond about access. He gives you his "
          "address for correspondence after deposit.",
          "He is disappointed. He lets you leave, already drafting a letter to his "
          "correspondents in England to obtain a copy through other means.",
          "CHA", 13,
          checkPassFlag="rixC4A3Done",
          activateCond="() => !!S_story.rixC4A2Done")

    quest("rix_04_act4", "The Alpine Road North",
          "The Alpine road, north of Venice. Three days to Weimar. The document is in "
          "the sealed wallet. Æthelstan paid what was owed. Þórólf is still dead. The "
          "silver is buried somewhere in Iceland. The settlement clause acknowledged "
          "the king's responsibility and completed the legal obligation and left "
          "everything else exactly as it was. Keep moving.",
          "VEN",
          "Three days. The wallet stays sealed. The acknowledgment is in the settlement "
          "clause. The archive will note both: the amount and the language that surrounds "
          "it.",
          "You think about the settlement clause on the road north — what it would cost "
          "a king to write that sentence, and what it cost to not write it differently. "
          "The thinking is not part of the delivery.",
          "WIS", 11,
          checkPassFlag="rixC4A4Done",
          activateCond="() => !!S_story.rixC4A3Done")

    quest("rix_04_act5", "Battle Compensation Records",
          "Sweelinck reads the settlement clause. He notes the acknowledgment of "
          "responsibility — unusual for a battle death, as the clerk noted. He notes "
          "the specified amount: two chests of silver. He notes Egil's mark below "
          "the king's seal. He creates the category.",
          "WM",
          "Sweelinck opens Battle Compensation Records. The king paid double and "
          "acknowledged responsibility in the settlement language. Both facts are "
          "unusual. The archive holds the document because the unusual language is "
          "the document's contribution to the record of what compensation agreements "
          "can say.",
          "Sweelinck receives the document. He will read the settlement clause in full "
          "when he has a legal scholar he trusts to assess the acknowledgment's "
          "significance in English royal practice.",
          "WIS", 10,
          checkPassFlag="rixC4A5Done",
          activateCond="() => !!S_story.rixC4A4Done")

    say("Cycle 4 complete. Beginning cycle 5: Þorgerðr's Sonatorrek Account. "
        "Token: Þorgerðr's Account. "
        "Node route Althing Ground Iceland, Constantinople, Weimar.")

    # --- Cycle 5: Þorgerðr's Sonatorrek Account ---
    print("\n-- Cycle 5: Þorgerðr's Sonatorrek Account --")
    quest("rix_05_act1", "What Þorgerðr Did",
          "Þorgerðr hands you the account at Borg farm. She says: Sonatorrek exists "
          "because of what I did. This is what I did. She is not claiming credit — "
          "she is completing the record. After Böðvarr drowned, Egil stopped eating "
          "and refused to speak. He planned to die. She arrived and said she would die "
          "with him. Then she announced she would eat. She said she would live — but "
          "only if Egil composed a poem. He composed Sonatorrek over three days in "
          "darkness. The poem exists because of this. The account is in six stanzas "
          "in a hand that is not Egil's.",
          "ISL",
          "You understand before the road why the account matters: everyone who recites "
          "Sonatorrek knows the poem; no one who hears the poem knows what preceded its "
          "composition. The account makes the poem's survival legible as an act, not "
          "just an artifact. Þorgerðr hands it over.",
          "You take the account. The distinction settles on the road east: the poem is "
          "the artifact; the account is the record of the conditions under which the "
          "artifact became possible.",
          "WIS", 12,
          checkPassFlag="rixC5A1Done")

    quest("rix_05_act2", "The Norse Scholar",
          "A Norse scholar at a trading post wants to copy the account before it reaches "
          "the archive. He argues that the account belongs with every copy of Sonatorrek "
          "— that the two documents should travel together. The account is a separate "
          "document that the archive holds separately. The relationship between the two "
          "documents is itself the archive's contribution to the record.",
          "ISL",
          "The archive holds the account separately, and holds the relationship between "
          "it and the poem. That relationship is the archive's contribution — not both "
          "documents in the same hand, but both documents in the same catalogue. He "
          "accepts the distinction and gives you his address for the copy request.",
          "He is not persuaded by the archival separation. He follows you to the harbor "
          "asking questions about the six stanzas. You board without opening the scroll.",
          "CHA", 12,
          checkPassFlag="rixC5A2Done",
          activateCond="() => !!S_story.rixC5A1Done")

    quest("rix_05_act3", "The Byzantine Scholar",
          "A Byzantine scholar of Greek tragedy in Constantinople wants to discuss "
          "Þorgerðr's account as a parallel to tragic context documents from the "
          "Athenian tradition — the records of conditions under which tragedies were "
          "commissioned. His reading is sophisticated and partly correct. The discussion "
          "is for after deposit. The account travels first.",
          "CON",
          "The archive receives the document first. After deposit, correspondence about "
          "the parallel with Athenian context documents can be arranged. He gives you "
          "his address for after deposit and lets you continue west.",
          "He wants to hold the account for a month while he writes the comparison. You "
          "decline. He lets you leave, already composing the comparative analysis from "
          "what he has read in passing.",
          "CHA", 13,
          checkPassFlag="rixC5A3Done",
          activateCond="() => !!S_story.rixC5A2Done")

    quest("rix_05_act4", "West from Constantinople",
          "West from Constantinople, three weeks to Weimar. The account is in the "
          "wallet. Þorgerðr is at Borg farm. Egil is still alive, composing occasional "
          "verse, going blind. The poem he composed in three days in darkness because "
          "his daughter said she would live is in circulation. The conditions under which "
          "it was composed are in your wallet. Keep moving.",
          "CON",
          "Three weeks. The account stays sealed. The conditions of Sonatorrek's "
          "composition travel to the archive that will hold them beside the poem "
          "itself.",
          "You think about the six stanzas on the road west — what Þorgerðr said when "
          "she arrived, what Egil said back, how it began. The thinking is not part "
          "of the delivery.",
          "WIS", 11,
          checkPassFlag="rixC5A4Done",
          activateCond="() => !!S_story.rixC5A3Done")

    quest("rix_05_act5", "Grief Work Records",
          "Sweelinck reads the account. He reads the six stanzas. He notes the hand "
          "— not Egil's — and the sequence: what Egil was like when she arrived, what "
          "she said, what he said, how the poem began, the three days, when he came "
          "out of the room. He creates the category.",
          "WM",
          "Sweelinck opens Grief Work Records. Sonatorrek is in circulation. What is "
          "not in circulation is how it began. Þorgerðr wrote it down because she "
          "thought the poem's existence should include a record of the conditions of "
          "its existence. The archive agrees.",
          "Sweelinck receives the account. He will read it in full when he has time "
          "to set it beside his copy of Sonatorrek and read both in sequence.",
          "WIS", 10,
          checkPassFlag="rixC5A5Done",
          activateCond="() => !!S_story.rixC5A4Done")

    say("Cycle 5 complete. Beginning cycle 6: Ásgerðr's Inheritance Record. "
        "Token: Ásgerðr's Inheritance Ruling. "
        "Node route Althing Ground Iceland, Rome, Weimar.")

    # --- Cycle 6: Ásgerðr's Inheritance Record ---
    print("\n-- Cycle 6: Ásgerðr's Inheritance Record --")
    quest("rix_06_act1", "The Althing Clerk's Copy",
          "The Althing clerk hands over the certified copy of the ruling. He notes: "
          "this case is still cited in subsequent Althing proceedings. The case record "
          "contains the full argument Egil made: three steps, the specific legal "
          "interpretation that extended daughters' children's rights when no male "
          "heirs remained in direct line, and the lawspeaker's ruling. The specific "
          "passage that determined the outcome is underlined.",
          "ISL",
          "You understand before the road what the archive wants: not the outcome of the "
          "case, but the specific argument Egil made — the three steps, the underlined "
          "passage — because that argument is the innovation, and the innovation is what "
          "the archive holds. The clerk hands it over.",
          "You take the ruling. The distinction between outcome and argument settles on "
          "the road south: the outcome is that Ásgerðr received her inheritance; the "
          "argument is why that was possible, and the argument is what can be used again.",
          "WIS", 12,
          checkPassFlag="rixC6A1Done")

    quest("rix_06_act2", "The Norwegian Legal Scholar",
          "A Norwegian legal scholar on the southern sea route wants to copy the ruling "
          "for a collection of innovative Althing decisions. He specifically wants the "
          "underlined passage — he has heard of the case and knows which passage "
          "created the precedent. The archive holds the original; he can apply for "
          "access after deposit.",
          "ISL",
          "The archive holds the original with the underlined passage intact and in "
          "context. After deposit, access can be arranged for scholarly purposes. He "
          "gives you his address for the copy request.",
          "He is not satisfied by the routing. He follows you to the harbor continuing "
          "the argument. You board without opening the document.",
          "CHA", 12,
          checkPassFlag="rixC6A2Done",
          activateCond="() => !!S_story.rixC6A1Done")

    quest("rix_06_act3", "The Church Official in Rome",
          "A church official at Rome who handles inheritance disputes in Norse merchant "
          "communities wants to use the ruling as a template for cases where daughters' "
          "rights are contested. His interest is practical — the ruling would be directly "
          "useful in three current proceedings. The archive can correspond about access "
          "after deposit. The ruling travels first.",
          "ROM",
          "The archive receives it first. After deposit, the archive can correspond about "
          "access for inheritance proceedings where the ruling would apply. He gives you "
          "a letter of introduction to the archive's legal correspondence clerk and lets "
          "you continue north.",
          "He wants to retain the ruling pending the current proceedings. You decline. "
          "He lets you leave with a formal note that the Church may request access "
          "through proper channels.",
          "CHA", 13,
          checkPassFlag="rixC6A3Done",
          activateCond="() => !!S_story.rixC6A2Done")

    quest("rix_06_act4", "North from Rome",
          "North from Rome, five days to Weimar. The ruling is in the sealed wallet. "
          "Ásgerðr received her inheritance. Egil won it through legal argument, which "
          "is more characteristic of him than his reputation as a berserk skald suggests. "
          "The underlined passage created a precedent. Keep moving.",
          "ROM",
          "Five days. The wallet stays sealed. The ruling travels to the archive where "
          "the argument it contains will be preserved beside the head-ransom poem and "
          "the curse transcript and the other documents of the same man.",
          "You think about the underlined passage on the road north — the three-step "
          "argument, how the logic assembled itself. The thinking is not part of "
          "the delivery.",
          "WIS", 11,
          checkPassFlag="rixC6A4Done",
          activateCond="() => !!S_story.rixC6A3Done")

    quest("rix_06_act5", "Inheritance Records",
          "Sweelinck reads the three-step argument. He notes the underlined passage. "
          "He reads the lawspeaker's ruling that followed it. He notes that the case "
          "is cited in subsequent Althing proceedings. He creates the category.",
          "WM",
          "Sweelinck opens Inheritance Records. Egil is remembered for poems. This is "
          "a legal argument. The archive holds both. The underlined passage is why the "
          "case is still cited at the Althing thirty years later.",
          "Sweelinck receives the ruling. He will read the three-step argument in full "
          "when he has time to assess whether the underlined passage's logic has "
          "parallels in other legal traditions the archive holds.",
          "WIS", 10,
          checkPassFlag="rixC6A5Done",
          activateCond="() => !!S_story.rixC6A4Done")

    say("Cycle 6 complete. Beginning cycle 7: Egil's Last Poem. "
        "Token: Egil's Last Poem wax tablet. "
        "Node route Althing Ground Iceland, London, Weimar. This is the final cycle.")

    # --- Cycle 7: Egil's Last Poem ---
    print("\n-- Cycle 7: Egil's Last Poem --")
    quest("rix_07_act1", "The Farm-Hand's Tablet",
          "The farm-hand at Borg hands you the wax tablet with both hands. He kept it "
          "because he didn't know what else to do with it. Egil dictated, he wrote, "
          "Egil went quiet. The tablet has been sitting in the hall for two months. "
          "The poem is what Egil would have recited at the Althing if his family had "
          "not stopped him — he had wanted to scatter his buried silver over the crowd "
          "and recite this while they scrambled. His family stopped him. He composed "
          "it anyway, from his chair, and then went quiet.",
          "ISL",
          "You understand before the road why the archive wants an unperformed poem: "
          "not because it is the best poem, but because the gap between composition and "
          "performance is itself a record — the poem exists, the audience never heard "
          "it, and the distance between those two facts is what happened to the "
          "strongest poet in Iceland at the end of his life.",
          "You take the tablet. The distinction settles on the road west: a performed "
          "poem enters the tradition; an unperformed one enters only the archive, which "
          "is the only place that holds the gap between composition and performance as "
          "a category worth preserving.",
          "WIS", 11,
          checkPassFlag="rixC7A1Done")

    quest("rix_07_act2", "The Skald on the Western Route",
          "A Norse skald on the trading route west wants to perform the poem from the "
          "tablet at the next major court he reaches. His argument: unperformed poems "
          "belong to the tradition, not to an archive. The tradition decides what is "
          "received. The archive holds what the tradition has not yet decided to receive "
          "— after deposit, the poem can be heard; the first performance should not be "
          "from a transcript made on a ship.",
          "ISL",
          "The archive holds what the tradition has not yet decided to receive. After "
          "deposit, a copy for performance can be arranged. The first performance from "
          "an authenticated copy is more useful to the tradition than one from a "
          "shipboard transcript. He gives you his address and lets you continue west.",
          "He is not persuaded by the archival argument. He follows you to the harbor. "
          "You board without letting him copy the tablet.",
          "CHA", 12,
          checkPassFlag="rixC7A2Done",
          activateCond="() => !!S_story.rixC7A1Done")

    quest("rix_07_act3", "The English Court Collector",
          "An English court collector of Norse poetry in London wants to add the last "
          "poem to his collection. His collection will be read — the poem would have "
          "an audience through it, which Egil's last poem has not yet had. The offer "
          "is genuine. The tablet travels to Weimar. After deposit, the poem can be "
          "copied for his collection.",
          "LDN",
          "The archive receives the tablet first. After deposit, a copy for the "
          "collection can be arranged. The poem will have an audience through his "
          "collection — but the first audience should be the archive's record, not "
          "a private collection copy. He gives you his address for after deposit.",
          "He is disappointed by the delay. He lets you leave, already writing to "
          "his Norse correspondents to obtain a copy through other means.",
          "CHA", 12,
          checkPassFlag="rixC7A3Done",
          activateCond="() => !!S_story.rixC7A2Done")

    quest("rix_07_act4", "Three Days to Weimar",
          "Three days east to Weimar. The wax tablet is in the case. The farm-hand's "
          "script is in the wax. Egil is alive at Borg, blind and quiet. The poem he "
          "wanted to scatter over a crowd at the Althing is in the case. Keep moving. "
          "The tablet has a destination.",
          "LDN",
          "Three days. The tablet stays sealed. The poem in the farm-hand's untrained "
          "script travels to the archive where the head-ransom poem and the curse "
          "transcript and the other documents of the same man are held.",
          "You think about the poem for most of the road east — what he would have "
          "said to the crowd while the silver scattered, whether the Althing would "
          "have understood what it was hearing. The thinking is not part of the delivery.",
          "WIS", 11,
          checkPassFlag="rixC7A4Done",
          activateCond="() => !!S_story.rixC7A3Done")

    quest("rix_07_act5", "Unperformed Work Records",
          "Sweelinck reads the tablet. He reads the farm-hand's script line by line. "
          "He reads the poem. He closes the tablet case and opens the category.",
          "WM",
          "Sweelinck opens Unperformed Work Records. He wanted to scatter the silver "
          "at the Althing and recite this while people scrambled for coins. His family "
          "stopped him. He composed it anyway. No one has heard it yet. The archive "
          "holds it until someone is ready to.",
          "Sweelinck receives the tablet. He will read the poem in full when he has "
          "time to set it beside Höfuðlausn and Sonatorrek and read all three as "
          "the arc of a single poet's life.",
          "WIS", 10,
          checkPassFlag="rixC7A5Done",
          activateCond="() => !!S_story.rixC7A4Done",
          questComplete=True)

    say("All 35 quests imported for RIX Egil's Saga.")

    # --- Save and Audit ---
    print("\n-- Save --")
    api("post", "/api/save", json={})
    print("  Saved.")

    print("\n-- Audit --")
    r = requests.get(BASE + "/api/audit").json()
    p = {x["section"]: x["count"] for x in r["parse"]}
    print(f"  NODE_MAP: {p.get('NODE_MAP')}")
    print(f"  QUEST_DB: {p.get('QUEST_DB')}")

if __name__ == "__main__":
    main()
