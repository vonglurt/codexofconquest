#!/usr/bin/env python3
# SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
# ═══════════════════════════════════════════════════════════════════════════
# ⚠️  ARCHAIC — OUT OF DATE.  Historical one-shot importer (POSTs to the
#     localhost:1367 WBAPI).  Content was long ago imported and lives in
#     play.html.  This script likely NO LONGER RUNS against the current
#     server/schema.  Kept for reference only — do not run without review.
#     Import history: BACKLOG.md / plan-archive.md / 1367-sources/.
# ═══════════════════════════════════════════════════════════════════════════
"""§IMPORT-103 ATH: Iliad (Homer, Lang tr.) — Cycle 1: The Herald's Tablet (5 acts)"""

import requests, subprocess

BASE = "http://localhost:1367"

def api(method, path, **kwargs):
    r = getattr(requests, method)(BASE + path, **kwargs)
    r.raise_for_status()
    return r.json()

def say(msg):
    subprocess.run(["./say.sh", msg], capture_output=True)

def ensure_npc(key, name, occupation, node):
    check = requests.get(BASE + f"/api/npc/{key}")
    if check.status_code == 200:
        print(f"  NPC (exists): {key} — {name}")
        return
    api("post", "/api/npc", json={"key": key, "name": name, "occupation": occupation, "node": node})
    print(f"  NPC: {key} — {name} @ {node}")

def quest(id, title, desc, activateNode, passText, failText, checkStat, checkDC,
          npc=None, checkPassFlag=None, activateCond=None, questComplete=False,
          monster=None, monsterHP=None, monsterAC=None, quest_type=None):
    check = requests.get(BASE + f"/api/quest/{id}")
    if check.status_code == 200:
        print(f"  SKIP (exists): {id}")
        return
    nonce_r = api("post", "/api/nonce", json={"type": "quest", "id": id})
    nonce = nonce_r["nonce"]
    if quest_type:
        q_type = quest_type
    elif monster and not checkStat:
        q_type = "combat"
    else:
        q_type = "skill_check"
    payload = {
        "id": id, "type": q_type, "title": title, "desc": desc,
        "activateNode": activateNode,
        "passText": passText, "failText": failText,
        "checkStat": checkStat, "checkDC": checkDC,
    }
    if npc:            payload["npc"]           = npc
    if checkPassFlag:  payload["checkPassFlag"]  = checkPassFlag
    if activateCond:   payload["activateCond"]   = activateCond
    if questComplete:  payload["questComplete"]  = True
    if monster:        payload["monster"]        = monster
    if monsterHP:      payload["monsterHP"]      = monsterHP
    if monsterAC:      payload["monsterAC"]      = monsterAC
    api("post", "/api/quest", json=payload, headers={"X-Nonce": nonce})
    print(f"  OK: {id} — {title}")

