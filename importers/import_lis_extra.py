#!/usr/bin/env python3
# SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson and Claude
# ═══════════════════════════════════════════════════════════════════════════
# ⚠️  ARCHAIC — OUT OF DATE.  Historical one-shot importer (POSTs to the
#     localhost:1367 WBAPI).  Content was long ago imported and lives in
#     roll2hit-v3.html.  This script likely NO LONGER RUNS against the current
#     server/schema.  Kept for reference only — do not run without review.
#     Import history: BACKLOG.md / plan-archive.md / 1367-sources/.
# ═══════════════════════════════════════════════════════════════════════════
"""§PASS4-EXTRA-LIS: Lusiads cycles 8–13 (Pass 4 extra cycles)"""

import requests, subprocess

BASE = "http://localhost:1367"
NPC  = "archivus_sweelinck"
BOOK = "LIS"

def api(method, path, **kwargs):
    r = getattr(requests, method)(BASE + path, **kwargs)
    r.raise_for_status()
    return r.json()

def say(msg):
    subprocess.run(["./say.sh", msg], capture_output=True)

def quest(id, title, desc, activateNode, passText, failText, checkStat, checkDC,
          checkPassFlag=None, activateCond=None, questComplete=False):
    check = requests.get(BASE + f"/api/quest/{id}")
    if check.status_code == 200:
        print(f"  SKIP (exists): {id}")
        return
    nonce_r = api("post", "/api/nonce", json={"type": "quest", "id": id})
    nonce = nonce_r["nonce"]
    payload = {
        "id": id, "type": "skill_check", "book": BOOK, "npc": NPC,
        "title": title, "desc": desc, "activateNode": activateNode,
        "passText": passText, "failText": failText,
        "checkStat": checkStat, "checkDC": checkDC,
    }
    if checkPassFlag: payload["checkPassFlag"] = checkPassFlag
    if activateCond:  payload["activateCond"]  = activateCond
    if questComplete: payload["questComplete"] = True
    api("post", "/api/quest", json=payload, headers={"X-Nonce": nonce})
    print(f"  OK: {id} — {title}")

def delivery(id, title, desc, activateNode, passText, failText,
             checkPassFlag=None, activateCond=None, questComplete=False):
    check = requests.get(BASE + f"/api/quest/{id}")
    if check.status_code == 200:
        print(f"  SKIP (exists): {id}")
        return
    nonce_r = api("post", "/api/nonce", json={"type": "quest", "id": id})
    nonce = nonce_r["nonce"]
    payload = {
        "id": id, "type": "delivery", "book": BOOK, "npc": NPC,
        "title": title, "desc": desc, "activateNode": activateNode,
        "passText": passText, "failText": failText,
    }
    if checkPassFlag: payload["checkPassFlag"] = checkPassFlag
    if activateCond:  payload["activateCond"]  = activateCond
    if questComplete: payload["questComplete"] = True
    api("post", "/api/quest", json=payload, headers={"X-Nonce": nonce})
    print(f"  OK: {id} — {title} [delivery]")

