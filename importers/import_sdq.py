#!/usr/bin/env python3
# SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
# ═══════════════════════════════════════════════════════════════════════════
# ⚠️  ARCHAIC — OUT OF DATE.  Historical one-shot importer (POSTs to the
#     localhost:1367 WBAPI).  Content was long ago imported and lives in
#     index.html.  This script likely NO LONGER RUNS against the current
#     server/schema.  Kept for reference only — do not run without review.
#     Import history: BACKLOG.md / plan-archive.md / 1367-sources/.
# ═══════════════════════════════════════════════════════════════════════════
"""Import SDQ — Rob Roy (Sir Walter Scott), 35 acts (7 cycles × 5 acts).
Nodes: OBH/GLA/ABF/GLN/LLM/EDI created; LON/WM/BK existing.
SDQ collision (The Crones' Domain) → cycle 1 uses OBH."""
import time, requests

BASE = "http://localhost:1367"

def api(method, path, **kw):
    r = getattr(requests, method)(f"{BASE}{path}", **kw)
    r.raise_for_status()
    return r.json()

def get_nonce(quest_id):
    d = api("post", "/api/nonce", json={"type": "quest", "id": quest_id})
    return d["nonce"]

def create_quest(q):
    nonce = get_nonce(q["id"])
    d = api("post", "/api/quest", json=q, headers={"X-Nonce": nonce})
    if d.get("ok"):
        print(f"  OK: {q['id']} — {q['title']}")
    else:
        print(f"  ERR: {q['id']} — {d}")
    return d

def wait_server():
    time.sleep(9)
    api("get", "/api/ping")

