#!/usr/bin/env python3
# SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson and Claude
# ═══════════════════════════════════════════════════════════════════════════
# ⚠️  ARCHAIC — OUT OF DATE.  Historical one-shot importer (POSTs to the
#     localhost:1367 WBAPI).  Content was long ago imported and lives in
#     roll2hit-v3.html.  This script likely NO LONGER RUNS against the current
#     server/schema.  Kept for reference only — do not run without review.
#     Import history: BACKLOG.md / plan-archive.md / 1367-sources/.
# ═══════════════════════════════════════════════════════════════════════════
"""§PASS4-EXTRA-MOL: Laxdaela Saga cycles 3–7 (Pass 4 extra cycles)
   Source: archive.org/details/laxdlasaga00presgoog — Muriel Press tr. 1906
   Seeds used: 2 (Melkorka's Ring), 4 (Ambush Warning), 5 (Gestr's Record),
               6 (Hrefna's Grave-Gift), 7 (Carved Beams of Herdholt)
"""

import requests, subprocess

BASE = "http://localhost:1367"
NPC  = "archivus_sweelinck"
BOOK = "MOL"

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
        return
    api("post", "/api/node", json={
        "code": code, "name": name, "label": label,
        "act": act, "r": r, "c": c, "desc": desc,
    })
    print(f"  NODE: {code} — {label}")

def quest(id, title, desc, activateNode, passText, failText, checkStat, checkDC,
          checkPassFlag=None, activateCond=None, questComplete=False,
          monster=None, monsterHP=None, monsterAC=None):
    check = requests.get(BASE + f"/api/quest/{id}")
    if check.status_code == 200:
        print(f"  SKIP (exists): {id}")
        return
    nonce_r = api("post", "/api/nonce", json={"type": "quest", "id": id})
    nonce = nonce_r["nonce"]
    q_type = "combat" if monster else "skill_check"
    payload = {
        "id": id, "type": q_type, "book": BOOK, "npc": NPC,
        "title": title, "desc": desc, "activateNode": activateNode,
        "passText": passText, "failText": failText,
        "checkStat": checkStat, "checkDC": checkDC,
    }
    if checkPassFlag: payload["checkPassFlag"] = checkPassFlag
    if activateCond:  payload["activateCond"]  = activateCond
    if questComplete: payload["questComplete"]  = True
    if monster:
        payload["monster"]   = monster
        payload["monsterHP"] = monsterHP
        payload["monsterAC"] = monsterAC
    api("post", "/api/quest", json=payload, headers={"X-Nonce": nonce})
    tag = "[combat]" if monster else ""
    print(f"  OK: {id} — {title} {tag}")