def main():
    say("LIS pass 4 extra cycles. Lusiads, Camões. Cycles 8 through 13. "
        "The Commission Letter, The False Pilot's Chart, The Zamorim's Diplomatic Record, "
        "Venus's Island Account, The Gift Inventory, The Official Voyage Log.")

    # ── Cycle 8: The Commission Letter ────────────────────────────────────────
    print("\n-- Cycle 8: The Commission Letter --")
    quest("lis_08_act1", "The Chancery Secretary",
        "A man in a black coat — Frei Domingos, secretary to the crown's archival "
        "commission — has placed his hand on the commission letter's case. He says the "
        "letter belongs to the royal archive, not the neutral one: it is an instrument of "
        "state, not a literary document. He has a classification form. He is polite. The "
        "commission letter sits in its case between you.",
        "LHA",
        "Frei Domingos reads the argument twice. He folds the classification form. 'The "
        "letter is evidence,' he says, as if testing the word. He withdraws. The case is "
        "yours. You receive the Royal Commission Letter.",
        "Frei Domingos notes your argument. He says he will file the classification form "
        "and allow the archive to contest it. The letter stays, under dispute. You may "
        "proceed, but the dispute will complicate passage at Mombas.",
        "CHA", 12, checkPassFlag="lis_08_act1")

    quest("lis_08_act2", "The Duplicate Copy",
        "Cape Verde, the Atlantic waypoint. A Lisbon merchant house factor named Esteves "
        "approaches you on the dock with a rolled document: a notarial copy of the "
        "commission letter, he says, made in 1497 from the court's retained exemplar. He "
        "wants to trade: the copy for the original, so that he can sell the original to a "
        "collector in Venice. He is pleasant. He has the copy under his arm. The original "
        "is in your possession. He is offering you a clean substitute.",
        "CVP",
        "Esteves knows exactly what he is offering. He is acting for a Venetian collector "
        "who understands that the letter in Gama's hand is the only document that physically "
        "accompanied the first contact between Europe and India. He will not stop you, but "
        "he has confirmed: the original is worth more than the copy, and the copy's "
        "existence does not diminish the original's singularity.",
        "Esteves is opaque — you cannot read him. You decline the trade but leave uncertain "
        "whether he was testing you or genuinely ignorant. He watches you board the next "
        "ship. A note under your cabin door that night: The duplicate is already in Venice.",
        "WIS", 13, checkPassFlag="lis_08_act2", activateCond="lis_08_act1")

    quest("lis_08_act3", "The Zamorim's Question",
        "Malindi, East Africa. A Swahili scholar named Bwana Fahari keeps a copying house "
        "and has studied the Portuguese arrival at Calicut. He has a question he wants "
        "answered before he will certify the letter's provenance chain: when Gama presented "
        "the letter to the Zamorim and the Zamorim handed it back unread, what was the "
        "nature of that exchange? Was it a diplomatic presentation or a display of force? "
        "He argues the difference matters for how the archive classifies the letter's "
        "function — treaty document or coercion instrument.",
        "MLN",
        "Fahari nods slowly. 'It was a presentation,' he says. 'Like any letter of "
        "introduction. The refusal came later, from different men, for different reasons.' "
        "He certifies the provenance chain. The letter's function is: authorized "
        "communication between sovereign powers, peaceful intent, offer of alliance.",
        "Fahari declines to certify. He will write a note of contested provenance — "
        "'function unclear, possibly coercive instrument' — that will follow the letter "
        "to the archive. Sweelinck will need to adjudicate.",
        "INT", 13, checkPassFlag="lis_08_act3", activateCond="lis_08_act2")

    quest("lis_08_act4", "The Mountain Road",
        "The road north from Constantinople into the Danube basin. On the second afternoon, "
        "a Venetian courier — fast horse, good coat — overtakes you on the road and asks "
        "to see your documents. He is pleasant, well-mannered, and armed. He says he is "
        "carrying dispatches for the Duke of Mantua. He wants to know what you are "
        "carrying. You are carrying the commission letter in a leather satchel under your "
        "coat. His saddle bags are wrong for dispatches; he arrived from the wrong "
        "direction; he has been matching your pace for an hour before overtaking.",
        "CON",
        "He reads your posture correctly and decides the risk is wrong. He nods, touches "
        "his hat, and rides ahead. You hear nothing from him again. The commission letter "
        "arrives at the next waypoint dry and intact.",
        "He gets a hand on the satchel strap. You hold. The strap tears. He has the outer "
        "sleeve — an empty leather case — and rides. The commission letter is still under "
        "your coat, wrapped in oilcloth. Your left shoulder is bruised.",
        "STR", 14, checkPassFlag="lis_08_act4", activateCond="lis_08_act3")

    delivery("lis_08_act5", "The Archive — The Commission Letter",
        "Weimar Archive. Sweelinck takes the commission letter and reads it for forty "
        "minutes without speaking. Then: 'The king who wrote this has been dead for seventy "
        "years. The voyage it authorized has been complete for seventy years. The empire it "
        "enabled exists, is presently governed by Spain, and has committed acts that this "
        "letter cannot have foreseen.' He looks at you. 'What does the archive do with a "
        "document whose authorization has outrun its author by a century?'",
        "NUE",
        "Sweelinck sets down his pen. 'A departure,' he says. 'Yes. The archive can "
        "classify a departure.' He writes: Royal Commission Records — The Letter That "
        "Authorized the Opening of the Eastern World, First Entry. Dom Manuel's charge to "
        "Vasco da Gama, 1497: to sail, to treat, to open. The consequences of that opening "
        "belong to history; the document belongs here, as the record of what was asked and "
        "of the man who agreed to do it. You receive the Commission Transcript.",
        "Sweelinck writes: 'Authorization instrument — scope disputed.' The letter is filed "
        "under administrative documents pending a second review.",
        checkPassFlag="lis_08_act5", activateCond="lis_08_act4")

    # ── Cycle 9: The False Pilot's Chart ──────────────────────────────────────
    print("\n-- Cycle 9: The False Pilot's Chart --")
    quest("lis_09_act1", "The Merchant's Grandson",
        "Mozambique waypoint. A young man named Habib — grandson of the merchant whose "
        "house received the chart — meets you at the harbor. He wants something before he "
        "hands over the chart: acknowledgment that his grandfather acted in good faith, "
        "that receiving scrap from a fleet transaction is not participation in a plot. "
        "The chart was used as packing material; his grandfather did not know what it was. "
        "Habib wants a written statement to that effect, signed by a credentialed archivist, "
        "to clear his family name before the chart becomes evidence of a conspiracy that "
        "touched them only accidentally.",
        "MDN",
        "Habib accepts the distinction. 'The truth is enough,' he says, quietly. He goes "
        "inside and returns with the chart in a rolled leather case. 'My grandfather would "
        "have wanted it known.' You receive the False Pilot's Chart.",
        "Habib is not satisfied. He will give you the chart but asks that you note his "
        "request at the archive. He will write a separate letter to Sweelinck. The chart "
        "comes with a dispute attached.",
        "CHA", 12, checkPassFlag="lis_09_act1")

    quest("lis_09_act2", "The Regent's Descendant",
        "Still at the Mozambique waypoint, before you board the ship north. A man in a "
        "white robe approaches the dock: he identifies himself as a descendant of the "
        "Mozambique regent who gave the pilot his orders. He wants the chart destroyed. "
        "Not suppressed — destroyed. His argument is that the chart proves only that his "
        "ancestor tried and failed; it is evidence of incompetence as much as malice. He "
        "is a man of some local standing. He is not threatening you, but there are three "
        "other men at the end of the dock who are watching.",
        "MDN",
        "He is frightened, not threatening. The chart reaching an archive closes a chapter "
        "he has spent his life hoping would remain open. You tell him: the archive "
        "classifies evidence, not judgment. The chart proves the act; historians will weigh "
        "what it means. He stands in the sun for a moment, then walks away without speaking.",
        "You cannot fully read him. You hold the chart and board the ship. He does not "
        "follow, but the three men at the dock note your departure direction.",
        "WIS", 12, checkPassFlag="lis_09_act2", activateCond="lis_09_act1")

    quest("lis_09_act3", "The Navigation Scholar",
        "Constantinople, the Ottoman chart library. A cartographer named Mehmed Çelebi "
        "has been consulted to authenticate the chart — is the coastal rendering accurate "
        "enough to have been useful as a guide, or was it drawn by someone who did not know "
        "the coast well enough to create a convincing false channel? His authentication will "
        "determine whether the chart is evidence of skilled sabotage or of an incompetent "
        "attempt. He has been reviewing it for two hours. He has a conclusion.",
        "CON",
        "Çelebi points to the channel notation: 'The soundings around it are exact. The "
        "pilot knew the depth at every point. He chose this one spot to draw the channel "
        "into the reef. No one who drew the rest of this chart could have made that error "
        "by accident.' His authentication is unambiguous: surgical falsification by a "
        "skilled navigator acting under instruction.",
        "Çelebi is uncertain about one secondary notation — he cannot rule out that it "
        "might be a copying error. His authentication note reads: 'possibly deliberate, "
        "inconclusive.' The chart's evidential value is reduced.",
        "INT", 12, checkPassFlag="lis_09_act3", activateCond="lis_09_act2")

    quest("lis_09_act4", "The Mountain River Crossing",
        "The Danube crossing, early spring. The river is running high from snowmelt. The "
        "ferry is a flat-bottomed barge worked by two men with poles. Halfway across, the "
        "current catches the barge's stern. The pilot tries to correct; the barge swings "
        "sideways. The chart in its leather case is under your arm. The river is cold. "
        "The ink on coastal leather does not survive submersion.",
        "CON",
        "You cross the deck in four steps, hit the stern rail, and brace. The ferryman "
        "gets the pole set and the bow comes around. You arrive on the north bank dry. "
        "The ferryman says nothing. The chart is intact.",
        "You keep the chart dry but go to one knee on the wet deck. The case skids two "
        "feet along the boards before you catch it. Your knee is bruised. The ferryman "
        "corrects the barge unassisted.",
        "STR", 13, checkPassFlag="lis_09_act4", activateCond="lis_09_act3")

    delivery("lis_09_act5", "The Archive — The False Pilot's Chart",
        "Weimar Archive. Sweelinck holds the chart at arm's length under the north light. "
        "'A chart drawn to wreck a fleet,' he says, 'authenticated by a cartographer in "
        "Constantinople, carried by a grandson's apology and a regent's descendant's fear.' "
        "He sets it down. 'What do I call this? It is not a diplomatic document. It is not "
        "a literary text. It is a physical instrument of attempted murder that happened to "
        "fail.' He looks at you. 'The archive does not classify objects by what they tried "
        "to do. I need to know what it is.'",
        "NUE",
        "Sweelinck writes: Cartographic Records — The Chart Drawn to Kill: A Coastal "
        "Navigation Document with a Surgical Falsification, First Entry. The Mozambique "
        "pilot's chart of the East African approach, 1498: accurate in every detail but "
        "one; the one detail is a reef where the chart draws a channel; the authentication "
        "is unambiguous; the fleet it was meant to destroy arrived in India anyway; the "
        "chart belongs here as evidence that the voyage was contested at every point by "
        "men who knew exactly what they were doing. You receive the Pilot's Authentication "
        "Note.",
        "Sweelinck files it under 'uncategorized instruments of the Indian voyage.' A note "
        "in the margin reads: 'origin contested, evidential weight unresolved.'",
        checkPassFlag="lis_09_act5", activateCond="lis_09_act4")

    # ── Cycle 10: The Zamorim's Diplomatic Record ─────────────────────────────
    print("\n-- Cycle 10: The Zamorim's Diplomatic Record --")
    quest("lis_10_act1", "The Scribe's Descendant",
        "Malindi, East Africa. A man named Rajan, a merchant of Tamil descent, has a "
        "rolled palm-leaf folio in a tin box. He is selling it, but he has three buyers: "
        "you, a Portuguese crown representative named Frei Simão who says it belongs to "
        "Portugal as a document of the Indian voyage, and a Venetian factor who wants it "
        "for a private collection. Rajan wants to sell to whomever will preserve it best. "
        "He is asking each buyer to explain their case.",
        "MLN",
        "Rajan considers for a long moment. 'The archive,' he says. 'Because the Zamorim "
        "would have wanted it read.' He hands you the tin box. You receive the Zamorim's "
        "Court Register Entry.",
        "Frei Simão outbids you financially. The folio is not sold but held for Simão's "
        "review of the price. You have three days before Simão's letter of credit arrives "
        "from Lisbon. Rajan will speak with you again if you return with a counter-argument.",
        "CHA", 13, checkPassFlag="lis_10_act1")

    quest("lis_10_act2", "Frei Simão's Objection",
        "Frei Simão has followed you to the dock. He is not threatening you — he is a "
        "scholar, not a soldier — but he is certain: a document describing the arrival of "
        "a Portuguese admiral on the first voyage to India is Portuguese patrimony, and the "
        "crown has the right to reclaim it. He cites the law of discovery. He is standing "
        "between you and the gangway.",
        "MLN",
        "The weakness is clear: the law of discovery governs the discoverer's records, not "
        "the discovered nation's. The Zamorim was not discovered; he was visited. His "
        "scribe's entry is his own record of a visitor. Simão hears you, opens his mouth, "
        "closes it. He steps aside. You board.",
        "Simão is not wrong enough to dismiss cleanly. He files a formal objection with "
        "the Portuguese trade factor in Malindi. A hold order will reach the next port "
        "ahead of you. Passage at Constantinople will require a document review.",
        "WIS", 12, checkPassFlag="lis_10_act2", activateCond="lis_10_act1")

    quest("lis_10_act3", "The Translation Problem",
        "Constantinople. A Greek scholar named Nikolaos who reads Malayalam is translating "
        "the folio. He has finished. He wants to discuss the last line. His reading of the "
        "Malayalam phrase is: 'These men have traveled a great distance to offer what we do "
        "not yet know whether we want. They should be watched carefully.' But he says there "
        "is an alternate reading of the final phrase: it could be 'watched carefully' or "
        "'understood carefully.' The distinction matters for how the Zamorim's attitude is "
        "classified — hostile surveillance or cautious inquiry.",
        "CON",
        "Nikolaos reviews the full entry. The gifts were returned courteously; the audience "
        "was granted, not refused; the deliberation was genuine. 'Understood carefully,' he "
        "says. 'The Zamorim wanted to understand these men before deciding what to do with "
        "them.' The translation is unambiguous.",
        "Nikolaos marks both readings in the translation. The archive will receive a "
        "document with an unresolved ambiguity in its central interpretive line.",
        "INT", 12, checkPassFlag="lis_10_act3", activateCond="lis_10_act2")

    quest("lis_10_act4", "The Courier Road",
        "North of Constantinople, the road toward the Danube. Rain. The tin box is wrapped "
        "in oilcloth inside your pack. A fellow traveler — a Ragusian merchant named Petar "
        "— has been walking the same road for two days and is now asking too many questions "
        "about your business in Constantinople. He is not armed visibly. He is very curious "
        "about the box. His left hand rests on his belt in the position of a man accustomed "
        "to carrying a weapon under his coat.",
        "CON",
        "His left hand rests on his belt in the exact position of a trained weapon-carrier. "
        "You change your route at the next crossroads and lose him in an hour. The box "
        "arrives at the next waystation intact.",
        "Petar's tell is subtle enough that you cannot be certain. You keep your distance "
        "and arrive at the next waystation with the box intact, but uneasy. A horse outside "
        "the waystation has been ridden hard from the south.",
        "WIS", 13, checkPassFlag="lis_10_act4", activateCond="lis_10_act3")

    delivery("lis_10_act5", "The Archive — The Receiving Nation's Record",
        "Weimar Archive. Sweelinck reads the translation twice. He sets it down. 'The "
        "Zamorim watched them carefully and was right to.' He is quiet for a moment. 'The "
        "Portuguese came back in 1502 and bombarded Calicut. This entry is from 1498 — "
        "four years before that. The Zamorim's scribe recorded the beginning of a story "
        "that ended badly for Calicut.' He looks at you. 'Where does this belong in the "
        "archive? With the Gama documents? Separately? It is the Indian record of a "
        "Portuguese event.'",
        "NUE",
        "Sweelinck writes: Indian Ocean Diplomatic Records — The Receiving Nation's "
        "Account, First Entry. The Zamorim's court register entry on the arrival of Vasco "
        "da Gama, 1498: written in Malayalam by the head palace scribe; the Portuguese "
        "offered alliance; the Zamorim deferred; the final line reads 'understood "
        "carefully'; four years later the Portuguese bombarded Calicut; this document "
        "belongs to the archive as the record of what the Zamorim thought before that "
        "happened. You receive the Malayalam Translation.",
        "Sweelinck files it under 'Eastern accounts of the Indian voyage.' A note reads: "
        "'translation contested, final line ambiguous.'",
        checkPassFlag="lis_10_act5", activateCond="lis_10_act4")

    # ── Cycle 11: Venus's Island Account ──────────────────────────────────────
    print("\n-- Cycle 11: Venus's Island Account --")
    quest("lis_11_act1", "The Flemish Heir",
        "Lisbon Humanist Archive, morning. A Flemish merchant named Van Houten — grandson "
        "of the broker who sold the notes — has decided he wants them back. Not for "
        "commercial reasons: he has been reading his ancestor's records and believes the "
        "notes are evidence that the Island of Venus actually occurred, and that this is a "
        "religious matter he wants handled by the Church. He has engaged a Dominican friar "
        "to accompany him. The friar is reading the notes with a troubled expression.",
        "LHA",
        "The Dominican reads your distinction aloud back to you, as if testing it. Then: "
        "'The archive holds testimony. The Church holds judgment. These are different "
        "offices.' He closes his breviary. Van Houten looks annoyed but yields. You "
        "receive the Flemish Secretary's Interview Notes.",
        "The Dominican wants to review the notes for three days before releasing them. "
        "On the third day, he releases them with a note attached: 'Contents spiritually "
        "ambiguous. Not recommended for general circulation.' The note will follow the "
        "document to the archive.",
        "CHA", 12, checkPassFlag="lis_11_act1")

    quest("lis_11_act2", "The Third Sailor's Son",
        "Cape Verde, the Atlantic waypoint. A Portuguese fisherman named Manuel — son of "
        "the third sailor, the one who would not describe his experience — has been waiting "
        "for this ship. He does not want the notes destroyed. He wants a specific change: "
        "his father's description should be read as a refusal to speak, not as an inability "
        "to speak. His father said 'that's enough' — that is a statement of sufficiency, "
        "not of failure.",
        "CVP",
        "The note is accurate and the motive is irrelevant to its accuracy. You write: "
        "'Supplementary note from subject's son: the silence was a chosen statement of "
        "sufficiency, not an indication of inability to describe. The subject said: that's "
        "enough. This should be read as testimony, not as refusal.' The notes gain "
        "precision.",
        "Both are true simultaneously — Manuel wants accuracy and he wants his father "
        "honored. You cannot cleanly separate them. The supplementary note is added, but "
        "with a hedged formulation: 'silence interpreted by the subject's son as chosen, "
        "not compelled.'",
        "WIS", 12, checkPassFlag="lis_11_act2", activateCond="lis_11_act1")

    quest("lis_11_act3", "The Allegorical Reading",
        "Malindi. A Portuguese Jesuit named Padre Henrique has studied Camões for thirty "
        "years and knows the Island of Venus as allegory: the reward of virtue, the glory "
        "of the hero made flesh. He wants to add a classification note to the interview "
        "records that describes them as allegorical illustration — as if the sailors were "
        "unconsciously enacting the poem's meaning. He is friendly, scholarly, enthusiastic. "
        "He does not understand why you are resisting.",
        "MLN",
        "Padre Henrique goes very still. 'Seventy years,' he says. 'I had the dates wrong.' "
        "He withdraws the classification note. 'Then the poem is what Camões made of what "
        "they said.' He pauses. 'That's more interesting, isn't it.' The notes are "
        "reclassified as primary testimony.",
        "Padre Henrique is unconvinced — he argues that Camões had access to these accounts "
        "and shaped them into the allegory. His classification note is added as an "
        "alternative reading.",
        "INT", 12, checkPassFlag="lis_11_act3", activateCond="lis_11_act2")

    quest("lis_11_act4", "The Night Road",
        "Outside Constantinople, the road north, after dark. Two men step from the "
        "treeline. They want your pack. They are carrying cudgels, not swords — this is a "
        "robbery, not an assassination. The notes are in the pack. Running is an option "
        "but not a good one — they know this road and you do not.",
        "CON",
        "You step into the space between them before either can wind up. Close work, bad "
        "range for cudgels. They recalculate and step back. You walk north at the same "
        "pace. They do not follow. The notes arrive at the next waystation dry.",
        "You take a blow across your left forearm deflecting a swing. You get enough "
        "distance to run. The pack stays on. Your arm aches. The notes are intact but the "
        "ink of the second page has smeared slightly where the pack hit the ground.",
        "STR", 14, checkPassFlag="lis_11_act4", activateCond="lis_11_act3")

    delivery("lis_11_act5", "The Archive — Venus's Island Account",
        "Weimar Archive. Sweelinck reads all six pages, including the supplementary note "
        "on the third sailor. 'Three sailors,' he says. 'All remember the same things. One "
        "cannot describe the woman. One will not describe his experience because it was "
        "sufficient. And the Flemish secretary did not know what to make of any of it.' "
        "He turns to you. 'Camões made it into allegory. What does the archive make of it?'",
        "NUE",
        "Sweelinck considers the formulation. He writes: Testimony of the Indian Voyage — "
        "Three Sailors on the Island of Love, First Entry. Six pages by a Flemish "
        "secretary, 1499: three sailors describe an island that rose from the sea; the "
        "first cannot describe the woman he met; the second chose silence because the "
        "experience was sufficient; the third says it was the best week of his life; the "
        "archivist does not adjudicate; the poet made it allegory; the archive holds what "
        "was said before the allegory was written. You receive the Van der Berg Transcript.",
        "Sweelinck writes: 'Sailor accounts, probable embellishment, possibly allegorical "
        "in origin.' The notes are filed under literary background material.",
        checkPassFlag="lis_11_act5", activateCond="lis_11_act4")

    # ── Cycle 12: The Gift Inventory ──────────────────────────────────────────
    print("\n-- Cycle 12: The Gift Inventory --")
    quest("lis_12_act1", "The Archivist's Reclassification",
        "Lisbon Humanist Archive. The inventory has been reclassified — it is currently "
        "in the maritime provisioning files, marked 'fleet quartermaster, Indian voyage.' "
        "A Lisbon crown official named Soares has flagged it for re-reclassification back "
        "to provisioning records, because the official diplomatic failure at Calicut is a "
        "sensitive matter and a document that evidences the miscalculation should not be "
        "easily findable. He has filed a reclassification order. The archive's senior "
        "cataloguer is reviewing it, uncertainly.",
        "LHA",
        "The cataloguer reads your argument, nods twice, and writes: 'document reclassified "
        "to diplomatic records per the argument that its subject is the content of a "
        "sovereign presentation, not fleet logistics.' Soares is overridden. You receive "
        "the Fleet Quartermaster's Gift Inventory.",
        "The cataloguer is uncertain. He defers the decision for a week and asks Soares "
        "to provide a written justification for the reclassification. The inventory remains "
        "in limbo. You can take it, but the dispute will follow it.",
        "INT", 12, checkPassFlag="lis_12_act1")

    quest("lis_12_act2", "Monsaide's Market Valuations",
        "Cape Verde. A scholar of Indian Ocean trade named Ibrahim has studied the "
        "second-hand marginal valuations on the inventory — the estimates in the secondary "
        "hand. He believes they are in Monsaide's handwriting; he has a comparison sample. "
        "He wants to add a certification to the inventory noting that Monsaide valued the "
        "gifts before the presentation and said nothing to Gama about their inadequacy. "
        "Ibrahim's interpretation: Monsaide was loyal but knew the gifts were wrong and "
        "let the presentation happen anyway.",
        "CVP",
        "Ibrahim accepts the separation. The certification reads: 'Secondary annotations "
        "consistent with Monsaide's hand, certified by comparison sample.' The interpretation "
        "reads: 'Historian's inference — not archival determination.' The two claims are "
        "listed distinctly. The document gains precision.",
        "Ibrahim adds both the handwriting certification and the interpretation as a "
        "combined note. Future readers will have difficulty separating the certified fact "
        "from the interpretive inference.",
        "WIS", 13, checkPassFlag="lis_12_act2", activateCond="lis_12_act1")

    quest("lis_12_act3", "The Zamorim's Contempt",
        "Malindi. A Swahili historian named Fatuma has written a study of the Calicut "
        "encounter and wants to add a contextual note to the inventory: that the Zamorim's "
        "silent reception of the gifts was, in Malabar court protocol, equivalent to a "
        "formal rejection. She received them without comment, which was the standard form "
        "for indicating that a visitor had failed the basic requirements of diplomatic "
        "exchange. She also wants to note that the Portuguese returned in 1502 and "
        "bombarded Calicut. She wants both points noted as historical fact.",
        "MLN",
        "Fatuma considers. 'The protocol is fact. The bombardment consequence is my "
        "argument.' She nods. The archive receives both, correctly labelled: the protocol "
        "note as documented Malabar court custom, the 1502 connection as Fatuma's "
        "historical interpretation, attributed.",
        "Fatuma insists both points be presented as historical fact. You include both but "
        "add a hedge: 'per historian Fatuma.' She objects to the hedge. The note is added "
        "in dispute.",
        "CHA", 12, checkPassFlag="lis_12_act3", activateCond="lis_12_act2")

    quest("lis_12_act4", "The Rain on the Road",
        "The road north from Constantinople. Three days of rain. The inventory — a single "
        "page of Portuguese — is in an oilskin pouch inside your pack. On the second day, "
        "the pack gets wet when a stream ford rises faster than expected and the pack goes "
        "under for three seconds before you pull it clear. You are cold and the nearest "
        "waystation is two hours ahead.",
        "CON",
        "You do not open the oilskin in the rain. You carry it inside your coat, close "
        "to your body, for the two hours to the waystation. The warmth and pressure dry "
        "the exterior without opening it to the air. At the waystation, by candlelight, "
        "you open it: dry throughout. The margin notations are intact.",
        "The oilskin held but you cannot be certain until you open it, and opening it wet "
        "is worse than waiting. You carry it closed for two hours, arrive at the waystation, "
        "and find the inventory lightly damp at one edge. The margin notations are slightly "
        "blurred. The certification will note the condition.",
        "WIS", 12, checkPassFlag="lis_12_act4", activateCond="lis_12_act3")

    delivery("lis_12_act5", "The Archive — The Gift Inventory",
        "Weimar Archive. Sweelinck reads the inventory and then reads it again. He reads "
        "the margin valuations. He reads Fatuma's note. 'The greatest voyage in recorded "
        "history,' he says, 'and they brought sugar and brass cups.' He is not laughing. "
        "'This document is worse for the crown's reputation than anything in the diplomatic "
        "records. No wonder it was filed as provisioning.' He looks at you. 'How do I "
        "write that without it sounding like mockery?'",
        "NUE",
        "Sweelinck writes: Diplomatic Records — The Gift Inventory at Calicut, First "
        "Entry. The Portuguese fleet quartermaster's list of items presented to the "
        "Zamorim of Calicut, 1498: four scarlet mantles, six feathered hats, four "
        "chaplets of coral, twelve Turkish carpets, seven brass cups, one chest of sugar, "
        "two barrels each of oil and honey; market valuations attributed to Monsaide; the "
        "Zamorim received them without comment, which in Malabar court protocol constituted "
        "a formal rejection; the archive holds this document as a record of the gap "
        "between the voyage's ambition and its diplomatic preparation; the gap is noted, "
        "not judged. You receive the Inventory Transcript.",
        "Sweelinck writes a careful but slightly deflating note that will be read as "
        "understated mockery by anyone who knows the context.",
        checkPassFlag="lis_12_act5", activateCond="lis_12_act4")

    # ── Cycle 13: The Official Voyage Log (questComplete) ─────────────────────
    print("\n-- Cycle 13: The Official Voyage Log --")
    quest("lis_13_act1", "The Coimbra Copy",
        "Lisbon Humanist Archive. The 1847 discovery of the Coimbra copy is contested: "
        "a Lisbon antiquarian named Rodrigues claims the volume is a forgery made in the "
        "1820s by a Portuguese nationalist who wanted a 'recovered' artifact. He has a "
        "list of anachronistic phrasings. The log is in a glass case. You need to get it "
        "out before Rodrigues's objection is filed as a formal challenge.",
        "LHA",
        "All of Rodrigues's examples are consistent with sixteenth-century chancery "
        "Portuguese. His forgery argument is anachronism-based and the anachronisms are "
        "not anachronisms — they are simply older than his frame of reference. The "
        "cataloguer releases the log. You receive the Official Voyage Log.",
        "Rodrigues has two examples that are genuinely difficult to date — they could be "
        "1510 or 1820. The cataloguer places the log in a contested status holding "
        "category. You may take it but with a dispute annotation.",
        "INT", 13, checkPassFlag="lis_13_act1")

    quest("lis_13_act2", "The Revised Entries",
        "Cape Verde. A palaeographer named Conceição studies the two anomalous log entries "
        "— 'We anchored. The country appeared much greater than we supposed' and 'We "
        "departed with less than we came for but with the knowledge that we had been there.' "
        "The insertions are in a third hand, different from the primary notary. She needs "
        "one more comparison sample to identify the hand: a letter in the Lisbon archive "
        "written by Gama himself, in 1499, shortly after the return.",
        "CVP",
        "The archivist allows a supervised comparison. Conceição examines both hands for "
        "twenty minutes and says: 'The letterforms are consistent across six indicators. "
        "I would not call this proof in a court, but I would call it highly probable.' "
        "The identification note: 'secondary insertions in a hand highly consistent with "
        "Vasco da Gama, 1499.'",
        "The colonial archivist allows a visual inspection but not removal. Conceição "
        "must work from photographs, which are not sharp enough for definitive comparison. "
        "She writes: 'possibly consistent with Gama's hand, comparison inconclusive.'",
        "CHA", 12, checkPassFlag="lis_13_act2", activateCond="lis_13_act1")

    quest("lis_13_act3", "The Casa da Índia Destruction",
        "Malindi. A Portuguese archivist named Santos has spent his career documenting the "
        "1755 earthquake losses. The original voyage log is on the lost list. But Santos "
        "has found a discrepancy: the 1510 copy order signed by the crown says 'copy to "
        "be kept at Coimbra as protection against loss of original in fire or flood' — "
        "which means the copy was made precisely because someone anticipated the original "
        "might be destroyed. Santos wants to add a note: this is not a substitute for the "
        "lost original; it was designed from the start to be the survival copy.",
        "MLN",
        "The 1510 order language is explicit: 'the copy shall serve in all purposes as "
        "the original, should the original be unavailable.' Santos is correct. The Coimbra "
        "copy's status is not inferior; it was designed by the crown to be the surviving "
        "record. The note is added without qualification.",
        "The 1510 copy order language is ambiguous on the question of equal authority — "
        "it says 'protection against loss' but does not say 'equal status.' Santos adds "
        "his note with the caveat 'interpretation contested.'",
        "WIS", 12, checkPassFlag="lis_13_act3", activateCond="lis_13_act2")

    quest("lis_13_act4", "The Final Road",
        "The last road to Weimar. Three days north of Constantinople. Spring, clear "
        "weather, good roads. A Portuguese naval officer named Capitão Braga is riding "
        "the same road northward and has been overtaking you for two hours. He is polite, "
        "well-dressed, and carries no documents. He asks if you are going to Weimar. You "
        "say yes. He says: 'A friend of mine is very interested in what you are carrying.' "
        "He names no friend.",
        "CON",
        "Braga listens to your answer and rides for a moment in silence. Then: 'My friend "
        "will be disappointed.' He touches his hat and takes a fork in the road south. "
        "You arrive at Weimar the following evening without further contact.",
        "Braga is not satisfied but is not hostile. He rides ahead. At the Weimar city "
        "gate, a man in a gray coat is waiting and asks your business. He is not blocking "
        "you — but he is noting your arrival time.",
        "CHA", 14, checkPassFlag="lis_13_act4", activateCond="lis_13_act3")

    delivery("lis_13_act5", "The Archive — The Official Voyage Log",
        "Weimar Archive, evening. Sweelinck takes the voyage log and carries it to the "
        "north window. He reads slowly. He reads the two anomalous entries twice. He "
        "reads them again. 'Gama wrote these himself,' he says. 'Into his own notary's "
        "log. After the fact, probably. Before he filed it.' He picks it up again. 'The "
        "country appeared much greater than we supposed. We departed with less than we "
        "came for but with the knowledge that we had been there.' He looks at you. 'That "
        "is not fleet administration. That is a man trying to say what happened to him.'",
        "NUE",
        "Sweelinck takes the pen. He writes slowly: Indian Voyage Records — The Official "
        "Log of the São Gabriel, First Entry. The fleet notary's record from departure "
        "Lisbon 1497 to return September 1499: four hands, three voices, one voyage; a "
        "fourth hand, identified as highly consistent with Gama's own, inserted two "
        "entries in the Calicut section; these insertions are not administrative language; "
        "they are a man trying to say what happened to him in the only record he knew "
        "would survive; the archive holds the skeleton beneath the poem; the poem was "
        "written later; the skeleton was always here. You receive the Log Transcript — "
        "LIS Complete.",
        "Sweelinck writes a careful accession note that slightly hedges the Gama "
        "identification in a way that will cause future readers to discount it.",
        checkPassFlag="lis_13_act5", activateCond="lis_13_act4", questComplete=True)

    print("\n=== LIS extra cycles complete ===")
    say("LIS cycles 8 through 13 deployed. 30 acts. Lusiads Pass 4 extra cycles complete. "
        "Weimar Archive. Archivus Sweelinck. "
        "The Commission Letter, The False Pilot's Chart, The Zamorim's Diplomatic Record, "
        "Venus's Island Account, The Gift Inventory, The Official Voyage Log. Quest complete.")

    print("\n-- Audit --")
    audit = api("get", "/api/audit")
    errors = audit.get("errors", [])
    print(f"  {len(errors)} errors" if errors else "  0 errors")
    for e in errors[:5]:
        print(f"    {e}")

    api("post", "/api/save", json={})
    print("  Saved.")

if __name__ == "__main__":
    main()
