#!/usr/bin/env python3
# SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson and Claude
# ═══════════════════════════════════════════════════════════════════════════
# ⚠️  ARCHAIC — OUT OF DATE.  Historical one-shot importer (POSTs to the
#     localhost:1367 WBAPI).  Content was long ago imported and lives in
#     roll2hit-v3.html.  This script likely NO LONGER RUNS against the current
#     server/schema.  Kept for reference only — do not run without review.
#     Import history: BACKLOG.md / plan-archive.md / 1367-sources/.
# ═══════════════════════════════════════════════════════════════════════════
"""§IMPORT-101 VBY: Grettir's Saga (Anon, c.1310) — 35 acts, 7 cycles"""

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
    say("§IMPORT 101 VBY. Grettir's Saga. Anonymous, circa 1310. "
        "Creating nodes Reykjaness shore-farm and burial mound on the Norwegian coast.")

    print("=== §IMPORT-101 VBY: Grettir's Saga ===")

    # --- Nodes ---
    print("\n-- Nodes --")
    create_node("RKN", "beach", "Reykjaness Shore-Farm — The Last Fire",
                1, 84, 106,
                "A low stone farmhouse at the edge of winter sea: frost on the thatch, salt in "
                "everything, the coastal road running north and south above the cliff. The path "
                "down to grey stones and grey water is narrow and steep. The fire inside is the "
                "only warmth on this stretch of coast for twenty miles in either direction.")
    create_node("BWH", "ruins", "Burial Mound — Norwegian Coastal Headland",
                1, 80, 114,
                "A grass-covered hill above a Norwegian coastal headland: stone entrance-post half "
                "buried in heather, the entrance seal cut and badly re-tied by someone who went no "
                "further than the threshold. Below the stone: old wood framing, old bones, old dark, "
                "and something in a carved chair that has been waiting for a long time.")

    say("Nodes created. Beginning cycle 1: The Fire-Fetch. "
        "Source: Grettir's Saga, anonymous. "
        "Node route Reykjaness shore-farm to Birka cliff-shore. "
        "Token: The Sealed Fire-Pot.")

    # --- Cycle 1: The Fire-Fetch ---
    print("\n-- Cycle 1: The Fire-Fetch --")
    quest("vby_01_act1", "The Asking",
          "A farmhouse at the sea's edge. Salt through the door-gaps. The fire is low. "
          "The woman — Aldis, a widow, not unkind — stands at the hearth and watches the door. "
          "It opens. Grettir Ásmundarson fills the frame. He is soaked, his lips pale, his "
          "hands at his sides and shaking. He cannot grip a knife. He cannot carry a sealed "
          "pot through a patrol zone. He asks for fire. The woman looks past him. She looks at you.",
          "RKN",
          "She reaches into the hearth. The coal goes into the clay pot. She presses the "
          "beeswax seal closed and holds the pot out to you — not to him. Her eyes say what "
          "she cannot: take it before I remember the law. You take it. Grettir's hands close "
          "on air. He nods once. He steps back into the dark.",
          "She steps back from the hearth and shakes her head. The coal dims. Grettir's jaw "
          "tightens in the doorway. You try again — a different argument, a smaller ask, "
          "something she can say she did not understand. The coal goes in eventually.",
          "CHA", 14,
          checkPassFlag="vbyC1A1Done")

    quest("vby_01_act2", "The Byre-Men",
          "The yard. Frost on everything. Two farmhands in the byre's entrance — men who "
          "couldn't sleep, or who were watching. One of them sees the wool bundle in your "
          "arms. His eyes move to the wet footprints that cross the yard toward the road. "
          "The other says nothing. He is looking at the dark where Grettir disappeared. "
          "The road is burning away behind you. Dawn is not far off. The patrol changes at "
          "first light.",
          "RKN",
          "You tell them what they need to hear. They are not brave men, and the dark is "
          "thick. They step back into the byre. You walk through the yard with the fire-pot "
          "warm against your chest.",
          "One of them steps forward. His voice drops: 'That's a fire-pot.' He wants payment "
          "for his silence. The road is burning away. You find the price and pay it. "
          "The night costs you time.",
          "CHA", 14,
          checkPassFlag="vbyC1A2Done",
          activateCond="() => !!S_story.vbyC1A1Done")

    quest("vby_01_act3", "The Road-Gate",
          "The patrol has strung a rope across the cliff road. Four men. One torch. They "
          "are looking for someone specific — they know the swimmer came ashore somewhere "
          "tonight. The captain's eyes move from your face to the shape under your cloak. "
          "In the road's shadow, fifty yards back, the shape that is Grettir does not move. "
          "He told you: do not look toward me. One of the riders circles behind you. "
          "He has seen the silhouette. He draws.",
          "RKN",
          "He is down on the road. The other riders pull their horses back — they are not "
          "paid to stand against a man who holds the road like this. You walk through the "
          "gate. The fire-pot is still sealed.",
          "The outrider drives you back toward the gate. The other men are watching now. "
          "The fire-pot is still sealed but you are losing ground. You recover your footing. "
          "You do not let go of the pot.",
          None, None,
          checkPassFlag="vbyC1A3Done",
          activateCond="() => !!S_story.vbyC1A2Done",
          monster="Patrol outrider", monsterHP=20, monsterAC=13)

    quest("vby_01_act4", "The Shore Approach",
          "The path down the cliff face is steep and angled. Grettir said: not the main "
          "path. Take the goat path, the one with the loose stone at the second curve. "
          "At the second curve there is a rope, strung at chest height across the path. "
          "And below the rope, a large loose stone positioned to roll and carry sound to "
          "the shore below. Someone set this for you. The shore is thirty feet below. "
          "There is not enough light to go back.",
          "RKN",
          "You see the rope in the last of the starlight — a dark line across dark path. "
          "You step over it. You reach down and push the stone back from the edge, gently, "
          "until it holds. You walk down to the shore unannounced.",
          "Your chest hits the rope. The stone rolls. Somewhere below, a man's head turns "
          "toward the cliff path. You stop. You wait in the dark until the sound resolves "
          "into nothing. Then you try the path again with more care.",
          "WIS", 14,
          checkPassFlag="vbyC1A4Done",
          activateCond="() => !!S_story.vbyC1A3Done")

    quest("vby_01_act5", "The Crossing",
          "He is there. Knee-deep, turned toward you. His palms are still pale from the "
          "first swim, shaking slightly — not with fear, with cold that has never fully "
          "left. He holds out both hands. Above the cliff road, a patrol rider has stopped "
          "and is looking down toward the shore — not clearly, not yet, but looking. "
          "The fire-pot is in your hands. The sea is open between here and Drangey.",
          "BK",
          "You walk to the water. He takes the pot. Both hands around the clay — one "
          "breath, just the warmth. His eyes come up to yours: winter-sea color. "
          "'One witness is enough,' he says. He turns and wades out. His arm rises above "
          "the surface, the pot above the sea. The patrol rider looks down and finds a "
          "person standing at the water with nothing in their hands. A fisherman at dawn. "
          "He rides on.",
          "You hesitate. The rider looks harder. His horse turns toward the cliff path. "
          "You breathe. You still your feet. You try again — just a person at the shore, "
          "nothing in their hands, nothing to see.",
          "CON", 12,
          checkPassFlag="vbyC1A5Done",
          activateCond="() => !!S_story.vbyC1A4Done")

    say("Cycle 1 complete. Beginning cycle 2: The Barrow-Night. "
        "Token: The Torch. All five acts underground at the burial mound.")

    # --- Cycle 2: The Barrow-Night ---
    print("\n-- Cycle 2: The Barrow-Night --")
    quest("vby_02_act1", "The Barrow Entrance",
          "The mound is a grass-covered hill above the coastal headland. The stone "
          "entrance-post is half-buried in heather. Someone cut the entrance seal — old "
          "wax, old rope — a long time ago and then thought better of going in. The seal "
          "has been re-tied, badly. Grettir stands at the entrance examining the rope with "
          "the look of a man who has already done his accounting and found it acceptable. "
          "He turns to you and holds out a sealed oil-lamp. 'Hold this.' He begins "
          "unwinding the rope from the entrance-post.",
          "BWH",
          "You take the lamp and step over the threshold stone without breaking pace. "
          "Grettir looks at you once. He nods in the manner of someone revising an "
          "estimate upward. You descend into the barrow with the torch.",
          "You hesitate at the threshold. Grettir is already inside by the time you "
          "move — his feet disappearing into the darkness ahead of you, waiting for the "
          "light you are holding, which is not yet underground. He says nothing about "
          "the three seconds.",
          "CON", 12,
          checkPassFlag="vbyC2A1Done")

    quest("vby_02_act2", "The Chamber",
          "The first chamber is narrow and low. Old wood-framing along the walls, dry "
          "and dark. The smell of stone and something older than stone. At the far end, "
          "in a carved wooden chair, sits the dead man — the barrow-wight — in the shape "
          "he had when he was buried, with the additions that come from a long time in "
          "the dark. He moves when the light reaches him. Grettir moves to meet him. "
          "The space is too narrow for both to move freely, and his sword-arm needs a "
          "specific angle that puts your torch-arm directly in the path of the wight's "
          "counter-reach.",
          "BWH",
          "You hold the angle. Arm extended, wrist steady, the light aimed at the wight's "
          "upper body through the first exchange. Grettir's first strike is exact. "
          "The wight is hurt. The fight continues. You have not moved.",
          "You step back once. The light angle drops. Grettir's first strike hits the "
          "wooden framing of the wall. The wood dust goes up. The chamber is now darker "
          "than it was.",
          "WIS", 12,
          checkPassFlag="vbyC2A2Done",
          activateCond="() => !!S_story.vbyC2A1Done")

    quest("vby_02_act3", "The Reach",
          "The wight reaches for the torch. Not for Grettir. Not for the treasure. "
          "For the torch. It has been in the dark for a long time and the light is the "
          "threat. It is not wrong. It is also faster than a dead man should be.",
          "BWH",
          "You pull the lamp back and to the left in a motion that keeps the flame level "
          "— the wight's hand passes through where the lamp was and finds nothing. "
          "Grettir, in the same instant, finds what he was looking for. The wight is "
          "going to lose this fight. It knows it now.",
          "The wight's hand closes on the lamp-housing. The flame gutters. For two "
          "seconds the chamber is nearly dark. Grettir fights by sound. When the light "
          "returns, the wick has been disturbed. Less time remaining.",
          "DEX", 13,
          checkPassFlag="vbyC2A3Done",
          activateCond="() => !!S_story.vbyC2A2Done")

    quest("vby_02_act4", "The Treasure Chamber",
          "The wight has retreated to the innermost chamber. The treasure-room is framed "
          "with old oak that has been standing for longer than the longship that carries "
          "most Norsemen's sense of time. At the far end: a chest, iron-banded, not "
          "locked. The old oak framing is rotting at the joint-points. Grettir's second "
          "exchange with the wight — necessary, final — will bring at least one beam "
          "down. Reach the chest before the beam falls, push it to the entrance side "
          "of the chamber, and hold the torch above the debris.",
          "BWH",
          "You reach the chest before the beam. Grettir's final strike brings the beam "
          "down behind you — you have the chest in one hand and the torch in the other "
          "and you are past the collapse zone. Grettir looks at you from the near side "
          "of the fallen wood and decides to revise his estimate upward again.",
          "The beam falls. The chest is half-buried under old wood. The torch is in your "
          "hand and lit but you are pinned under a cross-beam for thirty seconds while "
          "Grettir finishes the wight above you. He pulls you out. The chest is "
          "recovered but the lamp is at half its remaining fuel.",
          "STR", 13,
          checkPassFlag="vbyC2A4Done",
          activateCond="() => !!S_story.vbyC2A3Done")

    quest("vby_02_act5", "The Threshold",
          "They are at the barrow entrance. The stone threshold above them. The night "
          "air visible through the entrance-post gap — the actual night, with the stars "
          "in it. Grettir carries the chest. He stops at the threshold and looks back "
          "at the chamber once. 'The light held.' He says it as an observation, not a "
          "compliment. He steps out. The torch is burning at the last quarter of its "
          "oil. The barrow behind you is dark now. The torch belonged to the "
          "barrow-night. The barrow-night is over.",
          "BWH",
          "Two fingers across the wick at the threshold. The darkness inside the "
          "barrow is now the barrow's darkness, not something you carried out. You step "
          "over the threshold stone into the night air — cold, heather, sea wind. "
          "Grettir presses a coin into your hand on the path, without ceremony.",
          "You carry the torch back to camp still burning — the path is rough and the "
          "starlight is thin. A practical decision. Grettir, arriving at camp ahead of "
          "you, watches you approach with the still-burning torch and says nothing. "
          "The lamp runs out on its own an hour later.",
          "WIS", 11,
          checkPassFlag="vbyC2A5Done",
          activateCond="() => !!S_story.vbyC2A4Done")

    say("Cycle 2 complete. Beginning cycle 3: Glámr's Dying Curse. "
        "Token: Glámr's Curse Transcript. Node route Reykjaness, Birka, Weimar.")

    # --- Cycle 3: Glámr's Dying Curse ---
    print("\n-- Cycle 3: Glámr's Dying Curse --")
    quest("vby_03_act1", "The Farmer's Sealed Record",
          "The farmer of Þórhallsstaðir hands you the birch-bark transcript at the "
          "coastal road. He has kept it sealed for seven years, uncertain who it belongs "
          "to. He was present at the wrestling match. He wrote down what Glámr said the "
          "morning after, because he wanted a record of what had entered his household "
          "and what left with it. It is not a prayer, not a rune inscription — it is a "
          "witness record of what a dying enemy said to the man who was killing him.",
          "RKN",
          "You understand what the archive wants before the road: not the curse as magic, "
          "but the curse as the exact form in which one man's last strength entered "
          "another man's life permanently. The farmer holds your gaze for a moment. "
          "He hands over the sealed transcript.",
          "You take the transcript without fully demonstrating you understand what it is. "
          "The farmer's uncertainty about whether you understand what you are carrying "
          "follows it south toward Birka.",
          "WIS", 12,
          checkPassFlag="vbyC3A1Done")

    quest("vby_03_act2", "The Priest on the Coastal Road",
          "A Norse priest on the coastal road wants to burn the transcript on the grounds "
          "that keeping a written curse preserves its efficacy. His theology is internally "
          "consistent. He is not hostile — he is protective of travelers who carry such "
          "things without fully knowing what they carry.",
          "RKN",
          "Grettir is already outlawed and afraid of the dark. The efficacy question is "
          "settled. What the archive holds is the record of the words spoken, not the "
          "mechanism of their power. The priest considers this. He lets you pass.",
          "He is not persuaded by the archival argument. You find an alternate route "
          "before he escalates to action. His theology is correct about the mechanism; "
          "it is not correct about what the document is for.",
          "CHA", 12,
          checkPassFlag="vbyC3A2Done",
          activateCond="() => !!S_story.vbyC3A1Done")

    quest("vby_03_act3", "Þórir's Kinsmen",
          "Two men from the household of Þórir — whose father was killed by Grettir "
          "before the Glámr encounter — have been told the transcript exists. For them "
          "it is evidence in a blood-feud proceeding at the Althing. They want the "
          "document to support a compensation claim. Grettir's heroism and Grettir's "
          "crimes are not separate facts, and the document contains both ends of the "
          "same man. They move when you enter the Birka harbor square.",
          "BK",
          "They are down in the harbor square. The transcript is intact in the wallet. "
          "You keep moving east toward the road to Weimar.",
          "One of them drives you back against the harbor wall. The other closes from "
          "the left. You clear the square before anyone decides to involve the harbormaster.",
          None, None,
          checkPassFlag="vbyC3A3Done",
          activateCond="() => !!S_story.vbyC3A2Done",
          monster="Þórir's kinsmen", monsterHP=19, monsterAC=12)

    quest("vby_03_act4", "The Road to Weimar",
          "The road east to Weimar. The transcript is in the wallet. The curse is "
          "written out on the birch bark. You know the clauses by now — fear of darkness, "
          "strength turning to ill, perpetual outlawry, greatness withheld. You have "
          "carried them for three days. Keep moving. The words are a record. They do "
          "not do more than that at this distance.",
          "BK",
          "Three days. The transcript stays sealed. The curse is a record of a moment "
          "that is already complete. You deliver it intact.",
          "You spend time on the road thinking about the clauses in order — whether they "
          "were accurate, whether a dying man's words constitute a mechanism or a "
          "description. Neither question belongs to the delivery.",
          "WIS", 11,
          checkPassFlag="vbyC3A4Done",
          activateCond="() => !!S_story.vbyC3A3Done")

    quest("vby_03_act5", "Curse Records",
          "Sweelinck reads the birch-bark transcript. He notes the three witness "
          "signatures. He reads each clause in order: fear of the dark, strength to ill, "
          "outlawry, greatness withheld. He notes that Grettir is currently outlawed and "
          "afraid of the dark. He creates the category.",
          "WM",
          "Sweelinck opens Curse Records. Glámr said it. Three people heard it. The "
          "farmer wrote it down the morning after. The archive holds the form of the "
          "words, not an opinion about their mechanism. The correlation between the "
          "clauses and the man's current condition is noted without comment.",
          "Sweelinck receives the transcript. He will read it when he has time to examine "
          "the witness signatures in the proper order. The archive holds it in the meantime.",
          "WIS", 10,
          checkPassFlag="vbyC3A5Done",
          activateCond="() => !!S_story.vbyC3A4Done")

    say("Cycle 3 complete. Beginning cycle 4: Grettir's Outlawry Sentence. "
        "Token: Grettir's Outlawry Sentence. Node route Reykjaness, Venice, Weimar.")

    # --- Cycle 4: Grettir's Outlawry Sentence ---
    print("\n-- Cycle 4: Grettir's Outlawry Sentence --")
    quest("vby_04_act1", "The Lawspeaker's Clerk",
          "The lawspeaker's clerk hands over a certified copy from the Althing record. "
          "He notes: the sentence is not secret — it is the law; it is public; carrying "
          "it to Weimar is not removing it from Icelandic jurisdiction. The document "
          "names Grettir Ásmundarson, lists the accumulated charges, declares him "
          "skógarmaðr — forest-man, outlaw — for life, and specifies the terms that make "
          "helping him an act of complicity in the original offense.",
          "RKN",
          "You understand before the road what the archive specifically wants: not the "
          "charges as a legal argument — those are contested — but the specific language "
          "of the declaration: 'skógarmaðr,' 'for life,' and the clause that made helping "
          "him illegal. The clerk nods. He hands over the sealed copy.",
          "You take the copy. The distinction between the charges as argument and the "
          "language of the declaration as document settles on the road south.",
          "WIS", 11,
          checkPassFlag="vbyC4A1Done")

    quest("vby_04_act2", "The Norwegian Merchant",
          "A Norwegian merchant on the sea route south who knows Grettir — he has seen "
          "him help a farm household against raiders — wants to know why the outlawry "
          "document leaves Iceland. His objection: the sentence and the man are not the "
          "same thing. He is not wrong. He wants to know why the document that makes "
          "the man's heroism illegal should be preserved alongside the record of the "
          "heroism.",
          "RKN",
          "The archive holds the sentence because the gap between what a man does and "
          "what the law says about him is exactly the kind of record the archive is "
          "built for. Both things are true about the same man. The document holds the "
          "law's account. He lets you continue south.",
          "He is not persuaded. You find an alternate sea route. His objection was not "
          "wrong; it did not account for what the archive holds and why.",
          "CHA", 12,
          checkPassFlag="vbyC4A2Done",
          activateCond="() => !!S_story.vbyC4A1Done")

    quest("vby_04_act3", "The Venetian Scholar",
          "A Venetian legal scholar in the harbor district who collects examples of "
          "outlawry proceedings from European legal systems wants to add this to his "
          "collection. He offers a substantial sum for an original — Althing proceedings "
          "are rare this far south. He also asks whether the record of the heroic deeds "
          "can be obtained separately.",
          "VEN",
          "The sentence travels to the archive. His collection may already contain a "
          "copy through other channels — the Althing's proceedings are public record. "
          "The heroic deeds are in separate documents that are also in transit. He "
          "accepts the archival routing and gives you his address for correspondence.",
          "He is disappointed by the refusal to sell. He lets you leave, already drafting "
          "a letter to his correspondents in Iceland to obtain a copy through other means.",
          "CHA", 13,
          checkPassFlag="vbyC4A3Done",
          activateCond="() => !!S_story.vbyC4A2Done")

    quest("vby_04_act4", "The Alpine Road",
          "Alpine road north of Venice. Three days to Weimar. The lawspeaker's seal is "
          "on the copy in the wallet. Grettir is alive and outlawed on an island "
          "somewhere off the Icelandic coast, and the document you are carrying is why "
          "helping him is illegal. Keep moving.",
          "VEN",
          "Three days. The wallet stays sealed. The road is cold and clear. You deliver "
          "the sentence intact without adding anything to the lawspeaker's language.",
          "You think about the clause on the road north — the one that made helping him "
          "illegal. You carried fire to Grettir at Reykjaness. The sentence is in your "
          "wallet. The contradiction is not your problem to resolve.",
          "WIS", 11,
          checkPassFlag="vbyC4A4Done",
          activateCond="() => !!S_story.vbyC4A3Done")

    quest("vby_04_act5", "Outlawry Records",
          "Sweelinck reads the declaration clause. He notes the term 'skógarmaðr' and "
          "the lawspeaker's seal. He notes the accumulated charges and the term. He "
          "notes that the archive also holds documents of the man's deeds. He creates "
          "the category.",
          "WM",
          "Sweelinck opens Outlawry Records. The heroic deeds are not in the sentence. "
          "The sentence is about the fires and the deaths. Both things are true about "
          "the same man. The law's document holds the law's account. The archive "
          "holds both.",
          "Sweelinck receives the sentence. He will read the declaration clause when "
          "he has time to set it beside the heroic record and note the gap formally.",
          "WIS", 10,
          checkPassFlag="vbyC4A5Done",
          activateCond="() => !!S_story.vbyC4A4Done")

    say("Cycle 4 complete. Beginning cycle 5: Þorsteinn's Revenge Oath. "
        "Token: Þorsteinn's Revenge Oath. Node route Reykjaness, Constantinople, Weimar.")

    # --- Cycle 5: Þorsteinn's Revenge Oath ---
    print("\n-- Cycle 5: Þorsteinn's Revenge Oath --")
    quest("vby_05_act1", "The Althing Clerk",
          "The clerk of the Althing hands over the sworn oath copy. The names of Þuríðr "
          "and her son Narfi are in it, and the terms: 'wherever they go, for as long "
          "as it takes.' The oath was sworn in front of the law's witnesses and the law "
          "did not prevent it. Þorsteinn the Gallows-Man swore it after Grettir's death "
          "on Drangey. He has already followed it to Constantinople and fulfilled it there.",
          "RKN",
          "You understand before the road what the archive wants: the form of the "
          "authorization, not the record of the killings. The oath is the legal instrument "
          "that committed its carrier to traveling from Iceland to the eastern edge of "
          "the known world. The clerk hands it over.",
          "You take the oath copy. The distinction between the authorization and the acts "
          "it authorized settles on the road east.",
          "WIS", 12,
          checkPassFlag="vbyC5A1Done")

    quest("vby_05_act2", "Þuríðr's Watchers",
          "Þuríðr has kin watching the routes south and east. They know the oath was "
          "sworn and that it names Þuríðr and Narfi. A document with those names on it, "
          "heading east toward Constantinople, has a value to the family that is not "
          "archival — it is evidence in ongoing blood-feud negotiations. The Norse "
          "trading route through the Baltic is less watched than the direct route.",
          "RKN",
          "The Baltic route adds three days and removes two known watch-points. You "
          "rejoin the main road east of the last known family checkpoint without "
          "being stopped.",
          "A family agent on the main road stops you briefly. The archive transit "
          "exemption clears you. He lets you through, but the encounter is logged "
          "and a report will go south within the day.",
          "DEX", 12,
          checkPassFlag="vbyC5A2Done",
          activateCond="() => !!S_story.vbyC5A1Done")

    quest("vby_05_act3", "The Byzantine Official",
          "A Byzantine court official in Constantinople who has records of the Narfi "
          "killing wants to attach his account of the incident to the oath document "
          "before it reaches Weimar — to complete the narrative. His intention is good. "
          "His account of the incident is a separate document that belongs in a separate "
          "filing. The oath travels as the oath, without appendix.",
          "CON",
          "His account of the incident can be filed separately through the archive's "
          "intake process. The oath is the document you are carrying; it travels complete "
          "as it was sworn. He accepts the filing separation and gives you his "
          "credentials for the separate submission.",
          "He insists the account must be attached before the oath reaches the archive. "
          "You spend half a day on the procedural disagreement before he accepts the "
          "filing separation.",
          "CHA", 13,
          checkPassFlag="vbyC5A3Done",
          activateCond="() => !!S_story.vbyC5A2Done")

    quest("vby_05_act4", "West from Constantinople",
          "West from Constantinople, three weeks to Weimar. The oath is in the wallet. "
          "Þorsteinn has already fulfilled it and returned north with Spes. The document "
          "is the record of the commitment, not the act. It is a completed instrument. "
          "Keep moving.",
          "CON",
          "Three weeks. The wallet stays sealed. The oath is a completed instrument — "
          "its carrier fulfilled it and returned. You deliver the record of the "
          "commitment to the archive that holds the records of what it cost.",
          "You think about the terms on the road west: 'wherever they go, for as long "
          "as it takes.' Iceland to Constantinople on a brother's behalf. The oath "
          "authorized it. The thinking is not part of the delivery.",
          "WIS", 11,
          checkPassFlag="vbyC5A4Done",
          activateCond="() => !!S_story.vbyC5A3Done")

    quest("vby_05_act5", "Revenge Commission Records",
          "Sweelinck reads the terms of the oath. He notes the names — Þuríðr, Narfi. "
          "He notes the witnesses. He notes the scope: 'wherever they go, for as long "
          "as it takes.' He notes that the oath was fulfilled in Constantinople. "
          "He creates the category.",
          "WM",
          "Sweelinck opens Revenge Commission Records. Iceland to Constantinople on a "
          "brother's behalf. The oath authorized it. The archive holds the authorization. "
          "What Þorsteinn became in the process — traveler, killer, husband, penitent "
          "— is in the other files.",
          "Sweelinck receives the oath. He will read the terms when he has time to set "
          "them beside the record of the killing in Constantinople and confirm the scope "
          "was fulfilled exactly.",
          "WIS", 10,
          checkPassFlag="vbyC5A5Done",
          activateCond="() => !!S_story.vbyC5A4Done")

    say("Cycle 5 complete. Beginning cycle 6: Þuríðr's Rune Log. "
        "Token: Þuríðr's Rune Inscription Transcript. Node route Reykjaness, Rome, Weimar.")

    # --- Cycle 6: Þuríðr's Rune Log ---
    print("\n-- Cycle 6: Þuríðr's Rune Log --")
    quest("vby_06_act1", "Spes Hands Over the Transcription",
          "Spes — Þorsteinn's widow, now in Norway after returning from Constantinople "
          "— hands you the vellum transcription. She made it herself from a copy she "
          "kept before the original log was burned as cursed material. She wants the "
          "record to exist somewhere outside Iceland, where Þuríðr's family cannot "
          "pressure its disappearance. Each rune in the inscription is noted in sequence, "
          "with the carver's marks. This is the specific inscription that turned "
          "Grettir's axe into his own thigh.",
          "RKN",
          "You understand what the archive wants: not the runes as a magic system, but "
          "the runes as forensic evidence of the method of a killing. Spes holds your "
          "gaze. She sets the transcription in your hands.",
          "You take the transcription. The distinction between the runes as magic and "
          "the runes as evidence of method settles on the road south toward Rome.",
          "WIS", 13,
          checkPassFlag="vbyC6A1Done")

    quest("vby_06_act2", "Þuríðr's Kin on the Alpine Route",
          "Þuríðr's kin have been watching since Þorsteinn completed his revenge. "
          "A transcription of the rune inscription is evidence in an ongoing blood-feud "
          "proceeding — if it reaches a court that recognizes sorcery evidence, it could "
          "support further claims against the family. The Alpine route is longer "
          "but unwatched.",
          "RKN",
          "The Alpine route adds four days and removes three known watch-points. You "
          "arrive at the Italian border without being stopped.",
          "A family agent on the coastal road intercepts you briefly. The archive "
          "transit exemption clears you. He lets you through, but the encounter "
          "is logged.",
          "DEX", 12,
          checkPassFlag="vbyC6A2Done",
          activateCond="() => !!S_story.vbyC6A1Done")

    quest("vby_06_act3", "The Church Official in Rome",
          "A church official in Rome wants to confiscate the rune transcription as a "
          "document of pagan sorcery — specifically, the category of harmful enchantment "
          "whose records the Church has authority to suppress. His authority is real. "
          "The archive's exemption for documents in transit to permanent deposit is also "
          "real. The two claims must be resolved before he summons witnesses.",
          "ROM",
          "The archive's transit exemption covers documents in permanent deposit "
          "proceeding, including sorcery evidence filed as forensic record rather than "
          "active instrument. The official reviews the exemption letter. He issues a "
          "letter of formal clearance and lets you continue north.",
          "He insists on holding the transcription pending a diocese review. You spend "
          "two days in Rome while the exemption is processed through the correct "
          "ecclesiastical channel. The transcription clears eventually.",
          "WIS", 13,
          checkPassFlag="vbyC6A3Done",
          activateCond="() => !!S_story.vbyC6A2Done")

    quest("vby_06_act4", "North from Rome",
          "North from Rome, five days to Weimar. The transcription is in the sealed "
          "wallet. The church official's letter of exemption is attached to the outside. "
          "The runes are on the vellum inside. They describe what was carved on a log "
          "in Iceland to kill a man on an island. Keep moving.",
          "ROM",
          "Five days. The wallet stays sealed. The exemption letter is in order. You "
          "deliver the transcription intact — the runes in sequence, the carver's marks "
          "noted, the method preserved as evidence.",
          "You think about the rune sequence on the road north — the specific marks "
          "that turned an axe into a man's own thigh. The thinking is not part of "
          "the delivery. The transcription is evidence, not instruction.",
          "WIS", 11,
          checkPassFlag="vbyC6A4Done",
          activateCond="() => !!S_story.vbyC6A3Done")

    quest("vby_06_act5", "Sorcery Evidence Records",
          "Sweelinck reads the transcription. He notes each rune in sequence. He notes "
          "the carver's marks and the sequence in which they were applied. He reads "
          "Spes's account of the method: log carved, floated to Drangey, Grettir unable "
          "to stop himself chopping at it, axe into thigh, wound that did not heal. "
          "He creates the category.",
          "WM",
          "Sweelinck opens Sorcery Evidence Records. Þuríðr cut her own foot while "
          "carving the inscription. The log floated to Drangey. Grettir could not stop "
          "himself chopping at it. The axe went into his thigh. He died from the wound. "
          "The transcription is the record of the specific runes used in that sequence "
          "of events.",
          "Sweelinck receives the transcription. He will read the rune sequence when he "
          "has a Norse scholar he trusts to verify the sequence against the method "
          "described. The archive holds it in the meantime.",
          "WIS", 10,
          checkPassFlag="vbyC6A5Done",
          activateCond="() => !!S_story.vbyC6A4Done")

    say("Cycle 6 complete. Beginning cycle 7: Þorsteinn's Final Account. "
        "Token: Þorsteinn's Final Account. Node route Constantinople, London, Weimar. "
        "This is the final cycle.")

    # --- Cycle 7: Þorsteinn's Final Account ---
    print("\n-- Cycle 7: Þorsteinn's Final Account --")
    quest("vby_07_act1", "Þorsteinn's Sealed Account",
          "Þorsteinn hands you the sealed account before he and Spes depart for the "
          "north. He says: take it to the archive at Weimar. He says nothing else. He "
          "has spent three years getting to this point. The account is in his own hand "
          "— Grettir's death on Drangey, the sorcery, the killers, the revenge journey, "
          "the killing in Constantinople — and sealed with his own signet before "
          "handing it over.",
          "CON",
          "You understand before the road what makes this document different from a "
          "saga: it is not told for an audience; it is written for whoever needs to "
          "know what happened. Þorsteinn has already said everything there was to say "
          "about it by handing it over. You take the sealed account.",
          "You take the parchment. On the road west the distinction settles: a saga is "
          "told; this is written. The difference is in the sealed signet and the "
          "fact that he handed it over without asking for anything back.",
          "WIS", 12,
          checkPassFlag="vbyC7A1Done")

    quest("vby_07_act2", "The Norse Merchant",
          "A Norse merchant on the western sea route who knows of Þorsteinn's journey "
          "wants to make a copy of the account for the trading networks that have been "
          "following the saga since Grettir's outlawry. He means no harm. The account "
          "is sealed — Þorsteinn sealed it before handing it over. The decision of "
          "whether to circulate it belongs to the archive after deposit, not to "
          "the road.",
          "CON",
          "The account is already sealed. The archive decides what is circulated after "
          "deposit. He accepts the archival routing and gives you his address for "
          "correspondence after deposit.",
          "He is not satisfied by the routing argument. He follows you as far as the "
          "harbor gate asking questions about the saga's ending. You board without "
          "opening the seal.",
          "CHA", 12,
          checkPassFlag="vbyC7A2Done",
          activateCond="() => !!S_story.vbyC7A1Done")

    quest("vby_07_act3", "The English Chronicler",
          "An English chronicler in London who has been collecting Norse outlaw accounts "
          "wants to read the account before it is sealed into archive. His collection is "
          "genuine scholarship. The account is already sealed — Þorsteinn sealed it "
          "before handing it over. The archive receives it sealed. The chronicler can "
          "apply for access after deposit.",
          "LDN",
          "The account is sealed at the source — not by the archive but by the man who "
          "wrote it. The archive cannot unseal what it has not yet received. He accepts "
          "the access application process and gives you his address for the correspondence.",
          "He wants the ending specifically — the killing in Constantinople. You decline "
          "to break the seal for him. He lets you leave, already composing a letter to "
          "his Norse correspondents for a secondhand account.",
          "CHA", 12,
          checkPassFlag="vbyC7A3Done",
          activateCond="() => !!S_story.vbyC7A2Done")

    quest("vby_07_act4", "Three Days to Weimar",
          "Three days east to Weimar. The sealed account is in the wallet. Þorsteinn "
          "is somewhere on the northern road with Spes, heading back toward Norway and "
          "eventually Rome. He has written down what happened to his brother. Keep "
          "moving. The account has a destination.",
          "LDN",
          "Three days. The wallet stays sealed. Þorsteinn sealed it himself. The "
          "account has a destination and you are delivering it to that destination "
          "without adding anything.",
          "You think about what is in the account for most of the road east — the "
          "scope of it, Iceland to Constantinople, what a brother was willing to become "
          "to complete the obligation. The thinking is not part of the delivery.",
          "WIS", 11,
          checkPassFlag="vbyC7A4Done",
          activateCond="() => !!S_story.vbyC7A3Done")

    quest("vby_07_act5", "Sibling Testimony Records",
          "Sweelinck breaks the seal. He reads the account. He notes the scope: Iceland "
          "to Constantinople, one man's death, one man's obligation, the complete record "
          "in the writer's own hand. He notes that Þorsteinn and Spes are currently "
          "traveling north and will eventually become penitents in Rome. He closes the "
          "account and creates the category.",
          "WM",
          "Sweelinck opens Sibling Testimony Records. Grettir was the strongest man in "
          "Iceland and the law had no mechanism for that. His brother's account ends at "
          "Constantinople, which is where the obligation ran out. The archive holds the "
          "account at Weimar, which is where the road ended.",
          "Sweelinck receives the account. He will read it in full when he has time to "
          "set it beside the curse record, the outlawry sentence, and the rune transcript "
          "and read all four together.",
          "WIS", 10,
          checkPassFlag="vbyC7A5Done",
          activateCond="() => !!S_story.vbyC7A4Done",
          questComplete=True)

    say("All 35 quests imported for VBY Grettir's Saga.")

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