def main():
    say(
        "MOL pass 4 extra cycles. Laxdaela Saga, Muriel Press translation. "
        "Cycles 3 through 7. Melkorka Ring, Ambush Warning, Gestr Record, "
        "Hrefna Grave Gift, Carved Beams of Herdholt."
    )

    # ── New node: ALT (Althing, Þingvellir) — for cycle 5 ────────────────────
    print("\n-- Node: ALT (Althing, Þingvellir) --")
    create_node(
        "ALT", "plains",
        "Althing — Thingvellir, Iceland",
        act=1, r=10, c=94,
        desc=(
            "The assembly plain at Þingvellir, where all of Iceland meets each summer. "
            "Law-speakers stand on the Lögberg, the Law Rock, and recite the code. "
            "Legal disputes, inheritance claims, and the records of great families pass "
            "through this place. It smells of grass and cold river and the specific "
            "tension of people who must agree without a king to compel them."
        )
    )

    # ── Cycle 3: Melkorka's Ring ───────────────────────────────────────────────
    # Theme: The enslaved woman gives her son the name she was not permitted to keep;
    #        the ring carries the identity across the water the woman cannot cross.
    # Route: LGR → LXF → HHL
    print("\n-- Cycle 3: Melkorka's Ring --")

    quest(
        "mol003_act1",
        "The Slave Woman's Gift",
        "Melkorka's farmstead. She does not look at you for long. The ring is already "
        "in her hand when you arrive — she has been holding it, deciding. It is Irish "
        "gold, old work, the kind of metalwork that only royal smiths in Dublin make. "
        "She speaks to you in Norse with the accent of a woman who learned Norse second. "
        "Her instruction is simple: the ring goes with Ólafr before his ship leaves. "
        "It goes with him in his kit, in his own hand, not in the ship's cargo. "
        "She says: 'He knows the Irish words for his grandfather. He will know what "
        "to say when he holds this out.' She does not explain further. "
        "Höskuldr's legitimate sons have been watching the road between her farm "
        "and the harbor. They do not know the ring exists.",
        "LGR",
        "You read the full weight of what she is not saying. She was taken in a raid "
        "at fifteen. She has been silent in Norse for fifteen years more. The ring is "
        "the only piece of her identity she kept. She is not giving it for money. "
        "She is giving it because Ólafr is the one thing she can still send toward "
        "what she used to be. You take it. You leave before anyone on the road sees "
        "which direction you came from.",
        "You take the ring and the commission. She watches you go with the expression "
        "of a woman who has learned not to watch too long.",
        "WIS", 12,
        checkPassFlag="mol003_act1",
    )

    quest(
        "mol003_act2",
        "The Ford Watched",
        "Þorleikr Höskuldsson is at the ford. He is Höskuldr's eldest legitimate son "
        "and he has the specific alertness of a man who has been watching this road "
        "for something. He sees you coming from the direction of Melkorkastaðir. "
        "He moves his horse into the shallows. He does not ask what you are carrying. "
        "He asks where you are going. His tone is not hostile. "
        "It is worse than hostile: it is legal. A ring of Irish royal gold moving "
        "from his father's slave-woman toward a harbor where his half-brother is "
        "boarding a ship to Ireland — that is a claim with edges. He wants to know "
        "the shape of it before it leaves this district.",
        "LXF",
        "You tell him you carry a private commission for a voyage — final kit for "
        "a merchant's son, personal effects only. You name a settled trade debt "
        "between the two farmsteads — specific enough to be real, vague enough "
        "to give him nothing. He holds still a moment. "
        "Then he moves his horse aside. You cross before he changes his mind.",
        "He is not satisfied but he is not certain enough to compel. You wait at the "
        "ford for half the morning while he decides. By the time he lets you through "
        "the harbor road has more traffic and the ring is harder to move quietly.",
        "CHA", 13,
        checkPassFlag="mol003_act2",
        activateCond="mol003_act1",
    )

    quest(
        "mol003_act3",
        "The Irish Goldwork",
        "A Norwegian merchant on the road between the ford and Herdholt knows Irish "
        "metalwork when he sees it. He has not seen it — he has heard the description "
        "from someone at the ford who noticed you crossing. He is waiting at the "
        "crossroads with the calm of a man who has time and a good eye and a "
        "reasonable idea of what Dublin royal smithing fetches at a Dublin market. "
        "He says: 'I am not going to rob you. I am going to make you an offer.' "
        "He names a price. It is a fair price. It is also completely irrelevant "
        "because the ring is not yours to sell.",
        "LXF",
        "You tell him it is an old family piece, sentimental only, not for sale, "
        "never going to be for sale, and you have a ship to reach before evening. "
        "You name a different family who might have Irish gold to sell — specific "
        "enough to redirect his interest. He considers this. He steps aside. "
        "'Tell them Gunnar sent you.' You are already past him.",
        "He is persistent in the way that men with good prices tend to be persistent. "
        "By the time you clear him the afternoon is advanced and you approach "
        "Herdholt with less time than you wanted.",
        "CHA", 14,
        checkPassFlag="mol003_act3",
        activateCond="mol003_act2",
    )

    quest(
        "mol003_act4",
        "The Hall Before Departure",
        "Ólafr is in Herdholt's great hall beneath the carved beams. His half-brothers "
        "Þorleikr and Bárðr are in the yard. They know he is sailing. They do not "
        "know what you are bringing him. You need to reach Ólafr without the brothers "
        "seeing what changes hands. The hall has three entrances: the main door, "
        "the kitchen passage, and the low back door used by the household servants. "
        "The main door opens directly into the yard where the brothers are standing.",
        "HHL",
        "The kitchen passage brings you in behind the servants' screen. Ólafr looks "
        "up from the sailing-kit he is checking. He sees you. He sees what you are "
        "carrying. He holds out his hand without a word. The hall is quiet. "
        "The carved beams overhead — the gods' stories, the smith's work — "
        "are witness to nothing in particular.",
        "Þorleikr comes in behind you through the main door just as you approach "
        "Ólafr. He sees the handoff. His expression registers the ring's shape "
        "and does not change. Later someone will remember this moment.",
        "DEX", 13,
        checkPassFlag="mol003_act4",
        activateCond="mol003_act3",
    )

    quest(
        "mol003_act5",
        "Before the Ship",
        "Ólafr holds the ring in his palm. He has been taught the Irish words for "
        "grandfather — Melkorka drilled them into him for years, patient and exact, "
        "the way you teach a child a language in a house where no one else speaks it. "
        "He turns the ring over. He wraps it in the cloth his mother hemmed "
        "for this exact purpose. He says, quietly, not to you specifically: "
        "'She taught me the Irish word for grandfather.' He opens his sailing-kit "
        "and places the wrapped ring at the bottom. He closes it. "
        "He looks at you once more and says: 'Tell her I will send word from Ireland.' "
        "He does not say: if I find him. He says: from Ireland. The ship is ready. "
        "The tide is going out.",
        "HHL",
        "You let it settle. The ring is in his kit. The voyage is ready. "
        "The mother's gift has traveled from Melkorkastaðir to this hall "
        "across a contested ford and a merchant's good eye and a brother's jurisdiction. "
        "It is in the right hands. You leave before the brothers come back through "
        "the main door.",
        "You add something — a word about the mother, or a wish, or an unnecessary "
        "explanation. Ólafr looks at you with patient courtesy. He waits for you "
        "to finish. Then he closes his kit. The moment is slightly heavier than it "
        "needed to be and there was no reason for that.",
        "WIS", 11,
        checkPassFlag="mol003_act5",
        activateCond="mol003_act4",
        questComplete=True,
    )

    # ── Cycle 4: The Ambush Warning ────────────────────────────────────────────
    # Theme: The warning that arrives when the warned already knows;
    #        carrying urgency past its own necessity.
    # Route: LGR → LXF → LXF → HHL → HHL
    print("\n-- Cycle 4: The Ambush Warning --")

    quest(
        "mol004_act1",
        "The Servant at Laugar",
        "The servant's name is Sigríðr. She is not Guðrún's confidante — she is a "
        "woman who carries water and firewood and has ears. She overheard the brothers "
        "planning before dawn. Ósvífr's sons left before first light on horseback. "
        "Kjartan is on the road east toward Saelingsdale. The ambush is set at "
        "the upper valley crossing, which is roughly two hours ahead of him "
        "at the pace he usually rides. It is now mid-morning. "
        "Sigríðr cannot run without someone noticing. She cannot send household "
        "members without someone asking why. She is standing in the doorway "
        "of the storeroom looking at you with the expression of a person "
        "who has calculated the available options and found exactly one.",
        "LGR",
        "You read the window correctly. Two hours lead, if the plan is already set. "
        "One hour to the upper crossing from the ford if you push. Kjartan "
        "rides carefully in unfamiliar conditions; he may be slower than usual. "
        "The margin is not comfortable but it is a margin. You take the "
        "commission without negotiating. You leave through the back yard.",
        "You understand the logistics but not the precise timeline. You lose "
        "a quarter-hour asking questions that the margin did not have.",
        "WIS", 12,
        checkPassFlag="mol004_act1",
    )

    quest(
        "mol004_act2",
        "The Ford in Flood",
        "The ford is running higher than usual. Recent rain. The stones are "
        "invisible under fast brown water. The banks are churned — three or four "
        "horses came through here in the last two hours, pushing hard. "
        "Guðrún's brothers went this way. You need to be faster than they were "
        "and they were not moving slowly. "
        "The ford center is chest-high and pulling sideways. The far bank is "
        "clear. Beyond it the upper valley road forks at the bent rowan.",
        "LXF",
        "You read the current correctly and cross at the upstream angle. "
        "The stones are slippery but findable. You reach the far bank without "
        "losing ground. The rowan is ahead. The road forks in the right direction. "
        "You are still inside the margin.",
        "The current catches you at the center and you lose ten yards downstream "
        "before you can regain footing. You reach the far bank cold and late. "
        "The margin is gone. What follows is witness, not warning.",
        "STR", 13,
        checkPassFlag="mol004_act2",
        activateCond="mol004_act1",
    )

    quest(
        "mol004_act3",
        "The Outrider",
        "He comes from the high ground on the left fork — one of Ósvífr's men, "
        "riding back on a different road, sent to watch for exactly this kind of "
        "pursuit. He has seen you cross the ford from the ridge. He is "
        "coming down the slope at a canter with his hand on his sword-hilt "
        "and the expression of someone with a specific instruction about "
        "people following the brothers' route. "
        "He is not large. He is not slow. He has the high ground for another "
        "forty yards and he intends to use it.",
        "LXF",
        "You hear the shale crumbling under his horse's hooves before he "
        "commits to the descent. You take the uphill position at the road edge. "
        "He arrives with speed and not much plan beyond stopping you. "
        "The fight is brief.",
        "He arrives with the high ground and the initiative. The fight takes "
        "longer and costs more.",
        "WIS", 12,
        checkPassFlag="mol004_act3",
        activateCond="mol004_act2",
        monster="mounted_raider",
        monsterHP=22,
        monsterAC=13,
    )

    quest(
        "mol004_act4",
        "The Farmhand's Detour",
        "A farmhand from Herdholt is coming the other way on the road — heading "
        "toward Laugar on some errand. He has just come down from the upper valley. "
        "He saw what is on the road ahead of you: Guðrún's brothers in position "
        "at the upper crossing. And he knows which road Kjartan actually took, "
        "because he saw him from the high field an hour ago. "
        "Kjartan did not take the upper crossing road. He took the shepherd's path "
        "through the northern pasture — the one that joins the valley road "
        "a half-mile past the ambush site. If you move now you can reach that "
        "junction before Kjartan does. The farmhand is staring at you, "
        "uncertain whether to volunteer this or wait to be asked.",
        "HHL",
        "You ask directly and clearly — which road, how far ahead. "
        "He gives you the shepherd's path without hesitation. You are already "
        "moving before he finishes. He calls after you: 'The gate is tied, "
        "not locked.' The shortcut through the north field gate saves the time "
        "the ford cost you.",
        "He sees your urgency but wants to understand the situation before he "
        "commits to helping someone run toward an armed family dispute. "
        "The conversation takes longer than the margin allows.",
        "CHA", 13,
        checkPassFlag="mol004_act4",
        activateCond="mol004_act3",
    )

    quest(
        "mol004_act5",
        "Kjartan on the Road",
        "You find him on the shepherd's path, exactly where the farmhand said. "
        "He is riding at an easy pace, alone, unhelmeted, with the specific "
        "composure of a man who has made a decision about this morning and "
        "intends to live inside it. He sees you coming up the path fast. "
        "He sees your face. He slows his horse. "
        "He says: 'You have come from the south road.' Not a question. "
        "He looks at you for a moment. Then: 'I know what is ahead. "
        "I came this way on purpose.' He holds your gaze. "
        "The ambush site is visible on the ridge above the valley road — "
        "Guðrún's brothers, in position, watching the wrong road. "
        "Kjartan looks in that direction once, then back at you. "
        "'You ran a long way for a warning I already had.' "
        "He says it without contempt. Simply true.",
        "HHL",
        "You hold the warning. It is beside the point now. You were a witness "
        "to his decision, not a rescuer. He knew. He came this way on purpose. "
        "Whatever he intends to do about the brothers on the ridge "
        "is his to decide. You are already out of the way by the time "
        "he turns his horse toward the valley road.",
        "You say something — offer an alternative route, a plan, a reason "
        "to turn back. He looks at you with patience. He says: 'I know.' "
        "He says it once more: 'I know.' Then he turns his horse. "
        "The warning traveled a long way to land on ground that was already covered.",
        "WIS", 11,
        checkPassFlag="mol004_act5",
        activateCond="mol004_act4",
        questComplete=True,
    )

    # ── Cycle 5: Gestr's Record ────────────────────────────────────────────────
    # Theme: The dream-record as legal weight; the prophecy that was accurate enough
    #        to disturb a court; a fulfilled prediction becomes evidence.
    # Route: LGR → LXF → LXF → ALT → ALT
    print("\n-- Cycle 5: Gestr's Record --")

    quest(
        "mol005_act1",
        "What Gestr Left Behind",
        "Gestr Oddleifsson is dead. His granddaughter Þóra holds his house "
        "at the edge of the Dalir district and his papers, among which is "
        "the document everyone is looking for: the four-dreams interpretation, "
        "written in Gestr's own hand the morning after he told Guðrún "
        "what her dreams meant. He wrote it down because he was a careful "
        "record-keeper and because he thought the accuracy would be useful someday. "
        "He was right. Both claimants in the current inheritance dispute "
        "at the Althing need this document to establish the timeline of events. "
        "Both have sent legal agents. Both agents are in the district now. "
        "Þóra is holding the document and looking at you with the expression "
        "of someone who has decided to trust exactly one more person.",
        "LGR",
        "You read the situation without making Þóra spell it out. Two claimants, "
        "two legal agents, one document. The law-speaker at the Althing needs "
        "it in hand before either agent can file. You take it and tell her "
        "you will not open it and you will not say whose hands it came from. "
        "She wraps it in oilskin and hands it over.",
        "She needs reassurance you are not working for one of the claimants. "
        "The conversation takes long enough that one of the legal agents, "
        "on his second circuit of the district roads, passes the farmstead "
        "and sees your face.",
        "WIS", 12,
        checkPassFlag="mol005_act1",
    )

    quest(
        "mol005_act2",
        "The Legal Agent at the Ford",
        "The first claimant's legal agent is at the ford. He is not a thug — "
        "he is a lawman, with specific authority granted by the law-speaker's "
        "pre-Althing hearing, to compel the production of relevant documents "
        "in this district. He has a written order. He holds it up. "
        "He says: 'If you carry Gestr Oddleifsson's written interpretation "
        "of Guðrún Ósvífrsdóttir's four dreams, you are required to surrender "
        "it to me as the authorized representative of—' "
        "He continues for some time. The ford behind him is unguarded. "
        "The road is otherwise empty.",
        "LXF",
        "You tell him the document is not in your possession — which is true "
        "in the narrow sense that it is wrapped in oilskin inside your pack "
        "and you have not removed it since receiving it and therefore "
        "have not technically confirmed its presence. The lawman considers "
        "this. He is not stupid. But the narrow sense is what the law "
        "actually operates on. He steps aside, visibly unhappy.",
        "He is persuaded but conditionally. He sends a runner ahead to notify "
        "his principal. By the Althing road junction someone is waiting for you.",
        "CHA", 13,
        checkPassFlag="mol005_act2",
        activateCond="mol005_act1",
    )

    quest(
        "mol005_act3",
        "The Second Claimant's Man",
        "The second claimant's representative is not a lawman. He is a hired man "
        "with a sword and the instruction to acquire the document by whatever "
        "means the situation requires. He is waiting at the junction of the "
        "Althing road and the upper track, where the trees narrow the road "
        "to a single passage. He does not present credentials. He simply "
        "steps into the road and says: 'That document is my employer's property. "
        "You may choose to make this simple or complicated.' "
        "He is making it complicated by being here. He has chosen his ground well.",
        "LXF",
        "You hear him before you see him — his boot on a root in the verge. "
        "He has positioned himself facing the road; you have the angle of approach. "
        "He is competent but not exceptional. The document stays in the pack.",
        "He has the ground and the initiative. The document survives but the "
        "detour to avoid the worst of the engagement costs time at the Althing.",
        "WIS", 12,
        checkPassFlag="mol005_act3",
        activateCond="mol005_act2",
        monster="hired_sword",
        monsterHP=20,
        monsterAC=13,
    )

    quest(
        "mol005_act4",
        "The Law-Speaker's Clerk",
        "The Althing is in session. The Law-Speaker's clerk sits at a table "
        "near the Lögberg intake station, processing the day's filings. "
        "He has a queue. He is working through it. He does not look up when "
        "you approach. He holds out his hand for the next document in order. "
        "Behind you, the first claimant's legal agent has arrived at the "
        "Althing perimeter — he is arguing with the gate-keeper about "
        "an emergency motion to compel. You have perhaps five minutes "
        "before he reaches this table with proper authority.",
        "ALT",
        "You tell the clerk this is a time-sensitive evidentiary document "
        "for the Ósvífrsdóttir inheritance hearing, that two parties are "
        "attempting to intercept it, and that the law-speaker's own integrity "
        "in this case depends on receiving it before either party can file "
        "a competing motion. You name the hearing. You name the claimants. "
        "He looks up. He takes the document. He stamps it received.",
        "He processes you in order. The legal agent arrives at the table "
        "thirty seconds before the clerk finishes. There is a procedural "
        "argument. The document is eventually filed but not before the "
        "first claimant's agent has seen its contents.",
        "CHA", 13,
        checkPassFlag="mol005_act4",
        activateCond="mol005_act3",
    )

    quest(
        "mol005_act5",
        "Filed Under Dreams",
        "The law-speaker reads the document at the Lögberg. He reads it twice. "
        "He is a man who has seen everything pass through this plain — "
        "land claims, blood feuds, divorce settlements, questions of royal "
        "descent — and he has the calm of someone for whom the remarkable "
        "has become ordinary. He reads Gestr's four interpretations. "
        "He reads the dreams they interpret. He reads the note at the bottom "
        "in Gestr's hand: 'All four occurred as predicted. Written at Hagi, "
        "the year of Kjartan Ólafsson's death, in case anyone needs to know.' "
        "He looks up and says: 'Four dreams, four husbands, all accurate. "
        "This is a legal document now.' He stamps it. He files it. "
        "He says to his clerk: 'Dreams, fulfilled prophecy category.' "
        "His clerk writes something. Whatever the claimants fight over now, "
        "the record exists. Gestr was right. It was useful.",
        "ALT",
        "You let it settle. The document is filed. The record exists. "
        "Gestr wrote it down the morning after because he was careful "
        "and he thought it would matter. He was right. You leave the Althing "
        "before either claimant's agent finds you.",
        "You add something — a comment about the accuracy of the interpretation, "
        "or an observation about the dreams themselves. The law-speaker "
        "looks at you with the expression of a man who has work to do. "
        "He returns to his desk. The document is filed regardless.",
        "WIS", 11,
        checkPassFlag="mol005_act5",
        activateCond="mol005_act4",
        questComplete=True,
    )

    # ── Cycle 6: Hrefna's Grave-Gift ──────────────────────────────────────────
    # Theme: The restitution that only the dead can receive;
    #        completing the accounting for the living by giving to the grave.
    # Route: HHL → LXF → LXF → LGR → LGR
    print("\n-- Cycle 6: Hrefna's Grave-Gift --")

    quest(
        "mol006_act1",
        "The Peacock's Commission",
        "Ólafr the Peacock is very old. He opens the carved chest — the one "
        "in the corner where Kjartan's sword lies on his riding cloak. "
        "He takes out a carved silver ring-brooch: Kjartan's, given to him "
        "by his mother Þórgerd on his first voyage, worn on his best cloak "
        "at the Althing the summer everyone could see what Guðrún was. "
        "Ólafr wraps it in plain cloth. He says: 'Hrefna is at Meldalir. "
        "The burial mound is on the north slope, above the farmhouse.' "
        "He does not say: put it in the mound. He does not say: it is a "
        "grave-gift. He says: 'Her family will know what to do with it.' "
        "He does not ask if you understand.",
        "HHL",
        "You read the commission correctly. This is not a delivery to Hrefna's "
        "family — it is a delivery to Hrefna, through them. The old man cannot "
        "go himself. The brooch is the only form in which the acknowledgment "
        "can travel. You take it. You leave before he has to say anything else.",
        "You hesitate at the commission's exact terms. Ólafr adds one sentence: "
        "'She died within the year. She did not deserve to.' He closes the chest. "
        "You take the brooch.",
        "WIS", 12,
        checkPassFlag="mol006_act1",
    )

    quest(
        "mol006_act2",
        "The Ford Remembered",
        "The ford is quiet today. No watchers on the banks. But halfway across, "
        "a man from Bolli's old household appears on the far bank — "
        "he is not blocking the road; he is simply there, in the way that "
        "people are when they have heard something is moving through the district "
        "and they want to know what it is. He knows you came from Herdholt. "
        "He knows Herdholt and Hrefna's family are connected by a death "
        "that nobody discussed afterward. A brooch from Herdholt moving "
        "toward Meldalir reads as a message. He wants to know what message.",
        "LXF",
        "The commission is private. The object is an old family piece. "
        "You are carrying it to Meldalir on an errand for the household, "
        "nothing that concerns the district. You say it with the "
        "specific flatness of someone who is not hiding anything "
        "because there is nothing to hide that he could act on. "
        "He looks at you. He steps aside.",
        "He is not persuaded but not certain. He follows you at a distance "
        "for half a mile before turning back. The family at Meldalir "
        "sees him on the road behind you and asks questions you "
        "don't have easy answers for.",
        "CHA", 13,
        checkPassFlag="mol006_act2",
        activateCond="mol006_act1",
    )

    quest(
        "mol006_act3",
        "Þorkell's Hired Man",
        "Þorkell Eyjólfsson married Guðrún after Bolli died. He did not know "
        "Kjartan. He did not know Hrefna. He is, however, a man who does not "
        "want his wife's complex past made visible through public acts of "
        "acknowledgment from Herdholt. A grave-gift from Ólafr the Peacock "
        "to Hrefna's burial mound is exactly the kind of public act "
        "that makes Guðrún's past visible. "
        "His hired man is on the road above Meldalir, on the high track "
        "that looks down at the approach. He has been there since morning. "
        "He did not come to talk.",
        "LXF",
        "You see the position before you commit to the approach path. "
        "The high track is exposed; the lower path through the trees "
        "is longer but unobserved. You take the lower path. "
        "He finds you at the tree-line. The fight is in shadows, "
        "brief, and conclusive.",
        "He has the position and you approach on the expected road. "
        "The fight is longer and noisier. Someone at Meldalir hears "
        "and comes out to see what is happening on the approach path.",
        "WIS", 12,
        checkPassFlag="mol006_act3",
        activateCond="mol006_act2",
        monster="hired_sword",
        monsterHP=24,
        monsterAC=14,
    )

    quest(
        "mol006_act4",
        "The Grave-Keeper's Gate",
        "Hrefna's father is dead. The farm at Meldalir is held by her brother "
        "Kálf Ásgeirsson, who manages the burial mound on the north slope. "
        "He has had no contact with Herdholt since the funeral. "
        "Herdholt sent nothing after Hrefna died. No word. No acknowledgment. "
        "He is a careful man who remembers accurately. He looks at the cloth "
        "package in your hands and says: 'What family sends this.' Not a question. "
        "A condition. He needs the answer before anything passes through his gate.",
        "LGR",
        "You name Ólafr Höskuldsson — Ólafr the Peacock — and you say "
        "it is a grave-gift from the father of the man she married. "
        "You say it clearly: a grave-gift, not a settlement, not a message, "
        "not a reopening of anything. A brooch that belonged to his son. "
        "Kálf holds still for a moment. Then: 'Come through. "
        "The mound is on the north slope.' He does not add anything.",
        "He is not satisfied with the summary. He wants to know exactly "
        "what is in the cloth and why it took this long. The conversation "
        "is truthful and costly. He lets you through but the weight of "
        "the delay is on Ólafr's name, not yours.",
        "CHA", 13,
        checkPassFlag="mol006_act4",
        activateCond="mol006_act3",
    )

    quest(
        "mol006_act5",
        "Meldalir",
        "The burial mound is on the north slope, above the farmhouse, "
        "facing the fjord. Kálf and an old farmhand open the entrance stones "
        "with a specific practiced care — they have done this before, "
        "adding things to the mound since Hrefna was placed in it. "
        "You give Kálf the wrapped brooch. He unwraps it. "
        "He holds the ring-brooch up once in the light. "
        "He wraps it again. He places it inside the mound opening. "
        "He and the farmhand close the entrance stones. "
        "The farmhand bows toward the mound once — not dramatically. "
        "Simply an inclination of the head. He holds it for a moment. "
        "Then he straightens and the three of you walk back down the slope "
        "without talking. At the farmhouse gate Kálf says: "
        "'Tell the old man she is well-remembered here.' "
        "He goes inside. The commission is complete.",
        "LGR",
        "You let it be what it is. The brooch is in the mound. "
        "Hrefna is well-remembered at Meldalir. The old man at Herdholt "
        "has completed what he could complete. You leave before midday "
        "with Kálf's message, which is the only thing the living "
        "needed from this transaction.",
        "You say something about Kjartan, or about Ólafr, or about how "
        "long it took. Kálf looks at you once. He has already said "
        "what he intends to say. He goes inside without adding to it.",
        "WIS", 11,
        checkPassFlag="mol006_act5",
        activateCond="mol006_act4",
        questComplete=True,
    )

    # ── Cycle 7: The Carved Beams of Herdholt ─────────────────────────────────
    # Theme: The craftsman's fee for the gods' stories; beauty that owed a human
    #        price; the widow holds what the patron forgot.
    # Route: LGR → LXF → LXF → HHL → HHL
    print("\n-- Cycle 7: The Carved Beams of Herdholt --")

    quest(
        "mol007_act1",
        "The Widow's Scroll",
        "Ragnveig's farmstead is small and clean and very precise. "
        "She is in her seventies. Her husband Þorsteinn was the woodcarver "
        "who cut the great beams of Herdholt — the gods' stories, the death "
        "of Baldr, the binding of Loki — thirty years ago. Ólafr the Peacock "
        "commissioned the work and paid half in advance. Þorsteinn was killed "
        "on the road home from another commission before the final payment "
        "was settled. The deed of commission is in Ragnveig's hands: "
        "fifteen marks of silver, Ólafr's seal, the specific panels listed. "
        "She has been patient for thirty years. "
        "She wants it acknowledged before she dies. Not paid — acknowledged, "
        "in writing, before witnesses, at Herdholt itself.",
        "LGR",
        "You read the whole weight of it. Thirty years of precise patience. "
        "Not bitterness — she is past bitterness. Just accuracy. "
        "The gods' stories are on the beams at Herdholt; her husband "
        "cut them; the fee is still owed. You take the scroll and "
        "tell her you will carry it to Herdholt and see it properly received. "
        "She gives you a second document: the specific panel inventory, "
        "which lists what Þorsteinn carved and in what order. Evidence.",
        "She needs to understand your stake in the commission "
        "before she trusts you with the scroll. The explanation takes time. "
        "She is satisfied eventually but the morning is older.",
        "WIS", 12,
        checkPassFlag="mol007_act1",
    )

    quest(
        "mol007_act2",
        "Ólafr's Sons at the Ford",
        "Ólafr's sons know this commission exists. They have known for years. "
        "Settling an acknowledged debt from their father's hall affects "
        "the hall's legal standing in ways they have preferred to leave "
        "unresolved. One of them — Þórðr Ólafsson, the methodical one — "
        "is at the ford with a legal companion and the specific posture "
        "of someone who has a prepared position. "
        "He does not want to compel the document from you — that would "
        "make the debt more visible, not less. He wants to convince you "
        "to carry it to a mediation at Laugar instead of directly to Herdholt.",
        "LXF",
        "You tell him the commission is direct: document to Herdholt, "
        "acknowledgment before witnesses at the hall itself. "
        "Mediation at Laugar would be a different commission, "
        "which you have not accepted. The carrier's obligation is to the "
        "instruction given, not to alternatives proposed en route. "
        "You cross while he is considering his response.",
        "He makes a reasonable case and you find yourself responding to "
        "the substance of it. By the time you reestablish the original "
        "commission's terms, you have implied more flexibility than you intended. "
        "He sends word to Herdholt ahead of you.",
        "CHA", 13,
        checkPassFlag="mol007_act2",
        activateCond="mol007_act1",
    )

    quest(
        "mol007_act3",
        "The Carver's Son",
        "Þóroddr Þorsteinsson — the dead carver's son — is also on the road. "
        "He has his own version of the settlement: his father was paid, "
        "he says, in kind, through a different arrangement that Ólafr "
        "confirmed verbally at the hall's dedication feast. No written record. "
        "But if you deliver the scroll and Ólafr acknowledges it, "
        "the verbal arrangement becomes irrelevant and the deed stands. "
        "Þóroddr wants the scroll — not to destroy it, he says, "
        "but to add his father's inventory of the additional work "
        "done beyond the original commission. He has the inventory. "
        "He wants to take the scroll from you long enough to attach it. "
        "He is not small. He is not asking politely.",
        "LXF",
        "You tell him the scroll goes to Herdholt intact and unmodified. "
        "If he has an inventory of additional work, he may bring it himself "
        "and present it alongside the deed. His claim is not your commission. "
        "He finds this unacceptable and reaches for the scroll. "
        "The road is narrow. The discussion ends quickly.",
        "He takes the scroll briefly. You recover it but the seal "
        "is broken. At Herdholt the unsealed document requires "
        "additional verification before Ólafr will acknowledge it.",
        "STR", 13,
        checkPassFlag="mol007_act3",
        activateCond="mol007_act2",
        monster="farmstead_warrior",
        monsterHP=26,
        monsterAC=14,
    )

    quest(
        "mol007_act4",
        "Ólafr at the Beams",
        "Ólafr the Peacock is standing beneath the carved beams. "
        "He is not looking at them — he stopped needing to look at them "
        "years ago; he knows every panel from memory. He is looking at you. "
        "He has received word from Þórðr about the mediation proposal. "
        "He knows what the scroll contains. He says: 'Thirty years is a "
        "long time to keep a deed of commission.' "
        "He does not say: I forgot. He does not say: the circumstances. "
        "He stands beneath Baldr's death — the panel Þorsteinn carved last, "
        "Ragnveig said, the one he was most proud of — and waits "
        "for you to present the document.",
        "HHL",
        "You present the deed and the panel inventory together. "
        "You name what Ragnveig is asking: not payment, acknowledgment, "
        "in writing, before witnesses, at the hall itself. "
        "You say it clearly and briefly. "
        "Ólafr looks at the deed. He looks at the panel inventory. "
        "He says: 'Bring me sealing wax.' He says it to the room.",
        "He is resistant to the acknowledgment's form — he would prefer "
        "a private settlement without witnesses. You spend time "
        "establishing why the public form is what the commission requires. "
        "He eventually agrees but the witnesses have to be assembled.",
        "CHA", 13,
        checkPassFlag="mol007_act4",
        activateCond="mol007_act3",
    )

    quest(
        "mol007_act5",
        "The Seal on the Scroll",
        "Ólafr the Peacock presses his signet ring into the wax. "
        "The hall is quiet. Three household witnesses stand against "
        "the far wall. The carved beams overhead — Þorsteinn's work, "
        "every panel, the death of Baldr at the top of the north wall "
        "where the light catches it at midday — are present "
        "in the way that things are present when they have been "
        "acknowledged correctly. Ólafr says: "
        "'The man who carved the death of Baldr deserved his fee.' "
        "He says it once. He rolls the scroll. He gives it back to you "
        "for delivery to Ragnveig. The witnesses file out. "
        "He stands alone beneath the beams for a moment. "
        "You are already at the door.",
        "HHL",
        "You leave before he has to perform composure for another witness. "
        "The scroll is sealed and witnessed. Ragnveig will have "
        "what she asked for. Thirty years of patience, resolved "
        "in a hall decorated with her husband's work. "
        "The panel inventory goes in the archive. The carver is named.",
        "You stay a moment longer than necessary, looking at the beams. "
        "Ólafr notices. He says nothing. But the moment is slightly "
        "longer than it needed to be and the door takes longer to reach.",
        "WIS", 11,
        checkPassFlag="mol007_act5",
        activateCond="mol007_act4",
        questComplete=True,
    )

    print("\n=== MOL cycles 3–7 complete. 5 cycles, 25 acts. ===")

if __name__ == "__main__":
    main()