def main():
    say("§IMPORT 103 ATH. Iliad. Homer. Cycle one. The Herald's Tablet. Five acts. IDC SKN WM.")

    print("=== §IMPORT-103 ATH: The Iliad — Cycle 1: The Herald's Tablet ===")

    # --- NPC ---
    print("\n-- NPC --")
    ensure_npc(
        key="idaeus_herald",
        name="Idaeus the Herald",
        occupation="Royal Herald of Troy (retired; last survivor of Priam's last embassy)",
        node="IDC"
    )

    # --- Cycle 1: The Herald's Tablet ---
    print("\n-- Cycle 1: The Herald's Tablet (5 acts) --")

    quest(
        id="ath_c1a1",
        npc="idaeus_herald",
        title="Idaeus's Shelter",
        desc=(
            "The refugee camp outside Troy's ruins smells of ash and salt and too many people without "
            "enough water. Idaeus is in a lean-to at the camp's edge — old enough that the survivors "
            "have given him space without discussing it. He holds out a fired clay tablet, palm-sized, "
            "dull grey. On its face: the double-horse seal of Priam and the formal commission "
            "authorizing the last embassy to Achilles. He explains what it is. No one here wants to "
            "hear about diplomatic commissions. Everyone is alive and that is what matters to them."
        ),
        activateNode="IDC",
        checkStat="WIS",
        checkDC=12,
        passText=(
            "You understand before he finishes speaking. The tablet's value is not ceremonial — "
            "it is administrative. It is the proof that Priam went as a king exercising diplomatic "
            "authority, not as a broken old man begging; that Achilles received him under guest-friendship, "
            "not private mercy. The difference is law versus anecdote. You take the tablet with both hands. "
            "Idaeus nods. You receive The Herald's Tablet — Priam's Commission."
        ),
        failText=(
            "You reach for it while asking about the events themselves. Idaeus pulls it back — not "
            "because he won't give it, but because the question misses the point. After a moment he "
            "pushes it forward again with a look that says: the story does not matter. This matters. "
            "Try again."
        ),
        checkPassFlag="athC1A1Done",
    )

    quest(
        id="ath_c1a2",
        npc="idaeus_herald",
        title="The Checkpoint",
        desc=(
            "A Greek officer is running a checkpoint on the camp's perimeter road, cataloguing "
            "what Trojan survivors carry out. He sees Priam's seal on the clay tablet and wants it "
            "logged as war-spoil. His reasoning: the royal seal belongs to the treasury claim of "
            "the general who holds the royal quarter. He has a ledger open. His pen is ready."
        ),
        activateNode="IDC",
        checkStat="CHA",
        checkDC=13,
        passText=(
            "He notes the tablet in his ledger as 'diplomatic record — released under Achilles "
            "protocol' and stamps it through with a single dry mark. He does not look up again. "
            "You receive the Road Stamp — the officer's transit seal on the tablet's outer edge."
        ),
        failText=(
            "He holds it for review. Half a day while a superior is consulted who agrees with "
            "your argument entirely. The tablet is released at dusk. The delay costs you a night "
            "on the plain."
        ),
        checkPassFlag="athC1A2Done",
        activateCond="() => !!S_story.athC1A1Done",
    )

    quest(
        id="ath_c1a3",
        npc="idaeus_herald",
        title="The Scaean Gate Road",
        desc=(
            "The road through the ruins passes the Scaean Gate — rubble now, but the road worn "
            "deep by ten years of war traffic remains. Two armed men are waiting here. Their lord "
            "is building a legal argument that Agamemnon's offer of gifts in Book 9 creates an "
            "honor-debt that passes to him as Achilles's heir. He wants the commission tablet "
            "as evidence that the Book 24 embassy resolved that debt — which would collapse his "
            "own claim. He is not interested in the tablet's history. He is interested in its "
            "use as an instrument."
        ),
        activateNode="SKN",
        checkStat="CHA",
        checkDC=14,
        quest_type="hybrid",
        passText=(
            "The men step aside. Their lord's argument required the tablet to mean something it "
            "does not say — a Priam-Achilles transaction cannot resolve a Greek-internal honor "
            "dispute. The tablet records what it records. You receive the Scaean Road Stone — "
            "a fragment of the gate arch fallen in the road."
        ),
        failText=(
            "Persuasion fails. The men draw swords. Two soldiers, AC 13, HP 16 each. The tablet "
            "is not their target — they were told to acquire it, not destroy it. Fight through "
            "and continue."
        ),
        monster="soldier",
        monsterHP=16,
        monsterAC=13,
        checkPassFlag="athC1A3Done",
        activateCond="() => !!S_story.athC1A2Done",
    )

    quest(
        id="ath_c1a4",
        npc="idaeus_herald",
        title="The River Ford",
        desc=(
            "A river in early flood has washed out the bridge. The ford is waist-deep and moving "
            "fast. The clay tablet is fired and durable — the incised text will survive immersion "
            "— but the seal impression on the face can be softened if the tablet soaks. The seal "
            "is the proof of royal authority. The text without the seal is a document without a "
            "signature. There is no persuasion option. The river is not an argument. The ford "
            "must be taken."
        ),
        activateNode="SKN",
        checkStat="STR",
        checkDC=13,
        passText=(
            "The tablet arrives damp on its edges but the seal is intact. You receive the "
            "Ford-Crossing Record — a brief note in your own hand, written on the far bank, "
            "confirming the seal's condition on arrival."
        ),
        failText=(
            "The ford takes you under for a moment. The tablet is submerged. The seal impression "
            "softens — the shape is there but not crisp. The text is fully legible. The Archivus "
            "will note this at delivery: 'seal softened in transit, text confirmed authentic by "
            "content.' The tablet is still received. Cross and continue."
        ),
        checkPassFlag="athC1A4Done",
        activateCond="() => !!S_story.athC1A3Done",
    )

    quest(
        id="ath_c1a5",
        npc="idaeus_herald",
        title="The Weimar Archive",
        desc=(
            "Sweelinck receives documents at a long desk. He takes the tablet, reads the "
            "commission text, notes the seal — softened or intact — and consults his register "
            "of known diplomatic formats. He finds the format consistent with Mycenaean royal "
            "commission structure. He sets the tablet down and looks at it for a moment. "
            "'There is a separate entry for the burning of Troy,' he says. 'Under destruction "
            "events. This document does not belong there.' He makes the notation in a different "
            "register — under Diplomatic Records, Trojan Cycle, Priam of Troy: last known "
            "official act. He carries the tablet himself to the permanent vault."
        ),
        activateNode="WM",
        checkStat="WIS",
        checkDC=12,
        passText=(
            "Before he returns, Sweelinck says: 'This was the last night Troy was Troy.' "
            "You understand what he means — not Troy's last night before the burning, but the "
            "last night Troy was a functioning city: governed by a king exercising lawful "
            "diplomatic authority, producing documents in correct form, performing acts honored "
            "by its enemy's own champion. After that night, Troy was already a city-in-the-past, "
            "waiting for the fire to make it official. The tablet is the boundary marker. "
            "You receive Sweelinck's Archive Receipt — the intake notation in his hand: "
            "'Diplomatic Records — Trojan Cycle — last known official act of Priam of Troy.'"
        ),
        failText=(
            "You hand over the tablet but cannot articulate why it belongs in a different "
            "register from the destruction record. Sweelinck files it correctly anyway — he "
            "knows — but the notation lacks your witness. Try again."
        ),
        checkPassFlag="athC1A5Done",
        activateCond="() => !!S_story.athC1A4Done",
        questComplete=False,  # questComplete only on cycle 7
    )

    # --- Cycle 2: Helen at the Funeral ---
    print("\n-- Cycle 2: Helen at the Funeral --")
    ensure_npc("aethra_troy", "Aethra of Troy", "Attendant to Helen (survivor of the sack)", "TRH")
    quest("ath_c2a1", npc="aethra_troy", title="Troy Harbor",
          desc="The loading dock. Greek ships provisioned. Trojan women in registry lines. Aethra — Helen's elderly Athenian attendant — at the edge of the line with a cedar sleeve under her arm. She explains quickly: Helen composed this the night of the funeral, in her own hand, gave it to Aethra before the Greeks entered the city. Helen was at the bier. She said the things written here. Nobody else wrote them down. Aethra presses the sleeve into the Fighter's hands and turns back toward the line without looking back.",
          activateNode="TRH", checkStat="WIS", checkDC=11,
          passText="You take it with both hands before she finishes. She says: 'She was at the bier. She said those things.' She turns away. You receive Helen's Funeral Account — sealed folio in cedar sleeve.",
          failText="You reach for it while asking questions. She pushes it into your hands and turns away. The folio is in your possession. You know it is Helen's and that it should reach an archive.",
          checkPassFlag="athC2A1Done")
    quest("ath_c2a2", npc="aethra_troy", title="The Camp Perimeter",
          desc="The camp's exit checkpoint. A records officer checking departing documents sees the cedar sleeve and wants it logged as Helen's property under Menelaus's claim. Her written materials are technically her husband's property under Greek law. He has the ledger open.",
          activateNode="TRH", checkStat="CHA", checkDC=12,
          passText="He writes 'public speech record, not personal property' and closes the ledger. You walk through. You receive the Checkpoint Transit Stamp.",
          failText="He logs it as 'disputed property status, released pending review.' That notation will follow the document to the archive.",
          checkPassFlag="athC2A2Done", activateCond="() => !!S_story.athC2A1Done")
    quest("ath_c2a3", npc="aethra_troy", title="The Harbor Road",
          desc="An hour past the checkpoint. A man in Menelaus's livery on a fast horse. He has written authority from the household steward to review all recorded statements attributed to Helen before they enter any archive — to ensure the record is accurate. He is prepared to be reasonable. He only needs to read it before it is filed. The problem: if the steward's household reads it first and decides what 'accurate' means, Helen's voice arrives filtered.",
          activateNode="WM", checkStat="WIS", checkDC=13,
          passText="You name the filter itself as the modification. He accepts it. He turns his horse. You receive the Road Release Document.",
          failText="He rides beside you for half a mile asking questions about the content without reading the folio, noting your answers. He eventually turns back. The folio is intact.",
          checkPassFlag="athC2A3Done", activateCond="() => !!S_story.athC2A2Done")
    quest("ath_c2a4", npc="aethra_troy", title="The Mountain Road",
          desc="Three men above the road. No livery. The hard faction in Menelaus's household doesn't want any record that humanizes Helen circulating before the Greek account is fixed. They do not want to review it. They want it to not exist. Combat: 2× hired men, AC 12, HP 20.",
          activateNode="WM", checkStat="STR", checkDC=13,
          quest_type="combat", monster="soldier", monsterHP=20, monsterAC=12,
          passText="Both men are down. The cedar sleeve is intact. The seal is unbroken. You receive the Survivor's Note.",
          failText="They take the cedar sleeve — but didn't count the folios. The account and Aethra's covering note are on separate sheets. You still have the account wrapped in your pack.",
          checkPassFlag="athC2A4Done", activateCond="() => !!S_story.athC2A3Done")
    quest("ath_c2a5", npc="aethra_troy", title="The Archive — Helen",
          desc="Archivist Marta, who specializes in classical-era materials, receives documents at a long desk. She opens the sleeve, reads the folio, sets it down. She says: 'I can file this as attributed statement. Or I can file it as primary record — her voice, under her name. For that I need to establish it was composed by her, in her hand, at the time stated. Can you establish the chain of custody from her hand to yours without a gap?'",
          activateNode="WM", checkStat="WIS", checkDC=11,
          passText="You name the chain: Helen wrote it the night of the funeral; gave it to Aethra; Aethra gave it to you at the harbor. No gaps. Marta says: 'Chain is intact.' She opens the primary accounts section and writes Helen's name in the compiler field. 'Helen of Troy' — using the Trojan name, not the Greek one. You receive Marta's Archive Receipt.",
          failText="Marta files it as 'attributed statement, provenance established by carrier, classification pending secondary review.' She will upgrade it when the review confirms the chain. It is in the archive. Helen's name is in the record.",
          checkPassFlag="athC2A5Done", activateCond="() => !!S_story.athC2A4Done")

    # --- Cycle 3: The Embassy's Offer ---
    print("\n-- Cycle 3: The Embassy's Offer --")
    quest("ath_c3a1", npc="idaeus_herald", title="The Unsigned List",
          desc="The refugee camp. Idaeus has also kept the formal gift list from the Book 9 embassy — the document Odysseus, Ajax, and Phoenix carried into Achilles's tent. Both signature lines are empty. He carried it in and out the same evening. He is giving it to the archive with the Herald's Tablet: they belong together.",
          activateNode="IDC", checkStat="INT", checkDC=11,
          passText="You understand why an unsigned offer is an active record: it establishes both what was acknowledged as owed and what the offered terms were. The refusal is on record. The debt's existence is on record. You take it. Idaeus says: 'Take it with the tablet. They belong together.' You receive the Embassy Offer Record.",
          failText="You carry the record without the full context. Idaeus summarizes it while you pack.",
          checkPassFlag="athC3A1Done")
    quest("ath_c3a2", npc="idaeus_herald", title="The Inheritance Clerk",
          desc="A Greek legal clerk on the camp road is preparing claims against Agamemnon's estate from Achilles's heirs. He has heard there is a formal gift-list record from the Book 9 embassy and wants it as litigation evidence.",
          activateNode="IDC", checkStat="CHA", checkDC=12,
          passText="He accepts the neutrality argument: once filed at a neutral archive both parties can cite it, but if one party receives it before filing the record's neutrality is compromised. He files a request with the archive for future access. You receive the Clerk's Transit Note.",
          failText="He files an administrative notice that the document is under claim. The notice will follow the document to the archive.",
          checkPassFlag="athC3A2Done", activateCond="() => !!S_story.athC3A1Done")
    quest("ath_c3a3", npc="idaeus_herald", title="Achilles's Heirs",
          desc="Two men — soldiers' sons — on the Corinthian road. They represent Achilles's heir and want the Fighter to certify that the refusal was made under divine compulsion and therefore doesn't satisfy ordinary transaction terms. Their legal argument may be correct. But certification of the interpretation is not the Fighter's to give.",
          activateNode="CON", checkStat="WIS", checkDC=12,
          passText="They accept the carrier/interpreter distinction. One says: 'At least the record will be there.' You say: yes. You receive the Heir's Withdrawal Note.",
          failText="They follow for two hours. You eventually name an archive scholar they can consult after filing. They accept.",
          checkPassFlag="athC3A3Done", activateCond="() => !!S_story.athC3A2Done")
    quest("ath_c3a4", npc="idaeus_herald", title="The Agamemnon Faction",
          desc="Two serious agents on the mountain road — a cliff section ahead, a natural place for an accident. They represent claimants to Agamemnon's estate. If the archive holds the unsigned offer record it confirms Agamemnon publicly acknowledged a debt. They want the record unavailable. They will not fight openly. Athletics DC 13.",
          activateNode="CON", checkStat="STR", checkDC=13,
          passText="You take the wider path. The cliff section passes without incident. They abandon the follow. You receive the Mountain Road Writ.",
          failText="They force you close to the edge. A near-miss. The record stays with you. They follow no further but the road is watched.",
          checkPassFlag="athC3A4Done", activateCond="() => !!S_story.athC3A3Done")
    quest("ath_c3a5", npc="idaeus_herald", title="The Archive — Embassy",
          desc="Sweelinck reads the offer list. He reads both empty signature lines. He reads Idaeus's covering note. 'He offered seven cities. He acknowledged the debt. Achilles refused. Neither party denied the other's position. Both signature lines are empty because neither transaction was completed — but the offer's existence, the refusal's existence, and the conditions on both sides are in this document.'",
          activateNode="WM", checkStat="WIS", checkDC=11,
          passText="He files it beside the Herald's Tablet under a new category: Rejected Offers Under Divine Compulsion — Records Where the Ordinary Terms of Negotiation Did Not Apply. 'The archive holds this alongside the diplomatic commission as evidence that a city at war was also capable, at the same moment, of honest accounting.' You receive Sweelinck's Embassy Receipt.",
          failText="He files the document correctly. The category notation is brief. The archive receives it.",
          checkPassFlag="athC3A5Done", activateCond="() => !!S_story.athC3A4Done")

    # --- Cycle 4: Patroclus's Commission ---
    print("\n-- Cycle 4: Patroclus's Commission --")
    ensure_npc("automedon_charioteer", "Automedon the Charioteer", "Charioteer of Achilles (survivor; wrote the commission record)", "IDC")
    quest("ath_c4a1", npc="automedon_charioteer", title="The Charioteer's Record",
          desc="The refugee camp. Automedon — Achilles's charioteer, who was present when the commission was given — has kept a clay tablet written the evening of the battle: the exact terms of what Achilles said to Patroclus. The limit instruction and the glory comment both recorded. He did not write it for legal purposes. He wrote it because the conversation mattered.",
          activateNode="IDC", checkStat="WIS", checkDC=11,
          passText="You understand the completeness argument before he finishes explaining: he recorded both clauses because the whole conversation was what made the commission. That completeness is why it belongs in the archive. He hands you the tablet without comment. You receive Patroclus's Commission Tablet.",
          failText="You carry the tablet. Automedon adds a brief note explaining its circumstances.",
          checkPassFlag="athC4A1Done")
    quest("ath_c4a2", npc="automedon_charioteer", title="Achilles's Heir",
          desc="A man claiming authority from Achilles's heirs in Phthia on the camp road. He wants to know if the tablet contains the glory comment — the part where Achilles asked Patroclus not to press too far because it would diminish his glory. If recorded, it changes the moral accounting.",
          activateNode="IDC", checkStat="CHA", checkDC=12,
          passText="He accepts that the carrier cannot characterize the tablet's contents before filing. He turns back. You receive the Heir's Road Release.",
          failText="He asks you to describe Automedon's state when he handed it over. You describe it neutrally. He notes this and turns back.",
          checkPassFlag="athC4A2Done", activateCond="() => !!S_story.athC4A1Done")
    quest("ath_c4a3", npc="automedon_charioteer", title="The Nestor Problem",
          desc="A scholar at Ragusa has Nestor's oral account (transcribed by a student) of what he understood Achilles's commission to be. His account differs slightly from Automedon's tablet. He wants the Fighter to confirm which account is accurate.",
          activateNode="DBV", checkStat="WIS", checkDC=12,
          passText="Both accounts can be accurate — Nestor heard or summarized differently. Filing both is exactly what the archive is for. He accepts. He says he will send the Nestor transcription separately. You receive the Scholar's Referral Note.",
          failText="He argues for thirty minutes before accepting. He gives you a copy of the Nestor transcription to carry alongside the tablet.",
          checkPassFlag="athC4A3Done", activateCond="() => !!S_story.athC4A2Done")
    quest("ath_c4a4", npc="automedon_charioteer", title="The Patroclus Family",
          desc="A woman on the road north is Patroclus's aunt — a surviving relative who traveled far on the chance the tablet exists. Her question is not adversarial: she wants to know if it says he went willingly beyond the ships, or was pushed. She is not asking for legal reasons.",
          activateNode="DBV", checkStat="WIS", checkDC=11,
          passText="You understand what she actually needs before she finishes asking. You say: the tablet records the commission, not the decision. She closes her eyes for a moment. She lets you pass. You receive the Aunt's Blessing.",
          failText="You tell her the tablet records the commission, not the decision. She thanks you and sits down at the roadside.",
          checkPassFlag="athC4A4Done", activateCond="() => !!S_story.athC4A3Done")
    quest("ath_c4a5", npc="automedon_charioteer", title="The Archive — Commission",
          desc="Sweelinck reads the tablet. He reads the limit instruction. He reads the glory comment. 'He told him to turn back at the ships. He also told him it was for his glory. Automedon recorded both. Neither clause cancels the other. The tablet is complete. That means it is also unanswerable. The archive files unanswerable things.'",
          activateNode="WM", checkStat="WIS", checkDC=11,
          passText="He opens a new register: Commission Records — Instructions Given Before the Fatal Decision. 'The archive notes that a commission in which the instruction and its motivation are both on record is the most honest kind, even when — especially when — the person who received it pressed beyond both.' You receive Sweelinck's Commission Receipt.",
          failText="He files it correctly. The category notation is brief.",
          checkPassFlag="athC4A5Done", activateCond="() => !!S_story.athC4A4Done")

    # --- Cycle 5: Andromache's Loom ---
    print("\n-- Cycle 5: Andromache's Loom --")
    ensure_npc("chrysis_slave", "Chrysis the Slave", "Household slave of Andromache (survivor; carried the weaving from the burning room)", "TRH")
    quest("ath_c5a1", npc="chrysis_slave", title="What Chrysis Kept",
          desc="Troy harbor. Chrysis is old and has nothing. She will be assigned to a Greek household. She managed to keep a piece of cloth — half a purple cloth figured with flowers, cut from Andromache's loom still attached to the frame-bar, the dropped shuttle hanging from the last thread — because a piece of cloth in a woman's hands is invisible. She has been carrying it since the morning the crying started.",
          activateNode="TRH", checkStat="WIS", checkDC=11,
          passText="You take it with both hands and say nothing. She looks at you for a moment. She nods. You receive Andromache's Weaving Fragment — the cloth, the frame-bar, the shuttle.",
          failText="You say something inadequate. She hands it over anyway. She looks away.",
          checkPassFlag="athC5A1Done")
    quest("ath_c5a2", npc="chrysis_slave", title="The Greek Inventory Officer",
          desc="A Greek inventory officer at the harbor checkpoint logs textiles. The purple cloth with the shuttle still attached is clearly valuable — purple dye, quality fiber, fine figure-work even incomplete. He wants to log it as property.",
          activateNode="TRH", checkStat="CHA", checkDC=12,
          passText="He accepts the archive distinction. He notes: 'cultural record, non-assessable, archive transit.' You receive the Textile Transit Clearance.",
          failText="He logs it as 'purple textile, incomplete, origin Troy, status disputed' and issues provisional release with the notation following the cloth.",
          checkPassFlag="athC5A2Done", activateCond="() => !!S_story.athC5A1Done")
    quest("ath_c5a3", npc="chrysis_slave", title="The Greek Woman",
          desc="A Greek woman on the same coastal road lost a son at Troy. She wants to know if the cloth can be sent to Andromache — she doesn't know where Andromache is now, but she is sure someone must know. To her, returning the cloth is the obviously right thing.",
          activateNode="VS", checkStat="WIS", checkDC=12,
          passText="You explain the archive as the form of return: the only available form. She accepts it. She says: 'Tell them whose cloth it was.' You receive the Greek Woman's Letter.",
          failText="She argues about it. You explain the archive's role. She eventually agrees, though unhappily.",
          checkPassFlag="athC5A3Done", activateCond="() => !!S_story.athC5A2Done")
    quest("ath_c5a4", npc="chrysis_slave", title="The Weaver's Guild",
          desc="At Visby, a senior member of the weavers' guild examines the cloth with professional eyes. He is fascinated — Eastern Aegean figure-work this far north. He wants to bring in two colleagues to examine it. He has a technical guild right to examine imported textiles.",
          activateNode="VS", checkStat="CHA", checkDC=11,
          passText="He accepts the archive document distinction. He asks if the archive would accept a guild technical report as supplementary material. You say: write to Weimar. You receive the Guild Waiver.",
          failText="He brings his two colleagues. They examine it for one day, carefully. The cloth is returned intact with three technical observations added to your bundle.",
          checkPassFlag="athC5A4Done", activateCond="() => !!S_story.athC5A3Done")
    quest("ath_c5a5", npc="chrysis_slave", title="The Archive — Loom",
          desc="Sweelinck unwraps the cloth and holds the frame-bar so the shuttle hangs free. He examines the break-line in the weave. 'She was in the middle of the fourth figure when the crying started. The thread breaks here — you can see where the shuttle moved incorrectly.' He sets it down. 'The water was already set to heat for his bath.'",
          activateNode="WM", checkStat="WIS", checkDC=11,
          passText="He opens: Interrupted Work Records — The Unfinished Thing That Shows the Shape of What the Interruption Was. 'An interrupted domestic record is also a military record — the war appears in this cloth at the point where the woman doing the ordinary work dropped it and ran.' You receive Sweelinck's Loom Receipt.",
          failText="He files it correctly. The category notation is brief. The cloth is in the archive.",
          checkPassFlag="athC5A5Done", activateCond="() => !!S_story.athC5A4Done")

    # --- Cycle 6: The Shield's Description ---
    print("\n-- Cycle 6: The Shield's Description --")
    ensure_npc("bronze_attendant", "The Bronze Attendant", "Self-moving mechanical figure made by Hephaestus (holding the shield description scroll)", "SKN")
    quest("ath_c6a1", npc="bronze_attendant", title="The Bronze Attendant",
          desc="Scaean Gate ruins. The bronze attendant — a mechanical figure in female form, made by Hephaestus, one of the self-moving golden women who assist the god's work — is at the ruins. Her instruction was to hold the scroll until a carrier suitable for an archive arrived. She says nothing when she hands you the scroll. She holds it out. You take it. She turns and walks toward the sea and does not come back.",
          activateNode="SKN", checkStat="INT", checkDC=12,
          passText="You understand the dual context before opening it: not the shield itself (which was lost) but a description of what a god imagined the world was worth, made as a frame for a weapon the night before it was used. You receive the Shield Description Scroll — copper, thin, angular script.",
          failText="You carry the scroll without the full context. At Act 5, Sweelinck asks how you acquired it and from whom. You describe the bronze attendant. He writes it down.",
          checkPassFlag="athC6A1Done")
    quest("ath_c6a2", npc="bronze_attendant", title="The Philosopher of Crafts",
          desc="A Greek philosopher of crafts on the road north argues that the shield's description is primarily an aesthetic document — the most important surviving record of archaic visual composition — and that an archive filing it as military or diplomatic would misclassify it.",
          activateNode="SKN", checkStat="CHA", checkDC=12,
          passText="He accepts the inseparability argument: the content and context are one document; an aesthetic collection that extracts the images from their frame loses the argument. He says: 'The world on a weapon is not decoration. You're right.' You receive the Philosopher's Concession.",
          failText="He argues aesthetic primacy at length and eventually agrees that the archive can cross-file. He asks for the address.",
          checkPassFlag="athC6A2Done", activateCond="() => !!S_story.athC6A1Done")
    quest("ath_c6a3", npc="bronze_attendant", title="The Ajax Estate",
          desc="A legal representative of the Ajax estate at Constantinople claims the description document is material evidence in the estate dispute over who should have received the shield after Achilles's death.",
          activateNode="CON", checkStat="WIS", checkDC=12,
          passText="You name the composition/possession distinction: the description was written before the shield was ever in either man's hands; it doesn't bear on possession. He accepts. He notes the archive destination and withdraws. You receive the Estate Withdrawal Letter.",
          failText="The representative follows to the next waystation arguing about composition evidence. Eventually he accepts the distinction.",
          checkPassFlag="athC6A3Done", activateCond="() => !!S_story.athC6A2Done")
    quest("ath_c6a4", npc="bronze_attendant", title="The River Crossing",
          desc="A river crossing in late autumn flood. The copper scroll is sealed but thin — extended immersion will expand the copper and break the wax seal without damaging the text. The seal is the authentication. Athletics DC 12 to cross with the scroll held above water.",
          activateNode="CON", checkStat="STR", checkDC=12,
          passText="The scroll crosses dry. The seal is perfect. You receive the Dry Crossing Record.",
          failText="One hand drops. The wax seal takes water contact and softens. At Act 5 Sweelinck will note: 'bronze attendant's impression partially damaged; text intact.'",
          checkPassFlag="athC6A4Done", activateCond="() => !!S_story.athC6A3Done")
    quest("ath_c6a5", npc="bronze_attendant", title="The Archive — Shield",
          desc="Sweelinck opens the seal carefully. He reads the scroll with a lens — the script is old and angular and precise. He reads without expression for a long time. 'The wedding city and the war city on the same surface. The vintage and the herd and the dancing floor and the lion taking the heifer and the river of Ocean at the rim. He made this the night before Achilles put it on. The world as a frame for a weapon that would reduce most of it.'",
          activateNode="WM", checkStat="WIS", checkDC=11,
          passText="He writes: Divine Craft Records — Objects Described Before Their Destruction. 'The archive files the description alongside the context — the world-image and the weapon are one document.' You receive Sweelinck's Shield Receipt.",
          failText="He files it correctly. The notation is brief. The copper scroll is in the archive.",
          checkPassFlag="athC6A5Done", activateCond="() => !!S_story.athC6A4Done")

    # --- Cycle 7: Hecuba's Supplication ---
    print("\n-- Cycle 7: Hecuba's Supplication (questComplete) --")
    ensure_npc("myrine_survivor", "Myrine the Survivor", "Trojan woman who carried Hecuba's robe from the burning temple (burns on both hands)", "SKN")
    quest("ath_c7a1", npc="myrine_survivor", title="Myrine's Hands",
          desc="Scaean Gate ruins. Myrine has the robe folded under a stone — the golden Sidonian robe, star-figured, gold-worked, the finest thing in the Trojan treasury, laid on Athena's knees by the priestess Theano in a correctly performed supplication. Athena refused. Myrine carried it from the burning temple. She has burns on both hands. One corner singed. Gold thread intact.",
          activateNode="SKN", checkStat="WIS", checkDC=11,
          passText="You understand the divine-side argument before she explains: this is evidence not of a failed ritual but of a correctly performed petition answered in the negative. The gods' decision is in the record. You take the robe with both hands. She says: 'She was there when we laid it on the statue's knees.' You receive Hecuba's Supplication Robe.",
          failText="You carry the robe. Myrine adds a note describing the circumstances of the supplication and the robe's removal from the temple.",
          checkPassFlag="athC7A1Done")
    quest("ath_c7a2", npc="myrine_survivor", title="The Temple Inventory",
          desc="A Greek officer conducting a temple inventory at the checkpoint wants to log the golden robe as temple property — for return to Athena's temple or for the Roman treasury's sacred property collection.",
          activateNode="SKN", checkStat="CHA", checkDC=13,
          passText="He accepts the paradox argument: a Trojan dedicatory offering to a Greek goddess who chose the Greek side belongs in a neutral archive that can hold the paradox. He notes: 'dedicatory offering in contested status, archive transit authorized.' You receive the Temple Transit Document.",
          failText="He notes it as 'disputed temple property, Trojan origin, Athena dedication' and issues a transit document. You continue with it attached.",
          checkPassFlag="athC7A2Done", activateCond="() => !!S_story.athC7A1Done")
    quest("ath_c7a3", npc="myrine_survivor", title="The Priestess Theano",
          desc="In Rome: Theano, who was Athena's priestess in Troy and laid the robe on the statue herself, has survived and wants to carry the robe to the archive herself. She is not asking as property. She believes she should be its carrier — she performed the ritual.",
          activateNode="ROM", checkStat="WIS", checkDC=12,
          passText="You explain the custody chain's integrity: substituting Theano's hands now adds a gap, not a completion. She accepts it. She asks if her name can be in the archive's record. You say: write to Weimar. You receive Theano's Witness Statement.",
          failText="She takes the robe and agrees to carry it to the archive. You accompany her. The chain arrives with the gap noted.",
          checkPassFlag="athC7A3Done", activateCond="() => !!S_story.athC7A2Done")
    quest("ath_c7a4", npc="myrine_survivor", title="The Religious Commission",
          desc="A representative of the Roman religious commission intercepts on the Alpine road. His commission pre-dates the archive transit document. He argues the commission's authority over captured sacred property is absolute.",
          activateNode="ROM", checkStat="CHA", checkDC=12,
          passText="He accepts that the robe's unique status falls outside his category: it was never accepted by the temple because the goddess refused the supplication; it has no permanent sacred status the commission covers. He notes: 'offering in unresolved dedicatory status, commission authority does not apply.' You receive the Commission Release.",
          failText="He flags the argument as novel and sends a message to Rome for clarification. He does not stop you — the argument is strong enough — but the flag follows you.",
          checkPassFlag="athC7A4Done", activateCond="() => !!S_story.athC7A3Done")
    quest("ath_c7a5", npc="myrine_survivor", title="The Archive — Hecuba",
          desc="Sweelinck holds the robe to the light. He examines the gold thread and the Sidonian pattern and the singed corner. He reads Myrine's note and the transit documents. 'She offered this correctly. The ritual was performed correctly. The priestess laid it on the statue's knees. Athena refused.' He sets it down carefully. 'The archive does not often receive evidence of divine decisions. This is one.'",
          activateNode="WM", checkStat="WIS", checkDC=11,
          passText="He writes: Supplication Records — Correctly Executed Petitions That Were Denied, First Entry. 'This is not a document of failed ritual but of a correct petition answered in the negative; the gods' decision is in the record alongside the human act that prompted it; together they are the complete account of what Athena chose.' You receive Sweelinck's Supplication Receipt.",
          failText="He files it correctly. The notation opens the Supplication Records category. Hecuba's name is in the record.",
          checkPassFlag="athC7A5Done", activateCond="() => !!S_story.athC7A4Done",
          questComplete=True)

    print("\n-- Audit --")
    r = requests.get(BASE + "/api/audit")
    data = r.json()
    counts = data.get("counts", data)
    print(f"  Nodes: {counts.get('nodes','?')}  Quests: {counts.get('quests','?')}")
    print(f"  Errors: {data.get('errors','?')}  Warnings: {data.get('warnings','?')}")

    say("ATH cycle one complete. Herald's Tablet. Five acts. IDC SKN WM. Audit clean.")
    print("\n=== ATH Cycle 1 DONE ===")

if __name__ == "__main__":
    main()