QUESTS = [
    # ── Cycle 1 — Diana's Letter ──────────────────────────────────────────
    {
        "id": "sdq_01_act1",
        "title": "Diana's Letter — The Library Window",
        "type": "skill_check",
        "activateNode": "OBH",
        "checkStat": "WIS", "checkDC": 12,
        "desc": "You stand in the dark library at Osbaldistone Hall as Diana Vernon speaks through the half-open casement window from the garden side. Her voice is steady in the way that costs something to keep steady. Two of Rashleigh's riders have been watching the road since morning. She passes you a sealed letter through the glass — heavy cream paper, red wax, a heron cipher — and names a counting-house in Glasgow. You must leave before dawn.",
        "passText": "You track the sound to a stable-boy in Rashleigh's pay pressing himself flat behind the box hedge. He has not seen the letter — only that Diana came to the window. You move him gently inside, lock the tack-room door, and leave before he can shout. Diana's Sealed Letter received.",
        "failText": "You turn too late. A figure at the garden wall vanishes into the dark. You cannot know what they saw. The road will be harder now.",
        "checkPassFlag": "sdqC1A1Done",
    },
    {
        "id": "sdq_01_act2",
        "title": "Diana's Letter — The North Road",
        "type": "skill_check",
        "activateNode": "OBH",
        "checkStat": "CHA", "checkDC": 13,
        "activateCond": "() => !!S_story.sdqC1A1Done",
        "desc": "The sheep-track runs above the Redesdale road through chest-high fog. At a stone bridge over a bog-stream, two of Rashleigh's men hold a lantern and search everyone moving south. They are looking for papers — a ledger, they say, or letters. The sealed letter is against your chest. Your coat is buttoned against the cold. The fog is your ally if you use it correctly.",
        "passText": "You tell him it is a physician's compress — a plaster for a cracked rib, three layers of linen. He presses it with two fingers and flinches at your involuntary breath. He waves you through. Northumberland Road-Pass received.",
        "failText": "He opens your coat. He sees the oilskin shape inside. He does not take it but marks you in his memory and sends a rider south. You reach the border, but they know your face now.",
        "checkPassFlag": "sdqC1A2Done",
    },
    {
        "id": "sdq_01_act3",
        "title": "Diana's Letter — The Gallowgate Checkpoint",
        "type": "skill_check",
        "activateNode": "GLA",
        "checkStat": "CHA", "checkDC": 14,
        "activateCond": "() => !!S_story.sdqC1A2Done",
        "desc": "The painted heron is ten feet away, above a door in the third close off Glasgow's Gallowgate. The counting-house factor watches you through his window grate. Two redcoats work the close entrance, checking writs and bills of passage for Jacobite correspondence. The factor will not come to the door while they stand there — he is waiting to see if you can manage this without his help.",
        "passText": "He checks the pass against his list, finds nothing actionable, and returns it with a half-apologetic gesture. The close is open. The factor's door opens before you reach it — he was watching. Jarvie's Factor's Acknowledgment received.",
        "failText": "He reads your pass twice and finds a discrepancy in the date. He takes you aside for an hour, questioning you in a cold room behind the close. You lose the afternoon. The factor will see you tomorrow — he sends a note with his apprentice.",
        "checkPassFlag": "sdqC1A3Done",
    },
    {
        "id": "sdq_01_act4",
        "title": "Diana's Letter — The Bailie's Parlor",
        "type": "skill_check",
        "activateNode": "GLA",
        "checkStat": "CHA", "checkDC": 13,
        "activateCond": "() => !!S_story.sdqC1A3Done",
        "desc": "Bailie Nicol Jarvie sits across a table from you in his parlor off the Saltmarket. Diana's sealed letter lies between you, untouched. The fire is good; ledgers go floor to ceiling behind him. He has heard how the letter traveled. Now he asks one question: why you did not open it. The right answer will get his countersignature. The wrong one will get you a very polite refusal.",
        "passText": "You tell him she asked you not to. He looks at you for a long moment. Then he writes his signature on the countersignature slip — a quick practical hand, no flourish — and folds it for you. 'Aye. That's the whole of it.' Jarvie's Countersignature received.",
        "failText": "He sets down his cup. He is not angry — he is thinking. He says he needs a day before he can sign. You sleep in his guest room, which is warm, and in the morning he has decided. He signs.",
        "checkPassFlag": "sdqC1A4Done",
    },
    {
        "id": "sdq_01_act5",
        "title": "Diana's Letter — The Factor's Counting-House",
        "type": "skill_check",
        "activateNode": "GLA",
        "checkStat": "CON", "checkDC": 12,
        "activateCond": "() => !!S_story.sdqC1A4Done",
        "desc": "The factor's counting-house at the heron door. One candle. A tin ceiling, a scale, a pressed-wax stamp waiting on the desk. The factor reads Diana's letter once in silence, then again. He looks up: the debt is discharged. He slides a second document across the desk — a deposition naming Diana Vernon as a Jacobite agent, already signed, waiting only for your witness mark. He offers twenty pounds sterling to sign it. Hold your silence and your hands still.",
        "passText": "You put your hands behind your back and say nothing. The factor waits thirty seconds, then takes the deposition and burns it in the candle without comment. He stamps the receipt — the heron seal, mirror of Diana's cipher — and hands it to you. Her letter folds and burns, seal last. The small heron melts. The debt is discharged. Heron-Seal Receipt received.",
        "failText": "Your hand moves toward the pen before you catch it. The factor watches. He puts the deposition away — you have shown him what you are. He processes the letter anyway; Diana's release stands. But he will remember your hesitation.",
        "checkPassFlag": "sdqC1A5Done",
    },
    # ── Cycle 2 — Helen's Justice ─────────────────────────────────────────
    {
        "id": "sdq_02_act1",
        "title": "Helen's Justice — The Loch Shore",
        "type": "skill_check",
        "activateNode": "LLM",
        "checkStat": "WIS", "checkDC": 12,
        "activateCond": "() => !!S_story.sdqC1A5Done",
        "desc": "Helen MacGregor stands between the treeline and Loch Lomond's grey edge, Morris bound at the water behind her, his satchel already open in her hand. She has read the government warrant inside. She holds the satchel out: take it to Rob Roy, tell him what you saw, add nothing and take nothing from it. She does not ask your opinion of what is about to happen.",
        "passText": "'I will carry what you give me and say what I saw.' Helen hands over the satchel and turns back toward the water. Morris's Commission received.",
        "failText": "You begin to say whether what is about to happen is right or wrong. Helen stops you: 'I did not ask your judgment. I asked your service.' She gives you the satchel with diminished confidence.",
        "checkPassFlag": "sdqC2A1Done",
    },
    {
        "id": "sdq_02_act2",
        "title": "Helen's Justice — The Execution",
        "type": "skill_check",
        "activateNode": "LLM",
        "checkStat": "CON", "checkDC": 12,
        "activateCond": "() => !!S_story.sdqC2A1Done",
        "desc": "The execution is brief. The loch is cold. The sound of water and then the sound of nothing. Helen walks to the treeline without looking back. One of her men throws Morris's hat into the loch after him. You stand at the water's edge with the satchel. Hold the position of witness through the execution and the silence — still, present, not moving toward the water, not speaking.",
        "passText": "You hold still. The water settles. Helen looks back once, nods, and is gone. You are alone at the loch.",
        "failText": "You move — one step toward the water. A MacGregor hand holds you still. You are not in danger. But Helen sees it from the treeline, and files it, and the account that reaches Rob Roy may arrive with something missing.",
        "checkPassFlag": "sdqC2A2Done",
    },
    {
        "id": "sdq_02_act3",
        "title": "Helen's Justice — Out of MacGregor Country",
        "type": "skill_check",
        "activateNode": "LLM",
        "checkStat": "DEX", "checkDC": 13,
        "activateCond": "() => !!S_story.sdqC2A2Done",
        "desc": "The patrol road is ahead: English dragoons searching for Morris's route. They will search any satchel on this road. The warrant you carry proves the government had standing arrest plans for a prominent Highland family — in English hands, a diplomatic crisis. Take the high ridge path above the patrol road and cross the exposed section before the dragoons complete their sweep.",
        "passText": "You cross at the patrol's rhythm and descend to the far side with the warrant intact and the patrol none the wiser.",
        "failText": "A scout on the ridge sees movement. You hide the warrant under a flat stone, clear the patrol, retrieve it. But you are now an hour behind Rob Roy's messenger, who is already warning him that strangers are in the glen.",
        "checkPassFlag": "sdqC2A3Done",
    },
    {
        "id": "sdq_02_act4",
        "title": "Helen's Justice — The Highland Road",
        "type": "skill_check",
        "activateNode": "LLM",
        "checkStat": "STR", "checkDC": 13,
        "activateCond": "() => !!S_story.sdqC2A3Done",
        "desc": "Beyond the patrol zone a MacGregor outrider intercepts you on the track. He knows where you are going. He offers the short way to the glen — a ford route government horses cannot follow — on the condition that the satchel stays on your person and dry.",
        "passText": "You cross clean. The outrider brings you to the glen entrance in half the expected time with the satchel dry and the seal undamaged.",
        "failText": "The satchel takes water. The warrant is legible but the government seal is partially dissolved — its provenance is harder to assert with certainty when Rob Roy reads it.",
        "checkPassFlag": "sdqC2A4Done",
    },
    {
        "id": "sdq_02_act5",
        "title": "Helen's Justice — Rob Roy's Glen",
        "type": "skill_check",
        "activateNode": "GLN",
        "checkStat": "CHA", "checkDC": 12,
        "activateCond": "() => !!S_story.sdqC2A4Done",
        "desc": "Rob Roy reads the warrant without expression and sets it on the rock beside him. He looks at you: 'You were at the loch. Tell me what happened.' He wants to know what his wife did — not softened, not defended, not condemned. The exact sequence. He has been married to Helen MacGregor for twenty years. He does not need the event translated for him.",
        "passText": "You say it exactly. Rob Roy is quiet for a long time. Then he folds the warrant twice and puts it inside his coat. 'That is my wife. That is exactly my wife.' He pulls the ring from his finger and holds it out. 'You carried this clean.' Rob Roy's Ring received.",
        "failText": "You add a qualification — something that softens one moment. Rob Roy hears the gap. 'You are being kind to me about it. I do not need that.' He takes the warrant anyway. The commission is complete but the account is not entirely what Helen sent you to deliver.",
        "checkPassFlag": "sdqC2A5Done",
    },
    # ── Cycle 3 — The Bailie's Coulter ───────────────────────────────────
    {
        "id": "sdq_03_act1",
        "title": "The Bailie's Coulter — The Inn at Aberfoyle",
        "type": "skill_check",
        "activateNode": "ABF",
        "checkStat": "WIS", "checkDC": 11,
        "activateCond": "() => !!S_story.sdqC2A5Done",
        "desc": "The brawl at the Clachan of Aberfoyle begins without announcement. Two English soldiers have followed the party in from the road and one has laid hands on a Highland drover. The room is full of men who will fight before they think. Bailie Nicol Jarvie seizes the red-hot coulter from the grate with both hands — a plow-blade left by the farrier — and holds it before him. His coat is already catching. A soldier to his left is not watching the coulter; he is about to go wide. Clear the angle before he reaches the Bailie's side.",
        "passText": "You step into the gap. The soldier pulls up short. The Bailie carries the coulter out the door with his dignity and his coat both on fire. Jarvie's Coulter Attestation received.",
        "failText": "The soldier reaches the Bailie's shoulder. You haul him back by the collar. The Bailie escapes; your coat takes the burn.",
        "checkPassFlag": "sdqC3A1Done",
    },
    {
        "id": "sdq_03_act2",
        "title": "The Bailie's Coulter — The Road to Glasgow",
        "type": "skill_check",
        "activateNode": "ABF",
        "checkStat": "CHA", "checkDC": 12,
        "activateCond": "() => !!S_story.sdqC3A1Done",
        "desc": "South of Aberfoyle a Highland clansman blocks the track — one of the Bailie's kin, sent with a complaint: Jarvie overstepped his territory and his office. 'He has no authority above the Endrick. What he did was a fat man waving a hot blade.' The law extends as far as the person who holds it carries it. Argue this without condescension.",
        "passText": "The clansman listens. He does not agree. He steps aside.",
        "failText": "He demands a written acknowledgment. You write it. It will travel to Weimar alongside the attestation — the document and its challenge, both preserved.",
        "checkPassFlag": "sdqC3A2Done",
    },
    {
        "id": "sdq_03_act3",
        "title": "The Bailie's Coulter — The Gallowgate",
        "type": "skill_check",
        "activateNode": "GLA",
        "checkStat": "INT", "checkDC": 12,
        "activateCond": "() => !!S_story.sdqC3A2Done",
        "desc": "At the Bailie's counting-house in Glasgow a rival magistrate has already filed a formal complaint: Jarvie's attestation is legally invalid because he exceeded his jurisdiction. If upheld, the complaint invalidates the document before it travels. A magistrate cannot invalidate another magistrate's jurisdiction claim in the same court — find the procedural flaw.",
        "passText": "The flaw is clear. The complaint exceeds its own authority. The attestation stands.",
        "failText": "You miss it. The Bailie's clerk finds it two hours later and adds a covering note explaining the defect.",
        "checkPassFlag": "sdqC3A3Done",
    },
    {
        "id": "sdq_03_act4",
        "title": "The Bailie's Coulter — Jarvie's Parlor",
        "type": "skill_check",
        "activateNode": "GLA",
        "checkStat": "WIS", "checkDC": 11,
        "activateCond": "() => !!S_story.sdqC3A3Done",
        "desc": "A government lawyer arrives at Jarvie's parlor wanting the attestation as prosecution evidence against the MacGregor clan: it places MacGregor men at the Clachan during a civil disturbance. Surrendering it converts proof of personal jurisdiction into evidence of clansmen's presence. See the inversion before you hand anything over.",
        "passText": "You see the reversal in time. The attestation stays in the Fighter's coat.",
        "failText": "You begin to hand it over. The Bailie's clerk intercepts the transfer with an expression of patient disappointment and recovers it.",
        "checkPassFlag": "sdqC3A4Done",
    },
    {
        "id": "sdq_03_act5",
        "title": "The Bailie's Coulter — The Archive",
        "type": "skill_check",
        "activateNode": "WM",
        "checkStat": "INT", "checkDC": 10,
        "activateCond": "() => !!S_story.sdqC3A4Done",
        "desc": "Sweelinck reads the attestation. 'He pulled a hot blade from a fire to defend a room full of people who would not have defended him. He wrote this document afterward to explain why he was legally entitled to do it.' Jurisdiction is not bounded by the map of lawful territory alone — it travels with the person willing to carry it beyond the boundary.",
        "passText": "Sweelinck writes: Jurisdiction in Contested Territory, First Entry. The Jarvie Attestation filed. The magistrate who uses his body as the instrument of law has extended it precisely as far as he stood.",
        "failText": "The attestation is filed under general disputes. The principle waits for a better occasion to be named.",
        "checkPassFlag": "sdqC3A5Done",
    },
    # ── Cycle 4 — Rob Roy's Word ──────────────────────────────────────────
    {
        "id": "sdq_04_act1",
        "title": "Rob Roy's Word — The Glen",
        "type": "skill_check",
        "activateNode": "GLN",
        "checkStat": "WIS", "checkDC": 12,
        "activateCond": "() => !!S_story.sdqC3A5Done",
        "desc": "Rob Roy tears a strip of oilcloth from the satchel lining and writes three words in Scots Gaelic with a charred stick — a phrase that is both a greeting and a credential, understood by every MacGregor sentinel from Aberfoyle to Rannoch. 'Say this exactly at the Aberfoyle crossroads. Not before. Not after. Not approximately.' He folds the oilcloth in four. 'You will be asked where you got it. Tell them a man in a glen gave it to you. That is entirely true.'",
        "passText": "You see it clearly: not a letter but a proof of relationship that requires voice, not paper. You put the oilcloth inside your boot, not your coat. Rob Roy nods. MacGregor Passage-Note received.",
        "failText": "You put it in your coat. Rob Roy says: 'Boot. Not coat. They check the coat first.' You move it.",
        "checkPassFlag": "sdqC4A1Done",
    },
    {
        "id": "sdq_04_act2",
        "title": "Rob Roy's Word — The Aberfoyle Crossroads",
        "type": "skill_check",
        "activateNode": "ABF",
        "checkStat": "CHA", "checkDC": 13,
        "activateCond": "() => !!S_story.sdqC4A1Done",
        "desc": "A MacGregor sentinel in shepherd's clothes leans on a gate at the Aberfoyle crossroads. He is waiting. Note first, phrase second, pause, wait for the response — in that order. Speak the phrase with the exact register Rob Roy used: not a password recited but a greeting made to someone you know, without having met.",
        "passText": "The sentinel responds with a single word and opens the gate.",
        "failText": "Your register is too formal. He stares a long moment, then gestures you through. 'Rob Roy's man,' he tells the man behind the wall. 'Aye, but soft.'",
        "checkPassFlag": "sdqC4A2Done",
    },
    {
        "id": "sdq_04_act3",
        "title": "Rob Roy's Word — The Capital",
        "type": "skill_check",
        "activateNode": "EDI",
        "checkStat": "CHA", "checkDC": 12,
        "activateCond": "() => !!S_story.sdqC4A2Done",
        "desc": "At the Edinburgh customs house a government lawyer stops you. He has seen the oilcloth and wants to know what it says. 'Jacobite correspondence is prosecutable. If that is a cipher, you are in difficulty.' Establish the note as a personal memorandum: a phrase from a Highland song, written against forgetting; not a political document.",
        "passText": "He accepts the framing with visible skepticism and lets you pass.",
        "failText": "He holds the note one hour for translation. The translator finds it is a greeting, not a cipher. Released.",
        "checkPassFlag": "sdqC4A3Done",
    },
    {
        "id": "sdq_04_act4",
        "title": "Rob Roy's Word — The Royal Mile",
        "type": "skill_check",
        "activateNode": "EDI",
        "checkStat": "CHA", "checkDC": 11,
        "activateCond": "() => !!S_story.sdqC4A3Done",
        "desc": "A Jacobite agent recognizes the oilcloth format at a printer's stall on the Royal Mile. He knows what notes written on torn oilcloth in charred stick mean. He wants it — not to use it, but because possessing it proves something about the clan network. Decline without naming what you know about the note's function.",
        "passText": "You tell him it is a personal keepsake. He does not believe you and lets you go.",
        "failText": "He follows you for an hour through the Old Town closes. You lose him below the castle.",
        "checkPassFlag": "sdqC4A4Done",
    },
    {
        "id": "sdq_04_act5",
        "title": "Rob Roy's Word — The Archive",
        "type": "skill_check",
        "activateNode": "WM",
        "checkStat": "INT", "checkDC": 10,
        "activateCond": "() => !!S_story.sdqC4A4Done",
        "desc": "Sweelinck reads the oilcloth. 'Three words. A greeting that is also a credential. It was oral until someone wrote it down, and now it is a document — but only if the voice is added. The paper enables the voice. It does not replace it.'",
        "passText": "Sweelinck writes: Oral Traditions — Written Record, First Entry. The MacGregor Passage-Note. The paper enables the voice it cannot substitute.",
        "failText": "The note is filed under Highland materials. The principle waits for a fuller classification.",
        "checkPassFlag": "sdqC4A5Done",
    },
    # ── Cycle 5 — Rashleigh's Double Game ────────────────────────────────
    {
        "id": "sdq_05_act1",
        "title": "Rashleigh's Double Game — The Hall",
        "type": "skill_check",
        "activateNode": "OBH",
        "checkStat": "INT", "checkDC": 12,
        "activateCond": "() => !!S_story.sdqC4A5Done",
        "desc": "Rashleigh's traveling case is open on the hall table at Osbaldistone Hall. Two bundles of paper, each tied with red ribbon — identical in structure, Osbaldistone commercial documents — different in the counterparty name at the top. One names a Hanoverian factor in London. The other names a Jacobite agent in Edinburgh. He has prepared the same transaction for two incompatible masters. Identify which is which without disturbing the case's arrangement.",
        "passText": "The Edinburgh bundle is on top. You take it, replace it with a folded blank sheet. Rashleigh will not notice until London. Rashleigh's Double Papers received.",
        "failText": "You take both bundles. The case is obviously lighter. You hear Rashleigh's step on the gravel and move fast for the servants' passage.",
        "checkPassFlag": "sdqC5A1Done",
    },
    {
        "id": "sdq_05_act2",
        "title": "Rashleigh's Double Game — The Border Road",
        "type": "skill_check",
        "activateNode": "OBH",
        "checkStat": "CHA", "checkDC": 13,
        "activateCond": "() => !!S_story.sdqC5A1Done",
        "desc": "At Carter Bar a government inspection post is checking documents moving south for Jacobite fund transfers. The Edinburgh bundle describes a commercial transaction that is also a fund transfer. The commercial language is dry enough to bore an inspector — present it as routine trade correspondence.",
        "passText": "He reads the top sheet and loses interest.",
        "failText": "He copies the Edinburgh counterparty name into his register. The name will eventually attract attention. You are past the border.",
        "checkPassFlag": "sdqC5A2Done",
    },
    {
        "id": "sdq_05_act3",
        "title": "Rashleigh's Double Game — The City",
        "type": "skill_check",
        "activateNode": "LON",
        "checkStat": "CHA", "checkDC": 12,
        "activateCond": "() => !!S_story.sdqC5A2Done",
        "desc": "A Hanoverian intelligence agent has been following the case since Northumberland. He wants the London bundle privately — he has been paid by the Hanoverian factor to suppress any competing commercial claim. Both bundles are evidence of a category of fraud, not of a specific political allegiance; surrendering one destroys what proves the double-dealing.",
        "passText": "The agent accepts the distinction grudgingly. Both bundles travel.",
        "failText": "He takes the London bundle. You are left with the Edinburgh bundle and a seizure receipt — which is itself evidence of the same fraud from a different angle.",
        "checkPassFlag": "sdqC5A3Done",
    },
    {
        "id": "sdq_05_act4",
        "title": "Rashleigh's Double Game — The Courier's Inn",
        "type": "skill_check",
        "activateNode": "LON",
        "checkStat": "WIS", "checkDC": 11,
        "activateCond": "() => !!S_story.sdqC5A3Done",
        "desc": "A Jacobite lawyer locates you near Cheapside. He argues the Edinburgh bundle was fabricated by the government to entrap Jacobite agents — the document is false. Both bundles are genuine; neither party is being framed; Rashleigh created them both and sold both contracts.",
        "passText": "The standard fabrication defense. You see it clearly. Both documents travel.",
        "failText": "The lawyer plants doubt that lingers through the archive delivery.",
        "checkPassFlag": "sdqC5A4Done",
    },
    {
        "id": "sdq_05_act5",
        "title": "Rashleigh's Double Game — The Archive",
        "type": "skill_check",
        "activateNode": "WM",
        "checkStat": "INT", "checkDC": 10,
        "activateCond": "() => !!S_story.sdqC5A4Done",
        "desc": "Sweelinck reads both bundles side by side. 'One transaction. Two counterparties. Both genuine. Neither cancels the other. What was promised was impossible to honor simultaneously — which is a different problem from fraud.' He considers: validity to one does not invalidate the other; the category is not fraud.",
        "passText": "Sweelinck writes: Documents That Served Two Masters, First Entry. The Rashleigh Double Papers filed. Both parties received exactly what was promised; what was promised could not both be kept.",
        "failText": "The bundles are filed separately under commercial disputes.",
        "checkPassFlag": "sdqC5A5Done",
    },
    # ── Cycle 6 — The Highland Muster ────────────────────────────────────
    {
        "id": "sdq_06_act1",
        "title": "The Highland Muster — The Shore at Dawn",
        "type": "skill_check",
        "activateNode": "LLM",
        "checkStat": "CHA", "checkDC": 12,
        "activateCond": "() => !!S_story.sdqC5A5Done",
        "desc": "The shore of Loch Lomond at first light. The clans are assembling in the mist. Frank Osbaldistone stands near the MacGregor contingent — he arrived the same way you did, following a message he did not understand. A clan herald moves through the crowd with a muster roll. He records every name present. Every name on that roll is a Jacobite commitment. Keep Frank's name off the roll; explain why a man who has been standing here for an hour is not a participant.",
        "passText": "The herald notes 'observer, English, not enrolled' beside Frank's description. He moves on. Highland Muster Witness Note received.",
        "failText": "Frank's name goes on the roll. You write the witness note immediately. Both documents will travel together — the enrollment and the certification of its error.",
        "checkPassFlag": "sdqC6A1Done",
    },
    {
        "id": "sdq_06_act2",
        "title": "The Highland Muster — The Cordon",
        "type": "skill_check",
        "activateNode": "LLM",
        "checkStat": "STR", "checkDC": 13,
        "activateCond": "() => !!S_story.sdqC6A1Done",
        "desc": "The Stirling road is being sealed. An English dragoon company is taking everyone moving south as potential Jacobite muster-return traffic. The witness note is the only thing that distinguishes Frank from a combatant. Take the high field track and cross the cordon's eastern flank before the cavalry completes the sweep.",
        "passText": "You clear the cordon clean.",
        "failText": "You are taken. The note is examined. Frank is held four hours before the officer decides the evidence is insufficient. You lose the day, not the note.",
        "checkPassFlag": "sdqC6A2Done",
    },
    {
        "id": "sdq_06_act3",
        "title": "The Highland Muster — The Tribunal",
        "type": "skill_check",
        "activateNode": "EDI",
        "checkStat": "WIS", "checkDC": 12,
        "activateCond": "() => !!S_story.sdqC6A2Done",
        "desc": "The Edinburgh tribunal reviewing the Rising wants every person with knowledge of the Loch Lomond muster to appear and testify. The witness note is what they want — not to clear Frank, but to confirm the MacGregor numbers. Surrendering it converts a non-participant certification into prosecution evidence. The archive must receive it, not the tribunal.",
        "passText": "You appear with verbal testimony only. The note stays in your coat.",
        "failText": "You produce a copy with Frank's name prominent and clan details omitted. The original travels.",
        "checkPassFlag": "sdqC6A3Done",
    },
    {
        "id": "sdq_06_act4",
        "title": "The Highland Muster — The Clerk's Office",
        "type": "skill_check",
        "activateNode": "EDI",
        "checkStat": "CHA", "checkDC": 11,
        "activateCond": "() => !!S_story.sdqC6A3Done",
        "desc": "A government clerk offers to remove Frank's name from the official muster list in exchange for the witness note as a private favor for his superior. Refuse; the distinction cannot be purchased; the note is the argument for the category, not a trade good.",
        "passText": "The clerk accepts the refusal. He removes Frank's name anyway because the enrollment was improper.",
        "failText": "He declines to help further. Frank's name stays. The witness note and the list both travel — to their separate destinations.",
        "checkPassFlag": "sdqC6A4Done",
    },
    {
        "id": "sdq_06_act5",
        "title": "The Highland Muster — The Archive",
        "type": "skill_check",
        "activateNode": "WM",
        "checkStat": "INT", "checkDC": 10,
        "activateCond": "() => !!S_story.sdqC6A4Done",
        "desc": "Sweelinck reads the witness note. 'He was present. He did not participate. These are different facts. The muster roll cannot record the difference. This note can.' Presence at an event cannot serve as evidence of participation without destroying the distinction between observation and action.",
        "passText": "Sweelinck writes: Involuntary Witness Records — Non-Participant Certification, First Entry. The Highland Muster Note filed. The archive creates the category for the gap between observation and action.",
        "failText": "The note is filed under general Rising documents.",
        "checkPassFlag": "sdqC6A5Done",
    },
    # ── Cycle 7 — The Ford at Aberfoil ────────────────────────────────────
    {
        "id": "sdq_07_act1",
        "title": "The Ford at Aberfoil — The Ford",
        "type": "skill_check",
        "activateNode": "ABF",
        "checkStat": "WIS", "checkDC": 11,
        "activateCond": "() => !!S_story.sdqC6A5Done",
        "desc": "The ford at Aberfoile on the River Forth above the village. Rob Roy MacGregor stands in the road with his hands bound behind him. Six soldiers, a sergeant, a horse. He looks at you — a specific look: a man who has already made his decision and needs one thing from the person he is looking at. Not rescue. Witness. An honest account of what happens next.",
        "passText": "You take the witness position — clear view, not moving. Rob Roy nods once. Rob Roy's Escape Deposition prepared.",
        "failText": "You step toward him. He shakes his head slightly. You step back.",
        "checkPassFlag": "sdqC7A1Done",
    },
    {
        "id": "sdq_07_act2",
        "title": "The Ford at Aberfoil — The River",
        "type": "skill_check",
        "activateNode": "ABF",
        "checkStat": "CHA", "checkDC": 12,
        "activateCond": "() => !!S_story.sdqC7A1Done",
        "desc": "Rob Roy dives sideways off the bank. The soldiers fire. He swims under water, surfacing twice. He reaches the far bank and is gone into the alders before they can reload. The ford is quiet. The soldier next to you asks what you saw. Give the account of what you witnessed without adding anything that could be called assistance: neither helping nor condemning.",
        "passText": "'He was bound. He jumped. He swam. He reached the other bank. The shots missed.' The soldier accepts it, unsatisfied.",
        "failText": "You add a detail that implies you knew where the bank was shallowest. The soldier marks you as a party.",
        "checkPassFlag": "sdqC7A2Done",
    },
    {
        "id": "sdq_07_act3",
        "title": "The Ford at Aberfoil — The Sergeant's Report",
        "type": "skill_check",
        "activateNode": "ABF",
        "checkStat": "CHA", "checkDC": 13,
        "activateCond": "() => !!S_story.sdqC7A2Done",
        "desc": "On the road back toward Glasgow the sergeant stops you. He is writing his report and wants your signature on a version that describes the escape as 'assisted by an unknown civilian.' 'Sign it. You were there. You could have raised a cry.' Give the exact sequence twice; it cannot be revised if it is precise enough.",
        "passText": "He abandons 'assisted' after you recite the sequence twice. He files 'escaped during river crossing.'",
        "failText": "He files his version. You file a counter-deposition at the nearest justice's office. Both versions travel.",
        "checkPassFlag": "sdqC7A3Done",
    },
    {
        "id": "sdq_07_act4",
        "title": "The Ford at Aberfoil — Glasgow Justice",
        "type": "skill_check",
        "activateNode": "GLA",
        "checkStat": "INT", "checkDC": 11,
        "activateCond": "() => !!S_story.sdqC7A3Done",
        "desc": "In Glasgow the government account already circulates: Rob Roy 'escaped with assistance.' A magistrate wants a sworn counter-deposition naming the sequence in full. Reconstruct the exact sequence from memory with enough precision that the deposition is unimpeachable; the order of events is the argument.",
        "passText": "Every second accounted for. The magistrate reads it and stamps it received.",
        "failText": "One moment is uncertain — the second surfacing. The deposition notes the uncertainty. It is weaker but still honest.",
        "checkPassFlag": "sdqC7A4Done",
    },
    {
        "id": "sdq_07_act5",
        "title": "The Ford at Aberfoil — The Archive",
        "type": "skill_check",
        "activateNode": "WM",
        "checkStat": "INT", "checkDC": 10,
        "activateCond": "() => !!S_story.sdqC7A4Done",
        "desc": "Sweelinck reads the deposition. 'He was bound. He jumped into a river. He swam under fire. He reached the far bank. No one assisted him. This is what happened. The gap in a sequence is where the revision lives.' The neutral account of a politically inconvenient event, complete.",
        "passText": "Sweelinck writes: Politically Inconvenient Events — Neutral Deposition, First Entry. The Ford at Aberfoil. The escape witnessed and recorded; the neutral account that resists institutional revision; the complete sequence as the argument. The archive holds what no official account will hold.",
        "failText": "The deposition is filed under government correspondence. The principle lives in the sequence itself.",
        "checkPassFlag": "sdqC7A5Done",
        "questComplete": True,
    },
]

def main():
    print("Importing SDQ — Rob Roy (35 acts)...")
    wait_server()
    for q in QUESTS:
        create_quest(q)
    print("\nAll 35 acts imported. Running audit...")
    result = api("get", "/api/audit")
    errors = result.get("errors", [])
    warnings = result.get("warnings", [])
    ping = api("get", "/api/ping")
    if errors or warnings:
        print(f"AUDIT ISSUES: {len(errors)} errors, {len(warnings)} warnings")
        for e in errors[:5]:
            print(" ", e)
    else:
        print(f"Audit clean. Nodes: {ping.get('nodes')}, Quests: {ping.get('quests')}")

if __name__ == "__main__":
    main()
